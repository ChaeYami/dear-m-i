import { useInfiniteQuery, useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { recordApi } from '@/features/record/api';
import type { CreateRecordRequest, UpdateRecordRequest } from '@/shared/types/domain.types';

/** 타임라인 무한 스크롤 (커서 기반) */
export const useTimeline = () => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.timeline(),
    queryFn: async ({ pageParam }) => {
      const { data } = await recordApi.getTimeline(pageParam as string | undefined);
      return data.data ?? { items: [], hasNext: false };
    },
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.nextCursor : undefined),
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

/** RecordForm 드롭다운: 최근 일정 */
export const useRecentSchedules = () => {
  return useQuery({
    queryKey: QUERY_KEYS.recentSchedules(),
    queryFn: async () => {
      const { data } = await recordApi.getRecentSchedules();
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
