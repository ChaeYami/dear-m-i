# DearMI — Claude Code 공통 가이드

> **Dear Me + I** | 멘탈 케어 진료 기록 앱  
> 매 세션 시작 전 반드시 이 파일을 읽을 것.

---

## 프로젝트 구조

```
dearmi/
├── CLAUDE.md          ← 항상 읽힘 (공통 원칙)
├── backend/           Spring Boot 3
│   └── CLAUDE.md      ← 백엔드 세부 규칙
└── dearmi-app/        React Native (Expo)
    └── CLAUDE.md      ← 앱 세부 규칙
```

---

## 기술 스택

| 영역 | 기술 |
|---|---|
| 앱 | React Native (Expo SDK 51+) |
| 앱 상태 | Zustand ^5 (클라이언트) + React Query ^5 (서버) |
| 앱 로컬 저장 | react-native-mmkv + expo-secure-store |
| 앱 다국어 | i18next + expo-localization (미설치) |
| 앱 결제 | react-native-iap (미설치 — iOS IAP + Android Play Billing) |
| 백엔드 | Spring Boot 3 + JPA + QueryDSL + Flyway |
| 인증 | Spring Security OAuth2 (Google/Apple) + JWT |
| DB | PostgreSQL 15 (AWS RDS) |
| 파일 저장 | AWS S3 (Presigned URL) |
| 푸시 알림 | Firebase FCM (이것만 Firebase 사용) |
| OCR | Claude Vision API — 백엔드에서만 호출 |
| 약품 정보 | e약은요 Open API (30일 DB 캐시) |
| 웹 결제 | 토스페이먼츠 (Android + 웹) |
| 배포 | AWS ECS Fargate + RDS + S3 |
| 시크릿 관리 | AWS Secrets Manager (운영) / .env (로컬) |

---

## 구현 현황

### 백엔드 (완료)

| 도메인 | UseCase / 엔드포인트 |
|---|---|
| Auth | Login, Logout, TokenRefresh, GetCurrentUser |
| Schedule | CRUD + GetMonthly — `/api/v1/schedules` |
| Record | CRUD + Timeline(커서 페이징) — `/api/v1/records` |
| Prescription | GenerateUploadUrl, Create(OCR 비동기), GetDetail, UpdateMedications |
| Medication | GetDetail(e약은요) — `/api/v1/medications/{id}` |
| MedicationSchedule | CRUD + Today + History + Stats + Check — `/api/v1/medication-schedules` |
| Notification | GetSettings, UpdateSettings, UpdateFcmToken — `/api/v1/notifications` |

DB 마이그레이션: V1(초기 스키마) → V2(복약 타임슬롯) → V3(알림·체크인·복약 컬럼)

### 앱 화면 (완료)

| Feature | 화면 |
|---|---|
| auth | LoginScreen (Google/Apple OAuth2) |
| schedule | ScheduleTab, ScheduleDetail, ScheduleForm |
| record | RecordTab (타임라인), RecordForm |
| prescription | PrescriptionTab (아코디언), PrescriptionUpload, OcrResult |
| medication | MedicationDetail (약품 상세) |
| notification | NotificationSettingsScreen |
| mypage | MyPageScreen (placeholder) |
| subscription | PaywallScreen (skeleton) |

### 미구현

| 기능 | 비고 |
|---|---|
| CheckinTab (하루 메모) | 백엔드 API + 앱 화면 |
| 감정 그래프 | react-native-chart-kit |
| 결제 / 구독 | react-native-iap 설치 필요 |
| PDF 내보내기 | export_jobs 테이블 |
| 데이터 백업/복원 | 프리미엄 |
| PremiumGate 컴포넌트 | `shared/components/PremiumGate.tsx` |
| 앱 버전 체크 | `GET /api/v1/app/version` (RootNavigator 미적용) |
| 생체인증 | expo-local-authentication |
| 앱 위젯 | iOS / Android |

---

## 🔴 보안 필수 원칙 6가지 (절대 위반 금지)

### ① 클린 아키텍처 절대 준수
- 의존성 방향: `Presentation → Application → Domain ← Infrastructure`
- Domain은 Spring 의존성 없음 (순수 Java)
- Controller는 UseCase **interface**만 호출 (impl 직접 참조 금지)
- `@Transactional`은 UseCase impl에만

### ② API 키 하드코딩 금지
- 앱 코드(dearmi-app/src/) 어디에도 API 키·시크릿 직접 작성 금지
- Claude API, 약학정보원, AWS, JWT 시크릿 → 백엔드 환경변수 또는 AWS Secrets Manager
- 앱이 Claude API 필요 시 → 백엔드 API 호출, 백엔드가 Claude 호출
- **로컬 개발**: `backend/.env` 파일에 관리 (gitignored). `.env.example` 참고

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
| `hospital_schedules` | `counseling_records.schedule_id = NULL` / `prescriptions.schedule_id = NULL` / `prep_notes.schedule_id = NULL` |
| `prescriptions` | `prescription_medications` CASCADE 삭제 + S3 이미지 삭제 예약 |
| `medication_schedules` | `medication_logs` CASCADE 삭제 |
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

## API 응답 형식

```json
// 성공
{ "success": true, "data": { ... } }

// 실패
{ "success": false, "errorCode": "RESOURCE_001", "message": "요청한 리소스를 찾을 수 없습니다." }
```

---

## v2.0 이후 (지금 구현하지 말 것)

- AI 상담 준비 리포트 (v2.0 연기)
- OpenFDA 글로벌 약품 정보 (v1.1)
- Stripe 글로벌 웹 결제 (v1.1)
- 반복 일정 (v1.1)
