import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';
import { changeLanguage } from '@/locales/i18n';

export const LanguageSelector: React.FC = () => {
  const { i18n, t } = useTranslation('settings');
  const currentLang = i18n.language;

  const options: Array<{ code: 'ko' | 'en'; label: string }> = [
    { code: 'ko', label: t('language_ko') },
    { code: 'en', label: t('language_en') },
  ];

  return (
    <View style={styles.container}>
      {options.map((opt) => {
        const isActive = currentLang === opt.code;
        return (
          <TouchableOpacity
            key={opt.code}
            style={[styles.option, isActive && styles.optionActive]}
            onPress={() => changeLanguage(opt.code)}
            activeOpacity={0.7}
          >
            <Text style={[styles.optionText, isActive && styles.optionTextActive]}>
              {opt.label}
            </Text>
            {isActive && <Ionicons name="checkmark" size={sizes.font.md} color={colors.primary} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.surfaceSolid,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.divider,
    overflow: 'hidden',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
    paddingVertical: sizes.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.divider,
  },
  optionActive: {
    backgroundColor: colors.primaryLight + '20',
  },
  optionText: {
    fontSize: sizes.font.md,
    color: colors.text,
  },
  optionTextActive: {
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
});
