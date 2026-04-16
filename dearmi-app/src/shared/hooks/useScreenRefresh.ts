import { useCallback, useState } from 'react';
import { useQueryClient, type QueryKey } from '@tanstack/react-query';

/**
 * Pull-to-refresh 공통 핸들러.
 * 전달된 query key 들을 invalidate 하고 모두 settle 될 때까지 refreshing=true 유지.
 *
 * 사용:
 *   const { refreshing, onRefresh } = useScreenRefresh([
 *     QUERY_KEYS.records(),
 *     QUERY_KEYS.timeline(),
 *   ]);
 *   <FlatList refreshing={refreshing} onRefresh={onRefresh} ... />
 */
export const useScreenRefresh = (queryKeys: QueryKey[]) => {
  const queryClient = useQueryClient();
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await Promise.all(
        queryKeys.map((key) => queryClient.invalidateQueries({ queryKey: key })),
      );
    } finally {
      setRefreshing(false);
    }
    // queryKeys 는 호출자가 매번 새 배열을 만들기 쉬워 deps 에 넣으면 무한 루프 가능 →
    // queryClient 만 deps. 실제 키는 호출 시점에 읽음.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [queryClient]);

  return { refreshing, onRefresh };
};
