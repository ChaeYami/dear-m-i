import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  DailyCheckin,
  TodayCheckinResponse,
  CheckinHistoryResponse,
  CreateCheckinRequest,
  CheckinSummary,
} from '@/shared/types/domain.types';

export const checkinApi = {
  /** 오늘 체크인 상태 */
  getToday: () =>
    axiosInstance.get<ApiResponse<TodayCheckinResponse>>('/api/v1/checkins/today'),

  /** 체크인 이력 (날짜 범위) */
  getHistory: (startDate?: string, endDate?: string) =>
    axiosInstance.get<ApiResponse<CheckinHistoryResponse>>('/api/v1/checkins', {
      params: { startDate, endDate },
    }),

  /** 체크인 생성/수정 (UPSERT — 오늘 날짜 자동) */
  createOrUpdate: (data: CreateCheckinRequest) =>
    axiosInstance.post<ApiResponse<DailyCheckin>>('/api/v1/checkins', data),

  /** 최근 7일 요약 (RecordForm 용) */
  getSummary: () =>
    axiosInstance.get<ApiResponse<CheckinSummary>>('/api/v1/checkins/summary'),
};
