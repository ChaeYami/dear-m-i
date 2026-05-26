import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import { QUERY_KEYS } from '@/constants/cacheKeys';
import { prescriptionApi } from '@/features/prescription/api';
import { useAuthStore } from '@/features/auth/store/authStore';
import { getGuestPrescriptions } from '@/shared/mocks/guestData';
import type { SavePrescriptionRequest } from '@/shared/types/domain.types';

const OCR_POLL_INTERVAL_MS = 2000;
const OCR_TIMEOUT_MS = 90_000;

/** 처방전 목록 (단순, 소량일 때) */
export const usePrescriptions = () => {
  const isGuest = useAuthStore((s) => s.isGuest);
  return useQuery({
    queryKey: [...QUERY_KEYS.prescriptions(), isGuest ? 'guest' : 'user'],
    queryFn: async () => {
      if (isGuest) return getGuestPrescriptions();
      const { data } = await prescriptionApi.getPrescriptions();
      return data.data ?? [];
    },
  });
};

/** 처방전 목록 무한 스크롤 (page 기반) */
export const usePagedPrescriptions = () => {
  const isGuest = useAuthStore((s) => s.isGuest);
  return useInfiniteQuery({
    queryKey: [...QUERY_KEYS.prescriptions(), 'paged', isGuest ? 'guest' : 'user'],
    queryFn: async ({ pageParam }) => {
      if (isGuest) {
        const guestPrescriptions = getGuestPrescriptions();
        return {
          content: guestPrescriptions,
          page: 0,
          size: 20,
          totalElements: guestPrescriptions.length,
          totalPages: 1,
          hasNext: false,
        };
      }
      const { data } = await prescriptionApi.getPrescriptionsPaged(pageParam as number);
      return data.data ?? { content: [], page: 0, size: 20, totalElements: 0, totalPages: 0, hasNext: false };
    },
    initialPageParam: 0 as number,
    getNextPageParam: (lastPage) => (lastPage.hasNext ? lastPage.page + 1 : undefined),
  });
};

/** 약품 상세 (e약은요 정보) — drugInfoFetchedAt이 null이면 3초마다 폴링 */
export const useMedicationDetail = (id: string) =>
  useQuery({
    queryKey: QUERY_KEYS.medicationDetail(id),
    queryFn: async () => {
      const { data } = await prescriptionApi.getMedicationDetail(id);
      return data.data ?? null;
    },
    enabled: !!id,
    refetchInterval: (query) => {
      const med = query.state.data;
      if (!med) return false;
      if (med.drugInfoFetchedAt) return false;
      if (query.state.dataUpdateCount > 20) return false;
      return 3000;
    },
  });

/**
 * 처방전 상세 (OCR 폴링 포함)
 * - poll=true 이면 PENDING/PROCESSING 상태일 때 2초마다 재요청
 * - COMPLETED/FAILED 또는 90초 초과 시 폴링 중단
 * - 90초 내 완료/실패 미도달 시 isOcrTimedOut=true 로 UI 가 FailedView 로 전환 가능
 */
export const usePrescriptionDetail = (id: string, poll = false) => {
  const startTimeRef = useRef<number>(Date.now());
  const [isOcrTimedOut, setIsOcrTimedOut] = useState(false);

  const query = useQuery({
    queryKey: QUERY_KEYS.prescription(id),
    queryFn: async () => {
      try {
        const { data } = await prescriptionApi.getPrescription(id);
        return data.data ?? null;
      } catch (e) {
        // 404: unmount 자동 삭제와 폴링 레이스 — 조용히 null 반환
        if (e instanceof AxiosError && e.response?.status === 404) return null;
        throw e;
      }
    },
    enabled: !!id,
    staleTime: 0,
    refetchInterval: (q) => {
      if (!poll) return false;
      const data = q.state.data;
      if (data === null) return false; // 삭제된 경우 폴링 중단
      const status = data?.ocrStatus;
      if (status === 'COMPLETED' || status === 'FAILED') return false;
      if (Date.now() - startTimeRef.current > OCR_TIMEOUT_MS) return false;
      return OCR_POLL_INTERVAL_MS;
    },
  });

  const ocrStatus = query.data?.ocrStatus;
  // 재시도마다 증가 — useEffect 의존성으로 써서 타이머 재-arm 을 강제
  const [timerEpoch, setTimerEpoch] = useState(0);
  useEffect(() => {
    if (!poll) return;
    if (ocrStatus === 'COMPLETED' || ocrStatus === 'FAILED') return;
    const remaining = OCR_TIMEOUT_MS - (Date.now() - startTimeRef.current);
    if (remaining <= 0) {
      setIsOcrTimedOut(true);
      return;
    }
    const timer = setTimeout(() => setIsOcrTimedOut(true), remaining);
    return () => clearTimeout(timer);
  }, [poll, ocrStatus, timerEpoch]);

  // 재시도 시 타이머 리셋용 (handleRetry 에서 호출)
  const resetOcrTimer = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsOcrTimedOut(false);
    setTimerEpoch((n) => n + 1);
  }, []);

  return { ...query, isOcrTimedOut, resetOcrTimer };
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

/** 처방 약품 → 복약 일정 일괄 등록 (idempotent) */
export const useSyncMedicationSchedules = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionApi.syncMedicationSchedules(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.todayMedication() });
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.allMedicationSchedules() });
    },
  });
};

/** OCR 재시도 */
export const useRetryOcr = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => prescriptionApi.retryOcr(id),
    onSuccess: (_res, id) => {
      queryClient.invalidateQueries({ queryKey: QUERY_KEYS.prescription(id) });
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
