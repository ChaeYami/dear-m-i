import React from 'react';
import { View, Text, TouchableOpacity, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';
import { navigationRef } from '@/navigation/navigationRef';
import { useUnreadNotificationCount } from '@/features/notification/hooks/useNotificationHistory';

const a11y = {
  search: { accessibilityRole: 'button' as const, accessibilityLabel: '검색' },
  bell: (unread: boolean) => ({
    accessibilityRole: 'button' as const,
    accessibilityLabel: unread ? '알림 (읽지 않은 알림 있음)' : '알림',
  }),
  back: { accessibilityRole: 'button' as const, accessibilityLabel: '뒤로 가기' },
};

interface TabHeaderProps {
  variant: 'tab';
  title: string;
  /** 알림 벨 앞쪽(왼쪽)에 렌더할 추가 우측 컨텐츠 */
  rightContent?: React.ReactNode;
  /**
   * @deprecated 빨간 점은 내부 `useUnreadNotificationCount` 쿼리가 결정한다.
   * 이 prop 은 호환용으로만 남겨두며, 전달되더라도 무시된다.
   */
  hasNotification?: boolean;
  /** 검색 스코프 — 지정 시 돋보기 아이콘 표시, 해당 타입만 검색 */
  searchScope?: 'RECORD' | 'CHECKIN' | 'PREPNOTE';
}

interface BackHeaderProps {
  variant: 'back';
  title: string;
  onBack?: () => void;
  rightContent?: React.ReactNode;
}

interface FormHeaderProps {
  variant: 'form';
  title: string;
  onCancel: () => void;
  onSave: () => void;
  saveLabel?: string;
  cancelLabel?: string;
  saveDisabled?: boolean;
}

type ScreenHeaderProps = TabHeaderProps | BackHeaderProps | FormHeaderProps;

const BRAND_LOGO = require('../../../assets/banner-icon.png');

const TabHeader: React.FC<TabHeaderProps> = (props) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const hasUnread = unreadCount > 0;

  const handleBellPress = () => {
    // 벨은 어느 탭에서 눌러도 같은 Root 모달을 연다 (탭 스택을 오염시키지 않음)
    (navigationRef.current as any)?.navigate('NotificationHistory');
  };

  const handleSearchPress = () => {
    (navigationRef.current as any)?.navigate('Search', { scope: props.searchScope });
  };

  return (
    <View
      style={{
        height: sizes.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: sizes.spacing.lg,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', flex: 1, minWidth: 0 }}>
        <Image
          source={BRAND_LOGO}
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            marginRight: sizes.spacing.sm,
          }}
          resizeMode="cover"
        />
        <Text
          style={{
            fontFamily: fontFamily.bold,
            fontSize: sizes.font.lg,
            color: colors.text,
            letterSpacing: -0.2,
            flexShrink: 1,
          }}
          numberOfLines={1}
        >
          {props.title}
        </Text>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm }}>
        {props.rightContent}
        {props.searchScope && (
          <TouchableOpacity onPress={handleSearchPress} hitSlop={8} {...a11y.search}>
            <GlassView
              intensity="regular"
              borderRadius={19}
              style={{
                width: 38,
                height: 38,
                alignItems: 'center',
                justifyContent: 'center',
                borderWidth: 1,
                borderColor: colors.glassBorder,
              }}
            >
              <Ionicons name="search-outline" size={20} color={colors.text} />
            </GlassView>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={handleBellPress} hitSlop={8} {...a11y.bell(hasUnread)}>
          <GlassView
            intensity="regular"
            borderRadius={19}
            style={{
              width: 38,
              height: 38,
              alignItems: 'center',
              justifyContent: 'center',
              borderWidth: 1,
              borderColor: colors.glassBorder,
            }}
          >
            <Ionicons name="notifications-outline" size={20} color={colors.text} />
            {hasUnread ? (
              <View
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 9,
                  width: 8,
                  height: 8,
                  borderRadius: 4,
                  backgroundColor: colors.error,
                  borderWidth: 1.5,
                  borderColor: colors.surface,
                }}
              />
            ) : null}
          </GlassView>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export const ScreenHeader: React.FC<ScreenHeaderProps> = (props) => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation('common');
  const { variant, title } = props;

  if (variant === 'tab') {
    return <TabHeader {...(props as TabHeaderProps)} />;
  }

  if (variant === 'back') {
    const handleBack = props.onBack ?? (() => navigation.goBack());
    return (
      <View
        style={{
          height: sizes.headerHeight,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: sizes.spacing.md,
        }}
      >
        <TouchableOpacity
          onPress={handleBack}
          hitSlop={8}
          {...a11y.back}
          style={{
            width: 36,
            height: 36,
            borderRadius: 12,
            backgroundColor: colors.primaryMuted,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="chevron-back" size={20} color={colors.primary} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            fontFamily: fontFamily.semibold,
            fontSize: sizes.font.lg,
            color: colors.text,
            textAlign: 'center',
            marginRight: props.rightContent ? 0 : 36,
          }}
          numberOfLines={1}
        >
          {title}
        </Text>
        {props.rightContent ? (
          <View style={{ minWidth: 36, alignItems: 'flex-end' }}>
            {props.rightContent}
          </View>
        ) : null}
      </View>
    );
  }

  // form
  const { onCancel, onSave, saveLabel = t('save'), cancelLabel = t('cancel'), saveDisabled = false } = props;
  return (
    <View
      style={{
        height: sizes.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: sizes.spacing.lg,
      }}
    >
      <TouchableOpacity onPress={onCancel} hitSlop={8} style={{ minWidth: 48 }}>
        <Text
          style={{
            fontFamily: fontFamily.medium,
            fontSize: sizes.font.md,
            color: colors.textSub,
          }}
        >
          {cancelLabel}
        </Text>
      </TouchableOpacity>
      <Text
        style={{
          flex: 1,
          fontFamily: fontFamily.semibold,
          fontSize: sizes.font.lg,
          color: colors.text,
          textAlign: 'center',
        }}
        numberOfLines={1}
      >
        {title}
      </Text>
      <TouchableOpacity
        onPress={onSave}
        disabled={saveDisabled}
        hitSlop={8}
        style={{ minWidth: 48, alignItems: 'flex-end' }}
      >
        <Text
          style={{
            fontFamily: fontFamily.semibold,
            fontSize: sizes.font.md,
            color: saveDisabled ? colors.textDisabled : colors.primary,
          }}
        >
          {saveLabel}
        </Text>
      </TouchableOpacity>
    </View>
  );
};
