import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { scheduleApi } from '@/features/schedule/api';
import type {
  HospitalSchedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from '@/shared/types/domain.types';

/** 월별 일정 목록 조회 */
export const useMonthlySchedules = (year: number, month: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.monthlySchedules(year, month),
    queryFn: async () => {
      const { data } = await scheduleApi.getMonthlySchedules(year, month);
      return data.data ?? [];
    },
  });
};

/** 일정 상세 조회 */
export const useScheduleDetail = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.schedule(id),
    queryFn: async () => {
      const { data } = await scheduleApi.getScheduleDetail(id);
      return data.data ?? null;
    },
    enabled: id > 0,
  });
};

/** 일정 생성 (낙관적 업데이트) */
export const useCreateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: CreateScheduleRequest) => scheduleApi.createSchedule(payload),

    onMutate: async (payload) => {
      const date = new Date(payload.scheduledAt);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const queryKey = QUERY_KEYS.monthlySchedules(year, month);

      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<HospitalSchedule[]>(queryKey);

      const optimistic: HospitalSchedule = {
        id: -Date.now(), // 임시 id (서버 응답으로 교체됨)
        ...payload,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      queryClient.setQueryData<HospitalSchedule[]>(queryKey, (old = []) => [
        ...old,
        optimistic,
      ]);

      return { previous, year, month };
    },

    onError: (_err, _vars, context) => {
      if (context) {
        queryClient.setQueryData(
          QUERY_KEYS.monthlySchedules(context.year, context.month),
          context.previous
        );
      }
    },

    onSettled: (_data, _err, variables) => {
      const date = new Date(variables.scheduledAt);
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.monthlySchedules(date.getFullYear(), date.getMonth() + 1),
      });
    },
  });
};

/** 일정 수정 (낙관적 업데이트) */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateScheduleRequest }) =>
      scheduleApi.updateSchedule(id, data),

    onMutate: async ({ id, data }) => {
      // 상세 캐시 업데이트
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.schedule(id) });
      const previousDetail = queryClient.getQueryData<HospitalSchedule>(QUERY_KEYS.schedule(id));

      queryClient.setQueryData<HospitalSchedule>(QUERY_KEYS.schedule(id), (old) =>
        old ? { ...old, ...data, updatedAt: new Date().toISOString() } : old
      );

      // 월별 목록 캐시도 업데이트 (scheduledAt 기준 월)
      const targetDate = data.scheduledAt ?? previousDetail?.scheduledAt;
      if (!targetDate) return { previousDetail, year: 0, month: 0 };

      const date = new Date(targetDate);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const listKey = QUERY_KEYS.monthlySchedules(year, month);

      await queryClient.cancelQueries({ queryKey: listKey });
      const previousList = queryClient.getQueryData<HospitalSchedule[]>(listKey);

      queryClient.setQueryData<HospitalSchedule[]>(listKey, (old = []) =>
        old.map((s) =>
          s.id === id ? { ...s, ...data, updatedAt: new Date().toISOString() } : s
        )
      );

      return { previousDetail, previousList, year, month };
    },

    onError: (_err, { id }, context) => {
      if (!context) return;
      if (context.previousDetail) {
        queryClient.setQueryData(QUERY_KEYS.schedule(id), context.previousDetail);
      }
      if (context.previousList && context.year) {
        queryClient.setQueryData(
          QUERY_KEYS.monthlySchedules(context.year, context.month),
          context.previousList
        );
      }
    },

    onSettled: (_data, _err, { id, data }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.schedule(id) });
      // scheduledAt이 변경됐을 수 있으므로 서버에서 다시 fetch
      const detail = queryClient.getQueryData<HospitalSchedule>(QUERY_KEYS.schedule(id));
      const targetDate = data.scheduledAt ?? detail?.scheduledAt;
      if (targetDate) {
        const d = new Date(targetDate);
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.monthlySchedules(d.getFullYear(), d.getMonth() + 1),
        });
      }
    },
  });
};

/** 일정 삭제 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: number; year: number; month: number }) =>
      scheduleApi.deleteSchedule(id),

    onSettled: (_data, _err, { year, month }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.monthlySchedules(year, month),
      });
    },
  });
};
