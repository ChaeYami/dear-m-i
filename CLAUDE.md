# Dear Mi Backend - 개발 가이드라인


# DearMI — Claude Code 공통 가이드

> **Dear Me + I** | 멘탈 케어 진료 기록 앱  
> 매 세션 시작 전 반드시 이 파일을 읽을 것.

---

## 프로젝트 구조

```
dearmi/
├── CLAUDE.md         ← 항상 읽힘
├── backend/          Spring Boot 3
│   └── CLAUDE.md
└── app/              React Native (Expo)
    └── CLAUDE.md
```

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 앱 | React Native (Expo SDK 51+) |
| 앱 상태 | Zustand (클라이언트) + React Query (서버) |
| 앱 로컬 저장 | react-native-mmkv + expo-secure-store |
| 앱 다국어 | i18next + expo-localization |
| 앱 결제 | react-native-iap (iOS IAP + Android Play Billing) |
| 백엔드 | Spring Boot 3 + JPA + QueryDSL + Flyway |
| 인증 | Spring Security OAuth2 (Google/Apple) + JWT |
| DB | PostgreSQL 15 (AWS RDS) |
| 파일 저장 | AWS S3 (Presigned URL) |
| 푸시 알림 | Firebase FCM (이것만 Firebase 사용) |
| OCR | Claude Vision API — 백엔드에서만 호출 |
| 약품 정보 | e약은요 Open API |
| 웹 결제 | 토스페이먼츠 (Android + 웹) |
| 배포 | AWS ECS Fargate + RDS + S3 |
| 시크릿 관리 | AWS Secrets Manager |

---

## 🔴 보안 필수 원칙 6가지 (절대 위반 금지)

### ① 클린 아키텍처 절대 준수
- 의존성 방향: `Presentation → Application → Domain ← Infrastructure`
- Domain은 Spring 의존성 없음 (순수 Java)
- Controller는 UseCase **interface**만 호출 (impl 직접 참조 금지)
- `@Transactional`은 UseCase impl에만

### ② API 키 하드코딩 금지
- 앱 코드(app/src/) 어디에도 API 키·시크릿 직접 작성 금지
- Claude API, 약학정보원, AWS, JWT 시크릿 → 백엔드 환경변수 또는 AWS Secrets Manager
- 앱이 Claude API 필요 시 → 백엔드 API 호출, 백엔드가 Claude 호출

### ③ 앱 버전 체크는 서버에서
- 앱 코드에 버전 비교 로직 하드코딩 금지
- SplashScreen 시작 시 반드시 `GET /api/v1/app/version` 호출
- `forceUpdate: true`이면 앱스토어 이동, 진행 불가

### ④ 타인 리소스 접근 차단
- 모든 UseCase 첫 동작: JWT userId == 리소스 userId 검증
- 불일치 시 **404** 반환 (403 아님 — 리소스 존재 여부 숨김)
- `findById()` 단독 사용 금지 → `findByIdAndUserId()` 사용

### ⑤ 연관 데이터 처리 명확화 (삭제 시 규칙)

| 삭제 대상 | 연관 데이터 처리 |
|---|---|
| `hospital_schedules` 삭제 | `counseling_records.schedule_id = NULL` / `prescriptions.schedule_id = NULL` / `prep_notes.schedule_id = NULL` (데이터 유지, 연결만 해제) |
| `prescriptions` 삭제 | `prescription_medications` CASCADE 삭제 + S3 이미지 삭제 예약 |
| `medication_schedules` 삭제 | `medication_logs` CASCADE 삭제 |
| 회원 탈퇴 | `refresh_tokens` 즉시 삭제 + 소프트딜리트 + 30일 후 배치 하드딜리트 + S3 삭제 |

### ⑥ 탈퇴 후 토큰 즉시 무효화
- `DeleteUserUseCase`: `users.deleted_at` 설정과 **동시에** `refresh_tokens` 해당 userId 즉시 삭제
- 소프트딜리트만 하고 토큰 유지하는 코드 생성 금지

---

## DB 테이블 목록

```
users, hospital_schedules, counseling_records,
daily_checkins, prescriptions, prescription_medications,
medication_schedules, medication_logs, prep_notes,
subscriptions, subscription_histories, refresh_tokens,
notification_settings, audit_logs, payments_temp,
export_jobs, app_versions
```

---

## 플랜 분기 규칙

| 기능 | 무료 | 프리미엄 |
|---|---|---|
| 상담 기록 작성 | 200자 제한 | 무제한 |
| 상담 기록 조회 | 최근 2개월 | 전체 기간 |
| 하루 메모 작성 | 100자 제한 | 무제한 |
| 하루 메모 조회 | 최근 30일 | 전체 기간 |
| 감정 그래프 | 30일 | 전체 + 기간 선택 |
| 처방전 OCR | 미지원 | 지원 |
| 약품 상세 정보 | 미지원 | 지원 |
| 복약 일정 자동 생성 | 수동만 | OCR 연동 자동 제안 |
| 복약 이력 조회 | 최근 30일 | 전체 기간 |
| 검색 범위 | 최근 2개월 | 전체 기간 |
| PDF 내보내기 | 미지원 | 지원 |
| 데이터 백업/복원 | 미지원 | 지원 |
| AI 상담 준비 리포트 | 미지원 | v2.0 예정 |

**플랜 체크**: `@PlanRequired(PREMIUM)` AOP — 402 반환

---

## 미확정 / v2.0 이후 (지금 구현하지 말 것)

- AI 상담 준비 리포트 (v2.0 연기)
- OpenFDA 글로벌 약품 정보 (v1.1)
- Stripe 글로벌 웹 결제 (v1.1)
- 반복 일정 (v1.1)



## 프로젝트 구조 (클린 아키텍처)

```
com.dearmi.backend/
├── presentation/       # 외부 입출력 (Controller, DTO, Mapper)
├── application/        # 비즈니스 유스케이스 (UseCase interface + impl, Port)
├── domain/             # 핵심 도메인 (Entity, DomainService, Repository interface)
├── infrastructure/     # 기술 구현 (JPA impl, External API, Config, Batch, Scheduler)
└── common/             # 공통 유틸 (ApiResponse, GlobalExceptionHandler, BaseTimeEntity)
```

---

## 클린 아키텍처 레이어 규칙

### 의존성 방향 (단방향, 안쪽만 의존 가능)
```
presentation → application → domain
infrastructure → application → domain
```

### Domain 레이어
- Spring 프레임워크 의존성 **절대 금지**: `@Repository`, `@Service`, `@Component` 등
- 허용: JPA 어노테이션 (`@Entity`, `@Column`), Jakarta 표준 어노테이션
- Repository는 **interface만** 선언, 구현은 infrastructure/jpa/ 에서

### Application 레이어
- UseCase는 반드시 **interface + impl 분리**
  - 예: `CreateLetterUseCase` (interface) + `CreateLetterUseCaseImpl` (impl)
- Port interface 정의: 외부 의존성을 추상화

### Presentation 레이어
- Controller는 **UseCase interface만 호출** (impl 직접 참조 금지)
- Domain Entity를 Response로 직접 반환 금지 → DTO 변환 필수
- 모든 응답은 `ApiResponse<T>` 래퍼 사용

### Infrastructure 레이어
- **외부 API 클라이언트는 반드시 `infrastructure/external/` 하위에만** 위치
- Domain Repository interface를 구현하는 JPA 구현체는 `infrastructure/jpa/` 에
- AWS S3, 외부 서비스 등 모든 외부 통신은 `external/` 패키지에서만

---

## 보안 원칙

### API 키 / 시크릿 하드코딩 절대 금지
- DB 패스워드, JWT Secret, AWS Key 등 **모든 민감 정보는 환경변수로 주입**
- 로컬: `application-local.yml` (Git 커밋 가능하나 실제 운영 값 포함 금지)
- 운영: 환경변수 (`${DB_PASSWORD}`, `${JWT_SECRET}` 등)
- AWS Secrets Manager 활용 권장

### 잘못된 예 (절대 금지)
```java
// ❌ 하드코딩 금지
String secretKey = "my-super-secret-key-12345";
String awsAccessKey = "AKIAIOSFODNN7EXAMPLE";
```

### 올바른 예
```java
// ✅ 환경변수 또는 설정 파일에서 주입
@Value("${jwt.secret}")
private String secretKey;
```

---

## 타인 리소스 접근 시 404 반환 규칙

보안상 권한 없는 리소스와 존재하지 않는 리소스를 구분하지 않음:

```java
// ✅ 올바른 처리: 권한 없는 타인 리소스 접근 시 404 반환
public Letter getLetter(Long letterId, Long currentUserId) {
    Letter letter = letterRepository.findById(letterId)
            .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));

    // 타인 소유 리소스: 403 Forbidden 대신 404 Not Found 반환
    // (리소스 존재 여부 자체를 노출하지 않음)
    if (!letter.getOwnerId().equals(currentUserId)) {
        throw new CustomException(ErrorCode.NOT_FOUND);
    }
    return letter;
}
```

---

## API 응답 형식

```json
// 성공
{ "success": true, "data": { ... } }

// 실패
{ "success": false, "errorCode": "RESOURCE_001", "message": "요청한 리소스를 찾을 수 없습니다." }
```

---

## DB 마이그레이션 규칙

- **`spring.jpa.hibernate.ddl-auto=validate`** (create, create-drop, update 절대 금지)
- 스키마 변경은 반드시 `src/main/resources/db/migration/V{N}__{설명}.sql` 파일로 관리
- 마이그레이션 파일은 한번 배포 후 **절대 수정 금지** (새 버전 파일 추가)

---

## 패키지별 역할 요약

| 패키지 | 역할 | 허용 의존성 |
|--------|------|------------|
| `presentation` | HTTP 요청/응답, DTO 변환 | application (UseCase interface) |
| `application` | 유스케이스 오케스트레이션 | domain |
| `domain` | 핵심 비즈니스 규칙 | 없음 (최내부) |
| `infrastructure` | 기술 구현, 외부 연동 | application, domain |
| `common` | 공통 유틸리티 | 없음 |
