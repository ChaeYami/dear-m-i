# DearMI TDD 작업 회고 — 결제/권한 핵심 로직 (2026-06-16)

> 관점: "어떤 문제를, 왜, 어떻게 풀었나". 기능 나열이 아니라 의사결정 기록.

## 0. 한 줄 요약

사전 분석 리포트에서 "틀리면 돈/권한이 깨지는데 테스트가 0"이라고 지목한 두 지점을
**먼저 실패하는 테스트로 결함을 증명한 뒤(Red) 고쳐서 통과(Green)** 시켰다.
과정에서 잠재 결함 2개를 실제로 드러냈고, 그 중 하나는 시간 의존성 때문에
테스트 자체가 불가능했던 구조라 **Clock 주입**으로 테스트 가능한 설계로 바꿨다.

---

## 1. 어디에 테스트를 추가했나

### (A) `HandleAppleNotificationUseCaseImpl` — Apple Webhook 멱등성
- **추가 테스트**: `HandleAppleNotificationUseCaseImplTest.duplicate_subscribed_notification_is_recorded_only_once`
- **검증 내용**: 동일한 `SUBSCRIBED` 알림이 2회 도착했을 때, 구독 이력(`subscription_histories`)이
  **SUBSCRIBED 1건만** 남는가 (= 멱등한가).
- **왜 이 시나리오인가**: Apple Server-to-Server 알림은 at-least-once 전달이라 같은 알림이
  재전송될 수 있다. "한 번 더 와도 같은 결과"가 보장되지 않으면 결제 이력이 오염된다.

### (B) `PlanLimitAspect` — 프리미엄 권한 게이트 (402)
- **추가 테스트** (5개):
  - `expired_premium_is_blocked` — plan=PREMIUM 이지만 expiresAt 가 과거 → 402 차단
  - `premium_expiring_exactly_now_is_blocked` — 경계값: `expiresAt == now` → 차단 (isAfter 엄격 비교)
  - `active_premium_proceeds` — expiresAt 미래 → 통과하여 대상 메서드 실행
  - `no_subscription_is_blocked` — 구독 없음 → 402
  - `unauthenticated_is_rejected` — principal 이 UUID 아님 → 401
- **검증 내용**: AOP 권한 게이트가 plan 문자열만이 아니라 **만료 시점까지** 보고 차단하는가.

---

## 2. 짜면서 발견한 것 (예상과 달랐던 동작 / 잠재 결함 / 리팩터링)

### 발견 1 — 중복 알림이 `SUBSCRIBED`를 `RENEWED`로 둔갑시킴
`activate()`는 이벤트 타입을 이렇게 정한다:
```java
SubscriptionEventType eventType = subscription.isPremium()
        ? SubscriptionEventType.RENEWED      // 두 번째 SUBSCRIBED 가 여기로 샌다
        : SubscriptionEventType.SUBSCRIBED;
```
"현재 PREMIUM 인가"만으로 신규/갱신을 구분한다. 그래서 **같은** SUBSCRIBED 가 두 번 오면:
1회차는 SUBSCRIBED(+활성화), 2회차는 이미 PREMIUM 이라 **RENEWED 로 오기록**.
테스트 실행 로그가 이걸 그대로 보여줬다:
```
1회차: event=SUBSCRIBED
2회차: event=RENEWED      ← 실제 갱신이 없었는데 갱신 이력 생성
AssertionError: Expected size: 1 but was: 2
```
- **원인**: `handle()`에 멱등성 키(dedup)가 전혀 없음. `notificationUUID`를 코드가 아예 읽지도 않고 있었다.
- **해결**: `notificationUUID` 기반 dedup 도입.
  - `NotificationResult`에 `notificationUuid` 필드 추가 + 디코드부에서 `getNotificationUUID()` 추출
    (Apple SDK가 주는데 우리가 안 꺼내고 있었음).
  - `processed_apple_notifications(notification_uuid UNIQUE)` 전용 테이블 신설 (Flyway V26)
    + 도메인 엔티티/포트/JPA 구현 (클린 아키텍처 컨벤션 준수).
  - `handle()`: 처리 전 `existsByNotificationUuid` 체크 → 중복이면 skip, 처리 후 uuid 기록.
- **설계 판단 — 왜 전용 테이블 + 같은 트랜잭션인가**:
  - 키를 `transactionId`가 아니라 `notificationUUID`로: 트랜잭션ID는 갱신마다 바뀌어 "재전송 dedup"엔 부적합.
  - 체크-처리-기록을 **한 트랜잭션**에 묶어, 처리가 예외로 깨지면 dedup 기록도 롤백 →
    Apple 재전송 시 정상 재시도. "성공한 것만 처리됨으로 표시"가 보장된다.
  - 거의 동시에 중복이 와서 둘 다 체크를 통과해도 DB `UNIQUE`가 2차 방어 (애플리케이션 체크 1차 + DB 제약 최종).

### 발견 2 — 만료된 PREMIUM 이 권한 게이트를 통과함
```java
boolean isPremium = subscriptionRepository.findByUserId(userId)
        .map(s -> s.isPremium())   // isPremium() == plan 문자열이 "PREMIUM" 인가, 그게 전부
        .orElse(false);
```
`isPremium()`은 `expiresAt`를 보지 않는다. 만료됐지만 만료 배치(`SubscriptionExpireJob`, 매일 01:00)나
웹훅이 아직 FREE 로 못 내린 상태면 plan 은 여전히 "PREMIUM" → **게이트 통과**.
- **노출 시간창**: 만료 시점 ~ 다음 배치까지 최대 ~24시간 동안 만료자가 PREMIUM 기능 사용 = 매출 누수 + 정책 위반.
- **테스트가 처음엔 불가능했던 이유**: 이 경계를 검증하려면 "지금이 만료 직후"라는 시점을 고정해야 하는데,
  로직이 `LocalDateTime.now()`를 직접 호출해 시점을 통제할 수 없었다.
- **해결**: 아래 3번(Clock 주입)으로 시점을 고정 가능하게 만든 뒤, 만료/경계/유효 케이스를 결정적으로 검증.

---

## 3. 구조 변경 — Clock 주입 (before / after)

만료 판정 로직이 시스템 시계에 직접 묶여 있어 시간 경계 테스트가 불가능했던 걸,
시간 소스를 주입 가능하게 바꿨다.

### Before
```java
// PlanLimitAspect
.map(s -> s.isPremium())          // plan 만 봄, 시점 개념 없음

// Subscription
public boolean isPremium() {
    return "PREMIUM".equals(this.plan);
}
```
- 만료 개념이 게이트에 없음. 시간을 통제할 방법도 없음 → 경계 테스트 불가.

### After
```java
// ClockConfig (신설) — 운영용 Clock 빈
@Bean Clock clock() { return Clock.systemDefaultZone(); }

// PlanLimitAspect — Clock 주입, 만료까지 확인
.map(s -> s.isActivePremium(LocalDateTime.now(clock)))

// Subscription — 시각을 "파라미터로 받는" 순수 메서드
public boolean isActivePremium(LocalDateTime now) {
    return isPremium() && this.expiresAt != null && this.expiresAt.isAfter(now);
}
```
- **설계 원칙**: 도메인(`Subscription`)은 시간 소스(Clock)에 의존하지 않고 **기준 시각을 인자로 받는다**.
  Clock 소유는 인프라/AOP 쪽(`PlanLimitAspect`)에 둔다 → 도메인은 순수하게 유지되어 단위 테스트가 쉬움.
- **테스트 측**: `Clock.fixed(...)`로 "2026-06-16 12:00 KST"를 고정해
  `expiresAt == now`(경계), `now-1d`(만료), `now+1d`(유효)를 흔들림 없이 검증.
  `now()` 직접 호출이었다면 경계 테스트는 불가능하거나 flaky 했을 것.

---

## 4. 테스트 개수 / 커버리지

- **이번에 추가한 테스트**: 6개 (A 1개 + B 5개), 신규 테스트 클래스 2개.
- **전체 스위트**: 59 tests — **58 green**, 1 fail.
  - 유일한 실패 `BackendApplicationTests.contextLoads()`는 로컬에 `.env`(DB_URL)가 없어
    Spring 컨텍스트가 안 뜨는 **환경 의존 실패**로, 이번 변경과 무관(원래 깨져 있던 통합 테스트).
- **커버리지 수치**: 측정 불가 — 프로젝트에 JaCoCo가 설정돼 있지 않다.
  CI에도 테스트 실행 단계가 없어 회귀를 자동으로 못 잡는 상태.
  → 후속으로 JaCoCo 도입 + CI에 `./gradlew test` 게이트 추가가 필요하다고 판단.

---

## 5. "테스트로 박았지만 도메인상 재검토 필요" 지점

1. **만료 판정의 단일 출처가 없음 (일관성 리스크)**
   이번에 `PlanLimitAspect`만 `isActivePremium`으로 고쳤다. 그런데 같은 "프리미엄인가" 판단을
   `SearchUseCaseImpl` / `GetRecordTimelineUseCaseImpl` / `GetMedicationHistoryUseCaseImpl`의
   플랜 분기도 각자 `isPremium()`(만료 미고려)으로 하고 있다.
   → 같은 사용자가 화면마다 다른 권한을 볼 수 있음. 만료 정의를 도메인 한 곳으로 모아야 함.

2. **AOP의 만료 차단 vs 배치/웹훅의 책임 경계**
   "게이트가 직접 만료를 막는다"로 정했지만, 만료의 권위 있는 처리(plan을 FREE로 내리고 이력 남기기)는
   여전히 배치/웹훅이다. 게이트가 막아도 DB plan 은 PREMIUM 인 불일치 상태가 잠시 존재한다.
   → "막기"와 "상태 정정"을 둘 다 할지, 게이트 통과 시점에 lazy 하게 expire 시킬지는 제품 정책 결정 필요.

3. **dedup 레코드의 보존 정책**
   `processed_apple_notifications`는 무한히 쌓인다. 보존 기간(예: 90일 후 정리)·인덱스 운영 정책 미정.
   멱등성에 필요한 윈도우만 유지하면 충분하다.

4. **경계값 `expiresAt == now`를 "만료"로 본 결정**
   `isAfter` 엄격 비교라 정확히 같은 순간은 만료로 처리된다(사용자에게 보수적). 합리적 기본값이지만,
   결제 갱신이 만료와 동시각에 들어오는 경합에서의 동작은 별도 검토 가치가 있다.

---

## 부록 — 면접용 30초 스크립트

"결제·권한처럼 틀리면 돈이 새는 로직인데 테스트가 0인 곳을 먼저 골랐습니다.
TDD 로 '결함을 먼저 실패 테스트로 증명'하는 방식을 썼고, 실제로 두 개를 잡았습니다.
하나는 Apple 웹훅이 중복 전달될 때 구독 이력이 오염되는 멱등성 결함이라 notificationUUID 기반
dedup 을 넣었고, 다른 하나는 만료된 프리미엄이 권한 게이트를 통과하는 결함이었는데
시계를 직접 호출하는 구조라 테스트 자체가 불가능했습니다. 그래서 Clock 을 주입하고
도메인은 시각을 인자로 받는 순수 메서드로 바꿔 경계값까지 결정적으로 검증했습니다.
마지막으로 '이번엔 한 곳만 고쳤지만 만료 판정의 단일 출처가 없다'는 후속 리스크를 기록으로 남겼습니다."
