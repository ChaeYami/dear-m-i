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

interface LegalSection {
  title: string;
  body: string;
}

interface LicenseItem {
  name: string;
  version: string;
  license: string;
  copyright?: string;
}

const LICENSES: LicenseItem[] = [
  { name: 'React', version: '19.1.0', license: 'MIT', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.' },
  { name: 'React Native', version: '0.81.5', license: 'MIT', copyright: 'Copyright (c) Meta Platforms, Inc. and affiliates.' },
  { name: 'Expo', version: '~54.0.33', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-auth-session', version: '~7.0.10', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-blur', version: '~15.0.8', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-constants', version: '~18.0.13', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-device', version: '~8.0.10', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-font', version: '~14.0.11', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-image-picker', version: '~17.0.10', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-linear-gradient', version: '~15.0.8', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-local-authentication', version: '~17.0.8', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-localization', version: '~17.0.8', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-notifications', version: '~0.32.16', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-secure-store', version: '~15.0.8', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-status-bar', version: '~3.0.9', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: 'expo-web-browser', version: '~15.0.10', license: 'MIT', copyright: 'Copyright (c) 2015-present 650 Industries, Inc.' },
  { name: '@react-navigation/native', version: '^7.2.2', license: 'MIT', copyright: 'Copyright (c) 2017 React Navigation Contributors' },
  { name: '@react-navigation/stack', version: '^7.8.9', license: 'MIT', copyright: 'Copyright (c) 2017 React Navigation Contributors' },
  { name: '@react-navigation/bottom-tabs', version: '^7.15.9', license: 'MIT', copyright: 'Copyright (c) 2017 React Navigation Contributors' },
  { name: '@tanstack/react-query', version: '^5.96.2', license: 'MIT', copyright: 'Copyright (c) 2021 Tanner Linsley' },
  { name: 'zustand', version: '^5.0.12', license: 'MIT', copyright: 'Copyright (c) 2019 Paul Henschel' },
  { name: 'axios', version: '^1.15.0', license: 'MIT', copyright: 'Copyright (c) 2014-present Matt Zabriskie & Collaborators' },
  { name: 'i18next', version: '^26.0.4', license: 'MIT', copyright: 'Copyright (c) 2022 i18next' },
  { name: 'react-i18next', version: '^17.0.2', license: 'MIT', copyright: 'Copyright (c) 2017 i18next' },
  { name: 'react-native-reanimated', version: '~4.1.1', license: 'MIT', copyright: 'Copyright (c) 2016 Software Mansion' },
  { name: 'react-native-gesture-handler', version: '~2.28.0', license: 'MIT', copyright: 'Copyright (c) 2016 Software Mansion' },
  { name: 'react-native-screens', version: '~4.16.0', license: 'MIT', copyright: 'Copyright (c) 2018 Software Mansion' },
  { name: 'react-native-safe-area-context', version: '~5.6.0', license: 'MIT', copyright: 'Copyright (c) 2019 Th3rdwave' },
  { name: 'react-native-mmkv', version: '^4.3.1', license: 'MIT', copyright: 'Copyright (c) 2020 Marc Rousavy' },
  { name: 'react-native-svg', version: '15.12.1', license: 'MIT', copyright: 'Copyright (c) 2015 Horcrux' },
  { name: 'react-native-calendars', version: '^1.1314.0', license: 'MIT', copyright: 'Copyright (c) 2017 Wix.com' },
  { name: 'react-native-chart-kit', version: '^6.12.0', license: 'MIT', copyright: 'Copyright (c) 2018 Indiez' },
  { name: 'react-native-iap', version: '^15.0.0', license: 'MIT', copyright: 'Copyright (c) 2018 dooboolab' },
  { name: '@react-native-community/netinfo', version: '11.4.1', license: 'MIT', copyright: 'Copyright (c) 2015-present, Facebook, Inc.' },
  { name: '@react-native-community/datetimepicker', version: '8.4.4', license: 'MIT', copyright: 'Copyright (c) 2019 React Native Community' },
  { name: '@quidone/react-native-wheel-picker', version: '^1.6.4', license: 'MIT', copyright: 'Copyright (c) 2023 quidone' },
  { name: 'react-native-worklets', version: '0.5.1', license: 'MIT', copyright: 'Copyright (c) 2022 Margelo' },
];

export const LegalScreen: React.FC = () => {
  const { colors } = useTheme();
  const route = useRoute<Route>();
  const { t } = useTranslation(['settings', 'legal']);
  const kind = route.params?.kind ?? 'terms';
  const title = t(`settings:${KIND_KEY[kind] ?? 'legal_terms'}`);

  const sections = (
    kind === 'privacy'
      ? (t('legal:privacy_sections', { returnObjects: true }) as LegalSection[])
      : kind === 'terms'
        ? (t('legal:terms_sections', { returnObjects: true }) as LegalSection[])
        : []
  );

  const mainTitle =
    kind === 'privacy'
      ? t('legal:main_title_privacy')
      : kind === 'terms'
        ? t('legal:main_title_terms')
        : t('legal:licenses_main_title');

  const addendum =
    kind === 'privacy' ? t('legal:addendum_privacy') : t('legal:addendum_terms');

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={['top']}
    >
      <ScreenHeader variant="back" title={title} />
      <ScrollView contentContainerStyle={styles.content}>
        {kind === 'licenses' ? (
          <>
            <Text style={[styles.mainTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>
              {mainTitle}
            </Text>
            <Text style={[styles.sectionBody, { color: colors.textSub, fontFamily: fontFamily.regular, marginBottom: sizes.spacing.lg }]}>
              {t('legal:licenses_intro')}
            </Text>
            {LICENSES.map((item) => (
              <View key={item.name} style={[styles.licenseItem, { borderBottomColor: colors.divider }]}>
                <View style={styles.licenseHeader}>
                  <Text style={[styles.licenseName, { color: colors.text, fontFamily: fontFamily.semibold }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.licenseBadge, { color: colors.primary, backgroundColor: colors.primaryMuted, fontFamily: fontFamily.medium }]}>
                    {item.license}
                  </Text>
                </View>
                <Text style={[styles.licenseVersion, { color: colors.textSub, fontFamily: fontFamily.regular }]}>
                  {item.version}
                </Text>
                {item.copyright && (
                  <Text style={[styles.licenseCopyright, { color: colors.textSub, fontFamily: fontFamily.regular }]}>
                    {item.copyright}
                  </Text>
                )}
              </View>
            ))}
          </>
        ) : kind === 'privacy' || kind === 'terms' ? (
          <>
            <Text style={[styles.mainTitle, { color: colors.text, fontFamily: fontFamily.bold }]}>
              {mainTitle}
            </Text>
            {sections.map((section) => (
              <View key={section.title} style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text, fontFamily: fontFamily.semibold }]}>
                  {section.title}
                </Text>
                <Text style={[styles.sectionBody, { color: colors.textSub, fontFamily: fontFamily.regular }]}>
                  {section.body}
                </Text>
              </View>
            ))}
            <View style={[styles.addendumBox, { borderTopColor: colors.divider }]}>
              <Text style={[styles.addendumTitle, { color: colors.text, fontFamily: fontFamily.semibold }]}>
                {t('legal:addendum_title')}
              </Text>
              <Text style={[styles.sectionBody, { color: colors.textSub, fontFamily: fontFamily.regular }]}>
                {addendum}
              </Text>
            </View>
          </>
        ) : (
          <Text style={[styles.placeholder, { color: colors.textSub, fontFamily: fontFamily.regular }]}>
            {t('settings:legal_placeholder')}
          </Text>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: {
    padding: sizes.spacing.lg,
    paddingBottom: sizes.spacing.xxl,
  },
  mainTitle: {
    fontSize: sizes.font.xl,
    marginBottom: sizes.spacing.lg,
  },
  section: {
    marginBottom: sizes.spacing.lg,
  },
  sectionTitle: {
    fontSize: sizes.font.md,
    marginBottom: sizes.spacing.sm,
  },
  sectionBody: {
    fontSize: sizes.font.sm,
    lineHeight: 22,
  },
  addendumBox: {
    marginTop: sizes.spacing.sm,
    paddingTop: sizes.spacing.lg,
    borderTopWidth: 1,
  },
  addendumTitle: {
    fontSize: sizes.font.md,
    marginBottom: sizes.spacing.sm,
  },
  licenseItem: {
    paddingVertical: sizes.spacing.md,
    borderBottomWidth: 1,
  },
  licenseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: sizes.spacing.sm,
  },
  licenseName: {
    flex: 1,
    fontSize: sizes.font.sm,
  },
  licenseBadge: {
    fontSize: sizes.font.xs,
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 2,
    borderRadius: sizes.radius.sm,
    overflow: 'hidden',
  },
  licenseVersion: {
    fontSize: sizes.font.xs,
    marginTop: 2,
  },
  licenseCopyright: {
    fontSize: sizes.font.xs,
    marginTop: 1,
    lineHeight: 16,
  },
  placeholder: {
    fontSize: sizes.font.sm,
    lineHeight: 22,
  },
});
