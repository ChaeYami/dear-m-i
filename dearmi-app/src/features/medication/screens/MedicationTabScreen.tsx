import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useResetStackOnTabFocus } from '@/shared/hooks/useResetStackOnTabFocus';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';
import { MedicationHomeScreen } from './MedicationHomeScreen';
import { MedicationHistoryScreen } from './MedicationHistoryScreen';

type Nav = StackNavigationProp<MedicationStackParamList, 'MedicationTab'>;
type MedSubTab = 'home' | 'history';

export const MedicationTabScreen: React.FC = () => {
  useResetStackOnTabFocus();
  const { colors } = useTheme();
  const { t } = useTranslation(['common', 'prescription']);
  const navigation = useNavigation<Nav>();
  const [activeTab, setActiveTab] = useState<MedSubTab>('home');
  const [isEditMode, setIsEditMode] = useState(false);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <ScreenHeader
        variant="tab"
        title={t('tab_medication')}
        hasNotification
        rightContent={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {activeTab === 'home' && (
              <TouchableOpacity
                onPress={() => setIsEditMode(v => !v)}
                hitSlop={8}
                style={[
                  styles.iconBtn,
                  { backgroundColor: isEditMode ? colors.primaryMuted : colors.surface, borderColor: isEditMode ? colors.primary : colors.cardBorder },
                ]}
              >
                <Ionicons
                  name={isEditMode ? 'close' : 'create-outline'}
                  size={18}
                  color={isEditMode ? colors.primary : colors.text}
                />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              onPress={() => navigation.navigate('PrescriptionList')}
              hitSlop={8}
              style={[styles.prescriptionBtn, { backgroundColor: colors.accentMuted, borderColor: colors.accent + '33' }]}
            >
              <Ionicons name="receipt-outline" size={16} color={colors.accent} />
              <Text style={[styles.prescriptionBtnText, { color: colors.accent }]}>{t('prescription:title')}</Text>
            </TouchableOpacity>
          </View>
        }
      />

      {/* Sub-tab switcher */}
      <View style={styles.subTabBar}>
        {(['home', 'history'] as const).map((tab) => {
          const label = tab === 'home' ? t('sub_tab_med_today') : t('sub_tab_med_history');
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
              onPress={() => { setActiveTab(tab); if (tab !== 'home') setIsEditMode(false); }}
              activeOpacity={0.75}
            >
              <Text
                key={active ? 'on' : 'off'}
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
        {activeTab === 'home' ? (
          <MedicationHomeScreen embedded editMode={isEditMode} onEditModeChange={setIsEditMode} />
        ) : (
          <MedicationHistoryScreen embedded />
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
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  prescriptionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: sizes.spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: sizes.radius.full,
    borderWidth: 1,
  },
  prescriptionBtnText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.semibold,
  },
});
