![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.5.0-6DB33F?logo=springboot&logoColor=white)
![Expo](https://img.shields.io/badge/Expo-54-000020?logo=expo&logoColor=white)
![React Native](https://img.shields.io/badge/React%20Native-0.81-61DAFB?logo=react&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15-4169E1?logo=postgresql&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-yellow)

# DearMI

> **Dear Me + I** | 멘탈 케어 진료 기록 앱

정신건강의학과·심리상담을 정기적으로 받는 사람이 병원 일정, 상담 기록,
매일의 감정 상태, 처방 및 복약을 한 곳에서 관리할 수 있는 앱.

---

## 기술 스택

| 영역 | 기술 | 버전 |
|---|---|---|
| 앱 | React Native (Expo) | RN 0.81 / Expo SDK 54 |
| 앱 상태 관리 | Zustand + React Query | ^5 / ^5 |
| 앱 로컬 저장 | react-native-mmkv + expo-secure-store | |
| 앱 다국어 | i18next + expo-localization | |
| 앱 결제 | react-native-iap (iOS IAP + Android Play Billing) | |
| 백엔드 | Spring Boot + JPA + QueryDSL + Flyway | 3.5.0 |
| 인증 | Spring Security OAuth2 (Google/Apple) + JWT | |
| DB | PostgreSQL | 15 |
| 파일 저장 | AWS S3 (Presigned URL) | |
| 푸시 알림 | Firebase FCM | |
| OCR | Claude Vision API (백엔드에서만 호출) | |
| 약품 정보 | e약은요 Open API (30일 DB 캐시) | |
| 웹 결제 | 토스페이먼츠 (Android + 웹) | |
| 배포 | AWS ECS Fargate + RDS + S3 | |
| 시크릿 관리 | AWS Secrets Manager (운영) / `.env` (로컬) | |

---

## 프로젝트 구조

```
dearmi/
├── backend/          Spring Boot 3 — 클린 아키텍처 (presentation/application/domain/infrastructure)
├── dearmi-app/       React Native (Expo) — feature 기반 구조
└── docs/             ERD, OpenAPI 명세
```

---

## 로컬 개발 환경 세팅

### 사전 요구사항

- Java 17
- Node.js 18+
- Docker Desktop
- Android Studio (에뮬레이터) 또는 iOS 시뮬레이터

### 1. PostgreSQL 실행

```bash
docker run -d \
  --name dearmi-postgres \
  -e POSTGRES_DB=dearmidb \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=local1234 \
  -p 5432:5432 \
  postgres:15-alpine
```

### 2. 백엔드 실행

```bash
cd backend
cp .env.example .env    # 값 채우기 (아래 환경변수 참조)
./gradlew bootRun
```

Swagger UI: http://localhost:8080/swagger-ui.html

### 3. 앱 실행

```bash
cd dearmi-app
npm install
npx expo start
```

Android 에뮬레이터에서 백엔드 접속: `http://10.0.2.2:8080`

---

## 환경변수

### 백엔드 (`backend/.env`)

> `backend/.env.example`을 복사 후 값을 채우세요.

| 변수 | 설명 |
|---|---|
| `DB_URL` | JDBC URL (기본: `jdbc:postgresql://localhost:5432/dearmidb`) |
| `DB_USERNAME` | DB 사용자명 |
| `DB_PASSWORD` | DB 비밀번호 |
| `JWT_SECRET` | JWT 서명 키 |
| `ENCRYPTION_KEY` | 상담 기록 AES-256-GCM 암호화 키 |
| `DRUG_INFO_API_KEY` | e약은요 API 서비스 키 |
| `CLAUDE_API_KEY` | Claude Vision API 키 (OCR) |
| `AWS_S3_BUCKET` | S3 버킷명 |
| `AWS_REGION` | AWS 리전 (기본: `ap-northeast-2`) |
| `AWS_ACCESS_KEY` | AWS Access Key |
| `AWS_SECRET_KEY` | AWS Secret Key |
| `GOOGLE_CLIENT_ID` | Google OAuth2 Client ID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth2 Client Secret |
| `APPLE_CLIENT_ID` | Apple OAuth2 Client ID |
| `APPLE_CLIENT_SECRET` | Apple OAuth2 Client Secret |
| `FCM_SERVICE_ACCOUNT_KEY` | Firebase 서비스 계정 JSON (경로 또는 인라인) |
| `TOSS_SECRET_KEY` | 토스페이먼츠 시크릿 키 |

---

## 주요 기능

- **병원 일정 관리** — 달력 뷰, D-1/D-0 푸시 알림
- **진료 기록** — 감정 점수(1-10), 태그, AES-256-GCM 서버 암호화
- **하루 체크인** — 감정·수면·복약 여부, 트리거 태그, 7일 요약
- **처방전 OCR** — Claude Vision API로 약품명·용법 자동 인식
- **복약 관리** — 시간대별(아침/점심/저녁/취침) 복약 체크, 이력·통계
- **진료 준비 메모** — 일정 연결, 상담 기록 작성 시 참고 표시
- **통합 검색** — 상담 기록·체크인·준비 메모 통합 검색
- **구독 결제** — iOS IAP + Android Play Billing + 토스페이먼츠
- **푸시 알림** — FCM 기반 병원 알림, 체크인 리마인더, 복약 알림
- **한국어 / 영어** — i18next + expo-localization

---

## 플랜

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

---

## 보안 원칙

| # | 원칙 | 요약 |
|---|---|---|
| ① | 클린 아키텍처 | `Presentation → Application → Domain ← Infrastructure`. Domain에 Spring 의존성 금지. |
| ② | API 키 하드코딩 금지 | 모든 시크릿은 환경변수 또는 AWS Secrets Manager. 앱 코드에 키 직접 작성 금지. |
| ③ | 앱 버전 체크 서버 위임 | SplashScreen에서 `GET /api/v1/app/version` 호출. `forceUpdate: true`이면 스토어 이동. |
| ④ | 타인 리소스 접근 차단 | 모든 UseCase에서 JWT userId == 리소스 userId 검증. 불일치 시 404 반환 (403 아님). |
| ⑤ | 연관 데이터 삭제 규칙 | 일정 삭제 → 연관 FK SET NULL. 처방전 삭제 → 약품 CASCADE. 회원 탈퇴 → 소프트딜리트 + 30일 후 하드딜리트. |
| ⑥ | 탈퇴 시 토큰 즉시 무효화 | `deleted_at` 설정과 동시에 `refresh_tokens` 즉시 삭제. |

---

## 라이선스

[MIT](LICENSE)
