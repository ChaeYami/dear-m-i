import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse, RecordTimelinePage } from '@/shared/types/api.types';
import type {
  CounselingRecord,
  HospitalSchedule,
  CreateRecordRequest,
  UpdateRecordRequest,
} from '@/shared/types/domain.types';

export const recordApi = {
  /** 진료 기록 타임라인 (페이지 기반) */
  getTimeline: (page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<RecordTimelinePage>>('/api/v1/records', {
      params: { page, size },
    }),

  /** 상담 기록 상세 */
  getRecord: (id: string) =>
    axiosInstance.get<ApiResponse<CounselingRecord>>(`/api/v1/records/${id}`),

  /** 상담 기록 생성 */
  createRecord: (data: CreateRecordRequest) =>
    axiosInstance.post<ApiResponse<CounselingRecord>>('/api/v1/records', data),

  /** 상담 기록 수정 */
  updateRecord: (id: string, data: UpdateRecordRequest) =>
    axiosInstance.put<ApiResponse<CounselingRecord>>(`/api/v1/records/${id}`, data),

  /** 상담 기록 삭제 */
  deleteRecord: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/v1/records/${id}`),

  /**
   * RecordForm/PrepNoteForm 드롭다운용 최근 일정 목록
   * - direction=PAST: 과거 일정 (진료 기록 작성)
   * - direction=FUTURE: 다가오는 일정 (준비 메모 작성)
   */
  getRecentSchedules: (direction: 'PAST' | 'FUTURE' = 'PAST', limit = 10) =>
    axiosInstance.get<ApiResponse<HospitalSchedule[]>>('/api/v1/schedules/recent', {
      params: { direction, limit },
    }),
};
