import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { dailyNoteApi } from '@/features/checkin/api/dailyNoteApi';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import type { DailyNoteType, CreateDailyNoteRequest } from '@/shared/types/domain.types';

export const useDailyNotes = (startDate?: string, endDate?: string, noteType?: DailyNoteType) =>
  useQuery({
    queryKey: QUERY_KEYS.dailyNotes(startDate, endDate),
    queryFn: async () => {
      const res = await dailyNoteApi.getList({ startDate, endDate, noteType });
      return res.data.data ?? [];
    },
  });

export const useCreateDailyNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateDailyNoteRequest) =>
      dailyNoteApi.create(data).then((r) => r.data.data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNotes'] });
    },
  });
};

export const useDeleteDailyNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dailyNoteApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dailyNotes'] });
    },
  });
};
