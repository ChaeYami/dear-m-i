import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { prescriptionApi } from '@/features/prescription/api';
import type { SavePrescriptionRequest } from '@/shared/types/domain.types';

const OCR_POLL_INTERVAL_MS = 2000;
const OCR_TIMEOUT_MS = 90_000;

/** 처방전 목록 (단순, 소량일 때) */
export const usePrescriptions = () =>
  useQuery({
    queryKey: QUERY_KEYS.prescriptions(),
    queryFn: async () => {
      const { data } = await prescriptionApi.getPrescriptions();
      return data.data ?? [];
    },
  });

/** 처방전 목록 무한 스크롤 (page 기반) */
export const usePagedPrescriptions = () =>
  useInfiniteQuery({
    queryKey: [...QUERY_KEYS.prescriptions(), 'paged'],
    queryFn: async ({ pageParam }) => {
      const { data } = await prescriptionApi.getPrescriptionsPaged(pageParam as number);
      return data.data ?? { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, hasNext: false };
    },
    initialPageParam: 0 as number,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });

/** 약품 상세 (e약은요 정보) */
export const useMedicationDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.medicationDetail(id),
    queryFn: async () => {
      const { data } = await prescriptionApi.getMedicationDetail(id);
      return data.data ?? null;
    },
    enabled: !!id,
  });

/**
 * 처방전 상세 (OCR 폴링 포함)
 * - poll=true 이면 PENDING/PROCESSING 상태일 때 2초마다 재요청
 * - COMPLETED/FAILED 또는 90초 초과 시 폴링 중단
 */
export const usePrescriptionDetail = (id: string, poll = false) => {
  const startTime = Date.now();

  return useQuery({
    queryKey: QUERY_KEYS.prescription(id),
    queryFn: async () => {
      const { data } = await prescriptionApi.getPrescription(id);
      return data.data ?? null;
    },
    enabled: !!id,
    staleTime: 0,
    refetchInterval: (query) => {
      if (!poll) return false;
      const status = query.state.data?.ocrStatus;
      if (status === 'COMPLETED' || status === 'FAILED') return false;
      if (Date.now() - startTime > OCR_TIMEOUT_MS) return false;
      return OCR_POLL_INTERVAL_MS;
    },
  });
};

/** OCR 결과 확인 후 처방전 저장 */
export const useSavePrescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SavePrescriptionRequest }) =>
      prescriptionApi.savePrescription(id, data),
    onSuccess: (_res, { id }) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prescription(id) });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prescriptions() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline() });
    },
  });
};

/** 처방전 삭제 */
export const useDeletePrescription = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionApi.deletePrescription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prescriptions() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline() });
    },
  });
};

/** 처방전 일괄 삭제 */
export const useBulkDeletePrescriptions = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (ids: string[]) =>
      Promise.all(ids.map((id) => prescriptionApi.deletePrescription(id))),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prescriptions() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline() });
    },
  });
};
