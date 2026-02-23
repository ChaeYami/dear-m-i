import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type { DailyNote, DailyNoteType, CreateDailyNoteRequest } from '@/shared/types/domain.types';

export const dailyNoteApi = {
  /** 스레드 메모 목록 (날짜 범위 + 타입 필터) */
  getList: (params?: { startDate?: string; endDate?: string; noteType?: DailyNoteType }) =>
    axiosInstance.get<ApiResponse<DailyNote[]>>('/api/v1/daily-notes', { params }),

  /** 스레드 메모 작성 */
  create: (data: CreateDailyNoteRequest) =>
    axiosInstance.post<ApiResponse<DailyNote>>('/api/v1/daily-notes', data),

  /** 스레드 메모 삭제 */
  delete: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/v1/daily-notes/${id}`),
};
