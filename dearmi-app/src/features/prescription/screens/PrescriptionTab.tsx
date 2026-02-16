import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { useTranslation } from 'react-i18next';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import i18n from '@/locales/i18n';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import {
  usePagedPrescriptions,
  useDeletePrescription,
  useBulkDeletePrescriptions,
} from '@/features/prescription/hooks/usePrescription';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { MedicationStackParamList } from '@/navigation/MedicationNavigator';
import type { Prescription, PrescriptionMedication, OcrStatus } from '@/shared/types/domain.types';
import { navigationRef } from '@/navigation/navigationRef';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

type Nav = StackNavigationProp<MedicationStackParamList, 'PrescriptionList'>;

const formatDate = (dateStr?: string) => {
  if (!dateStr) return i18n.t('prescription:unknown_date');
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

const MedicationRow: React.FC<{
  med: PrescriptionMedication;
  onPress: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
}> = ({ med, onPress, colors }) => {
  const { t } = useTranslation('prescription');
  return (
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
        {[med.dosage, med.frequency, med.durationDays !== undefined ? t('duration_days_value', { count: med.durationDays }) : undefined]
          .filter(Boolean)
          .join(' · ') || t('no_info')}
      </Text>
    </View>
    <Ionicons name="chevron-forward" size={16} color={colors.textDisabled} />
  </AnimatedPressable>
  );
};

const MedicationDivider: React.FC<{ colors: any }> = ({ colors }) => (
  <View style={{ height: 1, backgroundColor: colors.divider, marginHorizontal: sizes.spacing.lg }} />
);

const PrescriptionCard: React.FC<{
  item: Prescription;
  expanded: boolean;
  selected: boolean;
  selectionMode: boolean;
  onToggle: () => void;
  onMedPress: (med: PrescriptionMedication) => void;
  onDelete: () => void;
  onViewOcr: () => void;
  onWriteRecord: () => void;
  onWriteSchedule: () => void;
  colors: ReturnType<typeof useTheme>['colors'];
  shadow: object;
}> = ({ item, expanded, selected, selectionMode, onToggle, onMedPress, onDelete, onViewOcr, onWriteRecord, onWriteSchedule, colors, shadow }) => {
  const { t } = useTranslation('prescription');
  const OCR_STATUS_CONFIG: Record<OcrStatus, { label: string; color: string; bg: string }> = {
    PENDING: { label: t('status_pending'), color: colors.warning, bg: colors.warningLight },
    PROCESSING: { label: t('status_processing'), color: colors.primary, bg: colors.primaryMuted },
    COMPLETED: { label: t('status_completed'), color: colors.success, bg: colors.successLight },
    FAILED: { label: t('status_failed'), color: colors.error, bg: colors.errorLight },
  };

  const statusCfg = item.ocrStatus ? OCR_STATUS_CONFIG[item.ocrStatus] : null;
  const isPending = item.ocrStatus === 'PENDING' || item.ocrStatus === 'PROCESSING';

  return (
    <AnimatedPressable onPress={onToggle} style={[
      {
        backgroundColor: colors.surface,
        borderRadius: sizes.radius.xxl,
        overflow: 'hidden',
        borderWidth: selectionMode && selected ? 2 : 0,
        borderColor: selectionMode && selected ? colors.primary : 'transparent',
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
        {/* 선택 모드 체크박스 */}
        {selectionMode && (
          <View style={{
            width: 24,
            height: 24,
            borderRadius: 12,
            borderWidth: 2,
            borderColor: selected ? colors.primary : colors.divider,
            backgroundColor: selected ? colors.primary : 'transparent',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: sizes.spacing.xs,
          }}>
            {selected && <Ionicons name="checkmark" size={14} color={colors.textInverse} />}
          </View>
        )}

        <View style={{ flex: 1, gap: sizes.spacing.xs }}>
          <Text style={{ fontSize: sizes.font.sm, fontFamily: fontFamily.regular, color: colors.textSub }}>
            {formatDate(item.prescribedAt)}
          </Text>
          <Text style={{ fontFamily: fontFamily.semibold, fontSize: sizes.font.md, color: colors.text }}>
            {item.hospitalName ?? t('unknown_hospital')}
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
              {t('medication_count', { count: item.medications.length })}
            </Text>
          </View>
          {!selectionMode && (
            <Ionicons
              name={expanded ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={colors.textDisabled}
            />
          )}
        </View>
      </View>

      {/* Accordion content — 선택 모드에서는 숨김 */}
      {!selectionMode && expanded && (
        <View style={{ borderTopWidth: 1, borderTopColor: colors.divider }}>
          {item.medications.length === 0 ? (
            <Text style={{
              fontSize: sizes.font.sm,
              fontFamily: fontFamily.regular,
              color: colors.textDisabled,
              textAlign: 'center',
              paddingVertical: sizes.spacing.lg,
            }}>
              {t('no_medications')}
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
            {/* 일정 추가 */}
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: sizes.spacing.sm + 2,
                borderRadius: sizes.radius.full,
                alignItems: 'center',
                backgroundColor: colors.primaryMuted,
              }}
              onPress={onWriteSchedule}
            >
              <Text style={{ fontFamily: fontFamily.medium, fontSize: sizes.font.sm, color: colors.primary }}>
                {t('add_schedule_btn')}
              </Text>
            </TouchableOpacity>

            {/* 기록하기 */}
            <TouchableOpacity
              style={{
                flex: 1,
                paddingVertical: sizes.spacing.sm + 2,
                borderRadius: sizes.radius.full,
                alignItems: 'center',
                backgroundColor: colors.primaryMuted,
              }}
              onPress={onWriteRecord}
            >
              <Text style={{ fontFamily: fontFamily.medium, fontSize: sizes.font.sm, color: colors.primary }}>
                {t('record_btn')}
              </Text>
            </TouchableOpacity>

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
                  {t('view_ocr_result')}
                </Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={{
                paddingVertical: sizes.spacing.sm + 2,
                paddingHorizontal: sizes.spacing.md,
                borderRadius: sizes.radius.full,
                alignItems: 'center',
                backgroundColor: colors.errorLight,
              }}
              onPress={onDelete}
            >
              <Text style={{ fontFamily: fontFamily.medium, fontSize: sizes.font.sm, color: colors.error }}>
                {i18n.t('common:delete')}
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
  const { t } = useTranslation(['prescription', 'common']);
  const tabBarSafeBottom = useTabBarSafeBottom();
  const queryClient = useQueryClient();
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    usePagedPrescriptions();
  const { mutate: deletePrescription } = useDeletePrescription();
  const { mutate: bulkDelete, isPending: isBulkDeleting } = useBulkDeletePrescriptions();

  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const shadow = softShadow(colors);

  // 포커스될 때마다 목록 새로고침
  useFocusEffect(
    useCallback(() => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prescriptions() });
    }, [queryClient])
  );

  const prescriptions = useMemo(
    () => data?.pages.flatMap((p) => p.content) ?? [],
    [data]
  );

  const toggleExpand = (id: string) => {
    if (selectionMode) {
      toggleSelect(id);
      return;
    }
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const enterSelectionMode = () => {
    setSelectionMode(true);
    setSelectedIds(new Set());
    setExpandedIds(new Set());
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === prescriptions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(prescriptions.map((p) => String(p.id))));
    }
  };

  const handleDelete = (item: Prescription) => {
    customAlert(t('prescription:delete_title'), t('prescription:delete_message'), [
      { text: t('common:cancel'), style: 'cancel' },
      { text: t('common:delete'), style: 'destructive', onPress: () => deletePrescription(String(item.id)) },
    ]);
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    customAlert(
      t('prescription:delete_selected_title', { count: selectedIds.size }),
      t('prescription:delete_selected_message'),
      [
        { text: t('common:cancel'), style: 'cancel' },
        {
          text: t('common:delete'),
          style: 'destructive',
          onPress: () => {
            bulkDelete([...selectedIds], {
              onSuccess: () => exitSelectionMode(),
            });
          },
        },
      ]
    );
  };

  if (isLoading) return <LoadingSpinner fullscreen />;

  const allSelected = prescriptions.length > 0 && selectedIds.size === prescriptions.length;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }}>
      {/* 헤더 */}
      <View style={{
        height: sizes.headerHeight,
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: sizes.spacing.lg,
      }}>
        <TouchableOpacity onPress={() => selectionMode ? exitSelectionMode() : navigation.goBack()} hitSlop={12}>
          <Ionicons name={selectionMode ? 'close' : 'chevron-back'} size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={{
          flex: 1,
          textAlign: 'center',
          fontSize: sizes.font.xl,
          fontFamily: fontFamily.bold,
          color: colors.text,
        }}>
          {selectionMode ? t('prescription:selected_count', { count: selectedIds.size }) : t('prescription:list_title')}
        </Text>
        {selectionMode ? (
          <TouchableOpacity onPress={toggleSelectAll} hitSlop={12}>
            <Text style={{ fontSize: sizes.font.sm, fontFamily: fontFamily.semibold, color: colors.primary }}>
              {allSelected ? t('prescription:deselect_all') : t('common:select_all')}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={enterSelectionMode} hitSlop={12}>
            <Text style={{ fontSize: sizes.font.sm, fontFamily: fontFamily.semibold, color: colors.primary }}>
              {t('prescription:select_btn')}
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={prescriptions}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={
          prescriptions.length === 0
            ? { flexGrow: 1 }
            : {
                padding: sizes.spacing.lg,
                gap: sizes.spacing.md,
                paddingBottom: selectionMode
                  ? 100
                  : tabBarSafeBottom + 20,
              }
        }
        renderItem={({ item }) => (
          <PrescriptionCard
            item={item}
            expanded={expandedIds.has(String(item.id))}
            selected={selectedIds.has(String(item.id))}
            selectionMode={selectionMode}
            onToggle={() => toggleExpand(String(item.id))}
            onMedPress={(med) =>
              navigation.navigate('MedicationDetail', {
                medicationId: med.id,
                medicationName: med.medicationName,
              })
            }
            onDelete={() => handleDelete(item)}
            onViewOcr={() =>
              navigation.navigate('OcrResult', { prescriptionId: String(item.id) })
            }
            onWriteRecord={() => {
              (navigationRef.current as any)?.navigate('Main', {
                screen: 'Care',
                params: {
                  screen: 'RecordForm',
                  params: { consultedAt: item.prescribedAt },
                },
              });
            }}
            onWriteSchedule={() => {
              // 1단계: Schedule 탭 전환 (ScheduleTab이 스택에 먼저 쌓이도록)
              (navigationRef.current as any)?.navigate('Main', { screen: 'Care' });
              // 2단계: 다음 프레임에 ScheduleForm push → [CareHome, ScheduleForm] 보장
              setTimeout(() => {
                (navigationRef.current as any)?.navigate('Main', {
                  screen: 'Care',
                  params: {
                    screen: 'ScheduleForm',
                    params: {
                      defaultDate: item.prescribedAt,
                      defaultHospitalName: item.hospitalName,
                    },
                  },
                });
              }, 0);
            }}
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
              {t('prescription:empty_title')}
            </Text>
            <Text style={{ fontSize: sizes.font.sm, fontFamily: fontFamily.regular, color: colors.textDisabled }}>
              {t('prescription:empty_desc')}
            </Text>
          </View>
        }
      />

      {/* 일반 모드: FAB */}
      {!selectionMode && (
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
      )}

      {/* 선택 모드: 하단 삭제 바 */}
      {selectionMode && (
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingHorizontal: sizes.spacing.lg,
          paddingVertical: sizes.spacing.md,
          paddingBottom: tabBarSafeBottom + sizes.spacing.md,
          backgroundColor: colors.surface,
          borderTopWidth: 1,
          borderTopColor: colors.divider,
          ...softShadow(colors),
        }}>
          <TouchableOpacity
            style={{
              height: sizes.buttonHeight.lg,
              borderRadius: sizes.radius.full,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: selectedIds.size === 0 ? colors.divider : colors.error,
            }}
            onPress={handleBulkDelete}
            disabled={selectedIds.size === 0 || isBulkDeleting}
            activeOpacity={0.8}
          >
            <Text style={{
              fontSize: sizes.font.md,
              fontFamily: fontFamily.bold,
              color: selectedIds.size === 0 ? colors.textDisabled : colors.textInverse,
            }}>
              {isBulkDeleting ? t('common:deleting') : selectedIds.size === 0 ? t('common:selection_required') : t('prescription:delete_count_btn', { count: selectedIds.size })}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};
