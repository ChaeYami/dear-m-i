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
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import axiosInstance from '@/shared/api/axiosInstance';
import { SkeletonLoader } from '@/shared/components/SkeletonLoader';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';

type Nav = StackNavigationProp<MedicationStackParamList, 'MedicationScheduleDetail'>;
type Route = RouteProp<MedicationStackParamList, 'MedicationScheduleDetail'>;

interface DrugInfoResponse {
  scheduleId: string;
  drugName: string;
  dosage: string | null;
  drugEffect: string | null;
  drugUsage: string | null;
  drugCaution: string | null;
  manufacturer: string | null;
  itemSeq: string | null;
  drugInfoPending: boolean;
}

const useMedicationScheduleDrugInfo = (scheduleId: string) =>
  useQuery({
    queryKey: ['medicationScheduleDrugInfo', scheduleId],
    queryFn: async () => {
      const { data } = await axiosInstance.get<{ success: boolean; data: DrugInfoResponse }>(
        `/api/v1/medication-schedules/${scheduleId}/drug-info`
      );
      return data.data;
    },
    enabled: !!scheduleId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data?.drugInfoPending) return false;
      if (query.state.dataUpdateCount > 15) return false;
      return 2000;
    },
  });

const useRefreshDrugInfo = (scheduleId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await axiosInstance.post(`/api/v1/medication-schedules/${scheduleId}/refresh-drug-info`);
    },
    onSuccess: () => {
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['medicationScheduleDrugInfo', scheduleId] });
      }, 2000);
    },
  });
};

/** "## 제목\n내용" 형식을 섹션 배열로 파싱 */
const parseSections = (text: string | null): Array<{ title: string; content: string }> => {
  if (!text) return [];
  const sections: Array<{ title: string; content: string }> = [];

  // ## 로 시작하는 줄을 기준으로 분할
  const lines = text.split('\n');
  let currentTitle = '';
  let currentContent: string[] = [];

  const flush = () => {
    const content = currentContent.join('\n').trim();
    if (currentTitle || content) {
      sections.push({ title: currentTitle, content });
    }
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

export const MedicationScheduleDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { scheduleId, drugName } = useRoute<Route>().params;
  const tabBarSafeBottom = useTabBarSafeBottom();
  const { data: info, isLoading } = useMedicationScheduleDrugInfo(scheduleId);
  const { mutate: refreshDrugInfo, isPending: isRefreshing } = useRefreshDrugInfo(scheduleId);

  const styles = getStyles(colors, tabBarSafeBottom);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>{drugName}</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity
            onPress={() => navigation.navigate('MedicationForm', { scheduleId })}
            hitSlop={12}
          >
            <Ionicons name="create-outline" size={22} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => refreshDrugInfo()} disabled={isRefreshing} hitSlop={12}>
            <Ionicons name="refresh" size={22} color={isRefreshing ? colors.textDisabled : colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {isLoading ? (
          <View style={styles.skeletonWrap}>
            <SkeletonLoader width="100%" height={80} borderRadius={sizes.radius.lg} />
            <SkeletonLoader width="100%" height={120} borderRadius={sizes.radius.lg} />
            <SkeletonLoader width="100%" height={120} borderRadius={sizes.radius.lg} />
          </View>
        ) : info?.drugInfoPending ? (
          <View style={styles.statusWrap}>
            <Ionicons name="time-outline" size={48} color={colors.primaryLight} />
            <Text style={styles.statusTitle}>약품 정보를 조회 중이에요</Text>
            <Text style={styles.statusDesc}>잠시 후 자동으로 업데이트됩니다</Text>
          </View>
        ) : !info?.drugEffect && !info?.drugCaution ? (
          <View style={styles.statusWrap}>
            <Ionicons name="information-circle-outline" size={48} color={colors.textDisabled} />
            <Text style={styles.statusTitle}>약품 정보를 찾을 수 없어요</Text>
            <Text style={styles.statusDesc}>우측 상단 새로고침 버튼을 눌러보세요</Text>
          </View>
        ) : (
          <>
            {/* 약품 기본 정보 카드 */}
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="medical" size={20} color={colors.primary} />
                <Text style={styles.infoCardTitle}>{info?.drugName ?? drugName}</Text>
              </View>
              {info?.manufacturer && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>제조사</Text>
                  <Text style={styles.infoValue}>{info.manufacturer}</Text>
                </View>
              )}
              {info?.dosage && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>용량</Text>
                  <Text style={styles.infoValue}>{info.dosage}</Text>
                </View>
              )}
            </View>

            {/* 효능·효과 */}
            {info?.drugEffect && (
              <DrugSection
                icon="checkmark-circle"
                iconColor={colors.secondary}
                title="효능·효과"
                sections={parseSections(info.drugEffect)}
                defaultOpen
              />
            )}

            {/* 용법·용량 */}
            {info?.drugUsage && (
              <DrugSection
                icon="document-text"
                iconColor={colors.primary}
                title="용법·용량"
                sections={parseSections(info.drugUsage)}
              />
            )}

            {/* 주의사항 */}
            {info?.drugCaution && (
              <DrugSection
                icon="warning"
                iconColor={colors.error}
                title="주의사항"
                sections={parseSections(info.drugCaution)}
              />
            )}

            {/* 약학정보원 더보기 링크 */}
            <TouchableOpacity
              style={styles.nedrugLink}
              onPress={() => {
                const url = info?.itemSeq
                  ? `https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=${info.itemSeq}`
                  : `https://nedrug.mfds.go.kr/searchDrug?searchYn=true&page=1&drug_name=${encodeURIComponent(info?.drugName ?? drugName)}`;
                Linking.openURL(url);
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="open-outline" size={16} color={colors.primary} />
              <Text style={styles.nedrugLinkText}>약학정보원에서 전체 정보 보기</Text>
              <Ionicons name="chevron-forward" size={14} color={colors.textDisabled} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

/** 접기/펼치기 가능한 약품 정보 섹션 */
const DrugSection: React.FC<{
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  title: string;
  sections: Array<{ title: string; content: string }>;
  defaultOpen?: boolean;
  maxPreview?: number;
}> = ({ icon, iconColor, title, sections, defaultOpen = false, maxPreview }) => {
  const { colors } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const displaySections = isOpen ? sections : sections.slice(0, maxPreview ?? sections.length);
  const hasMore = !isOpen && maxPreview !== undefined && sections.length > maxPreview;

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

      {(isOpen || defaultOpen) && (
        <View style={styles.sectionBody}>
          {displaySections.map((s, i) => (
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
          {hasMore && (
            <TouchableOpacity onPress={() => setIsOpen(true)} style={styles.showMoreBtn}>
              <Text style={styles.showMoreText}>더보기 ({sections.length - (maxPreview ?? 0)}개 항목)</Text>
              <Ionicons name="chevron-down" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors'], tabBarSafeBottom: number) =>
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
    headerRight: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: sizes.spacing.md,
    },
    content: {
      padding: sizes.spacing.lg,
      gap: sizes.spacing.md,
      paddingBottom: tabBarSafeBottom + 20,
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
    // 기본 정보 카드
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
    // 섹션 카드 (효능/용법/주의)
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
    subsection: {
      gap: sizes.spacing.xs,
    },
    subsectionTitle: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.semibold,
      color: colors.text,
      lineHeight: 20,
    },
    cautionTitle: {
      color: colors.error,
    },
    subsectionContent: {
      fontSize: sizes.font.sm,
      color: colors.textSub,
      lineHeight: 21,
    },
    showMoreBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: sizes.spacing.xs,
      paddingVertical: sizes.spacing.sm,
      borderTopWidth: 1,
      borderTopColor: colors.divider,
    },
    showMoreText: {
      fontSize: sizes.font.sm,
      color: colors.primary,
      fontFamily: fontFamily.medium,
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
  });
