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
  originalTransactionId: string;
  receiptData: string;
}

export type WebPlanType = 'MONTHLY' | 'YEARLY';

export interface PreparePaymentResponse {
  orderId: string;
  amount: number;
  customerName: string;
  customerEmail: string;
}

export interface ConfirmPaymentRequest {
  orderId: string;
  paymentKey: string;
  amount: number;
}

export interface ConfirmPaymentResponse {
  success: boolean;
  plan: string;
  expiresAt: string;
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

  /** 웹 결제 준비 (Android + 웹) — payments_temp에 임시 저장 */
  preparePayment: (planType: WebPlanType) =>
    axiosInstance.post<ApiResponse<PreparePaymentResponse>>(
      '/api/v1/payments/prepare',
      { planType }
    ),

  /** 웹 결제 승인 확인 (토스페이먼츠 결제 완료 후) */
  confirmPayment: (data: ConfirmPaymentRequest) =>
    axiosInstance.post<ApiResponse<ConfirmPaymentResponse>>(
      '/api/v1/payments/confirm',
      data
    ),
};
