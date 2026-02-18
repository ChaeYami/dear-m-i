import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { medicationApi } from '@/features/medication/api/medicationApi';
import { haptics } from '@/shared/utils/haptics';
import type { CreateMedicationScheduleRequest, UpdateMedicationScheduleRequest, CheckMedicationRequest } from '@/shared/types/domain.types';

/** 특정 날짜(기본=오늘) 복약 현황 */
export const useTodayMedication = (date?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.todayMedication(date),
    queryFn: async () => {
      const { data } = await medicationApi.getToday(date);
      return data.data ?? { schedules: [] };
    },
    // 매분 알림이 오는 즉시성 데이터 — 전역 5분 stale 보다 짧게.
    staleTime: 30_000,
  });

/** 사용자의 모든 복약 일정 (캘린더 마킹용) */
export const useAllMedicationSchedules = (enabled: boolean = true) =>
  useQuery({
    queryKey: QUERY_KEYS.allMedicationSchedules(),
    queryFn: async () => {
      const { data } = await medicationApi.listAll();
      return data.data ?? [];
    },
    enabled,
  });

/** 복약 일정 등록 */
export const useCreateMedicationSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateMedicationScheduleRequest) => medicationApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMedication'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allMedicationSchedules() });
    },
  });
};

/** 복약 일정 수정 */
export const useUpdateMedicationSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMedicationScheduleRequest }) =>
      medicationApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMedication'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allMedicationSchedules() });
    },
  });
};

/** 복약 일정 삭제 */
export const useDeleteMedicationSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMedication'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allMedicationSchedules() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicationLogs() });
    },
  });
};

/** 복약 체크 (TAKEN/SKIPPED) */
export const useCheckMedication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, req }: { scheduleId: string; req: CheckMedicationRequest }) =>
      medicationApi.check(scheduleId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todayMedication'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicationLogs() });
      haptics.success();
    },
    onError: () => haptics.error(),
  });
};

/** 복약 이력 */
export const useMedicationHistory = (startDate?: string, endDate?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.medicationLogs(startDate, endDate),
    queryFn: async () => {
      const { data } = await medicationApi.getLogs(startDate, endDate);
      return data.data ?? { startDate: startDate ?? '', endDate: endDate ?? '', logs: [] };
    },
  });

/** 복약 완료율 통계 */
export const useMedicationStats = (startDate?: string, endDate?: string) =>
  useQuery({
    queryKey: QUERY_KEYS.medicationStats(startDate, endDate),
    queryFn: async () => {
      const { data } = await medicationApi.getStats(startDate, endDate);
      return data.data ?? null;
    },
  });
