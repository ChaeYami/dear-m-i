import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse, PagedResponse } from '@/shared/types/api.types';

export interface NotificationSettings {
  enabled: boolean;
  dayBefore: boolean;
  dayOf: boolean;
  medEnabled: boolean;
}

export interface RegisterTokenRequest {
  fcmToken: string;
}

export type NotificationType = 'DAY_BEFORE' | 'DAY_OF' | 'CHECKIN' | 'MEDICATION';
export type NotificationTimeSlot = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'BEDTIME';

export interface NotificationItem {
  id: string;
  type: NotificationType;
  titleKey: string;
  titleParams: string[];
  bodyKey: string;
  bodyParams: string[];
  resourceId: string | null;
  timeSlot: NotificationTimeSlot | null;
  readAt: string | null;
  createdAt: string;
}

export interface UnreadCountResponse {
  count: number;
}

const notificationApi = {
  registerToken: (payload: RegisterTokenRequest) =>
    axiosInstance.post<ApiResponse<void>>('/api/v1/notifications/token', payload),

  getSettings: () =>
    axiosInstance.get<ApiResponse<NotificationSettings>>('/api/v1/notifications/settings'),

  updateSettings: (settings: NotificationSettings) =>
    axiosInstance.put<ApiResponse<NotificationSettings>>('/api/v1/notifications/settings', settings),

  getHistory: (page: number = 0, size: number = 20) =>
    axiosInstance.get<ApiResponse<PagedResponse<NotificationItem>>>('/api/v1/notifications', {
      params: { page, size },
    }),

  getUnreadCount: () =>
    axiosInstance.get<ApiResponse<UnreadCountResponse>>('/api/v1/notifications/unread-count'),

  markRead: (id: string) =>
    axiosInstance.patch<void>(`/api/v1/notifications/${id}/read`),

  markAllRead: () =>
    axiosInstance.patch<void>('/api/v1/notifications/read-all'),

  deleteOne: (id: string) =>
    axiosInstance.delete<void>(`/api/v1/notifications/${id}`),

  deleteAll: () =>
    axiosInstance.delete<void>('/api/v1/notifications'),
};

export default notificationApi;
