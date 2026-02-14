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
      <ScreenHeader variant="tab" title={t('tab_care')} hasNotification />

      {/* Sub-tab switcher */}
      <View style={[styles.subTabBar, { backgroundColor: colors.disabled }]}>
        {(['schedule', 'record'] as const).map((tab) => {
          const label = tab === 'schedule' ? t('sub_tab_schedule') : t('sub_tab_record');
          const active = activeTab === tab;
          return (
            <TouchableOpacity
              key={tab}
              style={[
                styles.subTabBtn,
                active && {
                  backgroundColor: colors.surface,
                  shadowColor: colors.glassShadow,
                  shadowOffset: { width: 0, height: 1 },
                  shadowOpacity: 1,
                  shadowRadius: 4,
                  elevation: 2,
                },
              ]}
              onPress={() => setActiveTab(tab)}
              activeOpacity={0.75}
            >
              <Text
                style={[
                  styles.subTabText,
                  { color: colors.textSub, fontFamily: fontFamily.medium },
                  active && { color: colors.primary, fontFamily: fontFamily.bold },
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
    marginBottom: sizes.spacing.sm,
    borderRadius: sizes.radius.full,
    padding: 2,
  },
  subTabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: sizes.spacing.xs + 2,
    borderRadius: sizes.radius.full,
  },
  subTabText: {
    fontSize: sizes.font.sm,
  },
  content: { flex: 1 },
});
