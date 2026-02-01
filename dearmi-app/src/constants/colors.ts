/**
 * 앱 전역 색상 상수
 * - 디자인 시스템의 단일 출처(single source of truth)
 * - 색상 값을 컴포넌트에 직접 하드코딩하지 말 것
 */
export const colors = {
  /** 주요 브랜드 색상 (버튼, 강조 요소) */
  primary: '#2E5FA3',

  /** 보조 브랜드 색상 (성공, 확인 요소) */
  secondary: '#0F6E56',

  /** 기본 배경색 */
  background: '#F8F9FA',

  /** 카드, 모달 등 표면 배경색 */
  surface: '#FFFFFF',

  /** 구분선, 테두리 색상 */
  border: '#E0E0E0',

  /** 텍스트 색상 계층 */
  text: {
    primary: '#1A1A2E',
    secondary: '#6B7280',
    disabled: '#9CA3AF',
    onPrimary: '#FFFFFF',
  },

  /** 에러 및 경고 색상 */
  error: '#D32F2F',
  errorLight: '#FFEBEE',

  /** 경고 색상 */
  warning: '#F59E0B',
  warningLight: '#FFFBEB',

  /** 성공 색상 */
  success: '#0F6E56',
  successLight: '#ECFDF5',

  /** 비활성 및 스켈레톤 색상 */
  disabled: '#E5E7EB',
  skeleton: '#F3F4F6',
} as const;

export type Colors = typeof colors;
