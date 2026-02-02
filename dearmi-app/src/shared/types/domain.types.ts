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
  content: string;
  emotionScore?: number;
  createdAt: string;
  updatedAt: string;
}

/** 처방전 */
export interface Prescription {
  id: number;
  scheduleId?: number;
  imageUrl?: string;
  hospitalName?: string;
  prescribedAt?: string;
  medications: PrescriptionMedication[];
  createdAt: string;
  updatedAt: string;
}

/** 처방 약품 */
export interface PrescriptionMedication {
  id: number;
  medicationName: string;
  dosage?: string;
  frequency?: string;
  durationDays?: number;
}

/** 감정 체크인 */
export interface DailyCheckin {
  id: number;
  date: string;
  emotionScore: number;
  memo?: string;
  createdAt: string;
}
