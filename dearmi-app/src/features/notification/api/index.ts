import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';

export interface NotificationSettings {
  enabled: boolean;
  dayBefore: boolean;
  dayOf: boolean;
  medEnabled: boolean;
}

export interface RegisterTokenRequest {
  token: string;
  platform: 'ios' | 'android';
}

const notificationApi = {
  registerToken: (payload: RegisterTokenRequest) =>
    axiosInstance.post<ApiResponse<void>>('/api/v1/notifications/token', payload),

  getSettings: () =>
    axiosInstance.get<ApiResponse<NotificationSettings>>('/api/v1/notifications/settings'),

  updateSettings: (settings: NotificationSettings) =>
    axiosInstance.put<ApiResponse<NotificationSettings>>('/api/v1/notifications/settings', settings),
};

export default notificationApi;
