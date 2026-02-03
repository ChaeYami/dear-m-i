/**
 * MMKV 캐시 및 SecureStore 키 상수
 * - 키 이름을 문자열로 직접 사용하지 말고 이 파일에서 참조
 */

/** expo-secure-store 키 (민감 정보: 토큰) */
export const SECURE_STORE_KEYS = {
  ACCESS_TOKEN: 'dearmi_access_token',
  REFRESH_TOKEN: 'dearmi_refresh_token',
} as const;

/** MMKV 캐시 키 (비민감 정보: 사용자 설정, 캐시) */
export const CACHE_KEYS = {
  // 사용자 정보
  USER_PROFILE: 'user_profile',

  // 앱 설정
  APP_VERSION: 'app_version',
  ONBOARDING_COMPLETED: 'onboarding_completed',
  NOTIFICATION_ENABLED: 'notification_enabled',

  // 기능별 캐시
  SCHEDULE_LIST: 'schedule_list',
  RECORD_LIST: 'record_list',
  PRESCRIPTION_LIST: 'prescription_list',
} as const;

/** React Query 쿼리 키 팩토리 */
export const QUERY_KEYS = {
  // 앱 버전
  appVersion: (platform: string, version: string) =>
    ['appVersion', platform, version] as const,

  // 인증
  me: () => ['me'] as const,

  // 일정
  monthlySchedules: (year: number, month: number) => ['schedules', year, month] as const,
  schedule: (id: number) => ['schedule', id] as const,

  // 타임라인 (상담 기록 + 처방전 혼합)
  timeline: () => ['timeline'] as const,

  // 상담 기록
  records: () => ['records'] as const,
  record: (id: number) => ['record', id] as const,

  // 최근 일정 (RecordForm 드롭다운용)
  recentSchedules: () => ['recentSchedules'] as const,

  // 처방전
  prescriptions: () => ['prescriptions'] as const,
  prescription: (id: number) => ['prescription', id] as const,
  medicationDetail: (id: number) => ['medication', id] as const,
} as const;
