# 보안 강화 작업 — 2026-05-24

전체 코드베이스 보안 취약점 점검 후 P0/P1/P2 7건 모두 처치. 빌드/타입체크 통과 (`./gradlew compileJava`, `tsc --noEmit`).

---

## 1. Toss 웹 결제 dead code 완전 제거

`PaywallScreen.tsx` 본인 주석에 `dormant` 라고 적혀 있던 토스페이먼츠 웹 결제 경로 일괄 정리. iOS 는 App Store IAP, Android 는 Play Billing 으로 통일 — 토스 웹 우회는 Google/Apple 양쪽 모두 심사 거부 사유라 활성화 가능성 0.

**백엔드 삭제**
- `application/payment/` (UseCase, DTO 전체)
- `domain/payment/` (PaymentTemp, PaymentTempRepository, PaymentStatus, PlanType)
- `infrastructure/external/payment/` (TossPaymentClient + DTO)
- `presentation/payment/` (PaymentController + DTO)
- `infrastructure/persistence/PaymentTempJpaRepository`, `PaymentTempRepositoryImpl`
- `infrastructure/batch/PaymentsTempCleanJob`

**백엔드 수정**
- `SecurityConfig`: `/api/v1/payments/webhook` PUBLIC_ENDPOINTS 에서 제거
- `SwaggerConfig`: subscription 그룹의 `/api/v1/payments/**` 매핑 제거
- `UserDataPurgeService`: `DELETE FROM payments_temp` 라인 제거
- `.env` / `.env.example`: `TOSS_SECRET_KEY` 제거

**DB 마이그레이션**
- `V24__drop_payments_temp.sql` 추가 → `DROP TABLE IF EXISTS payments_temp`

**앱 삭제/수정**
- `WebPaymentScreen.tsx` 삭제
- `RootNavigator.tsx`: `WebPayment` 라우트 + 타입 + import 제거
- `subscriptionApi.ts`: `preparePayment`, `confirmPayment`, 관련 타입 제거
- `PaywallScreen.tsx`: dormant 주석 블록 제거

**문서**
- 루트 `CLAUDE.md`: 스택 요약 `토스페이먼츠/IAP` → `IAP(App Store / Play Billing)`, DB 테이블 목록에서 `payments_temp` 제거
- `backend/CLAUDE.md`: 패키지 트리에서 `payment` 도메인 제거, `infrastructure/external/` 에서 `payment/` 제거, 환경변수 `TOSS_SECRET_KEY` 제거 + IAP 검증 변수 명시
- `dearmi-app/CLAUDE.md`: 결제 섹션을 IAP-only 로 변경

---

## 2. PII 로깅 마스킹

정신과 약품명/병원명/이메일 등은 CloudWatch 접근 권한자에게 평문 노출되면 진단 추론이 가능하므로 마스킹 또는 제거.

| 파일 | 변경 |
|---|---|
| [NotificationScheduler.java:275](backend/src/main/java/com/dearmi/backend/infrastructure/batch/NotificationScheduler.java#L275) | `group=`, `drugs=` 평문 → `groupId`, `drugs=N건` |
| [NotificationScheduler.java:318](backend/src/main/java/com/dearmi/backend/infrastructure/batch/NotificationScheduler.java#L318) | `drug=` 평문 → `scheduleId` |
| [FcmService.java:82-86](backend/src/main/java/com/dearmi/backend/infrastructure/external/fcm/FcmService.java#L82-L86) | Expo Push 발송 로그에서 `title=` 제거 (약품/병원명 포함 가능) |
| [OcrProcessorService.java:86-87](backend/src/main/java/com/dearmi/backend/application/prescription/service/OcrProcessorService.java#L86-L87) | `hospitalName=` 평문 → `prescriptionId` |
| [OcrProcessorService.java:98-99](backend/src/main/java/com/dearmi/backend/application/prescription/service/OcrProcessorService.java#L98-L99) | OCR 약품 상세 로그 (drugName/dosage/singleDose/directions/days) 전체 삭제 |
| [AutoCreateMedicationSchedulesService.java:94](backend/src/main/java/com/dearmi/backend/application/medication/service/AutoCreateMedicationSchedulesService.java#L94) | `drugName=` 제거 |

---

## 3. 게스트 → 로그인 React Query 캐시 정리

게스트 모드에서 사용한 mock 데이터 캐시가 로그인 직후 사용자 화면에 잠깐 잔존할 가능성 차단.

- [authStore.ts:60-67](dearmi-app/src/features/auth/store/authStore.ts#L60-L67): `setTokens()` 진입 시 `queryClient.clear()` 호출 추가

---

## 4. 처방전 업로드 확장자 / Content-Type 화이트리스트

기존: 클라이언트가 보낸 파일명·Content-Type 을 그대로 S3 presigned PUT 발급에 사용 → `.html`/`.svg`/실행파일 업로드 가능 (XSS, 악성파일 호스팅).

- [GenerateUploadUrlUseCaseImpl.java](backend/src/main/java/com/dearmi/backend/application/prescription/usecase/GenerateUploadUrlUseCaseImpl.java)
  - 확장자 화이트리스트: `jpg / jpeg / png / heic / heif / webp`
  - Content-Type 화이트리스트: 대응 `image/*`
  - 확장자 기준으로 Content-Type **서버 강제 정정** (클라이언트가 `image/jpeg` 라고 보내도 확장자가 `.png` 면 `image/png` 로 덮어씀 → MIME 스푸핑 차단)
  - 위반 시 `ErrorCode.INVALID_REQUEST` 400

---

## 5. DevAuthController prod 노출 방지

기존: `@Profile("local")` 로만 보호. 실수로 운영에 `local` 프로파일이 같이 active 되면 무방비.

**추가**
- [EnvironmentValidator.java](backend/src/main/java/com/dearmi/backend/infrastructure/config/EnvironmentValidator.java)
  - 부팅 시 active profile 로그
  - `prod` + (`local` | `dev`) 동시 active 시 `IllegalStateException` → 부팅 **fail-fast**
- [DevAuthController.java](backend/src/main/java/com/dearmi/backend/presentation/auth/DevAuthController.java)
  - `@PostConstruct` 에 활성화 경고 로그

---

## 6. Rate Limiting (Bucket4j 인메모리)

기존: 로그인/리프레시/OCR 등 abusive 시 비용 폭증 가능한 엔드포인트에 throttle 0건. Bucket4j 의존성은 이미 build.gradle 에 있었으나 사용 0건.

**추가**
- [RateLimitFilter.java](backend/src/main/java/com/dearmi/backend/infrastructure/security/RateLimitFilter.java)
  - 토큰 버킷 (Bucket4j) 기반 IP 별 제한, `OncePerRequestFilter` 로 자동 등록
  - `X-Forwarded-For` 첫 값 우선 (ALB/CloudFront 환경)
  - 초과 시 `429 RATE_LIMIT_EXCEEDED`

| Endpoint | 제한 |
|---|---|
| `GET /oauth2/authorization/**` | 10/min/IP |
| `POST /api/v1/auth/refresh` | 20/min/IP |
| `POST /api/v1/prescriptions/upload-url` | 20/min/IP |
| `POST /api/v1/prescriptions` (OCR 트리거) | 5/min/IP |

ECS multi-instance 에서는 인스턴스별로 제한이 분배되지만, abusive 클라이언트는 ALB sticky/동일 IP 로 한 인스턴스에 집중되므로 실효성 확보. 글로벌 엄격 제한 필요 시 `bucket4j-redis` 로 backend 만 교체하면 됨.

---

## 7. OAuth state/nonce 검증 (Login CSRF 차단)

기존: 백엔드가 발급한 토큰을 그대로 `dearmi://auth?access_token=...` 딥링크로 echo. 외부 페이지/타 앱이 이 딥링크를 강제 주입하면 피해자가 공격자 계정으로 로그인되어, 이후 입력하는 진료기록이 공격자 계정에 저장되는 Login CSRF 가능.

Spring 의 표준 OAuth2 `state` 는 백엔드 ↔ IdP CSRF 용이고, 앱 ↔ 백엔드 redirect 바인딩은 별도 nonce 가 필요.

**백엔드 추가**
- [OAuthAppStateFilter.java](backend/src/main/java/com/dearmi/backend/infrastructure/security/OAuthAppStateFilter.java)
  - `/oauth2/authorization/**` 진입 시 `app_state` 쿼리를 servlet session 에 저장
  - `WebBrowser.openAuthSessionAsync` 가 OAuth flow 동안 in-app browser cookie 를 유지하므로 동일 session 보장
- [OAuth2SuccessHandler.java](backend/src/main/java/com/dearmi/backend/infrastructure/security/OAuth2SuccessHandler.java)
  - session 에서 `app_state` 꺼내 redirect URI 에 `state=...` echo 후 session 에서 제거 (1회용)

**앱 수정**
- [useLogin.ts](dearmi-app/src/features/auth/hooks/useLogin.ts)
  - OAuth 시작 시 nonce 생성 (`timestamp-${16바이트 hex}`) → SecureStore 저장 → URL 에 `app_state` 쿼리로 전달
  - 콜백 수신 시 SecureStore 의 저장값 즉시 삭제 후 비교 (재사용 방지)
  - 불일치 → 에러 throw, 토큰 저장 안 함
  - cancel/dismiss/실패 경로에서도 SecureStore cleanup 수행

추측 공격 표면: 5~10분 OAuth window 안에 `timestamp + 16바이트 hex` 정확 추측 + 같은 시점 피해자가 OAuth 진행 중 + 딥링크 도달 — 실용적 보안 충분. CSPRNG 가 필요해지면 `expo-crypto` 추가 (현재 미설치).

---

## 변경 통계

- 신규 파일 5개: 마이그레이션 1, 백엔드 컴포넌트 3, 문서 1
- 삭제 파일 17개 (Toss dead code)
- 수정 파일: 백엔드 8개, 앱 4개, 문서 3개

## 미적용 (현재 위험 없음 / 추후 검토)

- **rate limit Redis backend**: ECS multi-instance 글로벌 제한 필요해지면 `bucket4j-redis` 도입. 현재는 인메모리로 충분.
- **OAuth state CSPRNG**: `expo-crypto` 추가 시 `Math.random` → `Crypto.randomUUID` 로 교체. 네이티브 빌드 트리거되므로 다른 네이티브 변경과 묶어서.
- **Android 자동 submission**: 사업자 등록 + 통신판매업 신고번호 입력 후. 별도 작업.
