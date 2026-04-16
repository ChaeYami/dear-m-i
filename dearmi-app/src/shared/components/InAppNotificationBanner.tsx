import React, { useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type * as Notifications from 'expo-notifications';
import { useTheme, sizes, fontFamily } from '@/shared/theme';

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
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const translateY = useRef(new Animated.Value(-(BANNER_HEIGHT + insets.top))).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      tension: 80,
      friction: 10,
    }).start();

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
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        paddingHorizontal: sizes.spacing.md,
        paddingBottom: sizes.spacing.sm,
        paddingTop: insets.top + sizes.spacing.sm,
        transform: [{ translateY }],
      }}
    >
      <TouchableOpacity
        onPress={handlePress}
        activeOpacity={0.9}
        style={Platform.select({
          ios: {
            shadowColor: colors.glassShadow,
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 1,
            shadowRadius: 12,
          },
          android: { elevation: 8 },
        })}
      >
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          minHeight: BANNER_HEIGHT,
          paddingVertical: sizes.spacing.md,
          paddingHorizontal: sizes.spacing.md,
          gap: sizes.spacing.sm,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          backgroundColor: colors.surface,
          borderRadius: sizes.radius.lg,
          overflow: 'hidden',
        }}
      >
        <View
          style={{
            width: 3,
            alignSelf: 'stretch',
            borderRadius: 2,
            backgroundColor: colors.primary,
          }}
        />
        <View style={{ flex: 1, gap: 2 }}>
          {title ? (
            <Text
              style={{
                fontFamily: fontFamily.semibold,
                fontSize: sizes.font.md,
                color: colors.text,
              }}
              numberOfLines={1}
            >
              {title}
            </Text>
          ) : null}
          {body ? (
            <Text
              style={{
                fontFamily: fontFamily.regular,
                fontSize: sizes.font.sm,
                color: colors.textSub,
                lineHeight: 18,
              }}
              numberOfLines={2}
            >
              {body}
            </Text>
          ) : null}
        </View>
        <TouchableOpacity style={{ padding: 4 }} onPress={dismiss} hitSlop={10}>
          <Ionicons name="close" size={sizes.font.md} color={colors.textDisabled} />
        </TouchableOpacity>
      </View>
      </TouchableOpacity>
    </Animated.View>
  );
};
