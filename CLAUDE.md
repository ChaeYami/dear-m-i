# DearMI

> Mental health visit tracking app | RN (Expo) + Spring Boot 3
>
> 작업 영역에 맞는 하위 가이드를 함께 읽을 것:
> - `backend/CLAUDE.md` — Spring Boot 백엔드 규약 / 패턴 / 함정
> - `dearmi-app/CLAUDE.md` — RN 앱 규약 / 패턴 / 함정
>
> 구현 현황 / 라우트 목록 / 패키지 트리는 코드를 직접 읽을 것 (이 문서에서 추적 안 함).

## 스택 한 줄 요약
RN 0.81 + Expo SDK 54, Zustand ^5 + React Query ^5, MMKV + SecureStore, i18next.
Spring Boot 3.5 + JPA + QueryDSL + Flyway, PostgreSQL 15, JWT(OAuth2: Google/Apple),
S3(Presigned), Expo Push (Firebase 제거됨), Claude Vision(OCR), e약은요(약품 30일 캐시), IAP(App Store / Play Billing).
배포: 백엔드 AWS ECS Fargate + RDS + S3 / 앱 EAS Build + EAS Update (OTA, fingerprint). 시크릿 AWS Secrets Manager (운영) / `.env` (로컬).

## CI/CD
- **백엔드**: `.github/workflows/deploy-backend.yml` — `backend/**` 변경 시 `main` 푸시 → ECR + ECS 자동 배포.
- **앱**: `.github/workflows/build-app.yml` — `dearmi-app/**` 변경 시 마지막 production 빌드의 commit 과 HEAD 간 `git diff` 로 "네이티브 영향 파일" (package.json, app.json, eas.json, plugins/, GoogleService-Info.plist 등) 변경 여부 체크:
  - 변경 없음 → `eas update --branch production` (OTA, JS-only, 양 플랫폼)
  - 변경 있음 → `eas build --platform all` (iOS + Android **둘 다 빌드**) → `eas submit --platform ios` (iOS 만 자동 제출)
  - 분기 판정에 fingerprint 라이브러리 안 씀 (EAS 내부 해시와 외부 도구 hash 가 안 맞아서 git diff 가 결정적).
- **⚠️ Android 자동 submission 미적용 (TODO)**: 빌드까지는 매번 진행해서 AAB 가 EAS 대시보드에 쌓이지만, Play Console 자동 업로드는 한국 사업자 등록 + 통신판매업 신고번호 등 계정 정보 입력 완료 후 추가 예정. 그 전까지 Android 제출이 필요하면 EAS 대시보드에서 AAB 다운로드 후 Play Console 에 수동 업로드.
- EAS 자격증명: iOS ASC API Key + Android Google Service Account (`dearmi-play-uploader@dearmi-493112.iam.gserviceaccount.com`) 모두 EAS 서버 저장됨. JSON 키 로컬 보관 금지.

## 보안 6원칙 (절대 위반 금지)

1. **클린 아키텍처**
   `Presentation → Application → Domain ← Infrastructure`.
   Domain 에 Spring 의존성 금지. Controller 는 UseCase **interface** 만 주입 (impl 직접 참조 금지). `@Transactional` 은 UseCase impl 에만.

2. **시크릿 하드코딩 금지**
   앱 코드 어디에도 API 키/시크릿 금지. Claude API 등 외부 키가 필요하면 백엔드 경유. 로컬 시크릿은 `backend/.env` (gitignored), 운영은 AWS Secrets Manager.

3. **앱 버전 체크는 서버 위임**
   `RootNavigator.tsx` 가 시작 시 `GET /api/v1/app/version` 호출. `forceUpdate: true` 면 스토어로 보내고 진행 차단. 앱 코드에 버전 비교 로직 하드코딩 금지.

4. **타인 리소스 접근 차단**
   모든 UseCase 첫 단계로 `JWT userId == 리소스 userId` 검증. 불일치는 **404** 반환 (403 아님 — 존재 여부 숨김). `findById()` 단독 사용 금지 → 항상 `findByIdAndUserId()`.

5. **삭제 시 연관 데이터 처리**
   | 삭제 대상 | 처리 |
   |---|---|
   | `hospital_schedules` | `counseling_records.schedule_id`, `prescriptions.schedule_id`, `prep_notes.schedule_id` 모두 SET NULL |
   | `prescriptions` | `prescription_medications` CASCADE + S3 이미지 삭제 예약 |
   | `medication_schedules` | `medication_logs` CASCADE |
   | 회원 탈퇴 | `refresh_tokens` 즉시 삭제 + soft delete + 30일 후 hard delete + S3 삭제 |

6. **탈퇴 시 토큰 즉시 무효화**
   `users.deleted_at` 설정과 **동시에** `refresh_tokens` 해당 userId 즉시 삭제. 소프트딜리트만 하고 토큰 유지하는 코드 절대 작성 금지.

## DB 테이블 (전체)
```
users, hospital_schedules, counseling_records, daily_checkins,
prescriptions, prescription_medications, medication_schedules, medication_logs,
prep_notes, subscriptions, subscription_histories, refresh_tokens,
notification_settings, audit_logs, export_jobs, app_versions
```
PK 모두 UUID. soft delete = `deleted_at TIMESTAMP NULL`. 마이그레이션은 Flyway (V1~).

## 플랜 분기 (FREE / PREMIUM)

| 기능 | FREE | PREMIUM |
|---|---|---|
| 진료 기록 작성 | 200자 | 무제한 |
| 진료 기록 조회 | 최근 2개월 | 전체 |
| 하루 메모 작성 | 100자 | 무제한 |
| 하루 메모 조회 | 최근 30일 | 전체 |
| 감정 그래프 | 30일 | 전체 |
| 처방전 OCR / 약품 상세 | × | ○ |
| 복약 일정 자동 생성 | 수동만 | OCR 연동 |
| 복약 이력 조회 | 최근 30일 | 전체 |
| 검색 범위 | 최근 2개월 | 전체 |
| PDF 내보내기 / 백업·복원 | × | ○ |

플랜 강제: 백엔드 `@PlanRequired(PREMIUM)` AOP — 위반 시 **402** 반환. 앱은 UI 안내/배너만 담당 (강제 책임은 백엔드).

## API 응답 포맷
```json
// 성공
{ "success": true, "data": { ... } }

// 실패
{ "success": false, "errorCode": "RESOURCE_001", "message": "..." }
```

## v2.0+ 보류 (지금 구현 금지)
AI 상담 준비 리포트, OpenFDA 글로벌 약품 정보, Stripe 글로벌 웹 결제, 반복 일정.
