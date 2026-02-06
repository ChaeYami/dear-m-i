import { useState, useEffect, useRef, useCallback } from 'react';
import { customAlert } from '@/shared/components/CustomAlert';
import {
  useNavigation,
  usePreventRemove,
  useFocusEffect,
} from '@react-navigation/native';
import { setTabSwitchGuard } from '@/shared/navigation/tabSwitchGuard';

interface Options {
  /** true면 변경사항 있음 → 이탈 시 경고 */
  isDirty: boolean;
  /** 다이얼로그 제목 (기본: '작성을 그만 두시겠어요?') */
  title?: string;
  /** 다이얼로그 메시지 (기본: '작성 중인 내용이 사라집니다.') */
  message?: string;
}

type ExitIntent =
  | null
  | { kind: 'back' }
  | { kind: 'tab'; doNavigate: () => void };

/**
 * 폼 이탈 경고 훅 (react-navigation v7)
 * - 뒤로가기/제스처 스와이프/헤더 백: usePreventRemove 로 가로채기
 * - 다른 탭 이동: CustomTabBar 가 호출하는 tabSwitchGuard 로 가로채기
 * - 저장 성공 후에는 markSavedAndExit() 호출 → 경고 없이 종료
 */
export const useUnsavedChangesWarning = ({
  isDirty,
  title = '작성을 그만 두시겠어요?',
  message = '작성 중인 내용이 사라집니다.',
}: Options) => {
  const navigation = useNavigation();
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  // 1. 스택 pop (헤더 백, 하드웨어 백, 제스처 스와이프)
  usePreventRemove(isDirty && !exitIntent, ({ data }) => {
    customAlert(title, message, [
      { text: '계속 작성', style: 'cancel' },
      {
        text: '나가기',
        style: 'destructive',
        // data.action 은 이미 visited 마크가 찍혀 있어 재dispatch 해도
        // usePreventRemove 가 다시 잡지 않음 (react-navigation 공식 패턴)
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  // 2. 다른 탭 이동 — CustomTabBar 가 호출하는 가드 등록 (focus 동안만)
  useFocusEffect(
    useCallback(() => {
      setTabSwitchGuard((_targetRouteName, doNavigate) => {
        if (!isDirtyRef.current) {
          doNavigate();
          return;
        }
        customAlert(title, message, [
          { text: '계속 작성', style: 'cancel' },
          {
            text: '나가기',
            style: 'destructive',
            onPress: () => setExitIntent({ kind: 'tab', doNavigate }),
          },
        ]);
      });
      return () => setTabSwitchGuard(null);
    }, [title, message])
  );

  // 3. exitIntent 처리: 다음 렌더에서 usePreventRemove 가 비활성화된 뒤 실행
  useEffect(() => {
    if (!exitIntent) return;
    if (exitIntent.kind === 'back') {
      navigation.goBack();
    } else {
      // target 탭으로 이동 + 폼 pop
      exitIntent.doNavigate();
      navigation.goBack();
    }
  }, [exitIntent, navigation]);

  /** 저장 성공 후 경고 없이 화면 종료 */
  const markSavedAndExit = useCallback(() => {
    setExitIntent({ kind: 'back' });
  }, []);

  return { markSavedAndExit };
};
