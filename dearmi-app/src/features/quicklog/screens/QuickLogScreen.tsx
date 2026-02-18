import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Pressable,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { customAlert } from '@/shared/components/CustomAlert';
import { softShadow } from '@/shared/theme/shadows';
import { useTodayCheckin, useCreateCheckin } from '@/features/checkin/hooks/useCheckin';
import { navigationRef } from '@/navigation/navigationRef';

/**
 * 메인 + FAB 에서 진입하는 빠른 입력 메뉴 (modal).
 * - 부작용 → SideEffectLog modal 로 이동
 * - 수면 → 인라인 mini 입력 → 오늘 체크인 sleepHours 만 업데이트
 * - 체크인 → CheckinForm 으로 이동
 */
export const QuickLogScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation(['sideeffect', 'checkin', 'common']);

  const [sleepInput, setSleepInput] = useState('');
  const [sleepInputOpen, setSleepInputOpen] = useState(false);

  const { data: todayState } = useTodayCheckin();
  const todayCheckin = (todayState as any)?.checkin;
  const { mutate: upsertCheckin, isPending: sleepSaving } = useCreateCheckin();

  const close = () => navigation.goBack();

  const goSideEffect = () => {
    navigation.replace('SideEffectLog');
  };

  const goCheckin = () => {
    close();
    setTimeout(() => {
      (navigationRef.current as any)?.navigate('Main', { screen: 'Checkin' });
    }, 50);
  };

  const saveSleep = () => {
    const hours = Number(sleepInput);
    if (!Number.isFinite(hours) || hours < 0 || hours > 24) {
      customAlert(t('common:invalid_input'), t('sideeffect:sleep_hours_label'));
      return;
    }
    upsertCheckin(
      {
        emotionScore: todayCheckin?.emotionScore ?? 5,
        sleepHours: hours,
        triggerTags: todayCheckin?.triggerTags,
        memo: todayCheckin?.memo,
        tookMedication: todayCheckin?.tookMedication,
      },
      {
        onSuccess: () => {
          close();
          setTimeout(() => customAlert(t('sideeffect:sleep_saved'), ''), 200);
        },
      },
    );
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      <Pressable style={styles.backdrop} onPress={close}>
        <View style={styles.sheet} onStartShouldSetResponder={() => true}>
          <View style={styles.handle} />
          <Text style={styles.title}>{t('sideeffect:quick_log_title')}</Text>

          <Action
            icon="medical-outline"
            title={t('sideeffect:quick_side_effect')}
            desc={t('sideeffect:quick_side_effect_desc')}
            color={colors.error}
            onPress={goSideEffect}
            styles={styles}
          />

          <Action
            icon="moon-outline"
            title={t('sideeffect:quick_sleep')}
            desc={t('sideeffect:quick_sleep_desc')}
            color={colors.secondary}
            onPress={() => setSleepInputOpen((v) => !v)}
            styles={styles}
          />

          {sleepInputOpen && (
            <View style={styles.sleepInputRow}>
              <TextInput
                style={styles.sleepInput}
                value={sleepInput}
                onChangeText={setSleepInput}
                placeholder={t('sideeffect:sleep_hours_label')}
                placeholderTextColor={colors.textDisabled}
                keyboardType="decimal-pad"
                autoFocus
              />
              <TouchableOpacity
                style={[styles.sleepSaveBtn, { backgroundColor: colors.primary }, sleepSaving && { opacity: 0.5 }]}
                onPress={saveSleep}
                disabled={sleepSaving}
              >
                <Ionicons name="checkmark" size={18} color={colors.textInverse} />
              </TouchableOpacity>
            </View>
          )}

          <Action
            icon="happy-outline"
            title={t('sideeffect:quick_checkin')}
            desc={t('sideeffect:quick_checkin_desc')}
            color={colors.primary}
            onPress={goCheckin}
            styles={styles}
          />
        </View>
      </Pressable>
    </SafeAreaView>
  );
};

interface ActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  color: string;
  onPress: () => void;
  styles: ReturnType<typeof makeStyles>;
}

const Action: React.FC<ActionProps> = ({ icon, title, desc, color, onPress, styles }) => (
  <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.7}>
    <View style={[styles.actionIcon, { backgroundColor: color + '20' }]}>
      <Ionicons name={icon} size={22} color={color} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={styles.actionTitle}>{title}</Text>
      <Text style={styles.actionDesc}>{desc}</Text>
    </View>
    <Ionicons name="chevron-forward" size={18} color="#999" />
  </TouchableOpacity>
);

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: 'transparent' },
    backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
    sheet: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: sizes.radius.xxl,
      borderTopRightRadius: sizes.radius.xxl,
      paddingHorizontal: sizes.spacing.lg,
      paddingTop: sizes.spacing.sm,
      paddingBottom: sizes.spacing.xl,
      gap: sizes.spacing.sm,
      ...softShadow(colors),
    },
    handle: {
      width: 40, height: 4, borderRadius: 2,
      backgroundColor: colors.divider, alignSelf: 'center', marginBottom: sizes.spacing.xs,
    },
    title: {
      fontSize: sizes.font.lg, fontFamily: fontFamily.bold, color: colors.text,
      marginBottom: sizes.spacing.xs,
    },
    action: {
      flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.md,
      paddingVertical: sizes.spacing.md,
      borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    actionIcon: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
    },
    actionTitle: {
      fontSize: sizes.font.md, fontFamily: fontFamily.semibold, color: colors.text,
    },
    actionDesc: { fontSize: sizes.font.sm, color: colors.textSub, marginTop: 2 },
    sleepInputRow: {
      flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm,
      paddingVertical: sizes.spacing.sm,
    },
    sleepInput: {
      flex: 1, height: 44,
      borderWidth: 1, borderColor: colors.divider, borderRadius: sizes.radius.md,
      paddingHorizontal: sizes.spacing.md, fontSize: sizes.font.md, color: colors.text,
      backgroundColor: colors.background,
    },
    sleepSaveBtn: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
    },
  });
