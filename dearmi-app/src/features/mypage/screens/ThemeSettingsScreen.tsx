import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily, type ThemeMode } from '@/shared/theme';

export const ThemeSettingsScreen: React.FC = () => {
  const { colors, mode, setMode } = useTheme();
  const navigation = useNavigation();
  const { t } = useTranslation('settings');

  const THEME_OPTIONS: Array<{ mode: ThemeMode; label: string; icon: keyof typeof Ionicons.glyphMap; desc: string }> = [
    { mode: 'light', label: t('theme_light'), icon: 'sunny-outline', desc: t('theme_light_desc') },
    { mode: 'dark', label: t('theme_dark'), icon: 'moon-outline', desc: t('theme_dark_desc') },
    { mode: 'system', label: t('theme_system'), icon: 'phone-portrait-outline', desc: t('theme_system_desc') },
  ];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View
        style={{
          height: sizes.headerHeight,
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: sizes.spacing.lg,
          gap: sizes.spacing.sm,
        }}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8}>
          <Ionicons name="chevron-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text
          style={{
            flex: 1,
            fontFamily: fontFamily.bold,
            fontSize: sizes.font.xl,
            color: colors.text,
          }}
        >
          {t('theme_settings_title')}
        </Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: sizes.spacing.lg, gap: sizes.spacing.sm }}>
        <View
          style={{
            backgroundColor: colors.surface,
            borderRadius: sizes.radius.lg,
            borderWidth: 1,
            borderColor: colors.divider,
            overflow: 'hidden',
          }}
        >
          {THEME_OPTIONS.map((opt, idx) => {
            const isActive = mode === opt.mode;
            return (
              <TouchableOpacity
                key={opt.mode}
                style={[
                  {
                    flexDirection: 'row',
                    alignItems: 'center',
                    paddingHorizontal: sizes.spacing.lg,
                    paddingVertical: sizes.spacing.md,
                    gap: sizes.spacing.md,
                  },
                  idx < THEME_OPTIONS.length - 1 && {
                    borderBottomWidth: 1,
                    borderBottomColor: colors.divider,
                  },
                  isActive && { backgroundColor: colors.primaryMuted },
                ]}
                onPress={() => setMode(opt.mode)}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={opt.icon}
                  size={22}
                  color={isActive ? colors.primary : colors.textSub}
                />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text
                    key={isActive ? 'on' : 'off'}
                    style={{
                      fontFamily: isActive ? fontFamily.semibold : fontFamily.regular,
                      fontSize: sizes.font.md,
                      color: isActive ? colors.primary : colors.text,
                    }}
                  >
                    {opt.label}
                  </Text>
                  <Text
                    style={{
                      fontFamily: fontFamily.regular,
                      fontSize: sizes.font.xs,
                      color: colors.textSub,
                    }}
                  >
                    {opt.desc}
                  </Text>
                </View>
                {isActive && (
                  <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};
