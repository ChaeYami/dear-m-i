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
│   ├── components/   공통 UI (PremiumGate 포함)
│   ├── store/        Zustand stores
│   ├── cache/        CacheService (MMKV)
│   └── utils/        dateUtils 등
├── navigation/
├── locales/
│   ├── ko/
│   └── en/
└── constants/
```

---

## 클린 아키텍처 규칙

```
Screen → hooks → api → axiosInstance → 백엔드
```

- **screens/**: hooks/만 호출. axios 직접 호출 금지.
- **hooks/**: useQuery/useMutation 사용. 서버 데이터를 Zustand에 저장 금지.
- **api/**: `shared/api/axiosInstance` 하나만. feature별 axios.create() 금지.
- **store/**: 인증 토큰, 구독 플랜, 언어 설정만. 서버 데이터 저장 금지.

---

## 인증 (JWT)

```typescript
// axiosInstance 인터셉터
// 요청: expo-secure-store에서 accessToken → Authorization 헤더
// 401 응답: /auth/refresh 호출 → 토큰 갱신 → 재시도
// 갱신 실패: 로그아웃 처리
```

### authStore (Zustand)
```typescript
// uid, email, name, plan('FREE'|'PREMIUM'), expiresAt
// logout: SecureStore 클리어 + 서버 refresh token 삭제
```

---

## 보안 규칙

```typescript
// 절대 금지 (② 원칙)
const JWT_SECRET = '...';
const CLAUDE_API_KEY = 'sk-ant-...';

// SplashScreen 필수 (③ 원칙)
const version = await appApi.checkVersion(Platform.OS, appVersion);
if (version.forceUpdate) Linking.openURL(storeUrl);
```

---

## 플랜 분기 UI

```tsx
// 잠긴 기능 감싸기
<PremiumGate>
  <MedicationDetail />
</PremiumGate>
// FREE → 자물쇠 + '업그레이드' → PaywallScreen

// 글자수: 상담 기록 200자 / 하루 메모 100자
// 조회 기간: RecordTab 2개월 이전 흐림 처리
```

---

## 결제

```typescript
// iOS: App Store IAP만 (웹 결제 버튼 절대 표시 금지)
// Android: Play Billing + 토스페이먼츠 웹 결제 병행
```

---

## 네비게이션

```
RootNavigator
├── AuthNavigator
│   ├── SplashScreen    (버전 체크 → 토큰 복원)
│   └── LoginScreen
└── MainTabNavigator
    ├── ScheduleTab          일정
    ├── RecordTab            진료 기록 모아보기
    ├── CheckinTab           하루 메모 모아보기
    ├── PrescriptionTab      처방 모아보기
    └── MyPageTab            마이
```

---

## 주요 패키지

```
expo-auth-session              OAuth2 로그인
react-native-iap               결제
i18next, react-i18next         다국어
react-native-mmkv              캐시 + 위젯 공유
expo-secure-store              토큰 저장
react-native-chart-kit         감정 그래프
expo-image-picker              처방전 촬영
expo-local-authentication      생체인증
react-native-widget-extension  iOS 위젯
react-native-android-widget    Android 위젯
```
