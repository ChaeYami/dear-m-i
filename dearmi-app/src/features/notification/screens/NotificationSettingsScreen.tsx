import React from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { colors, sizes } from '@/constants';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../hooks/useNotificationSettings';
import type { NotificationSettings } from '../api';

// ─── 설정 행 ────────────────────────────────────────────────────────────────

const SettingRow: React.FC<{
  label: string;
  description?: string;
  value: boolean;
  onToggle: (v: boolean) => void;
  disabled?: boolean;
}> = ({ label, description, value, onToggle, disabled }) => (
  <View style={[styles.row, disabled && styles.rowDisabled]}>
    <View style={styles.rowText}>
      <Text style={[styles.rowLabel, disabled && styles.labelDisabled]}>{label}</Text>
      {description ? (
        <Text style={styles.rowDescription}>{description}</Text>
      ) : null}
    </View>
    <Switch
      value={value}
      onValueChange={onToggle}
      disabled={disabled}
      trackColor={{ false: colors.border, true: colors.primary + '80' }}
      thumbColor={value ? colors.primary : colors.text.disabled}
    />
  </View>
);

// ─── 메인 화면 ────────────────────────────────────────────────────────────

export const NotificationSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { data: settings, isLoading } = useNotificationSettings();
  const { mutate: updateSettings } = useUpdateNotificationSettings();

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    const next: NotificationSettings = { ...settings, [key]: value };

    // 전체 알림 OFF → 하위 설정도 모두 OFF
    if (key === 'allNotificationsEnabled' && !value) {
      next.oneDayBeforeEnabled = false;
      next.onDayOfEnabled = false;
    }

    updateSettings(next);
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backBtn}>‹  뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>알림 설정</Text>
        <View style={{ width: 48 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator color={colors.primary} />
        </View>
      ) : !settings ? (
        <View style={styles.loadingWrap}>
          <Text style={styles.errorText}>설정을 불러올 수 없습니다.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.section}>
            <SettingRow
              label="전체 알림"
              description="모든 푸시 알림을 켜거나 끕니다"
              value={settings.allNotificationsEnabled}
              onToggle={(v) => handleToggle('allNotificationsEnabled', v)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>진료 일정 알림</Text>
            <SettingRow
              label="하루 전 알림"
              description="진료 예정일 하루 전 오전 9시에 알림"
              value={settings.oneDayBeforeEnabled}
              onToggle={(v) => handleToggle('oneDayBeforeEnabled', v)}
              disabled={!settings.allNotificationsEnabled}
            />
            <View style={styles.divider} />
            <SettingRow
              label="당일 알림"
              description="진료 당일 오전 8시에 알림"
              value={settings.onDayOfEnabled}
              onToggle={(v) => handleToggle('onDayOfEnabled', v)}
              disabled={!settings.allNotificationsEnabled}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.lg,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    fontSize: sizes.font.md,
    color: colors.primary,
    fontWeight: sizes.fontWeight.medium,
    width: 48,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: sizes.font.lg,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.primary,
  },
  content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg },
  section: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    overflow: 'hidden',
  },
  sectionTitle: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    paddingHorizontal: sizes.spacing.lg,
    paddingTop: sizes.spacing.md,
    paddingBottom: sizes.spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.md,
    gap: sizes.spacing.md,
  },
  rowDisabled: { opacity: 0.45 },
  rowText: { flex: 1, gap: 2 },
  rowLabel: {
    fontSize: sizes.font.md,
    fontWeight: sizes.fontWeight.medium,
    color: colors.text.primary,
  },
  labelDisabled: { color: colors.text.secondary },
  rowDescription: {
    fontSize: sizes.font.xs,
    color: colors.text.secondary,
    lineHeight: 16,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: sizes.spacing.lg,
  },
  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  errorText: { fontSize: sizes.font.md, color: colors.text.secondary },
});
