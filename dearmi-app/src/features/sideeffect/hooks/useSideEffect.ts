import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import sideEffectApi from '@/features/sideeffect/api';
import type { CreateSideEffectRequest, UpdateSideEffectRequest } from '@/shared/types/domain.types';

export const useSideEffectList = (page = 0, size = 20) =>
  useQuery({
    queryKey: [...QUERY_KEYS.sideEffects(), page, size],
    queryFn: async () => {
      const { data } = await sideEffectApi.list(page, size);
      return data.data ?? [];
    },
  });

/** prep note 작성 시 직전 진료 이후의 부작용을 끌어오기 위한 쿼리 */
export const useSideEffectsSince = (sinceIso: string | null) =>
  useQuery({
    queryKey: QUERY_KEYS.sideEffectsSince(sinceIso ?? ''),
    queryFn: async () => {
      const { data } = await sideEffectApi.since(sinceIso!);
      return data.data ?? [];
    },
    enabled: !!sinceIso,
  });

const invalidateAll = (qc: ReturnType<typeof useQueryClient>) => {
  qc.invalidateQueries({ queryKey: QUERY_KEYS.sideEffects() });
};

export const useCreateSideEffect = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateSideEffectRequest) => sideEffectApi.create(data),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useUpdateSideEffect = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSideEffectRequest }) =>
      sideEffectApi.update(id, data),
    onSuccess: () => invalidateAll(qc),
  });
};

export const useDeleteSideEffect = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => sideEffectApi.delete(id),
    onSuccess: () => invalidateAll(qc),
  });
};
