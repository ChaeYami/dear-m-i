import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse } from '@/shared/types/api.types';
import type { SearchResponse } from '@/shared/types/domain.types';

export type SearchType = 'RECORD' | 'CHECKIN' | 'PREPNOTE';

export const searchApi = {
  search: (keyword: string, page = 0, size = 20, types?: SearchType, tags?: string[]) =>
    axiosInstance.get<ApiResponse<SearchResponse>>('/api/v1/search', {
      params: {
        q: keyword || undefined,
        types: types || undefined,
        tags: tags && tags.length > 0 ? tags : undefined,
        page,
        size,
      },
    }),
};
