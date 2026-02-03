/**
 * 도메인 공통 타입 정의
 * - 비즈니스 객체 타입 (백엔드 도메인과 대응)
 */

/** 소셜 로그인 제공자 */
export type AuthProvider = 'GOOGLE' | 'APPLE';

/** 구독 플랜 */
export type SubscriptionPlan = 'FREE' | 'PREMIUM';

/** 사용자 정보 */
export interface User {
  id: number;
  email: string;
  name: string;
  provider: AuthProvider;
  plan: SubscriptionPlan;
  profileImageUrl?: string;
}

/** 병원 일정 */
export interface HospitalSchedule {
  id: number;
  hospitalName: string;
  doctorName?: string;
  scheduledAt: string; // ISO 8601 datetime
  memo?: string;
  createdAt: string;
  updatedAt: string;
}

/** 일정 생성 요청 */
export interface CreateScheduleRequest {
  hospitalName: string;
  doctorName?: string;
  scheduledAt: string; // ISO 8601 datetime
  memo?: string;
}

/** 일정 수정 요청 */
export type UpdateScheduleRequest = Partial<CreateScheduleRequest>;

/** 상담 기록 */
export interface CounselingRecord {
  id: number;
  scheduleId?: number;
  hospitalName?: string; // 연결된 일정의 병원명 (백엔드 조인)
  content: string;
  emotionScore?: number;
  tags?: string[];
  createdAt: string;
  updatedAt: string;
}

/** 상담 기록 생성 요청 */
export interface CreateRecordRequest {
  scheduleId?: number;
  content: string;
  emotionScore?: number;
  tags?: string[];
}

/** 상담 기록 수정 요청 */
export type UpdateRecordRequest = Partial<CreateRecordRequest>;

// ─── 타임라인 (상담 기록 + 처방전 혼합) ─────────────────────────────────────

export interface TimelineRecord {
  type: 'record';
  id: number;
  scheduleId?: number;
  hospitalName?: string;
  content: string;
  emotionScore?: number;
  tags?: string[];
  createdAt: string;
}

export interface TimelinePrescription {
  type: 'prescription';
  id: number;
  scheduleId?: number;
  hospitalName?: string;
  prescribedAt?: string;
  medicationCount: number;
  createdAt: string;
}

export type TimelineItem = TimelineRecord | TimelinePrescription;

/** 처방전 OCR 처리 상태 */
export type OcrStatus = 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED';

/** 처방전 */
export interface Prescription {
  id: number;
  scheduleId?: number;
  imageUrl?: string;
  hospitalName?: string;
  prescribedAt?: string;
  ocrStatus?: OcrStatus;
  medications: PrescriptionMedication[];
  createdAt: string;
  updatedAt: string;
}

/** 처방 약품 (e약은요 API 데이터 포함) */
export interface PrescriptionMedication {
  id: number;
  medicationName: string;
  manufacturer?: string;
  dosage?: string;
  frequency?: string;
  durationDays?: number;
  // 약학정보원(e약은요) 비동기 조회 결과
  drugEffect?: string;       // 효능·효과
  drugCaution?: string;      // 주의사항
  drugInfoFetchedAt?: string; // null이면 아직 미조회 (스켈레톤 표시)
}

/** 처방전 생성 요청 (S3 업로드 완료 후) */
export interface CreatePrescriptionRequest {
  s3Key: string;
  prescribedAt: string; // YYYY-MM-DD
  scheduleId?: number;
}

/** 처방전 수정 요청 (OCR 결과 확인 후 저장) */
export interface SavePrescriptionRequest {
  hospitalName?: string;
  prescribedAt?: string;
  medications: Array<{
    medicationName: string;
    dosage?: string;
    frequency?: string;
    durationDays?: number;
  }>;
}

/** 감정 체크인 */
export interface DailyCheckin {
  id: number;
  date: string;
  emotionScore: number;
  memo?: string;
  createdAt: string;
}
