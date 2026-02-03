import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  PrepNote,
  CreatePrepNoteRequest,
  UpdatePrepNoteRequest,
} from '@/shared/types/domain.types';

export const prepNoteApi = {
  /** 준비 메모 목록 (scheduleId 있으면 해당 일정만, 없으면 전체) */
  getList: (scheduleId?: string) =>
    axiosInstance.get<ApiResponse<PrepNote[]>>('/api/v1/prep-notes', {
      params: scheduleId ? { scheduleId } : undefined,
    }),

  /** 준비 메모 작성 */
  create: (data: CreatePrepNoteRequest) =>
    axiosInstance.post<ApiResponse<PrepNote>>('/api/v1/prep-notes', data),

  /** 준비 메모 수정 */
  update: (id: string, data: UpdatePrepNoteRequest) =>
    axiosInstance.put<ApiResponse<PrepNote>>(`/api/v1/prep-notes/${id}`, data),

  /** 준비 메모 삭제 */
  delete: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/v1/prep-notes/${id}`),
};
