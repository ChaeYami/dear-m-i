# DearMI Backend

> Spring Boot 3.5 + PostgreSQL + S3. 루트 `CLAUDE.md` 의 6원칙 준수 (특히 ①④⑤⑥).

## 패키지 트리
```
com.dearmi.backend/
├── presentation/      Controller, Request/Response DTO
├── application/       UseCase interface + impl, Command/Query DTO
│                      (도메인: auth, appversion, schedule, record, prescription,
│                       medication, druginfo, checkin, notification, prepnote,
│                       search, subscription)
├── domain/            Entity, Repository interface, DomainService, Exception
├── infrastructure/
│   ├── persistence/   JPA Repository impl + QueryDSL
│   ├── external/      claude/, druginfo/, fcm/, s3/
│   ├── config/        S3Config, AsyncConfig, EncryptionConfig, WebClientConfig 등
│   ├── batch/         NotificationScheduler 등
│   └── security/      JWT, OAuth2, AOP (PlanRequiredAspect, AuditLogAspect)
└── common/
    ├── converter/     AesEncryptionConverter, TagsJsonConverter
    │                  (Spring 의존성 X — domain 도 import 가능)
    ├── exception/     CustomException, ErrorCode, GlobalExceptionHandler
    └── response/      ApiResponse, PageResponse
```

Controller / UseCase 목록은 코드 직접 grep (스테일 방지).

## 클린 아키텍처 강제 사항
- **Domain**: Spring import 절대 금지. Repository 는 interface 만 정의.
- **Application**: UseCase **interface + impl 분리 필수**. impl 에만 `@Transactional`.
- **Presentation**: UseCase interface 만 주입. `@AuthenticatedUserId UUID userId` 로 인증된 사용자 ID 받음. Request DTO → Command 변환 후 호출.
- **Infrastructure/external**: 외부 API 호출은 Client 클래스로 격리. UseCase 는 Port interface 통해서만 사용.
- `common/converter` 는 domain 도 사용 가능 — Spring 의존성 없는 순수 변환 로직만 둘 것.
- **패키지 명명 일관성**: 한 도메인은 `domain`/`application`/`presentation` 세 계층에서 **같은 패키지명**을 쓸 것 (예: `schedule`, `record`). 엔티티 클래스명은 디스크립티브하게 달라도 됨 (패키지 `schedule` + 엔티티 `HospitalSchedule` — `MedicationSchedule` 과 구분). DB 테이블명/라우트는 별개로 유지.

## UseCase 분할 기준

**기본값 = "쓰기(Command) 연산 1개 = UseCase 1개"** (다수파: auth/medication/prescription/schedule/notification). 단, 아래로 합치기/쪼개기 판정:

- 다음 중 하나라도 해당 → **반드시 독립 UseCase**:
  - 자기만의 트랜잭션 경계 (`@Async`, 별도 propagation, 멱등 처리 등)
  - 이 연산에만 붙는 정책 애너테이션 (`@PlanRequired`, `@Audited`)
  - Controller 외 호출자 존재 (Scheduler / Webhook / 다른 UseCase 가 재사용)
  - impl 본문 ~50줄↑ 거나 외부 연동(OCR·IAP·S3) 포함
- 위 어디에도 안 걸리는 **단순 CRUD** → 같은 aggregate 형제 연산과 한 인터페이스로 묶어도 됨 (예: `SideEffectUseCase`). 명사형 인터페이스명 허용.
- **과거 자산 churn 금지**: 규칙은 신규 + 해당 파일 어차피 건드릴 때만 적용. 일관성 명분으로 동작 코드 대량 리네임 X.

### `usecase/` vs `service/` 경계
- `usecase/XxxUseCase(+Impl)` — **Controller 진입점 1:1**. Controller 가 직접 주입. `@Transactional` impl 에.
- `service/XxxService` — **여러 UseCase 공유** 또는 **비동기/조합 로직** (예: `OcrProcessorService`, `DrugInfoCacheService`, `AutoCreateMedicationSchedulesService`). 호출자는 UseCase/Scheduler/다른 Service. 자체 트랜잭션 경계 가질 수 있음.
- 판정: "Controller 가 직접 부르나?" → usecase / "UseCase 들이 공유하는 내부 협력자?" → service.

## DB
- PK 모두 UUID, soft delete `deleted_at TIMESTAMP NULL`.
- 마이그레이션: Flyway, `src/main/resources/db/migration/V{n}__{desc}.sql`.
- `spring.jpa.hibernate.ddl-auto=validate` (create 절대 금지).

## 인증
- OAuth2 (Google/Apple) → JWT 발급. Access 1h / Refresh 7d (DB SHA-256 해시 저장, rotation).
- `JwtAuthenticationFilter` → SecurityContext → `@AuthenticatedUserId UUID userId` 주입.
- 탈퇴 시 `refresh_tokens` 즉시 삭제 (원칙 ⑥).
- `DevAuthController` 존재 — 운영 비활성화 확인 필수.

## 로컬 개발
```bash
cp backend/.env.example backend/.env   # 값 채우기
./gradlew bootRun                      # bootRun.doFirst 가 .env 자동 주입
```
- `application-local.yml` 의 민감 값은 모두 `${ENV_VAR}` 참조. 하드코딩 금지.
- `.env` 는 gitignored, `.env.example` 은 빈 템플릿으로 커밋.

### 환경변수
```
DB_URL, DB_USERNAME, DB_PASSWORD
JWT_SECRET
ENCRYPTION_KEY                              # 진료 기록 AES-256-GCM
GEMINI_API_KEY                              # Vision OCR
DRUG_INFO_API_KEY                           # 식약처 의약품 제품 허가정보 API
AWS_S3_BUCKET, AWS_ACCESS_KEY, AWS_SECRET_KEY, AWS_REGION
GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET
APPLE_CLIENT_ID, APPLE_CLIENT_SECRET
PLAY_DEVELOPER_API_JSON, PLAY_PACKAGE_NAME       # Android IAP 검증
APPLE_BUNDLE_ID, APPLE_APP_APPLE_ID, APPLE_ENV   # iOS IAP 검증
```
운영: AWS Secrets Manager / ECS Task Definition.

## 주요 패턴 / 함정

### 진료 기록 암호화 (AES-256-GCM)
- `common/converter/AesEncryptionConverter` (JPA `AttributeConverter`, **static** `SecretKeySpec`).
- JPA 는 converter 를 Spring 없이 인스턴스화 → `@Value` 주입 불가.
- `infrastructure/config/EncryptionConfig.@PostConstruct` 에서 `AesEncryptionConverter.initialize(key)` 호출.
- 추가 암호화 필드도 같은 패턴.
- **암호화 컬럼은 DB LIKE 검색 불가** → 검색은 인메모리 `String.contains()` 처리 (SearchUseCase 참조).

### 진료 기록 날짜 (V10)
- `counseling_records.consulted_at` (LocalDate, nullable) — 일정 미연결 기록의 진료일.
- 일정 연결 시 `hospital_schedules.scheduled_at` 우선 사용.

### 약품 분류 (V11)
- `medication_schedules.drug_category` (VARCHAR(100), nullable) — 약품 분류 (예: 항우울제, 수면제 등).
- `MedicationScheduleResponse` 에 `drugCategory`, `drugCaution` 필드 포함.
- `MedicationLogResult` 에 `drugName` 필드 포함 — 이력 조회 시 약품명 직접 반환.

### JSON 배열 컬럼 (tags)
- `common/converter/TagsJsonConverter`: `List<String>` ↔ JSON.
- 컬럼 `TEXT`/`VARCHAR`, JPA 에서 `@Convert(converter = TagsJsonConverter.class)`.

### 처방전 OCR 비동기 파이프라인
```
POST /prescriptions
  → S3 업로드 확인 → Prescription 저장
  → OcrProcessorService.processAsync()      ← 별도 빈 (self-invocation 방지)
     [@Async("ocrTaskExecutor") @Transactional, 별도 스레드]
       → Gemini Vision (GeminiVisionClient) → medications 저장
       → DrugInfoCacheService 로 약품 정보 채움
```
- drug info 조회 실패는 try-catch 무시 (OCR 결과에 영향 없음).
- 미조회 상태: `PrescriptionMedication.drugInfoFetchedAt == null` → 응답에 `drugInfoPending: true` → 앱이 폴링.

### 약품 정보 30일 캐시 (DrugInfoCacheService — 식약처 의약품 제품 허가정보 API)
- `drugInfoFetchedAt > now - 30days` 면 DB 반환, 아니면 허가정보 API 호출 후 갱신.
- 허가정보 API `ServiceKey` 는 **이미 URL 인코딩된 채 발급**됨 → `WebClient.queryParam()` 쓰면 이중 인코딩 → **raw URL 문자열로 직접 조합**할 것.

### 복약 시간대 (TimeSlot)
- `MedicationSchedule`: `morning/afternoon/evening/bedtime` (boolean) + `morningTime/...` (LocalTime) 컬럼.
- `MedicationLog`: `(scheduleId, logDate, timeSlot)` UNIQUE.
- UPSERT 키: `findByMedicationScheduleIdAndLogDateAndTimeSlot` 사용.

### 알림 스케줄러 (`infrastructure/batch/NotificationScheduler`)
- **병원 D-1/D-0**: 매일 9시. `notification_settings.day_before/day_of` 체크. D-0 본문에 `prep_notes` 존재 여부 포함 (`existsByScheduleIdAndDeletedAtIsNull`).
- **체크인 리마인더**: 매분. `notification_settings.checkin_time == now()` + 오늘 `daily_checkins` 없는 유저만 발송. 유저별 `checkin_time` 커스텀 가능.
- **복약 알림**: 매분. 각 slot_time == now() + 오늘 해당 슬롯 로그 없는 경우만 발송.

### 진료 준비 메모 (PrepNote)
- `prep_notes.schedule_id` nullable (일정 미연결 메모 허용).
- 생성 시 `scheduleId != null` 이면 `hospitalScheduleRepository.findByIdAndUserIdAndDeletedAtIsNull` 로 소유권 검증 (원칙 ④).
- `hospital_schedules` 소프트 삭제 시 `prep_notes.schedule_id = NULL` SET — `PrepNoteRepository.detachSchedule()` (원칙 ⑤).

### 통합 검색 (`/api/v1/search?q=&types=&page=&size=`)
- 플랜 분기: FREE 2개월 cutoff, PREMIUM 전체.
- CounselingRecord: 암호화 → DB LIKE 불가 → 날짜 범위만 DB 필터, 이후 인메모리 `String.contains()` + tags 매칭.
- DailyCheckin / PrepNote: QueryDSL `containsIgnoreCase` (`searchByKeyword` / `countByKeyword`).
- 응답: 도메인별 결과 + 각 total (별도 페이지네이션).

### 일정 조회 API
- `GET /api/v1/schedules?year=&month=` — 월별
- `GET /api/v1/schedules/all` — 전체 (캘린더 없는 목록 뷰용)
- `GET /api/v1/schedules/recent?direction=PAST|FUTURE&limit=` — 폼 드롭다운용
  - `PAST`: 진료 기록 작성 (RecordForm)
  - `FUTURE`: 준비 메모 작성 (PrepNoteForm)

### 진료 기록 타임라인 N+1 방지
- `GetRecordTimelineUseCase`: 연결된 일정의 `hospitalName` 을 ID 일괄 조회로 매핑 (Map<UUID, String>) 후 RecordSummaryResult 에 주입.

### S3 키 규칙
- 처방전: `prescriptions/{userId}/{prescriptionId}/image.jpg`
- 내보내기: `exports/{userId}/{jobId}/export.pdf`
- 백업: `backups/{userId}/{timestamp}/backup.json`
- 접근은 Presigned URL (GET/PUT 15분) 만. 퍼블릭 차단 + SSE-S3.
