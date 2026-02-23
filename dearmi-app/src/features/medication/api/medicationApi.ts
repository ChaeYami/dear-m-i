import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  TodayMedication,
  MedicationSchedule,
  MedicationSlotGroup,
  CreateMedicationScheduleRequest,
  UpdateMedicationScheduleRequest,
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

  /** PUT /api/v1/medication-schedules/{id} — 복약 일정 수정 */
  update: (id: string, data: UpdateMedicationScheduleRequest) =>
    axiosInstance.put<ApiResponse<MedicationSchedule>>(`/api/v1/medication-schedules/${id}`, data),

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

  /** DELETE /api/v1/medication-schedules/{id}/logs — 복약 체크 취소 (상태 초기화) */
  uncheck: (scheduleId: string, date: string, timeSlot: string) =>
    axiosInstance.delete<ApiResponse<void>>(
      `/api/v1/medication-schedules/${scheduleId}/logs`,
      { params: { date, timeSlot } }
    ),

  /** GET /api/v1/medication-slot-groups — 사용자 그룹 목록 */
  listGroups: () =>
    axiosInstance.get<ApiResponse<MedicationSlotGroup[]>>('/api/v1/medication-slot-groups'),

  /** POST /api/v1/medication-slot-groups — 그룹 생성 */
  createGroup: (groupName: string) =>
    axiosInstance.post<ApiResponse<MedicationSlotGroup>>('/api/v1/medication-slot-groups', { groupName }),

  /** DELETE /api/v1/medication-slot-groups/{id} — 그룹 삭제 */
  deleteGroup: (groupId: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/v1/medication-slot-groups/${groupId}`),

  /** PUT /api/v1/medication-schedules/{id}/group — 슬롯들에 그룹 연결 */
  assignGroup: (scheduleId: string, timeSlots: string[], groupId: string | null) =>
    axiosInstance.put<ApiResponse<void>>(
      `/api/v1/medication-schedules/${scheduleId}/group`,
      { timeSlots, groupId }
    ),
};
