import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type * as Notifications from 'expo-notifications';
import { colors, sizes } from '@/constants';

interface Props {
  notification: Notifications.Notification;
  onDismiss: () => void;
  onPress: () => void;
}

const BANNER_HEIGHT = 72;
const AUTO_DISMISS_MS = 3000;

export const InAppNotificationBanner: React.FC<Props> = ({
  notification,
  onDismiss,
  onPress,
}) => {
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-(BANNER_HEIGHT + insets.top))).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // 슬라이드 인
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

    // 3초 후 자동 해제
    timerRef.current = setTimeout(dismiss, AUTO_DISMISS_MS);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [notification]);

  const dismiss = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    Animated.timing(translateY, {
      toValue: -(BANNER_HEIGHT + insets.top + 20),
      duration: 250,
      useNativeDriver: true,
    }).start(() => onDismiss());
  };

  const handlePress = () => {
    dismiss();
    onPress();
  };

  const title = notification.request.content.title ?? '';
  const body = notification.request.content.body ?? '';

  return (
    <Animated.View
      style={[
        styles.container,
        { paddingTop: insets.top + sizes.spacing.sm, transform: [{ translateY }] },
      ]}
    >
      <TouchableOpacity style={styles.inner} onPress={handlePress} activeOpacity={0.9}>
        <View style={styles.accent} />
        <View style={styles.textWrap}>
          {title ? <Text style={styles.title} numberOfLines={1}>{title}</Text> : null}
          {body ? <Text style={styles.body} numberOfLines={2}>{body}</Text> : null}
        </View>
        <TouchableOpacity style={styles.closeBtn} onPress={dismiss} hitSlop={10}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    paddingHorizontal: sizes.spacing.md,
    paddingBottom: sizes.spacing.sm,
  },
  inner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    minHeight: BANNER_HEIGHT,
    paddingVertical: sizes.spacing.md,
    paddingHorizontal: sizes.spacing.md,
    gap: sizes.spacing.sm,
    // 그림자
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
      },
      android: { elevation: 8 },
    }),
    borderWidth: 1,
    borderColor: colors.border,
  },
  accent: {
    width: 3,
    alignSelf: 'stretch',
    borderRadius: 2,
    backgroundColor: colors.primary,
  },
  textWrap: { flex: 1, gap: 2 },
  title: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.primary,
  },
  body: {
    fontSize: sizes.font.sm,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  closeBtn: { padding: 4 },
  closeText: { fontSize: sizes.font.sm, color: colors.text.disabled },
});
