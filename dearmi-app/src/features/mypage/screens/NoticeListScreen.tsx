import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';

export const NoticeListScreen: React.FC = () => {
  const { colors } = useTheme();
  const { t } = useTranslation('settings');
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScreenHeader variant="back" title={t('menu_notice')} />
      <View style={styles.empty}>
        <Ionicons name="megaphone-outline" size={40} color={colors.textDisabled} />
        <Text style={[styles.emptyText, { color: colors.textSub, fontFamily: fontFamily.medium }]}>
          {t('notice_empty')}
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: sizes.spacing.md,
  },
  emptyText: { fontSize: sizes.font.md },
});
