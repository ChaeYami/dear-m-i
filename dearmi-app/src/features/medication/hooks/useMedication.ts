import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { medicationApi } from '@/features/medication/api/medicationApi';
import type { CreateMedicationScheduleRequest, CheckMedicationRequest } from '@/shared/types/domain.types';

/** 오늘 복약 현황 */
export const useTodayMedication = () =>
  useQuery({
    queryKey: QUERY_KEYS.todayMedication(),
    queryFn: async () => {
      const { data } = await medicationApi.getToday();
      return data.data ?? { schedules: [] };
    },
  });

/** 복약 일정 등록 */
export const useCreateMedicationSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (req: CreateMedicationScheduleRequest) => medicationApi.create(req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayMedication() });
    },
  });
};

/** 복약 일정 삭제 */
export const useDeleteMedicationSchedule = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => medicationApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayMedication() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicationLogs() });
    },
  });
};

/** 복약 체크 (TAKEN/SKIPPED) — 낙관적 업데이트 */
export const useCheckMedication = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ scheduleId, req }: { scheduleId: string; req: CheckMedicationRequest }) =>
      medicationApi.check(scheduleId, req),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayMedication() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.medicationLogs() });
    },
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
