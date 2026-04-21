import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';

export interface SubscriptionStatus {
  id: number;
  plan: 'FREE' | 'PREMIUM';
  paymentProvider?: 'APP_STORE' | 'PLAY_STORE' | 'WEB';
  startedAt?: string;
  expiresAt?: string;
  autoRenew?: boolean;
}

export interface VerifyIapRequest {
  productId: string;               // com.dearmi.premium.{monthly|yearly}
  originalTransactionId: string;
  receiptData: string;             // iOS: JWS, Android: purchaseToken
}

export const subscriptionApi = {
  getStatus: () =>
    axiosInstance.get<ApiResponse<SubscriptionStatus>>('/api/v1/subscriptions'),

  verifyAppStore: (data: VerifyIapRequest) =>
    axiosInstance.post<ApiResponse<SubscriptionStatus>>(
      '/api/v1/subscriptions/verify/app-store',
      data
    ),

  verifyPlayStore: (data: VerifyIapRequest) =>
    axiosInstance.post<ApiResponse<SubscriptionStatus>>(
      '/api/v1/subscriptions/verify/play-store',
      data
    ),

  cancel: () =>
    axiosInstance.delete<ApiResponse<void>>('/api/v1/subscriptions/cancel'),
};
