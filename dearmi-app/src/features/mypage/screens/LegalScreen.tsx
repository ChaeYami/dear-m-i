import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRoute, type RouteProp } from '@react-navigation/native';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import type { MyPageStackParamList } from '@/navigation/MyPageNavigator';

type Route = RouteProp<MyPageStackParamList, 'Legal'>;

const KIND_KEY: Record<string, string> = {
  terms: 'legal_terms',
  privacy: 'legal_privacy',
  licenses: 'legal_licenses',
};

export const LegalScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const { t } = useTranslation('settings');
  const kind = route.params?.kind ?? 'terms';
  const title = t(KIND_KEY[kind] ?? 'legal_terms');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScreenHeader variant="back" title={title} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[styles.placeholder, { color: colors.textSub, fontFamily: fontFamily.regular }]}>
          {t('legal_placeholder')}
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: sizes.spacing.lg,
  },
  placeholder: {
    fontSize: sizes.font.sm,
    lineHeight: 22,
  },
});
