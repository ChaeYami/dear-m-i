import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { SkeletonLoader } from '@/shared/components/SkeletonLoader';
import { useMedicationDetail } from '@/features/prescription/hooks/usePrescription';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import axiosInstance from '@/shared/api/axiosInstance';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';

type Nav = StackNavigationProp<MedicationStackParamList, 'MedicationDetail'>;
type Route = RouteProp<MedicationStackParamList, 'MedicationDetail'>;

/** "## 제목\n내용" 형식을 섹션 배열로 파싱 */
const parseSections = (text: string | null | undefined): Array<{ title: string; content: string }> => {
  if (!text) return [{ title: '', content: text ?? '' }];
  const sections: Array<{ title: string; content: string }> = [];
  const lines = text.split('\n');
  let currentTitle = '';
  let currentContent: string[] = [];

  const flush = () => {
    const content = currentContent.join('\n').trim();
    if (currentTitle || content) sections.push({ title: currentTitle, content });
    currentTitle = '';
    currentContent = [];
  };

  for (const line of lines) {
    if (line.startsWith('## ')) {
      flush();
      currentTitle = line.substring(3).trim();
    } else {
      currentContent.push(line);
    }
  }
  flush();
  return sections;
};

/** 접기/펼치기 가능한 약품 정보 섹션 */
const DrugSection: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  sections: Array<{ title: string; content: string }>;
  defaultOpen?: boolean;
}> = ({ icon, iconColor, title, sections, defaultOpen = false }) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const styles = getStyles(colors, 0);

  return (
    <View style={styles.sectionCard}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setIsOpen(!isOpen)}
        activeOpacity={0.8}
      >
        <View style={styles.sectionHeaderLeft}>
          <Ionicons name={icon} size={18} color={iconColor} />
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons name={isOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSub} />
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.sectionBody}>
          {sections.map((s, i) => (
            <View key={i} style={styles.subsection}>
              {s.title !== '' && (
                <Text style={[styles.subsectionTitle, iconColor === colors.error && styles.cautionTitle]}>
                  {s.title}
                </Text>
              )}
              {s.content !== '' && (
                <Text style={styles.subsectionContent}>{s.content}</Text>
              )}
            </View>
          ))}
        </View>
      )}
    </View>
  );
};

export const MedicationDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t } = useTranslation('prescription');
  const { medicationId, medicationName } = useRoute<Route>().params;
  const queryClient = useQueryClient();

  const { data: med, isLoading } = useMedicationDetail(medicationId);

  const { mutate: refreshDrugInfo, isPending: isRefreshing } = useMutation({
    mutationFn: () =>
      axiosInstance.post(`/api/v1/prescription-medications/${medicationId}/refresh-drug-info`),
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicationDetail(medicationId) });
      }, 2000);
    },
  });

  const isPending = !isLoading && med && !med.drugInfoFetchedAt;
  const noInfo = !isLoading && (!med || (!med.drugEffect && !med.drugCaution));
  const styles = getStyles(colors, 0);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {med?.medicationName ?? medicationName}
        </Text>
        <TouchableOpacity onPress={() => refreshDrugInfo()} disabled={isRefreshing} hitSlop={12}>
          <Ionicons name="refresh" size={22} color={isRefreshing ? colors.textDisabled : colors.primary} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonLoader width="100%" height={80} borderRadius={sizes.radius.lg} />
            <SkeletonLoader width="100%" height={120} borderRadius={sizes.radius.lg} />
            <SkeletonLoader width="100%" height={120} borderRadius={sizes.radius.lg} />
          </View>
        ) : isPending ? (
          <View style={styles.statusWrap}>
            <Ionicons name="time-outline" size={48} color={colors.primaryLight} />
            <Text style={styles.statusTitle}>{t('drug_loading_title')}</Text>
            <Text style={styles.statusDesc}>{t('drug_not_found_desc')}</Text>
          </View>
        ) : noInfo ? (
          <View style={styles.statusWrap}>
            <Ionicons name="information-circle-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.statusTitle}>{t('drug_not_found_title')}</Text>
            <Text style={styles.statusDesc}>{t('drug_not_found_desc')}</Text>
          </View>
        ) : (
          <>
            {/* 약품 기본 정보 카드 */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="medical" size={20} color={colors.primary} />
                <Text style={styles.infoCardTitle}>{med?.medicationName ?? medicationName}</Text>
              </View>
              {med?.manufacturer && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('manufacturer')}</Text>
                  <Text style={styles.infoValue}>{med.manufacturer}</Text>
                </View>
              )}
              {med?.dosage && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('dosage_label')}</Text>
                  <Text style={styles.infoValue}>{med.dosage}</Text>
                </View>
              )}
              {med?.singleDose && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('dose_per_time_label')}</Text>
                  <Text style={styles.infoValue}>{med.singleDose}</Text>
                </View>
              )}
              {med?.frequency && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('frequency_label')}</Text>
                  <Text style={styles.infoValue}>{med.frequency}</Text>
                </View>
              )}
              {med?.durationDays !== undefined && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>{t('duration_label')}</Text>
                  <Text style={styles.infoValue}>{t('duration_days_value', { count: med.durationDays })}</Text>
                </View>
              )}
            </View>

            {/* 효능·효과 */}
            {med?.drugEffect && (
              <DrugSection
                icon="checkmark-circle"
                iconColor={colors.secondary}
                title={t('drug_effect')}
                sections={parseSections(med.drugEffect)}
                defaultOpen
              />
            )}

            {/* 주의사항 */}
            {med?.drugCaution && (
              <DrugSection
                icon="warning"
                iconColor={colors.error}
                title={t('drug_caution')}
                sections={parseSections(med.drugCaution)}
              />
            )}

            {/* 약학정보원 더보기 링크 */}
            <TouchableOpacity
              style={styles.nedrugLink}
              onPress={() => {
                const name = med?.medicationName ?? medicationName;
                Linking.openURL(
                  `https://nedrug.mfds.go.kr/searchDrug?searchYn=true&page=1&drug_name=${encodeURIComponent(name)}`
                );
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={styles.nedrugLinkText}>{t('drug_nedrug_link')}</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} />
            </TouchableOpacity>

            {/* 출처 표기 + 의료 면책 (App Store 4.1) */}
            <View style={styles.attribution}>
              <View style={styles.attributionRow}>
                <Ionicons name="information-circle-outline" size={14} color={colors.textSub} />
                <Text style={styles.attributionSource}>{t('drug_info_source')}</Text>
              </View>
              <Text style={styles.attributionDisclaimer}>{t('drug_info_disclaimer')}</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors'], _tabBarSafeBottom: number) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      height: sizes.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.spacing.lg,
      gap: sizes.spacing.sm,
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
      gap: sizes.spacing.md,
      paddingBottom: 40,
    },
    skeletonWrap: { gap: sizes.spacing.md },
    statusWrap: {
      alignItems: 'center',
      paddingTop: 80,
      gap: sizes.spacing.md,
    },
    statusTitle: {
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
    },
    statusDesc: {
      fontSize: sizes.font.sm,
      color: colors.textDisabled,
    },
    infoCard: {
      backgroundColor: colors.primaryLight + '15',
      borderRadius: sizes.radius.xl,
      padding: sizes.spacing.lg,
      gap: sizes.spacing.sm,
      borderWidth: 1,
      borderColor: colors.primaryLight + '30',
    },
    infoCardHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.sm,
      marginBottom: sizes.spacing.xs,
    },
    infoCardTitle: {
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
      color: colors.text,
      flex: 1,
    },
    infoRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    infoLabel: {
      fontSize: sizes.font.sm,
      color: colors.textSub,
    },
    infoValue: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.medium,
      color: colors.text,
    },
    sectionCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xl,
      borderWidth: 1,
      borderColor: colors.divider,
      overflow: 'hidden',
    },
    sectionHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: sizes.spacing.md,
    },
    sectionHeaderLeft: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.sm,
    },
    sectionTitle: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    sectionBody: {
      paddingHorizontal: sizes.spacing.md,
      paddingBottom: sizes.spacing.md,
      gap: sizes.spacing.md,
    },
    subsection: { gap: sizes.spacing.xs },
    subsectionTitle: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.text,
      lineHeight: 20,
    },
    cautionTitle: { color: colors.error },
    subsectionContent: {
      fontSize: sizes.font.sm,
      color: colors.textSub,
      lineHeight: 21,
    },
    nedrugLink: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sizes.spacing.sm,
      backgroundColor: colors.primaryLight + '15',
      borderRadius: sizes.radius.lg,
      paddingVertical: sizes.spacing.md,
      borderWidth: 1,
      borderColor: colors.primaryLight + '30',
    },
    nedrugLinkText: {
      fontSize: sizes.font.sm,
      color: colors.primary,
      fontFamily: fontFamily.semibold,
      flex: 1,
    },
    attribution: {
      marginTop: sizes.spacing.xs,
      paddingHorizontal: sizes.spacing.sm,
      gap: 4,
    },
    attributionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 4,
    },
    attributionSource: {
      fontSize: sizes.font.xs,
      color: colors.textSub,
      fontFamily: fontFamily.medium,
    },
    attributionDisclaimer: {
      fontSize: sizes.font.xs,
      color: colors.textDisabled,
      lineHeight: 16,
    },
  });
