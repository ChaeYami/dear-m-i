import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { recordApi } from '@/features/record/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { GUEST_TIMELINE_PAGE, GUEST_RECORDS, GUEST_SCHEDULES } from '@/shared/mocks/guestData';
import type { CreateRecordRequest, UpdateRecordRequest } from '@/shared/types/domain.types';

/** 진료 기록 타임라인 무한 스크롤 (page 기반) */
export const useTimeline = () => {
  const isGuest = useAuthStore((s) => s.isGuest);
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.timeline(), isGuest ? 'guest' : 'user'],
    queryFn: async ({ pageParam }) => {
      if (isGuest) return GUEST_TIMELINE_PAGE;
      const { data } = await recordApi.getTimeline(pageParam as number, 20);
      return (
        data.data ?? {
          content: [],
          page: 0,
          size: 20,
          totalElements: 0,
          totalPages: 0,
          isLimited: false,
        }
      );
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage) => {
      const nextPage = lastPage.page + 1;
      return nextPage < lastPage.totalPages ? nextPage : undefined;
    },
  });
};

/** 상담 기록 상세 */
export const useRecordDetail = (id: string) => {
  const isGuest = useAuthStore((s) => s.isGuest);
  return useQuery({
    queryKey: [...QUERY_KEYS.record(id), isGuest ? 'guest' : 'user'],
    queryFn: async () => {
      if (isGuest) {
        return GUEST_RECORDS.find((r) => r.id === id) ?? null;
      }
      const { data } = await recordApi.getRecord(id);
      return data.data ?? null;
    },
    enabled: !!id,
  });
};

/**
 * 최근 일정 드롭다운 — direction에 따라 과거/미래 일정 반환
 * - PAST: RecordForm 진료 기록 작성용 (과거 일정 내림차순)
 * - FUTURE: PrepNoteForm 준비 메모 작성용 (다가오는 일정 오름차순)
 */
export const useRecentSchedules = (direction: 'PAST' | 'FUTURE' = 'PAST') => {
  const isGuest = useAuthStore((s) => s.isGuest);
  return useQuery({
    queryKey: [...QUERY_KEYS.recentSchedules(direction), isGuest ? 'guest' : 'user'],
    queryFn: async () => {
      if (isGuest) {
        const now = Date.now();
        return GUEST_SCHEDULES.filter((s) => {
          const t = new Date(s.scheduledAt).getTime();
          return direction === 'PAST' ? t < now : t >= now;
        }).sort((a, b) => {
          const ta = new Date(a.scheduledAt).getTime();
          const tb = new Date(b.scheduledAt).getTime();
          return direction === 'PAST' ? tb - ta : ta - tb;
        });
      }
      const { data } = await recordApi.getRecentSchedules(direction);
      return data.data ?? [];
    },
  });
};

/** 상담 기록 생성 */
export const useCreateRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateRecordRequest) => recordApi.createRecord(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline() });
    },
  });
};

/** 상담 기록 수정 */
export const useUpdateRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateRecordRequest }) =>
      recordApi.updateRecord(id, data),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.record(id) });
    },
  });
};

/** 상담 기록 삭제 */
export const useDeleteRecord = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => recordApi.deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline() });
    },
  });
};
