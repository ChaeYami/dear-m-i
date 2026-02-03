# DearMI App — Claude Code 가이드

> React Native (Expo) | 루트의 CLAUDE.md도 함께 읽을 것

---

## 폴더 구조

```
src/
├── features/{name}/
│   ├── api/          axios 호출 + 타입 정의
│   ├── hooks/        useQuery / useMutation 래핑
│   ├── screens/      화면 레이아웃
│   └── components/   feature 전용 UI
├── shared/
│   ├── api/          axiosInstance (단 하나), queryClient
│   ├── components/   공통 UI (Button, Input, Card, EmotionSlider, LoadingSpinner 등)
│   ├── store/        Zustand stores (authStore)
│   ├── cache/        CacheService (MMKV)
│   └── utils/        dateUtils 등
├── navigation/
├── locales/
│   ├── ko/
│   └── en/
└── constants/        colors, sizes, cacheKeys (QUERY_KEYS, SECURE_STORE_KEYS 등)
```

---

## 클린 아키텍처 규칙

```
Screen → hooks → api → axiosInstance → 백엔드
```

- **screens/**: hooks/만 호출. axios 직접 호출 금지.
- **hooks/**: useQuery/useMutation 사용. 서버 데이터를 Zustand에 저장 금지.
- **api/**: `shared/api/axiosInstance` 하나만. feature별 axios.create() 금지.
  - 예외: S3 presigned PUT 업로드는 XHR 직접 사용 (인증 헤더 없어야 CORS 통과)
- **store/**: 인증 토큰, 구독 플랜, 언어 설정만. 서버 데이터 저장 금지.

---

## 인증 (JWT)

```typescript
// axiosInstance 인터셉터 (src/shared/api/axiosInstance.ts)
// 요청: expo-secure-store에서 accessToken → Authorization 헤더
// 401 응답: /api/v1/auth/refresh 호출 → 토큰 갱신 → 원래 요청 재시도
// 갱신 실패: SecureStore 클리어 → authStore.logout()
```

### authStore (Zustand) — `src/features/auth/store/authStore.ts`
```typescript
// accessToken, refreshToken, user(id/email/name/plan/provider), isAuthenticated
// setTokens: SecureStore 저장 + 메모리 동기화
// restoreTokens: 앱 시작 시 SecureStore에서 복원
// logout: SecureStore 삭제 + 상태 초기화
```

### OAuth 플로우
```
앱 → 백엔드 /oauth2/authorization/{google|apple} (expo-web-browser)
  → 소셜 인증 → 백엔드 → dearmi://auth?access_token=...&refresh_token=...
  → SecureStore 저장 → /api/v1/auth/me → authStore 업데이트
  → MainTabNavigator
```

---

## 보안 규칙

```typescript
// 절대 금지 (② 원칙)
const JWT_SECRET = '...';
const CLAUDE_API_KEY = 'sk-ant-...';

// 앱 시작 시 필수 (③ 원칙) — RootNavigator.tsx
const version = await axiosInstance.get('/api/v1/app/version', { params: { platform, currentVersion } });
if (version.data.forceUpdate) Linking.openURL(storeUrl); // 앱 진행 불가

// 토큰 복원 후 유효성 검증 — RootNavigator.tsx
const hasToken = await restoreTokens();
if (hasToken) await authApi.getMe(); // 실패 시 자동 logout()
```

---

## 플랜 분기 UI

```tsx
// 현재는 authStore user.plan으로 직접 분기
const isPremium = user?.plan === 'PREMIUM';

// 글자수 제한: 상담 기록 200자 (RecordFormScreen), 하루 메모 100자 (미구현)
// 조회 기간: RecordTab 2개월 이전 흐림 처리 (미구현)
// OCR: PREMIUM만 업로드 가능 (PrescriptionUploadScreen에서 검사)
// 복약 이력: FREE 30일 강제 (MedicationHistoryScreen 배너 표시, 백엔드에서도 강제)
// 처방전 탭: FREE 플랜이면 PremiumGate 표시 (MainTabNavigator.PrescriptionTabWrapper)
// 검색: FREE 2개월 이내만 (백엔드 강제 + SearchScreen 배너 안내)
```

---

## 결제

```typescript
// iOS: App Store IAP만 (웹 결제 버튼 절대 표시 금지)
// Android: Play Billing + 토스페이먼츠 웹 결제 병행
// react-native-iap — 미설치, 결제 기능 구현 시 추가
// PaywallScreen — RootNavigator에 모달로 등록 (Paywall 라우트)
```

---

## 네비게이션 (현재 구현 상태)

```
RootNavigator (src/navigation/RootNavigator.tsx)
│   ref: navigationRef (src/navigation/navigationRef.ts)
│   Paywall: PaywallScreen (modal)
│   Search: SearchScreen (modal)
├── AuthNavigator
│   └── LoginScreen          Google/Apple OAuth2 로그인
└── MainTabNavigator
    ├── Schedule → ScheduleNavigator
    │   ├── ScheduleTab      CalendarList + 슬라이드업 시트 + FAB + 준비 메모 버튼
    │   ├── ScheduleDetail   상세 보기, 수정/삭제, 상담 기록 연결, 준비 메모 섹션
    │   ├── ScheduleForm     생성/수정 폼 (DateTimePicker)
    │   ├── PrepNoteList     전체 준비 메모 목록 (일정별 섹션 + 일정 없음)
    │   └── PrepNoteForm     준비 메모 등록/수정 (내용 + 일정 연결)
    ├── Record → RecordNavigator
    │   ├── RecordTab        SectionList 타임라인 (record | prescription 혼합)
    │   └── RecordForm       감정 슬라이더, 내용, 태그, 일정 연결
    │                        (연결 일정에 준비 메모 있으면 접기/펼치기 참고 섹션)
    ├── Prescription → PrescriptionNavigator  (FREE: PremiumGate)
    │   ├── PrescriptionTab    아코디언 카드 목록 (무한 스크롤)
    │   ├── PrescriptionUpload 이미지 선택 → S3 업로드 → OCR 요청
    │   ├── OcrResult          폴링(2s) → COMPLETED/FAILED 분기 → 약품 편집
    │   │                      저장 후 복약 알림 설정 다이얼로그 → MedicationForm 연동
    │   └── MedicationDetail   약품명·효능·주의사항(스켈레톤)
    └── MyPage → MyPageNavigator
        ├── MyPageTab          프로필 + 메뉴 목록 (복약관리/알림설정/로그아웃) + 검색 아이콘
        ├── MedicationHome     오늘 복약 현황 (완료율 바 + 시간대별 카드) + FAB
        ├── MedicationForm     복약 일정 등록/수정
        │                      OCR 흐름: isFromOcr=true → 진행 배너 + '다음 약품' 버튼
        ├── MedicationHistory  날짜별 이력 (FREE 30일 배너)
        └── NotificationSettings  전체/D-1/D-0 알림 토글
```

### 크로스탭 네비게이션
```typescript
// ScheduleDetail → RecordForm (scheduleId 전달)
const tabNav = navigation.getParent()?.getParent();
tabNav?.navigate('Record', { screen: 'RecordForm', params: { scheduleId } });

// OcrResult → MedicationForm (OCR 흐름, drugName/dosage/totalDays/remainingMeds 전달)
const tabNav = navigation.getParent()?.getParent();
tabNav?.navigate('MyPage', {
  screen: 'MedicationForm',
  params: { drugName, dosage, totalDays, isFromOcr: true, remainingMeds },
});

// 알림 탭 → ScheduleDetail 딥링크 (백그라운드/종료 상태)
// RootNavigator.navigateToScheduleDetail(data) → navigationRef.current?.navigate('Main', {
//   screen: 'Schedule', params: { screen: 'ScheduleDetail', params: { scheduleId } }
// })

// Search 모달 → RecordForm / PrepNoteForm 딥링크
// navigation.goBack() + setTimeout(() => navigationRef.current?.navigate('Main', { ... }), 300)
```

### OCR → 복약 일정 연동 흐름
```
OcrResultScreen 저장
  → Alert('복약 알림을 설정할까요?')
  → '설정하기': 첫 번째 약품으로 MedicationForm 이동 (cross-tab)
     MedicationForm (isFromOcr=true)
       → 저장 버튼: 저장 후 goBack
       → '다음: {약품명} →' 버튼: 저장 후 navigation.replace(다음 약품)
       → 마지막 약품이면 '다음' 버튼 미표시
  → '나중에': PrescriptionTab으로 이동
```

---

## 공통 컴포넌트 (`src/shared/components/`)

| 컴포넌트 | 용도 |
|---|---|
| `Button` | variant: primary/secondary/outline/ghost, size: sm/md/lg |
| `Input` | 공통 텍스트 입력 |
| `Card` | 카드 레이아웃 |
| `LoadingSpinner` | fullscreen 또는 인라인 |
| `OfflineBanner` | 네트워크 오프라인 배너 |
| `EmotionSlider` | 1–10 탭 슬라이더 (red≤3 / amber≤6 / green≤10), `getEmotionColor(score)` export |
| `InAppNotificationBanner` | 포그라운드 알림 슬라이드인 배너 (3초 자동 해제) |

---

## 쿼리 키 (`src/constants/cacheKeys.ts` — QUERY_KEYS)

```typescript
monthlySchedules(year, month)          // 월별 일정
schedule(id)                           // 일정 상세
timeline()                             // 상담+처방 혼합 타임라인 (커서 페이징)
records()                              // 상담 기록 목록
record(id)                             // 상담 기록 상세
recentSchedules()                      // RecordForm / PrepNoteForm 드롭다운용 최근 일정
prescriptions()                        // 처방전 목록
prescription(id)                       // 처방전 상세 (OCR 폴링에도 사용)
medicationDetail(id)                   // 약품 상세 (e약은요, prescription-medications)
todayMedication()                      // 오늘 복약 현황
medicationLogs(startDate?, endDate?)   // 복약 이력
medicationStats(startDate?, endDate?)  // 복약 완료율 통계
prepNotes()                            // 전체 준비 메모
prepNotesBySchedule(scheduleId)        // 일정별 준비 메모
search(keyword)                        // 통합 검색 결과
```

---

## 공통 훅 (`src/shared/hooks/`)

| 훅 | 용도 |
|---|---|
| `useNetworkStatus` | 네트워크 오프라인 감지 |
| `useAuthGuard` | 인증 필요 화면 가드 |
| `useFcmSetup` | FCM 권한 요청 + 토큰 등록 (MainTabNavigator에서 호출) |

---

## 주요 패키지

```
# 설치됨
expo-web-browser                          OAuth2 (WebBrowser.openAuthSessionAsync)
@react-native-community/datetimepicker    일정/복약 날짜/시간 선택
react-native-calendars                    ScheduleTab CalendarList
expo-image-picker                         처방전 촬영
expo-secure-store                         토큰 저장
react-native-mmkv                         캐시 (CacheService) + 최근 검색어 저장
@react-native-community/netinfo          오프라인 감지
@tanstack/react-query ^5                  서버 상태 관리
zustand ^5                               클라이언트 상태
expo-notifications ^55                    FCM 푸시 알림
expo-device ^55                           실기기 여부 확인 (FCM)

# 미설치 (기능 구현 시 추가)
react-native-iap                          결제 (iOS IAP + Android Play Billing)
i18next, react-i18next                    다국어
react-native-chart-kit                    감정 그래프
expo-local-authentication                 생체인증
react-native-widget-extension             iOS 위젯
react-native-android-widget              Android 위젯
```

---

## 미구현 (구현 순서 참고)

| 기능 | 비고 |
|---|---|
| CheckinTab | 하루 메모 모아보기 (검색 결과에서 탭 시 화면 없음) |
| PremiumGate 컴포넌트 | `shared/components/PremiumGate.tsx` — 자물쇠 + PaywallScreen |
| PaywallScreen | 구독 결제 화면 (react-native-iap 필요) — RootNavigator에 Paywall 라우트 등록됨 |
| RecordTab 기간 제한 UI | FREE: 2개월 이전 흐림 처리 |
| 감정 그래프 | react-native-chart-kit |
| 생체인증 | expo-local-authentication |
| 복약 일정 수정 | MedicationFormScreen에 scheduleId 파라미터 전달 → PUT /medication-schedules/{id} |
| 앱 위젯 | iOS / Android |
