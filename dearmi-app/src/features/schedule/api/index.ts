import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  HospitalSchedule,
  CreateScheduleRequest,
  UpdateScheduleRequest,
} from '@/shared/types/domain.types';

export const scheduleApi = {
  getMonthlySchedules: (year: number, month: number) =>
    axiosInstance.get<ApiResponse<HospitalSchedule[]>>('/api/v1/schedules', {
      params: { year, month },
    }),

  /** 전체 일정 (캘린더 없이 목록만 보여주는 "전체" 필터용) */
  getAllSchedules: () =>
    axiosInstance.get<ApiResponse<HospitalSchedule[]>>('/api/v1/schedules/all'),

  getScheduleDetail: (id: number | string) =>
    axiosInstance.get<ApiResponse<HospitalSchedule>>(`/api/v1/schedules/${id}`),

  createSchedule: (data: CreateScheduleRequest) =>
    axiosInstance.post<ApiResponse<HospitalSchedule>>('/api/v1/schedules', data),

  updateSchedule: (id: string, data: UpdateScheduleRequest) =>
    axiosInstance.put<ApiResponse<HospitalSchedule>>(`/api/v1/schedules/${id}`, data),

  deleteSchedule: (id: string) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/v1/schedules/${id}`),
};
