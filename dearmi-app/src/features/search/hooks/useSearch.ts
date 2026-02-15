import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS, CACHE_KEYS } from '@/constants/cacheKeys';
import { CacheService } from '@/shared/cache';
import { searchApi, type SearchType } from '@/features/search/api/searchApi';

const MAX_RECENT = 5;

/** 최근 검색어 관리 */
export const useRecentSearches = () => {
  const load = (): string[] =>
    CacheService.get<string[]>(CACHE_KEYS.RECENT_SEARCHES) ?? [];

  const save = (keyword: string) => {
    if (!keyword.trim()) return;
    const current = load().filter((k) => k !== keyword);
    CacheService.set(CACHE_KEYS.RECENT_SEARCHES, [keyword, ...current].slice(0, MAX_RECENT));
  };

  const remove = (keyword: string) => {
    CacheService.set(CACHE_KEYS.RECENT_SEARCHES, load().filter((k) => k !== keyword));
  };

  const clear = () => CacheService.delete(CACHE_KEYS.RECENT_SEARCHES);

  return { load, save, remove, clear };
};

/** 통합 검색 (debounce 300ms) */
export const useSearch = (keyword: string, types?: SearchType, tags?: string[]) => {
  const [debouncedKeyword, setDebouncedKeyword] = useState(keyword);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedKeyword(keyword), 300);
    return () => clearTimeout(timer);
  }, [keyword]);

  const hasInput = debouncedKeyword.trim().length > 0 || (tags != null && tags.length > 0);

  return {
    ...useQuery({
      queryKey: [...QUERY_KEYS.search(debouncedKeyword), types, tags],
      queryFn: async () => {
        const { data } = await searchApi.search(debouncedKeyword, 0, 20, types, tags);
        return data.data ?? null;
      },
      enabled: hasInput,
    }),
    isDebouncing: keyword !== debouncedKeyword,
  };
};
