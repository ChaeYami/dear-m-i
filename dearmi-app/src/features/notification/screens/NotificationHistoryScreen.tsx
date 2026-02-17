import React, { useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Swipeable } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { customAlert } from '@/shared/components/CustomAlert';
import { navigationRef } from '@/navigation/navigationRef';
import {
  useNotificationHistory,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  useDeleteAllNotifications,
} from '@/features/notification/hooks/useNotificationHistory';
import type { NotificationItem, NotificationType } from '@/features/notification/api';

/** 백엔드가 `{{0}}, {{1}}, ...` 위치 파라미터 형태로 내려보낸 params 배열을 i18next 가 이해할 수 있는 object 로 변환 */
const paramsObj = (arr: string[]) => {
  const out: Record<string, string> = {};
  arr.forEach((v, i) => {
    out[String(i)] = v;
  });
  return out;
};

const typeIcon = (type: NotificationType): keyof typeof Ionicons.glyphMap => {
  switch (type) {
    case 'DAY_BEFORE':
    case 'DAY_OF':
      return 'calendar-outline';
    case 'MEDICATION':
      return 'medical-outline';
    case 'CHECKIN':
      return 'happy-outline';
  }
};

const diffInMinutes = (iso: string) =>
  Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);

const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

interface NotificationRowProps {
  item: NotificationItem;
  onPress: () => void;
  onDelete: () => void;
  formatRelative: (iso: string) => string;
  colors: ReturnType<typeof useTheme>['colors'];
  styles: ReturnType<typeof makeStyles>;
  t: ReturnType<typeof useTranslation>['t'];
}

const NotificationRow: React.FC<NotificationRowProps> = ({
  item, onPress, onDelete, formatRelative, colors, styles, t,
}) => {
  const swipeRef = useRef<Swipeable>(null);
  const unread = !item.readAt;
  // 리소스 삭제 여부: 타입상 resourceId 가 있어야 하는데 null 로 들어온 경우
  const resourceExpected = item.type !== 'CHECKIN';
  const resourceMissing = resourceExpected && !item.resourceId;

  const title = t(item.titleKey as any, {
    ns: 'notifications',
    keySeparator: false,
    ...paramsObj(item.titleParams),
  });
  const body = t(item.bodyKey as any, {
    ns: 'notifications',
    keySeparator: false,
    ...paramsObj(item.bodyParams),
  });

  const renderRightActions = () => (
    <TouchableOpacity
      style={[styles.swipeDeleteBtn, { backgroundColor: colors.error }]}
      onPress={() => { swipeRef.current?.close(); onDelete(); }}
      activeOpacity={0.8}
    >
      <Ionicons name="trash-outline" size={18} color="#fff" />
      <Text style={styles.swipeDeleteText}>{t('notifications:delete')}</Text>
    </TouchableOpacity>
  );

  return (
    <Swipeable ref={swipeRef} renderRightActions={renderRightActions} overshootRight={false}>
      <TouchableOpacity
        style={[styles.item, unread && styles.itemUnread]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <View style={[styles.iconWrap, unread && styles.iconWrapUnread]}>
          <Ionicons name={typeIcon(item.type)} size={18} color={colors.primary} />
        </View>
        <View style={styles.body}>
          <Text style={[styles.title, unread && styles.titleUnread]}>{title}</Text>
          <Text style={styles.subtitle}>{body}</Text>
          <Text style={styles.meta}>
            {formatRelative(item.createdAt)}
            {resourceMissing ? ` · ${t('notifications:resource_deleted')}` : ''}
          </Text>
        </View>
        {unread ? <View style={styles.unreadDot} /> : null}
      </TouchableOpacity>
    </Swipeable>
  );
};

export const NotificationHistoryScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation(['notifications', 'common']);

  const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } = useNotificationHistory();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: markAllRead } = useMarkAllNotificationsRead();
  const { mutate: deleteOne } = useDeleteNotification();
  const { mutate: deleteAll } = useDeleteAllNotifications();

  const items: NotificationItem[] = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data],
  );
  const hasUnread = useMemo(() => items.some((i) => !i.readAt), [items]);

  const sections = useMemo(() => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const todayItems: NotificationItem[] = [];
    const yesterdayItems: NotificationItem[] = [];
    const earlierItems: NotificationItem[] = [];

    items.forEach((item) => {
      const d = new Date(item.createdAt);
      if (isSameDay(d, today)) todayItems.push(item);
      else if (isSameDay(d, yesterday)) yesterdayItems.push(item);
      else earlierItems.push(item);
    });

    return [
      { title: t('notifications:section_today'), data: todayItems },
      { title: t('notifications:section_yesterday'), data: yesterdayItems },
      { title: t('notifications:section_earlier'), data: earlierItems },
    ].filter((s) => s.data.length > 0);
  }, [items, t]);

  const formatRelative = (iso: string): string => {
    const minutes = diffInMinutes(iso);
    if (minutes < 1) return t('notifications:relative_just_now');
    if (minutes < 60) return t('notifications:relative_minutes_ago', { count: minutes });
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return t('notifications:relative_hours_ago', { count: hours });
    const days = Math.floor(hours / 24);
    return t('notifications:relative_days_ago', { count: days });
  };

  const confirmDeleteAll = () => {
    customAlert(
      t('notifications:delete_all_confirm_title'),
      t('notifications:delete_all_confirm_body'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        { text: t('notifications:delete_all'), style: 'destructive', onPress: () => deleteAll() },
      ],
    );
  };

  const openHeaderMenu = () => {
    const buttons = [] as Array<{ text: string; style?: 'cancel' | 'destructive'; onPress?: () => void }>;
    if (hasUnread) buttons.push({ text: t('notifications:mark_all_read'), onPress: () => markAllRead() });
    if (items.length > 0) buttons.push({ text: t('notifications:delete_all'), style: 'destructive', onPress: confirmDeleteAll });
    buttons.push({
      text: t('menu_notification', { ns: 'settings' }),
      onPress: () => {
        navigation.goBack();
        setTimeout(() => {
          (navigationRef.current as any)?.navigate('Main', {
            screen: 'MyPage',
            params: { screen: 'NotificationSettings' },
          });
        }, 150);
      },
    });
    buttons.push({ text: t('common:cancel'), style: 'cancel' });
    customAlert(t('notifications:more_actions'), '', buttons);
  };

  const handleItemPress = (item: NotificationItem) => {
    if (!item.readAt) markRead(item.id);

    const nav = navigationRef.current as any;
    if (!nav) return;

    // 딥링크: 타입 + resourceId 로 분기
    if (item.type === 'DAY_BEFORE' || item.type === 'DAY_OF') {
      if (item.resourceId) {
        nav.navigate('Main', {
          screen: 'Care',
          params: { screen: 'ScheduleDetail', params: { scheduleId: item.resourceId } },
        });
      } else {
        nav.navigate('Main', { screen: 'Care' });
      }
    } else if (item.type === 'MEDICATION') {
      // 푸시 알림 본체 탭과 동일하게 복약 관리 탭(오늘 목록)으로 이동 — 바로 체크 가능
      nav.navigate('Main', { screen: 'Medication' });
    } else if (item.type === 'CHECKIN') {
      nav.navigate('Main', { screen: 'Checkin' });
    }
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScreenHeader
        variant="back"
        title={t('notifications:history_title')}
        rightContent={
          <TouchableOpacity onPress={openHeaderMenu} hitSlop={8}>
            <Ionicons name="ellipsis-horizontal" size={20} color={colors.textSub} />
          </TouchableOpacity>
        }
      />

      {items.length === 0 ? (
        <View style={styles.emptyWrap}>
          <View style={styles.emptyIcon}>
            <Ionicons name="notifications-off-outline" size={32} color={colors.textDisabled} />
          </View>
          <Text style={styles.emptyTitle}>{t('notifications:empty_title')}</Text>
          <Text style={styles.emptyDesc}>{t('notifications:empty_desc')}</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          stickySectionHeadersEnabled
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => handleItemPress(item)}
              onDelete={() => deleteOne(item.id)}
              formatRelative={formatRelative}
              colors={colors}
              styles={styles}
              t={t}
            />
          )}
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage();
          }}
          onEndReachedThreshold={0.4}
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={colors.primary} style={styles.footerSpinner} />
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    listContent: { paddingBottom: 40 },
    sectionHeader: {
      backgroundColor: colors.background,
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.sm,
    },
    sectionTitle: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.bold,
      color: colors.textSub,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    item: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      paddingHorizontal: sizes.spacing.lg,
      paddingVertical: sizes.spacing.md,
      gap: sizes.spacing.md,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    itemUnread: {
      backgroundColor: colors.primaryMuted,
    },
    iconWrap: {
      width: 38,
      height: 38,
      borderRadius: 19,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    },
    iconWrapUnread: {
      backgroundColor: colors.primary + '30',
    },
    body: { flex: 1, gap: 2 },
    title: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.medium,
      color: colors.text,
    },
    titleUnread: {
      fontFamily: fontFamily.bold,
    },
    subtitle: {
      fontSize: sizes.font.sm,
      color: colors.textSub,
      lineHeight: 18,
    },
    meta: {
      fontSize: sizes.font.xs,
      color: colors.textDisabled,
      marginTop: 2,
    },
    unreadDot: {
      width: 8,
      height: 8,
      borderRadius: 4,
      backgroundColor: colors.error,
      marginTop: 6,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingTop: 120,
      gap: sizes.spacing.sm,
    },
    emptyIcon: {
      width: 64,
      height: 64,
      borderRadius: 32,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: sizes.spacing.sm,
    },
    emptyTitle: {
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
    },
    emptyDesc: {
      fontSize: sizes.font.sm,
      color: colors.textDisabled,
    },
    footerSpinner: {
      paddingVertical: sizes.spacing.lg,
    },
    swipeDeleteBtn: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 88,
      gap: 4,
    },
    swipeDeleteText: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.semibold,
      color: '#fff',
    },
  });
