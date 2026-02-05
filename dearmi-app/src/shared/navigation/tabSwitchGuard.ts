/**
 * 탭 전환 가드 — 폼 이탈 경고 등 cross-tab 차단을 위한 간단한 module-level 레지스트리
 *
 * - useUnsavedChangesWarning 등에서 setTabSwitchGuard 로 가드 등록
 * - CustomTabBar 의 onPress 가 cross-tab 이동 직전에 runTabSwitchGuard 호출
 * - 가드는 doNavigate 콜백을 받아 즉시 호출하면 통과, 보류하면 차단됨
 *   (예: Alert 띄운 뒤 사용자 확인 시점에 doNavigate 호출)
 */

export type TabSwitchGuard = (targetRouteName: string, doNavigate: () => void) => void;

let activeGuard: TabSwitchGuard | null = null;

export const setTabSwitchGuard = (guard: TabSwitchGuard | null) => {
  activeGuard = guard;
};

export const runTabSwitchGuard = (
  targetRouteName: string,
  doNavigate: () => void,
) => {
  if (activeGuard) {
    activeGuard(targetRouteName, doNavigate);
  } else {
    doNavigate();
  }
};
