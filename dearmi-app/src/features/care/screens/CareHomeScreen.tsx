import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import { ScheduleTab } from '@/features/schedule/screens/ScheduleTab';
import { RecordTab } from '@/features/record/screens/RecordTab';

type CareSubTab = 'schedule' | 'record';

export const CareHomeScreen: React.FC = () => {
  useResetStackOnTabFocus();
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const [activeTab, setActiveTab] = useState<CareSubTab>('schedule');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        variant="tab"
        title={t('tab_care')}
        hasNotification
        searchScope={activeTab === 'schedule' ? 'PREPNOTE' : 'RECORD'}
      />

      {/* Sub-tab switcher */}
      <View style={styles.subTabBar}>
        {(['schedule', 'record'] as const).map((tab) => {
          const label = tab === 'schedule' ? t('sub_tab_schedule') : t('sub_tab_record');
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.subTabBtn,
                active
                  ? { backgroundColor: colors.primaryMuted, borderColor: colors.primary }
                  : { backgroundColor: colors.surface, borderColor: colors.divider },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.subTabText,
                  active
                    ? { color: colors.primary, fontFamily: fontFamily.bold }
                    : { color: colors.textSub, fontFamily: fontFamily.medium },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Tab content */}
      <View style={styles.content}>
        {activeTab === 'schedule' ? (
          <ScheduleTab embedded />
        ) : (
          <RecordTab embedded />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  subTabBar: {
    flexDirection: 'row',
    marginHorizontal: sizes.spacing.lg,
    marginTop: sizes.spacing.xs,
    marginBottom: sizes.spacing.md,
    gap: sizes.spacing.sm,
  },
  subTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: sizes.spacing.sm + 4,
    borderRadius: sizes.radius.full,
    borderWidth: 1.5,
  },
  subTabText: {
    fontSize: sizes.font.md,
  },
  content: { flex: 1 },
});
