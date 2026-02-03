import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type { SearchResponse } from '@/shared/types/domain.types';

export const searchApi = {
  search: (keyword: string, page = 0, size = 20) =>
    axiosInstance.get<ApiResponse<SearchResponse>>('/api/v1/search', {
      params: {
        q: keyword || undefined,
        page,
        size,
      },
    }),
};
