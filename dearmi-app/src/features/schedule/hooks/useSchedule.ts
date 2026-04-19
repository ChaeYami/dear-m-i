import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { scheduleApi } from '@/features/schedule/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { GUEST_SCHEDULES } from '@/shared/mocks/guestData';
import type {
  HospitalSchedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from '@/shared/types/domain.types';

/** 월별 일정 목록 조회 — 게스트 모드면 해당 월에 속한 mock 일정만 반환 */
export const useMonthlySchedules = (year: number, month: number) => {
  const isGuest = useAuthStore((s) => s.isGuest);
  return useQuery({
    queryKey: [...QUERY_KEYS.monthlySchedules(year, month), isGuest ? 'guest' : 'user'],
    queryFn: async () => {
      if (isGuest) {
        return GUEST_SCHEDULES.filter((s) => {
          const d = new Date(s.scheduledAt);
          return d.getFullYear() === year && d.getMonth() + 1 === month;
        });
      }
      const { data } = await scheduleApi.getMonthlySchedules(year, month);
      return data.data ?? [];
    },
  });
};

/** 전체 일정 목록 조회 (캘린더 없이 목록만 보여주는 "전체" 필터용) */
export const useAllSchedules = (enabled: boolean = true) => {
  const isGuest = useAuthStore((s) => s.isGuest);
  return useQuery({
    queryKey: [...QUERY_KEYS.allSchedules(), isGuest ? 'guest' : 'user'],
    queryFn: async () => {
      if (isGuest) return GUEST_SCHEDULES;
      const { data } = await scheduleApi.getAllSchedules();
      return data.data ?? [];
    },
    enabled,
  });
};

/** 일정 상세 조회 */
export const useScheduleDetail = (id: number | string) => {
  const isGuest = useAuthStore((s) => s.isGuest);
  return useQuery({
    queryKey: [...QUERY_KEYS.schedule(id), isGuest ? 'guest' : 'user'],
    queryFn: async () => {
      if (isGuest) {
        return GUEST_SCHEDULES.find((s) => s.id === String(id)) ?? null;
      }
      const { data } = await scheduleApi.getScheduleDetail(id);
      return data.data ?? null;
    },
    enabled: !!id,
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
        id: `temp-${Date.now()}`, // 임시 id (서버 응답으로 교체됨)
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allSchedules() });
    },
  });
};

/** 일정 수정 (낙관적 업데이트) */
export const useUpdateSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateScheduleRequest }) =>
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
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allSchedules() });
    },
  });
};

/** 일정 삭제 */
export const useDeleteSchedule = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id }: { id: string; year: number; month: number }) =>
      scheduleApi.deleteSchedule(id),

    onSettled: (_data, _err, { year, month }) => {
      queryClient.invalidateQueries({
        queryKey: QUERY_KEYS.monthlySchedules(year, month),
      });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allSchedules() });
    },
  });
};
