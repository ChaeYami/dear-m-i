import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Pressable,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  runOnJS,
  Easing,
} from 'react-native-reanimated';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import i18n from '@/locales/i18n';

// ─── 전역 상태 ────────────────────────────────────────

export interface AlertButton {
  text: string;
  style?: 'default' | 'cancel' | 'destructive';
  onPress?: () => void;
}

interface AlertState {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AlertButton[];
}

let _setAlert: React.Dispatch<React.SetStateAction<AlertState>> | null = null;

/**
 * Alert.alert 대체 — 앱 테마에 맞는 커스텀 모달
 * 사용법: customAlert('제목', '메시지', [{ text: '확인' }])
 */
export const customAlert = (
  title: string,
  message?: string,
  buttons?: AlertButton[],
) => {
  if (!_setAlert) return;
  _setAlert({
    visible: true,
    title,
    message: message || undefined,
    buttons: buttons ?? [{ text: i18n.t('common:confirm') }],
  });
};

// ─── 컴포넌트 ─────────────────────────────────────────

const INITIAL: AlertState = { visible: false, title: '', buttons: [] };

export const CustomAlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = React.useState<AlertState>(INITIAL);

  useEffect(() => {
    _setAlert = setState;
    return () => { _setAlert = null; };
  }, []);

  const dismiss = useCallback((btn?: AlertButton) => {
    setState(INITIAL);
    if (btn?.onPress) {
      const onPress = btn.onPress;
      setTimeout(onPress, 50);
    }
  }, []);

  return (
    <>
      {children}
      {state.visible && (
        <AlertModal
          title={state.title}
          message={state.message}
          buttons={state.buttons}
          onDismiss={dismiss}
        />
      )}
    </>
  );
};

// ─── 모달 렌더링 ──────────────────────────────────────

const AlertModal: React.FC<{
  title: string;
  message?: string;
  buttons: AlertButton[];
  onDismiss: (btn?: AlertButton) => void;
}> = ({ title, message, buttons, onDismiss }) => {
  const { colors } = useTheme();
  const backdropOpacity = useSharedValue(0);
  const cardScale = useSharedValue(0.9);
  const cardOpacity = useSharedValue(0);

  useEffect(() => {
    backdropOpacity.value = withTiming(1, { duration: 200, easing: Easing.out(Easing.ease) });
    cardScale.value = withSpring(1, { damping: 18, stiffness: 300 });
    cardOpacity.value = withTiming(1, { duration: 180 });
  }, []);

  const handlePress = useCallback((btn?: AlertButton) => {
    const callback = () => onDismiss(btn);
    backdropOpacity.value = withTiming(0, { duration: 150 });
    cardScale.value = withTiming(0.95, { duration: 120 });
    cardOpacity.value = withTiming(0, { duration: 120 }, () => {
      runOnJS(callback)();
    });
  }, [onDismiss]);

  const backdropStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0,0,0,${0.4 * backdropOpacity.value})`,
  }));

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: cardScale.value }],
    opacity: cardOpacity.value,
  }));

  // 버튼 레이아웃: 2개 이하면 가로, 3개 이상이면 세로
  const isHorizontal = buttons.length <= 2;

  // cancel 버튼을 마지막으로 정렬
  const sortedButtons = [...buttons].sort((a, b) => {
    if (a.style === 'cancel') return 1;
    if (b.style === 'cancel') return -1;
    return 0;
  });

  const styles = getStyles(colors, isHorizontal);

  return (
    <Modal transparent statusBarTranslucent animationType="none">
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={styles.backdropPress} onPress={() => handlePress()}>
          <Animated.View style={[styles.card, cardStyle]}>
            <Pressable>
              {/* 헤더 */}
              <View style={styles.header}>
                <Text style={styles.title}>{title}</Text>
                {message ? <Text style={styles.message}>{message}</Text> : null}
              </View>

              {/* 구분선 */}
              <View style={styles.divider} />

              {/* 버튼 */}
              <View style={isHorizontal ? styles.buttonsRow : styles.buttonsCol}>
                {sortedButtons.map((btn, idx) => {
                  const isCancel = btn.style === 'cancel';
                  const isDestructive = btn.style === 'destructive';
                  const btnColor = isDestructive
                    ? colors.error
                    : isCancel
                      ? colors.textSub
                      : colors.primary;

                  return (
                    <React.Fragment key={idx}>
                      {idx > 0 && isHorizontal && <View style={styles.btnDividerV} />}
                      {idx > 0 && !isHorizontal && <View style={styles.btnDividerH} />}
                      <TouchableOpacity
                        style={isHorizontal ? styles.btnH : styles.btnV}
                        onPress={() => handlePress(btn)}
                        activeOpacity={0.7}
                      >
                        <Text
                          style={[
                            styles.btnText,
                            { color: btnColor },
                            !isCancel && styles.btnTextBold,
                          ]}
                        >
                          {btn.text}
                        </Text>
                      </TouchableOpacity>
                    </React.Fragment>
                  );
                })}
              </View>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Animated.View>
    </Modal>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors'], _isH: boolean) =>
  StyleSheet.create({
    backdrop: {
      flex: 1,
    },
    backdropPress: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 40,
    },
    card: {
      width: '100%',
      maxWidth: 320,
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      overflow: 'hidden',
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.15,
      shadowRadius: 24,
      elevation: 12,
    },
    header: {
      paddingHorizontal: sizes.spacing.xl,
      paddingTop: sizes.spacing.xl,
      paddingBottom: sizes.spacing.lg,
      gap: sizes.spacing.sm,
      alignItems: 'center',
    },
    title: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.text,
      textAlign: 'center',
    },
    message: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.regular,
      color: colors.textSub,
      textAlign: 'center',
      lineHeight: 20,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
    },
    buttonsRow: {
      flexDirection: 'row',
    },
    buttonsCol: {
      flexDirection: 'column',
    },
    btnH: {
      flex: 1,
      paddingVertical: sizes.spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnV: {
      paddingVertical: sizes.spacing.md + 2,
      alignItems: 'center',
      justifyContent: 'center',
    },
    btnDividerV: {
      width: 1,
      backgroundColor: colors.divider,
    },
    btnDividerH: {
      height: 1,
      backgroundColor: colors.divider,
    },
    btnText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.medium,
    },
    btnTextBold: {
      fontFamily: fontFamily.semibold,
    },
  });
