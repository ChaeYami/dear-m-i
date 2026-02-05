import React, { useMemo } from 'react';
import {
  View,
  Text,
  Switch,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,

} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import {
  useNotificationSettings,
  useUpdateNotificationSettings,
} from '../hooks/useNotificationSettings';
import type { NotificationSettings } from '../api';

// ─── 메인 화면 ────────────────────────────────────────────────────────────

export const NotificationSettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { data: settings, isLoading } = useNotificationSettings();
  const { mutate: updateSettings } = useUpdateNotificationSettings();

  const handleToggle = (key: keyof NotificationSettings, value: boolean) => {
    if (!settings) return;

    const next: NotificationSettings = { ...settings, [key]: value };

    // 전체 알림 OFF → 하위 설정도 모두 OFF
    if (key === 'enabled' && !value) {
      next.dayBefore = false;
      next.dayOf = false;
      next.medEnabled = false;
    }

    updateSettings(next);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      height: sizes.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.spacing.lg,
    },
    backBtn: {
      fontSize: sizes.font.md,
      color: colors.primary,
      fontFamily: fontFamily.medium,
      width: 48,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg },
    section: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.lg,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
    },
    sectionTitle: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.bold,
      color: colors.textSub,
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
      fontFamily: fontFamily.medium,
      color: colors.text,
    },
    labelDisabled: { color: colors.textSub },
    rowDescription: {
      fontSize: sizes.font.xs,
      color: colors.textSub,
      lineHeight: 16,
    },
    divider: {
      height: 1,
      backgroundColor: colors.divider,
      marginHorizontal: sizes.spacing.lg,
    },
    loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    errorText: { fontSize: sizes.font.md, color: colors.textSub },
  }), [colors]);

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
        trackColor={{ false: colors.divider, true: colors.primary + '80' }}
        thumbColor={value ? colors.primary : colors.textDisabled}
      />
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
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
              value={settings.enabled}
              onToggle={(v) => handleToggle('enabled', v)}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>진료 일정 알림</Text>
            <SettingRow
              label="하루 전 알림"
              description="진료 예정일 하루 전 오전 9시에 알림"
              value={settings.dayBefore}
              onToggle={(v) => handleToggle('dayBefore', v)}
              disabled={!settings.enabled}
            />
            <View style={styles.divider} />
            <SettingRow
              label="당일 알림"
              description="진료 당일 오전 8시에 알림"
              value={settings.dayOf}
              onToggle={(v) => handleToggle('dayOf', v)}
              disabled={!settings.enabled}
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>복약 알림</Text>
            <SettingRow
              label="복약 시간 알림"
              description="복약 일정에 설정한 시각에 알림"
              value={settings.medEnabled}
              onToggle={(v) => handleToggle('medEnabled', v)}
              disabled={!settings.enabled}
            />
          </View>
        </ScrollView>
      )}
    </SafeAreaView>
  );
};
