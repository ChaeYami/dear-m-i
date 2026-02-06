import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import {
  usePagedPrescriptions,
  useDeletePrescription,
} from '@/features/prescription/hooks/usePrescription';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { PrescriptionStackParamList } from '@/navigation/PrescriptionNavigator';
import type { Prescription, PrescriptionMedication, OcrStatus } from '@/shared/types/domain.types';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Nav = StackNavigationProp<PrescriptionStackParamList, 'PrescriptionTab'>;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return '날짜 미상';
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const MedicationRow: React.FC<{
  med: PrescriptionMedication;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ med, onPress, colors }) => (
  <AnimatedPressable
    onPress={onPress}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: sizes.spacing.md,
      paddingHorizontal: sizes.spacing.lg,
      gap: sizes.spacing.sm,
    }}
  >
    <View style={{
      width: 36,
      height: 36,
      borderRadius: 12,
      backgroundColor: colors.primaryMuted,
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <Ionicons name="medical-outline" size={16} color={colors.primary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={{ fontFamily: fontFamily.medium, fontSize: sizes.font.md, color: colors.text }}>
        {med.medicationName}
      </Text>
      <Text style={{ fontSize: sizes.font.xs, fontFamily: fontFamily.regular, color: colors.textSub, marginTop: 2 }}>
        {[med.dosage, med.frequency, med.durationDays !== undefined ? `${med.durationDays}일` : undefined]
          .filter(Boolean)
          .join(' · ') || '정보 없음'}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
  </AnimatedPressable>
);

const MedicationDivider: React.FC<{ colors: any }> = ({ colors }) => (
  <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: sizes.spacing.lg }} />
);

const PrescriptionCard: React.FC<{
  item: Prescription;
  expanded: boolean;
  onToggle: () => void;
  onMedPress: (med: PrescriptionMedication) => void;
  onDelete: () => void;
  onViewOcr: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  shadow: object;
}> = ({ item, expanded, onToggle, onMedPress, onDelete, onViewOcr, colors, shadow }) => {
  const OCR_STATUS_CONFIG: Record<OcrStatus, { label: string; color: string; bg: string }> = {
    PENDING: { label: '분석 대기', color: colors.warning, bg: colors.warningLight },
    PROCESSING: { label: '분석 중', color: colors.primary, bg: colors.primaryMuted },
    COMPLETED: { label: '분석 완료', color: colors.success, bg: colors.successLight },
    FAILED: { label: '인식 실패', color: colors.error, bg: colors.errorLight },
  };

  const statusCfg = item.ocrStatus ? OCR_STATUS_CONFIG[item.ocrStatus] : null;
  const isPending = item.ocrStatus === 'PENDING' || item.ocrStatus === 'PROCESSING';

  return (
    <AnimatedPressable onPress={onToggle} style={[
      {
        backgroundColor: colors.surface,
        borderRadius: sizes.radius.xxl,
        overflow: 'hidden',
      },
      shadow,
    ]}>
      {/* Card header */}
      <View style={{
        flexDirection: 'row',
        alignItems: 'center',
        padding: sizes.spacing.lg,
        gap: sizes.spacing.sm,
      }}>
        <View style={{ flex: 1, gap: sizes.spacing.xs }}>
          <Text style={{ fontSize: sizes.font.sm, fontFamily: fontFamily.regular, color: colors.textSub }}>
            {formatDate(item.prescribedAt)}
          </Text>
          <Text style={{ fontFamily: fontFamily.semibold, fontSize: sizes.font.md, color: colors.text }}>
            {item.hospitalName ?? '병원명 미상'}
          </Text>
        </View>
        <View style={{ alignItems: 'flex-end', gap: sizes.spacing.xs }}>
          {statusCfg && (
            <View style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: statusCfg.bg,
              paddingHorizontal: 12,
              paddingVertical: 4,
              borderRadius: sizes.radius.full,
              gap: 4,
            }}>
              {isPending && (
                <ActivityIndicator size="small" color={statusCfg.color} style={{ transform: [{ scale: 0.7 }] }} />
              )}
              <Text style={{ fontFamily: fontFamily.semibold, fontSize: sizes.font.xs, color: statusCfg.color }}>
                {statusCfg.label}
              </Text>
            </View>
          )}
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
            <Ionicons name="medical-outline" size={14} color={colors.textSub} />
            <Text style={{ fontSize: sizes.font.xs, fontFamily: fontFamily.regular, color: colors.textSub }}>
              {item.medications.length}종
            </Text>
          </View>
          <Ionicons
            name={expanded ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textDisabled}
          />
        </View>
      </View>

      {/* Accordion content */}
      {expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.divider }}>
          {item.medications.length === 0 ? (
            <Text style={{
              fontSize: sizes.font.sm,
              fontFamily: fontFamily.regular,
              color: colors.textDisabled,
              textAlign: 'center',
              paddingVertical: sizes.spacing.lg,
            }}>
              등록된 약품이 없습니다
            </Text>
          ) : (
            item.medications.map((med, idx) => (
              <React.Fragment key={med.id}>
                <MedicationRow
                  med={med}
                  onPress={() => onMedPress(med)}
                  colors={colors}
                />
                {idx < item.medications.length - 1 && <MedicationDivider colors={colors} />}
              </React.Fragment>
            ))
          )}

          {/* Action buttons */}
          <View style={{
            flexDirection: 'row',
            padding: sizes.spacing.md,
            gap: sizes.spacing.sm,
            backgroundColor: colors.background,
            borderBottomLeftRadius: sizes.radius.xxl,
            borderBottomRightRadius: sizes.radius.xxl,
          }}>
            {(item.ocrStatus === 'FAILED' || item.ocrStatus === 'COMPLETED') && (
              <TouchableOpacity
                style={{
                  flex: 1,
                  paddingVertical: sizes.spacing.sm + 2,
                  borderRadius: sizes.radius.full,
                  alignItems: 'center',
                  backgroundColor: colors.surface,
                  borderWidth: 1,
                  borderColor: colors.divider,
                }}
                onPress={onViewOcr}
              >
                <Text style={{ fontFamily: fontFamily.medium, fontSize: sizes.font.sm, color: colors.primary }}>
                  자동 인식 결과 보기
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: sizes.spacing.sm + 2,
                borderRadius: sizes.radius.full,
                alignItems: 'center',
                backgroundColor: colors.errorLight,
              }}
              onPress={onDelete}
            >
              <Text style={{ fontFamily: fontFamily.medium, fontSize: sizes.font.sm, color: colors.error }}>
                삭제
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </AnimatedPressable>
  );
};

export const PrescriptionTab: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const tabBarSafeBottom = useTabBarSafeBottom();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    usePagedPrescriptions();
  const { mutate: deletePrescription } = useDeletePrescription();

  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());
  const shadow = softShadow(colors);

  const prescriptions = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data]
  );

  const toggleExpand = (id: number) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const handleDelete = (item: Prescription) => {
    Alert.alert('처방전 삭제', '이 처방전을 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      { text: '삭제', style: 'destructive', onPress: () => deletePrescription(item.id) },
    ]);
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      <View style={{
        height: sizes.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: sizes.spacing.lg,
      }}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          textAlign: 'center',
          fontSize: sizes.font.xl,
          fontFamily: fontFamily.bold,
          color: colors.text,
        }}>
          처방 목록
        </Text>
        <View style={{ width: 24 }} />
      </View>

      <FlatList
        data={prescriptions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={
          prescriptions.length === 0
            ? { flexGrow: 1 }
            : { padding: sizes.spacing.lg, gap: sizes.spacing.md, paddingBottom: tabBarSafeBottom + 20 }
        }
        renderItem={({ item }) => (
          <PrescriptionCard
            item={item}
            expanded={expandedIds.has(item.id)}
            onToggle={() => toggleExpand(item.id)}
            onMedPress={(med) =>
              navigation.navigate('MedicationDetail', {
                medicationId: med.id,
                medicationName: med.medicationName,
              })
            }
            onDelete={() => handleDelete(item)}
            onViewOcr={() =>
              navigation.navigate('OcrResult', { prescriptionId: item.id })
            }
            colors={colors}
            shadow={shadow}
          />
        )}
        onEndReached={() => {
          if (hasNextPage && !isFetchingNextPage) fetchNextPage();
        }}
        onEndReachedThreshold={0.3}
        ListFooterComponent={
          isFetchingNextPage ? (
            <ActivityIndicator color={colors.primary} style={{ marginVertical: sizes.spacing.lg }} />
          ) : null
        }
        ListEmptyComponent={
          <View style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            gap: sizes.spacing.sm,
            paddingTop: 120,
          }}>
            <Text style={{ fontSize: sizes.font.lg, fontFamily: fontFamily.semibold, color: colors.textSub }}>
              처방전이 없어요
            </Text>
            <Text style={{ fontSize: sizes.font.sm, fontFamily: fontFamily.regular, color: colors.textDisabled }}>
              처방전을 촬영해서 등록해보세요
            </Text>
          </View>
        }
      />

      <TouchableOpacity
        style={{
          position: 'absolute',
          bottom: tabBarSafeBottom + sizes.spacing.md,
          right: sizes.spacing.xl,
          width: 56,
          height: 56,
          borderRadius: 28,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: colors.primary,
          shadowColor: colors.glassShadow,
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 1,
          shadowRadius: 12,
          elevation: 8,
        }}
        onPress={() => navigation.navigate('PrescriptionUpload')}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};
