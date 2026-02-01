# DearMI Backend — Claude Code 가이드

> Spring Boot 3 + PostgreSQL + S3 | 루트의 CLAUDE.md도 함께 읽을 것

---

## 패키지 구조

```
com.dearmi/
├── presentation/        Controller, Request/Response DTO, Mapper
├── application/         UseCase interface, UseCase impl, Port interface, Command/Query DTO
├── domain/              Entity, Repository interface, DomainService, Exception
└── infrastructure/
    ├── persistence/     JPA Repository impl, QueryDSL
    ├── external/        Claude API, 약학정보원, FCM, S3, 토스페이먼츠
    ├── config/          Spring 설정
    ├── batch/           Scheduler, Batch Job
    └── security/        JWT, OAuth2, AOP
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

---

## 인증 (Spring Security OAuth2 + JWT)

```
앱 → Google/Apple OAuth2 → JWT 발급
  → Authorization: Bearer {accessToken}
  → JwtAuthenticationFilter → SecurityContext
  → @AuthenticatedUser UserId 주입
```

- Access Token: 1시간 / Refresh Token: 30일 (DB BCrypt 해시 저장, Rotation)
- 탈퇴 시: `refresh_tokens` 해당 userId 즉시 삭제 (⑥ 원칙)

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

## S3

- 처방전 이미지: `prescriptions/{userId}/{prescriptionId}/image.jpg`
- PDF 내보내기: `exports/{userId}/{jobId}/export.pdf`
- 백업: `backups/{userId}/{timestamp}/backup.json`
- 접근: Presigned URL만 (GET/PUT 15분). 직접 URL 노출 금지.
- 보안: 퍼블릭 차단, SSE-S3 암호화

---

## 외부 API 위치

| 서비스 | 패키지 |
|---|---|
| Claude Vision (OCR) | `infrastructure/external/claude/` |
| e약은요 | `infrastructure/external/druginfo/` |
| Firebase FCM | `infrastructure/external/fcm/` |
| AWS S3 | `infrastructure/external/s3/` |
| 토스페이먼츠 | `infrastructure/external/payment/` |
| Apple/Google IAP 검증 | `infrastructure/external/payment/` |

---

## 배치 스케줄러

| Job | 주기 | 내용 |
|---|---|---|
| `HardDeleteBatchJob` | 매일 새벽 2시 | 탈퇴 30일 후 하드딜리트 + S3 삭제 |
| `SubscriptionExpireJob` | 매일 새벽 1시 | 만료 PREMIUM → FREE |
| `PaymentsTempCleanJob` | 매시간 | 30분 경과 payments_temp 삭제 |
| `NotificationScheduler` | 매일 오전 9시 | D-1/D-0 FCM 알림 |

---

## 환경변수 (AWS Secrets Manager)

```
DB_URL, DB_USERNAME, DB_PASSWORD
JWT_SECRET
CLAUDE_API_KEY
DRUG_INFO_API_KEY
AWS_S3_BUCKET, AWS_ACCESS_KEY, AWS_SECRET_KEY
FIREBASE_CREDENTIALS_PATH  (FCM용)
TOSS_SECRET_KEY
ENCRYPTION_KEY  (상담 기록 AES-256)
```
