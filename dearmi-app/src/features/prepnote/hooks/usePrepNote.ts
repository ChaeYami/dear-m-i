import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { prepNoteApi } from '@/features/prepnote/api/prepNoteApi';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getGuestPrepNotes } from '@/shared/mocks/guestData';
import type { CreatePrepNoteRequest, UpdatePrepNoteRequest } from '@/shared/types/domain.types';

/** 전체 준비 메모 목록 */
export const usePrepNotes = () => {
  const isGuest = useAuthStore((s) => s.isGuest);
  return useQuery({
    queryKey: [...QUERY_KEYS.prepNotes(), isGuest ? 'guest' : 'user'],
    queryFn: async () => {
      if (isGuest) return getGuestPrepNotes();
      const { data } = await prepNoteApi.getList();
      return data.data ?? [];
    },
  });
};

/** 특정 일정의 준비 메모 목록 */
export const usePrepNotesBySchedule = (scheduleId?: string) => {
  const isGuest = useAuthStore((s) => s.isGuest);
  return useQuery({
    queryKey: [...QUERY_KEYS.prepNotesBySchedule(scheduleId ?? ''), isGuest ? 'guest' : 'user'],
    queryFn: async () => {
      if (isGuest) {
        return getGuestPrepNotes().filter((p) => p.scheduleId === scheduleId);
      }
      const { data } = await prepNoteApi.getList(scheduleId);
      return data.data ?? [];
    },
    enabled: Boolean(scheduleId),
  });
};

/** 준비 메모 생성 */
export const useCreatePrepNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreatePrepNoteRequest) => prepNoteApi.create(payload),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prepNotes() });
      if (variables.scheduleId) {
        queryClient.invalidateQueries({
          queryKey: QUERY_KEYS.prepNotesBySchedule(variables.scheduleId),
        });
      }
    },
  });
};

/** 준비 메모 수정 */
export const useUpdatePrepNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdatePrepNoteRequest }) =>
      prepNoteApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prepNotes() });
    },
  });
};

/** 준비 메모 삭제 */
export const useDeletePrepNote = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prepNoteApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prepNotes() });
    },
  });
};
