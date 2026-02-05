import React from 'react';
import { View, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useTheme, sizes, fontFamily } from '@/shared/theme';

export const OfflineBanner: React.FC = () => {
  const { colors } = useTheme();
  const { isOffline } = useNetworkStatus();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View
      style={{
        backgroundColor: colors.warning,
        paddingHorizontal: sizes.spacing.md,
        paddingBottom: sizes.spacing.sm,
        paddingTop: insets.top + sizes.spacing.sm,
        alignItems: 'center',
      }}
    >
      <Text
        style={{
          fontFamily: fontFamily.medium,
          color: '#fff',
          fontSize: sizes.font.sm,
          textAlign: 'center',
        }}
      >
        {t('offline')}
      </Text>
    </View>
  );
};
