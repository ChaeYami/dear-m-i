import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { customAlert } from '@/shared/components/CustomAlert';
import {
  useNavigation,
  usePreventRemove,
  useFocusEffect,
} from '@react-navigation/native';
import { setTabSwitchGuard } from '@/shared/navigation/tabSwitchGuard';

interface Options {
  isDirty: boolean;
  title?: string;
  message?: string;
}

type ExitIntent =
  | null
  | { kind: 'back' }
  | { kind: 'tab'; doNavigate: () => void };

export const useUnsavedChangesWarning = ({
  isDirty,
  title,
  message,
}: Options) => {
  const navigation = useNavigation();
  const { t } = useTranslation('common');
  const resolvedTitle = title ?? t('exit_warning_title');
  const resolvedMessage = message ?? t('exit_warning_desc');
  const continueText = t('exit_continue');
  const leaveText = t('exit_leave');
  const [exitIntent, setExitIntent] = useState<ExitIntent>(null);

  const isDirtyRef = useRef(isDirty);
  isDirtyRef.current = isDirty;

  usePreventRemove(isDirty && !exitIntent, ({ data }) => {
    customAlert(resolvedTitle, resolvedMessage, [
      { text: continueText, style: 'cancel' },
      {
        text: leaveText,
        style: 'destructive',
        onPress: () => navigation.dispatch(data.action),
      },
    ]);
  });

  useFocusEffect(
    useCallback(() => {
      setTabSwitchGuard((_targetRouteName, doNavigate) => {
        if (!isDirtyRef.current) {
          doNavigate();
          return;
        }
        customAlert(resolvedTitle, resolvedMessage, [
          { text: continueText, style: 'cancel' },
          {
            text: leaveText,
            style: 'destructive',
            onPress: () => setExitIntent({ kind: 'tab', doNavigate }),
          },
        ]);
      });
      return () => setTabSwitchGuard(null);
    }, [resolvedTitle, resolvedMessage, continueText, leaveText])
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
