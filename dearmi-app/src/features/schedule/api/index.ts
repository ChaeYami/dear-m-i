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

  getScheduleDetail: (id: number) =>
    axiosInstance.get<ApiResponse<HospitalSchedule>>(`/api/v1/schedules/${id}`),

  createSchedule: (data: CreateScheduleRequest) =>
    axiosInstance.post<ApiResponse<HospitalSchedule>>('/api/v1/schedules', data),

  updateSchedule: (id: number, data: UpdateScheduleRequest) =>
    axiosInstance.put<ApiResponse<HospitalSchedule>>(`/api/v1/schedules/${id}`, data),

  deleteSchedule: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/v1/schedules/${id}`),
};
