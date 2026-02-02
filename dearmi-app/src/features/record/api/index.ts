import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse, TimelineResponse } from '@/shared/types/api.types';
import type {
  CounselingRecord,
  HospitalSchedule,
  CreateRecordRequest,
  UpdateRecordRequest,
} from '@/shared/types/domain.types';

export const recordApi = {
  /** 타임라인 (상담 기록 + 처방전 혼합, 커서 기반 페이지네이션) */
  getTimeline: (cursor?: string, limit = 20) =>
    axiosInstance.get<ApiResponse<TimelineResponse>>('/api/v1/timeline', {
      params: { cursor, limit },
    }),

  /** 상담 기록 상세 */
  getRecord: (id: number) =>
    axiosInstance.get<ApiResponse<CounselingRecord>>(`/api/v1/records/${id}`),

  /** 상담 기록 생성 */
  createRecord: (data: CreateRecordRequest) =>
    axiosInstance.post<ApiResponse<CounselingRecord>>('/api/v1/records', data),

  /** 상담 기록 수정 */
  updateRecord: (id: number, data: UpdateRecordRequest) =>
    axiosInstance.put<ApiResponse<CounselingRecord>>(`/api/v1/records/${id}`, data),

  /** 상담 기록 삭제 */
  deleteRecord: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/v1/records/${id}`),

  /** RecordForm 드롭다운용 최근 일정 목록 */
  getRecentSchedules: () =>
    axiosInstance.get<ApiResponse<HospitalSchedule[]>>('/api/v1/schedules/recent'),
};
