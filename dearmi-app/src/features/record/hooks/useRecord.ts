import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { recordApi } from '@/features/record/api';
import type { CreateRecordRequest, UpdateRecordRequest } from '@/shared/types/domain.types';

/** 진료 기록 타임라인 무한 스크롤 (page 기반) */
export const useTimeline = () => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.timeline(),
    queryFn: async ({ pageParam }) => {
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
export const useRecordDetail = (id: number) => {
  return useQuery({
    queryKey: QUERY_KEYS.record(id),
    queryFn: async () => {
      const { data } = await recordApi.getRecord(id);
      return data.data ?? null;
    },
    enabled: id > 0,
  });
};

/**
 * 최근 일정 드롭다운 — direction에 따라 과거/미래 일정 반환
 * - PAST: RecordForm 진료 기록 작성용 (과거 일정 내림차순)
 * - FUTURE: PrepNoteForm 준비 메모 작성용 (다가오는 일정 오름차순)
 */
export const useRecentSchedules = (direction: 'PAST' | 'FUTURE' = 'PAST') => {
  return useQuery({
    queryKey: QUERY_KEYS.recentSchedules(direction),
    queryFn: async () => {
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
    mutationFn: ({ id, data }: { id: number; data: UpdateRecordRequest }) =>
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
    mutationFn: (id: number) => recordApi.deleteRecord(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline() });
    },
  });
};
