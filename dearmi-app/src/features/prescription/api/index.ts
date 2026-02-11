import axiosInstance from '@/shared/api/axiosInstance';
import type { ApiResponse, PagedResponse, PresignedUrlResponse } from '@/shared/types/api.types';
import type {
  Prescription,
  PrescriptionMedication,
  CreatePrescriptionRequest,
  SavePrescriptionRequest,
} from '@/shared/types/domain.types';

export const prescriptionApi = {
  /** Presigned URL 발급 */
  getPresignedUrl: (fileName: string, contentType: string) =>
    axiosInstance.post<ApiResponse<PresignedUrlResponse>>('/api/v1/prescriptions/presigned-url', {
      fileName,
      contentType,
    }),

  /**
   * S3 직접 업로드 (presigned PUT)
   * - axiosInstance 아닌 순수 axios 사용 (인증 헤더 없어야 S3 CORS 통과)
   * - onProgress: 0~100 진행률 콜백
   */
  uploadToS3: (
    uploadUrl: string,
    uri: string,
    mimeType: string,
    onProgress: (percent: number) => void
  ) =>
    new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open('PUT', uploadUrl, true);
      xhr.setRequestHeader('Content-Type', mimeType);

      xhr.upload.onprogress = (e) => {
        if (e.lengthComputable) {
          onProgress(Math.round((e.loaded / e.total) * 100));
        }
      };
      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve();
        else reject(new Error(`S3 업로드 실패 (${xhr.status})`));
      };
      xhr.onerror = () => reject(new Error('S3 업로드 중 네트워크 오류가 발생했습니다.'));

      // React Native: URI를 Blob 대신 직접 전송
      xhr.send({ uri, type: mimeType, name: 'prescription.jpg' } as unknown as Document);
    }),

  /** 처방전 등록 (S3 업로드 완료 후 백엔드에 메타데이터 저장) */
  createPrescription: (data: CreatePrescriptionRequest) =>
    axiosInstance.post<ApiResponse<Prescription>>('/api/v1/prescriptions', data),

  /** 처방전 목록 (단순) */
  getPrescriptions: () =>
    axiosInstance.get<ApiResponse<Prescription[]>>('/api/v1/prescriptions'),

  /** 처방전 목록 페이징 (무한 스크롤용) */
  getPrescriptionsPaged: (page: number, size = 20) =>
    axiosInstance.get<ApiResponse<PagedResponse<Prescription>>>('/api/v1/prescriptions', {
      params: { page, size },
    }),

  /** 약품 상세 (e약은요 정보 포함) */
  getMedicationDetail: (id: number) =>
    axiosInstance.get<ApiResponse<PrescriptionMedication>>(`/api/v1/prescription-medications/${id}`),

  /** 처방전 상세 (OCR 상태 포함) */
  getPrescription: (id: number) =>
    axiosInstance.get<ApiResponse<Prescription>>(`/api/v1/prescriptions/${id}`),

  /** OCR 결과 확인 후 저장 (약품 목록 수정 포함) */
  savePrescription: (id: number, data: SavePrescriptionRequest) =>
    axiosInstance.put<ApiResponse<Prescription>>(`/api/v1/prescriptions/${id}`, data),

  /** 처방전 삭제 */
  deletePrescription: (id: number) =>
    axiosInstance.delete<ApiResponse<void>>(`/api/v1/prescriptions/${id}`),
};
