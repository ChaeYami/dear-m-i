import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import notificationApi, { type NotificationItem } from '../api';
import { QUERY_KEYS } from '@/constants/cacheKeys';

const PAGE_SIZE = 20;

/** 알림 히스토리 무한 스크롤 */
export const useNotificationHistory = () => {
  return useInfiniteQuery({
    queryKey: QUERY_KEYS.notificationHistory(),
    initialPageParam: 0,
    queryFn: async ({ pageParam }) => {
      const { data } = await notificationApi.getHistory(pageParam as number, PAGE_SIZE);
      return data.data!;
    },
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
};

/** 안 읽은 알림 개수 — 벨 인디케이터용 */
export const useUnreadNotificationCount = () => {
  return useQuery({
    queryKey: QUERY_KEYS.notificationUnreadCount(),
    queryFn: async () => {
      const { data } = await notificationApi.getUnreadCount();
      return data.data?.count ?? 0;
    },
    // 백그라운드/포커스 복귀 시 재조회
    refetchOnWindowFocus: true,
    refetchInterval: 60_000, // 1분마다 폴링
    staleTime: 30_000,
  });
};

/** 단일 알림 읽음 처리 (optimistic update) */
export const useMarkNotificationRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationApi.markRead(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notificationHistory() });

      // 히스토리 캐시에서 해당 항목 readAt 을 optimistic 하게 채움
      const now = new Date().toISOString();
      queryClient.setQueriesData<{ pages: Array<{ content: NotificationItem[] }> } | undefined>(
        { queryKey: QUERY_KEYS.notificationHistory() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              content: p.content.map((item) =>
                item.id === id && !item.readAt ? { ...item, readAt: now } : item
              ),
            })),
          };
        }
      );

      // unread count 1 감소
      queryClient.setQueryData<number>(QUERY_KEYS.notificationUnreadCount(), (old) =>
        old != null ? Math.max(0, old - 1) : old
      );
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationUnreadCount() });
    },
  });
};

/** 모두 읽음 처리 */
export const useMarkAllNotificationsRead = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => notificationApi.markAllRead(),
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: QUERY_KEYS.notificationHistory() });

      const now = new Date().toISOString();
      queryClient.setQueriesData<{ pages: Array<{ content: NotificationItem[] }> } | undefined>(
        { queryKey: QUERY_KEYS.notificationHistory() },
        (old) => {
          if (!old) return old;
          return {
            ...old,
            pages: old.pages.map((p) => ({
              ...p,
              content: p.content.map((item) =>
                !item.readAt ? { ...item, readAt: now } : item
              ),
            })),
          };
        }
      );

      queryClient.setQueryData(QUERY_KEYS.notificationUnreadCount(), 0);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationUnreadCount() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.notificationHistory() });
    },
  });
};
