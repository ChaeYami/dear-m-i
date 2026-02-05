import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  TodayMedication,
  MedicationSchedule,
  CreateMedicationScheduleRequest,
  CheckMedicationRequest,
  MedicationLogItem,
  MedicationHistory,
  MedicationStats,
} from '@/shared/types/domain.types';

export const medicationApi = {
  /** GET /api/v1/medication-schedules?date= — 특정 날짜(기본=오늘) 복약 현황 */
  getToday: (date?: string) =>
    axiosInstance.get<ApiResponse<TodayMedication>>('/api/v1/medication-schedules', {
      params: date ? { date } : undefined,
    }),

  /** GET /api/v1/medication-schedules/all — 사용자의 모든 복약 일정 (캘린더 마킹용) */
  listAll: () =>
    axiosInstance.get<ApiResponse<MedicationSchedule[]>>('/api/v1/medication-schedules/all'),

  /** POST /api/v1/medication-schedules — 복약 일정 등록 */
  create: (data: CreateMedicationScheduleRequest) =>
    axiosInstance.post<ApiResponse<MedicationSchedule>>('/api/v1/medication-schedules', data),

  /** DELETE /api/v1/medication-schedules/{id} — 복약 일정 삭제 */
  delete: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/v1/medication-schedules/${id}`),

  /** POST /api/v1/medication-schedules/{id}/logs — 복약 체크 (TAKEN/SKIPPED UPSERT) */
  check: (scheduleId: string, data: CheckMedicationRequest) =>
    axiosInstance.post<ApiResponse<MedicationLogItem>>(
      `/api/v1/medication-schedules/${scheduleId}/logs`,
      data
    ),

  /** GET /api/v1/medication-schedules/logs?startDate=&endDate= — 복약 이력 */
  getLogs: (startDate?: string, endDate?: string) =>
    axiosInstance.get<ApiResponse<MedicationHistory>>('/api/v1/medication-schedules/logs', {
      params: { startDate, endDate },
    }),

  /** GET /api/v1/medication-schedules/stats?startDate=&endDate= — 복약 완료율 통계 */
  getStats: (startDate?: string, endDate?: string) =>
    axiosInstance.get<ApiResponse<MedicationStats>>('/api/v1/medication-schedules/stats', {
      params: { startDate, endDate },
    }),
};
