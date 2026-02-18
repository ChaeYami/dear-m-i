import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { checkinApi } from '@/features/checkin/api/checkinApi';
import { haptics } from '@/shared/utils/haptics';
import type { CreateCheckinRequest } from '@/shared/types/domain.types';

/** 오늘 체크인 상태 */
export const useTodayCheckin = () => {
  return useQuery({
    queryKey: QUERY_KEYS.todayCheckin(),
    queryFn: async () => {
      const { data } = await checkinApi.getToday();
      return data.data ?? { checkedIn: false, checkin: null };
    },
    // 알림 → 체크인 → 즉시 반영이 핵심 사용자 경험
    staleTime: 30_000,
  });
};

/** 체크인 이력 */
export const useCheckinHistory = (startDate?: string, endDate?: string) => {
  return useQuery({
    queryKey: QUERY_KEYS.checkinHistory(startDate, endDate),
    queryFn: async () => {
      const { data } = await checkinApi.getHistory(startDate, endDate);
      return data.data ?? { content: [], isLimited: false };
    },
  });
};

/** 7일 요약 */
export const useCheckinSummary = () => {
  return useQuery({
    queryKey: QUERY_KEYS.checkinSummary(),
    queryFn: async () => {
      const { data } = await checkinApi.getSummary();
      return data.data ?? null;
    },
  });
};

/** 체크인 생성/수정 */
export const useCreateCheckin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateCheckinRequest) => checkinApi.createOrUpdate(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayCheckin() });
      queryClient.invalidateQueries({ queryKey: ['checkinHistory'] });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.checkinSummary() });
      haptics.success();
    },
    onError: () => haptics.error(),
  });
};
