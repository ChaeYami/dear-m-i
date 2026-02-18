import * as Haptics from 'expo-haptics';

/**
 * Haptic feedback wrapper.
 * - 모든 호출은 fire-and-forget (await 불필요).
 * - Android 일부 디바이스 미지원 — Haptics 가 silently no-op.
 * - 너무 자주 쓰면 피로감 증가 → 보상감 있는 액션(체크/완료)과 destructive 확인에만.
 */
export const haptics = {
  /** 체크/토글류 가벼운 탭 */
  light: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
  },
  /** 폼 저장/주요 인터랙션 완료 */
  medium: () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
  },
  /** 성공 — 체크인 완료, 처방전 OCR 완료 등 */
  success: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  },
  /** 경고 — destructive 확인 직전 */
  warning: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning).catch(() => {});
  },
  /** 오류 — 저장 실패 등 */
  error: () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error).catch(() => {});
  },
};
