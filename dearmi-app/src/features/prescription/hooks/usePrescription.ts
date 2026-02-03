import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { prescriptionApi } from '@/features/prescription/api';
import type { SavePrescriptionRequest } from '@/shared/types/domain.types';

const OCR_POLL_INTERVAL_MS = 2000;
const OCR_TIMEOUT_MS = 90_000;

/** 처방전 목록 */
export const usePrescriptions = () =>
  useQuery({
    queryKey: QUERY_KEYS.prescriptions(),
    queryFn: async () => {
      const { data } = await prescriptionApi.getPrescriptions();
      return data.data ?? [];
    },
  });

/**
 * 처방전 상세 (OCR 폴링 포함)
 * - poll=true 이면 PENDING/PROCESSING 상태일 때 2초마다 재요청
 * - COMPLETED/FAILED 또는 90초 초과 시 폴링 중단
 */
export const usePrescriptionDetail = (id: number, poll = false) => {
  const startTime = Date.now();

  return useQuery({
    queryKey: QUERY_KEYS.prescription(id),
    queryFn: async () => {
      const { data } = await prescriptionApi.getPrescription(id);
      return data.data ?? null;
    },
    enabled: id > 0,
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
    mutationFn: ({ id, data }: { id: number; data: SavePrescriptionRequest }) =>
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
    mutationFn: (id: number) => prescriptionApi.deletePrescription(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prescriptions() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.timeline() });
    },
  });
};
