# DearMI Backend — Claude Code 가이드

> Spring Boot 3 + PostgreSQL + S3 | 루트의 CLAUDE.md도 함께 읽을 것

---

## 패키지 구조

```
com.dearmi/
├── presentation/        Controller, Request/Response DTO
├── application/         UseCase interface, UseCase impl, Port interface, Command/Query DTO
├── domain/              Entity, Repository interface, DomainService, Exception
├── infrastructure/
│   ├── persistence/     JPA Repository impl, QueryDSL
│   ├── external/        Claude API, 약학정보원, FCM, S3, 토스페이먼츠
│   ├── config/          Spring 설정 (S3Config, AsyncConfig, WebClientConfig, EncryptionConfig 등)
│   ├── batch/           Scheduler, Batch Job
│   └── security/        JWT, OAuth2, AOP (AuditLogAspect, PlanRequiredAspect)
└── common/
    ├── converter/        AesEncryptionConverter, TagsJsonConverter  ← domain도 참조 가능
    ├── exception/        CustomException, ErrorCode, GlobalExceptionHandler
    └── response/         ApiResponse, PageResponse
```

---

## 클린 아키텍처 규칙

### 의존성 방향
```
Presentation → Application → Domain ← Infrastructure
```

**Domain**: Spring 의존성 절대 금지. Repository interface만 정의.  
**Application**: UseCase interface + impl 분리 필수. `@Transactional`은 impl에만.  
**Presentation**: UseCase interface만 주입. Request→Command 변환 후 호출.  
**Infrastructure**: 외부 API는 `infrastructure/external/` 하위 Client 클래스로만.  
**common/converter**: domain과 infrastructure 모두 참조. Spring 의존성 없는 순수 변환 로직만.

---

## 인증 (Spring Security OAuth2 + JWT)

```
앱 → Google/Apple OAuth2 → JWT 발급
  → Authorization: Bearer {accessToken}
  → JwtAuthenticationFilter → SecurityContext
  → @AuthenticatedUserId UUID 주입
```

- Access Token: 1시간 / Refresh Token: 7일 (DB SHA-256 해시 저장, Rotation)
- 탈퇴 시: `refresh_tokens` 해당 userId 즉시 삭제 (⑥ 원칙)

---

## 로컬 개발 환경 설정

```bash
cp backend/.env.example backend/.env   # 값 채우기
./gradlew bootRun                       # .env 자동 로딩
```

- `backend/.env`: 실제 로컬 시크릿 (gitignored)
- `backend/.env.example`: 팀 온보딩용 빈 템플릿 (Git 커밋됨)
- `application-local.yml`: 민감 값은 모두 `${ENV_VAR}` 참조. 하드코딩 금지.
- `bootRun`의 `doFirst` 블록이 `.env`를 읽어 환경변수로 주입

---

## DB 규칙

- 모든 PK: UUID
- 논리 삭제: `deleted_at TIMESTAMP NULL`
- 마이그레이션: Flyway (`V{n}__{description}.sql`)
- `spring.jpa.hibernate.ddl-auto=validate` (create 절대 금지)

---

## 연관 데이터 처리 (⑤ 원칙)

| 삭제 대상 | 처리 |
|---|---|
| `hospital_schedules` | `counseling_records.schedule_id = NULL` / `prescriptions.schedule_id = NULL` / `prep_notes.schedule_id = NULL` |
| `prescriptions` | `prescription_medications` CASCADE + S3 삭제 예약 |
| `medication_schedules` | `medication_logs` CASCADE |
| 회원 탈퇴 | `refresh_tokens` 즉시 삭제 + 소프트딜리트 + 30일 후 배치 하드딜리트 |

---

## 주요 구현 패턴

### 상담 기록 암호화 (AES-256-GCM)
- `common/converter/AesEncryptionConverter`: JPA `AttributeConverter` — static `SecretKeySpec` 사용
- JPA는 converter를 Spring 없이 직접 인스턴스화하므로 `@Value` 주입 불가
- `infrastructure/config/EncryptionConfig` `@PostConstruct`에서 `AesEncryptionConverter.initialize(key)` 호출
- 새 암호화 필드 추가 시 동일 패턴 사용

### JSON 배열 컬럼 (tags)
- `common/converter/TagsJsonConverter`: `List<String>` ↔ JSON 문자열
- DB 컬럼은 `TEXT` or `VARCHAR`, JPA에서 `@Convert(converter = TagsJsonConverter.class)`

### 처방전 OCR 비동기 파이프라인
```
POST /prescriptions → S3 업로드 확인 → prescription 저장 → OcrProcessorService.processAsync() @Async
  └→ [별도 스레드] Claude Vision → medications 저장 → DrugInfoCacheService → drug info 업데이트
```
- `OcrProcessorService`는 `CreatePrescriptionUseCaseImpl`과 **별도 빈** (self-invocation 방지)
- `@Async("ocrTaskExecutor")` + `@Transactional` 함께 사용
- drug info 조회 실패는 try-catch로 무시 — OCR 결과에 영향 없음

### 약품 정보 30일 캐시
- `DrugInfoCacheService.searchWithCache(drugName)`: `drugInfoFetchedAt > now - 30days` 인 레코드가 있으면 DB 반환, 없으면 e약은요 API 호출
- e약은요 `ServiceKey`는 이미 URL 인코딩된 채 발급 → `WebClient.queryParam()` 쓰면 이중 인코딩됨 → raw URL 문자열 직접 조합

### 약품 정보 미조회 상태 처리
- `PrescriptionMedication.drugInfoFetchedAt == null` → `MedicationDetailResponse.drugInfoPending = true`
- 앱이 폴링 또는 재조회로 처리

### 복약 일정 시간대 (TimeSlot)
- `MedicationSchedule`: `morning/afternoon/evening/bedtime` (Boolean) + `morningTime/afternoonTime/eveningTime/bedtimeTime` (LocalTime)
- `MedicationLog`: `logDate` (LocalDate) + `timeSlot` (VARCHAR) — UNIQUE(scheduleId, logDate, timeSlot)로 중복 방지
- UPSERT 기준 키: `(medicationScheduleId, logDate, timeSlot)` → `findByMedicationScheduleIdAndLogDateAndTimeSlot` 사용

### 알림 스케줄러 (NotificationScheduler)
- **병원 D-1/D-0**: 매일 오전 9시 — `notification_settings.day_before/day_of` 체크
- **체크인 리마인더**: 매분 실행 — `checkin_time == now()` + 오늘 `daily_checkins` 없는 유저만 발송
- **복약 알림**: 매분 실행 — 각 slot_time == now() + 오늘 해당 슬롯 로그 없는 경우만 발송
- 유저별 `checkin_time` 커스텀 가능 (기본 21:00), `med_enabled`/`checkin_enabled` 플래그로 개별 제어

---

## S3

- 처방전 이미지: `prescriptions/{userId}/{prescriptionId}/image.jpg`
- PDF 내보내기: `exports/{userId}/{jobId}/export.pdf`
- 백업: `backups/{userId}/{timestamp}/backup.json`
- 접근: Presigned URL만 (GET/PUT 15분). 직접 URL 노출 금지.
- 보안: 퍼블릭 차단, SSE-S3 암호화

---

## 외부 API 위치

| 서비스 | 패키지 | 구현 상태 |
|---|---|---|
| Claude Vision (OCR) | `infrastructure/external/claude/` | ✅ |
| e약은요 | `infrastructure/external/druginfo/` | ✅ |
| Firebase FCM | `infrastructure/external/fcm/` | ✅ |
| AWS S3 | `infrastructure/external/s3/` | ✅ |
| 토스페이먼츠 | `infrastructure/external/payment/` | 🔲 |
| Apple/Google IAP 검증 | `infrastructure/external/payment/` | 🔲 |

---

## 배치 스케줄러

| Job | 주기 | 내용 | 상태 |
|---|---|---|---|
| `HardDeleteBatchJob` | 매일 새벽 2시 | 탈퇴 30일 후 하드딜리트 + S3 삭제 | 🔲 |
| `SubscriptionExpireJob` | 매일 새벽 1시 | 만료 PREMIUM → FREE | 🔲 |
| `PaymentsTempCleanJob` | 매시간 | 30분 경과 payments_temp 삭제 | 🔲 |
| `NotificationScheduler` | 오전 9시 (병원) / 매분 (체크인·복약) | D-1/D-0 병원 알림 + 체크인 리마인더 + 복약 알림 | ✅ |

---

## 환경변수

```
# DB
DB_URL, DB_USERNAME, DB_PASSWORD

# 인증
JWT_SECRET

# 암호화
ENCRYPTION_KEY          # 상담 기록 AES-256-GCM

# 외부 API
CLAUDE_API_KEY
DRUG_INFO_API_KEY

# AWS
AWS_S3_BUCKET, AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION

# OAuth2
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
APPLE_CLIENT_ID, APPLE_CLIENT_SECRET

# 기타
FIREBASE_CREDENTIALS_PATH
TOSS_SECRET_KEY
```

로컬: `backend/.env` | 운영: AWS Secrets Manager / ECS Task Definition
