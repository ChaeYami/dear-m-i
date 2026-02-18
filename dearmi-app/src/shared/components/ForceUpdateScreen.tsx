import React from 'react';
import { Linking, StyleSheet, Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';

/**
 * 강제 업데이트 게이트 화면.
 * RootNavigator 가 forceUpdate=true 응답을 받으면 NavigationContainer 대신 이 화면을 마운트한다.
 * 어떤 인터랙션으로도 우회 불가 — 스토어 이동만 가능.
 */
export const ForceUpdateScreen: React.FC<{
  message?: string;
  storeUrl: string;
}> = ({ message, storeUrl }) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.inner}>
        <View style={[styles.iconWrap, { backgroundColor: colors.primaryLight + '40' }]}>
          <Ionicons name="cloud-download-outline" size={48} color={colors.primary} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>{t('update_required')}</Text>
        <Text style={[styles.message, { color: colors.textSub }]}>
          {message || t('update_message')}
        </Text>
        <Text style={[styles.subtitle, { color: colors.textDisabled }]}>
          {t('update_subtitle')}
        </Text>

        <AnimatedPressable
          onPress={() => Linking.openURL(storeUrl)}
          style={[styles.button, { backgroundColor: colors.primary }]}
        >
          <Ionicons name="open-outline" size={18} color={colors.textInverse} />
          <Text style={[styles.buttonText, { color: colors.textInverse }]}>
            {t('update_open_store')}
          </Text>
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sizes.spacing.xl,
    gap: sizes.spacing.md,
  },
  iconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sizes.spacing.lg,
  },
  title: {
    fontSize: sizes.font.xxl,
    fontFamily: fontFamily.bold,
  },
  message: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.medium,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    marginBottom: sizes.spacing.xl,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.xl,
    paddingVertical: sizes.spacing.md,
    borderRadius: sizes.radius.full,
    marginTop: sizes.spacing.md,
  },
  buttonText: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.bold,
  },
});
