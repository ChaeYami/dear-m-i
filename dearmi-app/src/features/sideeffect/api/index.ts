import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type {
  SideEffectLog,
  CreateSideEffectRequest,
  UpdateSideEffectRequest,
} from '@/shared/types/domain.types';

export const sideEffectApi = {
  /** 최신순 페이지 목록 */
  list: (page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<SideEffectLog[]>>('/api/v1/side-effects', {
      params: { page, size },
    }),

  /** 특정 시점 이후 — prep note 자동 첨부용 */
  since: (sinceIso: string) =>
    axiosInstance.get<ApiResponse<SideEffectLog[]>>('/api/v1/side-effects/since', {
      params: { since: sinceIso },
    }),

  create: (data: CreateSideEffectRequest) =>
    axiosInstance.post<ApiResponse<SideEffectLog>>('/api/v1/side-effects', data),

  update: (id: string, data: UpdateSideEffectRequest) =>
    axiosInstance.put<ApiResponse<SideEffectLog>>(`/api/v1/side-effects/${id}`, data),

  delete: (id: string) =>
    axiosInstance.delete<void>(`/api/v1/side-effects/${id}`),
};

export default sideEffectApi;
