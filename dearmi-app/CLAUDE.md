# DearMI App

> RN 0.81 + Expo SDK 54. 루트 `CLAUDE.md` 의 6원칙 준수 (특히 ②③).

## 배포 / CI/CD
- 빌드 시스템: EAS Build. 자격증명은 EAS 서버 보관 (iOS ASC API Key + Android Service Account).
- `eas.json`: `appVersionSource: "remote"` (buildNumber/versionCode 서버 관리), `production.autoIncrement: true`, `production.channel: "production"`.
- `app.json`: `runtimeVersion.policy: "fingerprint"` + `updates.url` 설정됨. **네이티브 변경 (패키지 / app.json plugin / 권한 등) 자동 감지**.
- GitHub Actions (`.github/workflows/build-app.yml`):
  - `dearmi-app/**` 푸시 → 마지막 production 빌드의 commit 과 HEAD 간 `git diff` 로 네이티브 영향 파일 변경 여부 체크. 변경 없으면 `eas update` (OTA, 양 플랫폼), 변경 있으면 `eas build --platform all` (iOS + Android 둘 다) + `eas submit --platform ios` + `eas submit --platform android` (**양 플랫폼 자동 제출**).
  - "네이티브 영향 파일" 화이트리스트: `package.json`, `package-lock.json`, `app.json`/`app.config.*`, `eas.json`, `babel.config.js`, `metro.config.js`, `plugins/`, `GoogleService-Info.plist`, `google-services.json`, `assets/adaptive-icon.png`, `assets/fonts/`, `ios/`, `android/`. 새 네이티브 트리거 추가 시 워크플로의 `NATIVE_PATHSPEC` 도 같이 업데이트.
  - **iOS / Android 모두 자동 submission**: iOS → App Store Connect, Android → Play Console (`production` 트랙, `eas.json` submit.production.android 참조). 자격증명 양쪽 모두 EAS 서버 보관.
  - `workflow_dispatch` 로 mode 강제 (`auto`/`build`/`update`) 가능.
- OTA 가능한 변경: TS/TSX, 스타일, 텍스트, i18n, 번들 이미지. OTA 불가: `expo-*` 패키지 변경, app.json plugin/permission, 새 네이티브 모듈, 앱 아이콘/스플래시.
- 사용자 보이는 버전 (`1.0.x`) 올릴 때만 `app.json` 의 `version` 수정. `buildNumber`/`versionCode` 는 EAS remote 가 자동 increment — 절대 수동 수정 금지.

## 폴더 구조
```
src/
├── features/{auth, schedule, record, prescription, medication, checkin,
│            prepnote, notification, mypage, search, subscription}/
│   ├── api/         axios 호출 + 타입
│   ├── hooks/       useQuery / useMutation 래핑
│   ├── screens/
│   ├── components/  feature 전용 UI
│   └── store/       (해당 feature 에만)
├── shared/
│   ├── api/         axiosInstance, queryClient
│   ├── components/  Button, Input, Card, EmotionSlider, ScreenHeader, AnimatedPressable,
│   │                LoadingSpinner, OfflineBanner, InAppNotificationBanner ...
│   ├── hooks/       useNetworkStatus, useFcmSetup, useAuthGuard,
│   │                useResetStackOnTabFocus, useTabBarSafeBottom, useUnsavedChangesWarning
│   ├── navigation/  tabSwitchGuard (module-level 가드 레지스트리)
│   ├── theme/       ThemeProvider, colors, sizes, typography, shadows (다크모드)
│   ├── store/       authStore (Zustand)
│   ├── cache/       MMKV CacheService
│   ├── utils/       dateUtils 등
│   └── types/       api.types, domain.types
├── navigation/      RootNavigator, MainTabNavigator(custom tab bar), {feature}Navigator
├── locales/{ko,en}/ i18next
└── constants/       cacheKeys (QUERY_KEYS, SECURE_STORE_KEYS, CACHE_KEYS)
```

## 데이터 흐름
```
Screen → feature/hooks → feature/api → shared/api/axiosInstance → 백엔드
```
- **Screen**: hooks 만 호출. axios 직접 호출 금지.
- **hooks**: React Query 만 사용. **서버 데이터를 Zustand 에 저장 금지**.
- **api**: `shared/api/axiosInstance` 단일 인스턴스. feature 별 `axios.create()` 금지.
  - 예외: S3 presigned PUT 은 XHR 직접 사용 (인증 헤더 없어야 CORS 통과).
- **store (Zustand)**: 토큰, 구독, 언어, 테마 등 클라이언트 상태만.

## 인증
- `axiosInstance` 인터셉터: SecureStore → accessToken → Authorization 헤더.
- 401 응답 → `/api/v1/auth/refresh` → 토큰 갱신 → 원래 요청 재시도. 갱신 실패 → SecureStore 클리어 → `authStore.logout()`.
- `authStore` (`src/features/auth/store/authStore.ts`): `accessToken`, `refreshToken`, `user`, `setTokens`, `restoreTokens`, `logout`, `isAuthenticated`.
- OAuth 플로우: `expo-web-browser` 로 백엔드 `/oauth2/authorization/{google|apple}` 호출 → 딥링크 `dearmi://auth?access_token=&refresh_token=` 수신 → `setTokens` → `/api/v1/auth/me` → user 세팅.
- 앱 시작 시 `RootNavigator.initializeApp`: 버전 체크 → 토큰 복원 → `getMe()` 검증 → 실패 시 자동 logout.

## 네비게이션 (5탭 구조)
```
RootNavigator (Stack)
├── Auth: AuthNavigator → LoginScreen
├── Main: MainTabNavigator (custom tab bar — 라벨 없는 아이콘만)
│   ├── Schedule  → ScheduleNavigator
│   ├── Record    → RecordNavigator (RecordTab → RecordDetail → RecordForm, PrescriptionList/Upload/OcrResult/MedicationDetail 포함)
│   ├── Checkin   → CheckinNavigator           ← 초기 탭 (center, initialRouteName)
│   ├── Medication→ MedicationNavigator
│   └── MyPage    → MyPageNavigator
├── Paywall (modal)
├── WebPayment (modal)
└── Search (modal)
```

> Prescription 은 별도 탭이 아니라 RecordTab 에서 진입. 화면/스택 정확한 목록은 `src/navigation/*.tsx` 직접 참조.

### Custom Tab Bar (`MainTabNavigator.tsx`)
react-navigation v7 BottomTabBar 의 `justifyContent: 'flex-start'` 강제 + tabBarItemStyle 이 outer wrapper 에만 적용되는 한계 때문에, 라이브러리 기본 tab bar 를 버리고 `tabBar` prop 으로 `CustomTabBar` 직접 구현. 라벨 없는 아이콘 정중앙 정렬, 포커스 인디케이터는 항상 inline 렌더 (비포커스 시 transparent) 로 레이아웃 고정.

### 같은 탭 재탭 → popToTop
`useResetStackOnTabFocus`: tab navigator 의 `tabPress` 리스너에서 `e.target === currentTabKey` 인 경우에만 `StackActions.popToTop()`. **다른 탭 이동 시엔 소스 탭 스택을 보존** (표준 모바일 패턴).

### 다른 탭 이동 가로채기 → `tabSwitchGuard`
- `src/shared/navigation/tabSwitchGuard.ts` — module-level 레지스트리 (`setTabSwitchGuard`, `runTabSwitchGuard`).
- `CustomTabBar.onPress` 가 cross-tab navigate 직전 `runTabSwitchGuard(routeName, doNavigate)` 호출. 가드가 있으면 위임, 없으면 즉시 navigate.
- 이유: react-navigation 의 `addListener('tabPress')` 는 등록 화면의 route key 로 scoped 라, 깊이 nest 된 폼 화면이 다른 탭의 tabPress 를 받지 못함.

### 폼 이탈 경고 (`useUnsavedChangesWarning`)
- v7 `usePreventRemove` 로 스택 pop (헤더 백/하드웨어 백/스와이프) 가로채기. v6 의 `addListener('beforeRemove')` 는 v7 에서 동작 안 함.
- cross-tab 은 `useFocusEffect` 로 focus 동안만 `setTabSwitchGuard` 등록.
- "나가기" 시 `exitIntent` state 설정 → 다음 렌더에서 `usePreventRemove` 비활성화 후 `useEffect` 가 `goBack()` (+ tab navigate) 실행. ref 로는 re-render 안 일어나서 안 됨.
- 저장 후엔 `markSavedAndExit()` 호출.
- **편집 모드 hydration 함정**: `useState` 초기값에 비동기 로드된 서버 데이터를 넣으면 항상 빈 값으로 시작 → `hydrated` state + `useEffect` 로 1회 채우고, `isDirty = hydrated && (...)` 로 가드.

### 크로스탭 네비게이션 패턴
**항상 `navigationRef` 사용** — `getParent()?.getParent()` 는 RootNavigator 까지 올라가 버려서 'Record' 등 탭 이름을 찾지 못함 (action not handled 에러 발생).

```typescript
import { navigationRef } from '@/navigation/navigationRef';

// 예: 어디서든 → Record/RecordForm
(navigationRef.current as any)?.navigate('Main', {
  screen: 'Record',
  params: { screen: 'RecordForm', params: { scheduleId } },
});

// 예: 어디서든 → Schedule/ScheduleDetail
(navigationRef.current as any)?.navigate('Main', {
  screen: 'Schedule',
  params: { screen: 'ScheduleDetail', params: { scheduleId } },
});
```

### OCR → 복약 일정 연동
```
OcrResultScreen 저장 → Alert
  '설정하기' → cross-tab: Medication/MedicationForm (isFromOcr=true, drugName/dosage/totalDays/remainingMeds)
              → 저장 후 다음 약품 있으면 navigation.replace, 없으면 goBack
  '나중에'   → PrescriptionList 로 이동
```

## 보안 (앱)
- API 키/시크릿 직접 작성 금지 (원칙 ②). Claude API 등은 백엔드 경유.
- 앱 시작 시 `GET /api/v1/app/version` 필수 (`RootNavigator.checkAppVersion`). `forceUpdate: true` 면 스토어 이동 + 진행 차단.
- 토큰 복원 후 `getMe()` 로 유효성 검증 — 실패 시 자동 logout.

## 플랜 분기 UI
- `const isPremium = useAuthStore(s => s.user?.plan === 'PREMIUM')`
- 글자수: RecordForm 200자 (FREE), DailyCheckinForm 100자 (FREE).
- OCR / 약품 상세: PREMIUM 만 (`PrescriptionUploadScreen` 에서 검사).
- 복약 이력 30일, 검색 2개월 — 백엔드가 강제, 앱은 배너 안내.
- FREE 진입 차단이 필요하면 `PremiumGate` 컴포넌트로 감싸 PaywallScreen 으로 유도.

## 결제
- iOS: App Store IAP 만. **웹 결제 버튼 노출 절대 금지** (App Store 3.1.1 강제).
- Android: Play Billing 만 (디지털 상품은 Play Billing 강제 정책 — 토스 웹 결제는 심사 거부 위험으로 제거됨).
- `PaywallScreen` 은 `RootNavigator` 에 modal 로 등록.
- `subscriptionStore` (Zustand) 가 플랜 동기화 — `RootNavigator` 가 me/subscription 호출 후 plan 불일치 시 `setUser` 갱신.

## 공통 컴포넌트 (`src/shared/components/`)
| 컴포넌트 | 비고 |
|---|---|
| `Button` | variant: primary/secondary/outline/ghost, size: sm/md/lg |
| `Input`, `Card`, `LoadingSpinner` | 기본 |
| `OfflineBanner` | `useNetworkStatus` 연동, RootNavigator 에 등록 |
| `ScreenHeader` | variant: `tab` (탭 루트) / `back` (서브 화면), title, rightContent. 아이콘 버튼 GlassView 사용 |
| `EmotionSlider` | 1–10. red≤3 / amber≤6 / green≤10. `getEmotionColor(score)` export |
| `AnimatedPressable` | 터치 시 scale 애니메이션 |
| `InAppNotificationBanner` | 포그라운드 알림 슬라이드인 (3초 자동 해제). GlassView 적용 |
| `CustomAlert` | Alert.alert 대체 커스텀 모달. GlassView 적용 |
| `TimePickerModal` | @quidone/react-native-wheel-picker 기반 시간 선택 모달. GlassView 적용 |
| `SectionTitle` | 섹션 제목 공통 컴포넌트 |
| `DatePickerModal` | 재사용 가능 날짜 선택 모달 (highlightedDates/maxDate 옵션). GlassView 적용 |
| `TabBarVisibilityContext` | 탭바 표시/숨김 제어 Context |
| `GlassView` | iOS `expo-blur` BlurView / Android 반투명 fallback. intensity: subtle/regular/thick. 카드·모달·탭바·헤더 아이콘에 사용 |
| `PhoneWidthContainer` | iPad/태블릿에서 콘텐츠를 440pt 폭으로 중앙 제한. App.tsx 에서 `RootNavigator` 감쌈. 좁은 화면은 패스스루 |

## 테마 시스템 (`src/shared/theme/`)
- `ThemeProvider` 가 라이트/다크 모드 토글. `useTheme()` 로 `{ colors, isDark }` 사용.
- `colors.ts` — 라이트/다크 팔레트. `sizes.ts` — spacing/font/radius/icon/buttonHeight/`tabBarHeight: 64`.
- `softShadow / floatingShadow / subtleShadow` 는 colors 받아서 ViewStyle 반환.
- 폰트: Pretendard (fontFamily.regular/medium/semibold/bold).

## React Query 키
실제 키는 `src/constants/cacheKeys.ts` 의 `QUERY_KEYS` 를 직접 참조 (스테일 방지).
주의: `recentSchedules(direction)` 는 `'PAST' | 'FUTURE'` 인자 필수.
변경/추가 시 mutation 의 `invalidateQueries` 매핑도 함께 업데이트.

## 주요 패키지
설치됨: `expo-web-browser`, `expo-blur`, `expo-updates`, `expo-dev-client`, `@quidone/react-native-wheel-picker`, `react-native-calendars`,
`expo-image-picker`, `expo-secure-store`, `react-native-mmkv`, `@react-native-community/netinfo`,
`@tanstack/react-query ^5`, `zustand ^5`, `expo-notifications`, `expo-device`,
`i18next` + `react-i18next`, `expo-localization`, `react-native-chart-kit`,
`expo-linear-gradient`, `react-native-iap`.

푸시 알림은 **Expo Push Service** 직접 사용 (Firebase 의존 제거됨, 커밋 f246d17).

미사용: `@react-native-community/datetimepicker` (설치는 되어 있으나 CustomAlert/DatePickerModal/TimePickerModal 로 대체됨).
미설치: `expo-local-authentication` (생체인증), iOS/Android 위젯 라이브러리.

## 자주 하는 실수
- **떠 있는 탭바와 콘텐츠 겹침**: 모든 탭 루트 + FAB 가 있는 화면은 `useTabBarSafeBottom()` 으로 paddingBottom/`bottom` 계산. 직접 상수 박지 말 것.
- **편집 폼 hydration 누락**: `useState(existingData?.field)` 만 쓰면 비동기 로드 후 안 채워짐 → useEffect 로 1회 hydrate + `hydrated && isDirty(...)` 가드.
- **새 모달 등록 누락**: modal 화면은 `RootNavigator` 의 Stack 에 추가.
- **Zustand 에 서버 데이터 저장**: 금지. React Query 캐시 사용.
- **feature 별 `axios.create`**: 금지. `shared/api/axiosInstance` 만 사용.
- **이탈 경고**: v7 에선 `usePreventRemove` 사용 (v6 의 `addListener('beforeRemove')` 안 됨). cross-tab 은 `tabSwitchGuard` 로 별도 처리.
