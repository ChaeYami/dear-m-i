import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
} from 'react-native';
import { useNavigation, CompositeNavigationProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { useAuthStore } from '@/features/auth/store/authStore';
import type { MyPageStackParamList } from '@/navigation/MyPageNavigator';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = CompositeNavigationProp<
  StackNavigationProp<MyPageStackParamList, 'MyPageTab'>,
  StackNavigationProp<RootStackParamList>
>;

interface MenuItemProps {
  icon: string;
  label: string;
  onPress: () => void;
  badge?: string;
}

const MenuItem: React.FC<MenuItemProps> = ({ icon, label, onPress, badge }) => (
  <TouchableOpacity style={styles.menuItem} onPress={onPress} activeOpacity={0.7}>
    <Text style={styles.menuIcon}>{icon}</Text>
    <Text style={styles.menuLabel}>{label}</Text>
    {badge && (
      <View style={styles.badge}>
        <Text style={styles.badgeText}>{badge}</Text>
      </View>
    )}
    <Text style={styles.menuArrow}>›</Text>
  </TouchableOpacity>
);

export const MyPageScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const { user, logout } = useAuthStore();

  const handleLogout = () => {
    Alert.alert('로그아웃', '로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      { text: '로그아웃', style: 'destructive', onPress: () => logout() },
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>마이페이지</Text>
        <TouchableOpacity onPress={() => navigation.navigate('Search')} hitSlop={8}>
          <Text style={styles.headerSearchIcon}>🔍</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* 프로필 */}
        <View style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {user?.name?.charAt(0)?.toUpperCase() ?? '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{user?.name ?? '사용자'}</Text>
            <Text style={styles.profileEmail}>{user?.email ?? ''}</Text>
          </View>
          <View style={[styles.planBadge, user?.plan === 'PREMIUM' && styles.planBadgePremium]}>
            <Text style={[styles.planBadgeText, user?.plan === 'PREMIUM' && styles.planBadgeTextPremium]}>
              {user?.plan === 'PREMIUM' ? '프리미엄' : '무료'}
            </Text>
          </View>
        </View>

        {/* 기능 메뉴 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>건강 관리</Text>
          <View style={styles.card}>
            <MenuItem
              icon="💊"
              label="복약 관리"
              onPress={() => navigation.navigate('MedicationHome')}
            />
          </View>
        </View>

        {/* 설정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>설정</Text>
          <View style={styles.card}>
            <MenuItem
              icon="🔔"
              label="알림 설정"
              onPress={() => navigation.navigate('NotificationSettings')}
            />
          </View>
        </View>

        {/* 계정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.menuItem} onPress={handleLogout} activeOpacity={0.7}>
              <Text style={styles.menuIcon}>🚪</Text>
              <Text style={[styles.menuLabel, styles.menuLabelDanger]}>로그아웃</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerSearchIcon: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
  },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 40 },
  // 프로필 카드
  profileCard: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: sizes.spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.md,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.onPrimary,
  },
  profileInfo: { flex: 1 },
  profileName: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.primary,
  },
  profileEmail: {
    fontSize: sizes.font.xs,
    color: colors.text.secondary,
    marginTop: 2,
  },
  planBadge: {
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 3,
    borderRadius: sizes.radius.full,
    backgroundColor: colors.skeleton,
  },
  planBadgePremium: {
    backgroundColor: colors.secondary + '20',
  },
  planBadgeText: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.semibold,
    color: colors.text.secondary,
  },
  planBadgeTextPremium: {
    color: colors.secondary,
  },
  // 섹션
  section: { gap: sizes.spacing.sm },
  sectionTitle: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: sizes.spacing.xs,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.md,
    gap: sizes.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  menuIcon: { fontSize: 20, width: 28, textAlign: 'center' },
  menuLabel: {
    flex: 1,
    fontSize: sizes.font.md,
    color: colors.text.primary,
  },
  menuLabelDanger: { color: colors.error },
  badge: {
    backgroundColor: colors.primary + '18',
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.full,
  },
  badgeText: {
    fontSize: sizes.font.xs,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  menuArrow: {
    fontSize: sizes.font.lg,
    color: colors.text.disabled,
  },
});
