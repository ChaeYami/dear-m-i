import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { LanguageSelector } from '@/shared/components/LanguageSelector';

export const LanguageSettingsScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation('settings');

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
    content: {
      padding: sizes.spacing.lg,
    },
  }), [colors]);

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
