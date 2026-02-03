import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
import { LanguageSelector } from '@/shared/components/LanguageSelector';

export const LanguageSettingsScreen: React.FC = () => {
  const navigation = useNavigation();
  const { t } = useTranslation('settings');

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Text style={styles.backBtn}>{'<  '}{t('common:back')}</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('language_title')}</Text>
        <View style={{ width: 48 }} />
      </View>
      <View style={styles.content}>
        <LanguageSelector />
      </View>
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
    color: colors.text,
  },
  content: {
    padding: sizes.spacing.lg,
  },
});
