import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { changeLanguage } from '@/locales/i18n';

export const LanguageSelector: React.FC = () => {
  const { colors } = useTheme();
  const { i18n, t } = useTranslation('settings');
  const currentLang = i18n.language;

  const options: Array<{ code: 'ko' | 'en'; label: string }> = [
    { code: 'ko', label: t('language_ko') },
    { code: 'en', label: t('language_en') },
  ];

  return (
    <View
      style={{
        backgroundColor: colors.surface,
        borderRadius: sizes.radius.lg,
        borderWidth: 1,
        borderColor: colors.divider,
        overflow: 'hidden',
      }}
    >
      {options.map((opt) => {
        const isActive = currentLang === opt.code;
        return (
          <TouchableOpacity
            key={opt.code}
            style={[
              {
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                paddingHorizontal: sizes.spacing.lg,
                paddingVertical: sizes.spacing.md,
                borderBottomWidth: 1,
                borderBottomColor: colors.divider,
              },
              isActive && { backgroundColor: colors.primaryMuted },
            ]}
            onPress={() => changeLanguage(opt.code)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                {
                  fontFamily: fontFamily.regular,
                  fontSize: sizes.font.md,
                  color: colors.text,
                },
                isActive && {
                  fontFamily: fontFamily.semibold,
                  color: colors.primary,
                },
              ]}
            >
              {opt.label}
            </Text>
            {isActive && (
              <Ionicons name="checkmark" size={sizes.font.md} color={colors.primary} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};
