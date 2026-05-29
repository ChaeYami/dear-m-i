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
  id: string;
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
/** 정신과 진료 기록 구조화 섹션 */
export interface RecordSections {
  diagnosis?: string;
  rxChanges?: string;
  nextSteps?: string;
  keyTakeaway?: string;
}

export interface CounselingRecord {
  id: string;
  scheduleId?: string;
  hospitalName?: string; // 연결된 일정의 병원명 (백엔드 조인)
  content: string;
  emotionScore?: number;
  tags?: string[];
  consultedAt?: string; // YYYY-MM-DD — 일정 미연결 기록의 진료 날짜
  sections?: RecordSections;
  visitSatisfaction?: number; // 1-10, 진료 자체에 대한 만족도
  createdAt: string;
  updatedAt: string;
}

/** 상담 기록 생성 요청 */
export interface CreateRecordRequest {
  scheduleId?: string;
  content: string;
  emotionScore?: number;
  tags?: string[];
  consultedAt?: string; // YYYY-MM-DD
  sections?: RecordSections;
  visitSatisfaction?: number;
}

/** 상담 기록 수정 요청 */
export type UpdateRecordRequest = Partial<CreateRecordRequest>;

/** 진료 기록 타임라인 카드용 요약 */
export interface RecordSummary {
  id: string;
  scheduleId?: string;
  hospitalName?: string;
  emotionScore?: number;
  content: string;
  tags?: string[];
  consultedAt?: string; // YYYY-MM-DD
  createdAt: string;    // ISO datetime
}

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

/** 약품 정보 출처 지역 — KR: 식약처/nedrug, US: OpenFDA/DailyMed */
export type DrugRegion = 'KR' | 'US';

/** 처방 약품 (약품 허가정보 데이터 포함) */
export interface PrescriptionMedication {
  id: string;
  medicationName: string;
  manufacturer?: string;
  dosage?: string;
  singleDose?: string;
  frequency?: string;
  durationDays?: number;
  // 약품 허가정보 비동기 조회 결과 (KR 식약처 / US OpenFDA)
  drugEffect?: string;       // 효능·효과
  drugCaution?: string;      // 주의사항
  region?: DrugRegion;       // 출처 지역 — 상세 링크/출처 라벨 분기
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
    singleDose?: string;
    frequency?: string;
    durationDays?: number;
  }>;
}

/** 감정 체크인 */
export interface DailyCheckin {
  id: string;
  checkedAt: string; // YYYY-MM-DD
  emotionScore: number;
  triggerTags?: string[];
  memo?: string;
  sleepHours?: number;
  tookMedication?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** 오늘 체크인 상태 */
export interface TodayCheckinResponse {
  checkedIn: boolean;
  checkin: DailyCheckin | null;
}

/** 체크인 이력 응답 */
export interface CheckinHistoryResponse {
  content: DailyCheckin[];
  isLimited: boolean;
}

/** 체크인 생성/수정 요청 */
export interface CreateCheckinRequest {
  emotionScore: number;
  triggerTags?: string[];
  memo?: string;
  sleepHours?: number;
  tookMedication?: boolean;
  /** 기록 날짜 (YYYY-MM-DD). 생략 시 서버에서 오늘 */
  checkedAt?: string;
}

/** 7일 체크인 요약 */
export interface CheckinSummary {
  averageEmotionScore: number | null;
  averageSleepHours: number | null;
  medicationRate: number | null;
  topTriggerTags: string[];
  totalCheckins: number;
}

// ─── 복약 관리 ────────────────────────────────────────────────────────────────

export type TimeSlotType = 'MORNING' | 'AFTERNOON' | 'EVENING' | 'BEDTIME';
export type MedicationLogStatus = 'TAKEN' | 'SKIPPED' | 'MISSED';

/** 복약 슬롯 그룹 */
export interface MedicationSlotGroup {
  id: string;
  groupName: string;
}

/** 오늘 복약 현황 — 시간대별 상태 */
export interface MedicationSlot {
  timeSlot: TimeSlotType;
  notifyTime?: string; // "HH:mm:ss" | null
  status: MedicationLogStatus | null;
  logId: string | null;
  groupId?: string | null;
  groupName?: string | null;
}

/** 오늘 복약 일정 항목 (일정 + 슬롯 목록) */
export interface TodayMedicationSchedule {
  scheduleId: string; // UUID
  drugName: string;
  dosage?: string;
  timesPerDay?: number;
  startDate?: string;
  endDate?: string;
  slots: MedicationSlot[];
}

/** GET /api/v1/medication-schedules 응답 */
export interface TodayMedication {
  schedules: TodayMedicationSchedule[];
}

/** 복약 일정 (등록/수정 후 반환) */
export interface MedicationSchedule {
  id: string; // UUID
  prescriptionMedicationId?: string;
  drugName: string;
  dosage?: string;
  singleDose?: string;
  drugCategory?: string;
  drugCaution?: string;
  timesPerDay?: number;
  startDate?: string;
  endDate?: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  bedtime: boolean;
  morningTime?: string;
  afternoonTime?: string;
  eveningTime?: string;
  bedtimeTime?: string;
}

/** POST /api/v1/medication-schedules 요청 */
export interface CreateMedicationScheduleRequest {
  prescriptionMedicationId?: string;
  drugName?: string;
  dosage?: string;
  singleDose?: string;
  drugCategory?: string;
  timesPerDay?: number;
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;
  morning: boolean;
  afternoon: boolean;
  evening: boolean;
  bedtime: boolean;
  morningTime?: string; // "HH:mm:ss"
  afternoonTime?: string;
  eveningTime?: string;
  bedtimeTime?: string;
}

export type UpdateMedicationScheduleRequest = Omit<CreateMedicationScheduleRequest, 'prescriptionMedicationId'>;

/** POST /api/v1/medication-schedules/{id}/logs 요청 */
export interface CheckMedicationRequest {
  logDate: string; // YYYY-MM-DD
  timeSlot: TimeSlotType;
  status: 'TAKEN' | 'SKIPPED';
}

/** 복약 로그 항목 */
export interface MedicationLogItem {
  logId: string;
  scheduleId: string;
  drugName: string;
  logDate: string; // YYYY-MM-DD
  timeSlot: TimeSlotType;
  status: MedicationLogStatus;
  takenAt?: string;
}

/** GET /api/v1/medication-schedules/logs 응답 */
export interface MedicationHistory {
  startDate: string;
  endDate: string;
  logs: MedicationLogItem[];
}

/** GET /api/v1/medication-schedules/stats 응답 */
export interface MedicationStats {
  startDate: string;
  endDate: string;
  totalLogs: number;
  scheduledDoses: number; // 기간 내 예정 복용 횟수 (완료율 분모)
  takenCount: number;
  skippedCount: number;
  missedCount: number; // 예정인데 미체크 = 미복용
  completionRate: number; // taken / scheduledDoses * 100
}

// ─── 진료 준비 메모 ────────────────────────────────────────────────────────────

/** 정신과 진료 준비 메모 구조화 섹션 */
export interface PrepNoteSections {
  moodChanges?: string;
  sideEffects?: string;
  sleepAppetite?: string;
  newSymptoms?: string;
  questions?: string[];
  selfHarmThoughts?: string;
}

export interface PrepNote {
  id: string; // UUID
  scheduleId?: string | null; // UUID (null = 미연결)
  content: string;
  sections?: PrepNoteSections;
  linkedNoteIds?: string[]; // 선택된 DailyNote ID 목록
  createdAt: string;
  updatedAt: string;
}

export interface CreatePrepNoteRequest {
  scheduleId?: string; // UUID
  content?: string;
  sections?: PrepNoteSections;
  linkedNoteIds?: string[];
}

export interface UpdatePrepNoteRequest {
  content?: string;
  sections?: PrepNoteSections;
  linkedNoteIds?: string[];
}

// ─── 하루 스레드 메모 ─────────────────────────────────────────────────────────

export type DailyNoteType = 'FEELING' | 'SYMPTOM' | 'QUESTION' | 'SIDE_EFFECT' | 'OTHER';

export interface DailyNote {
  id: string; // UUID
  body: string;
  noteType: DailyNoteType;
  noteDate: string; // YYYY-MM-DD
  usedInPrepNoteId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateDailyNoteRequest {
  body: string;
  noteType?: DailyNoteType;
  noteDate?: string; // YYYY-MM-DD — 생략 시 오늘
}

// ─── 부작용 로그 ───────────────────────────────────────────────────────────────

export interface SideEffectLog {
  id: string;
  medicationScheduleId?: string | null;
  occurredAt: string; // ISO instant
  symptom: string;
  severity?: number | null; // 1-5
  notes?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSideEffectRequest {
  medicationScheduleId?: string;
  occurredAt: string;
  symptom: string;
  severity?: number;
  notes?: string;
}

export type UpdateSideEffectRequest = CreateSideEffectRequest;

// ─── 통합 검색 ─────────────────────────────────────────────────────────────────

export interface SearchRecordItem {
  id: string; // UUID
  scheduleId?: string | null;
  emotionScore?: number;
  content: string;
  tags?: string[];
  createdAt: string;
}

export interface SearchCheckinItem {
  id: string;
  checkedAt: string; // YYYY-MM-DD
  emotionScore?: number;
  memo?: string;
  createdAt: string;
}

export interface SearchPrepNoteItem {
  id: string;
  scheduleId?: string | null;
  content: string;
  createdAt: string;
}

export interface SearchResponse {
  records: SearchRecordItem[];
  recordTotal: number;
  checkins: SearchCheckinItem[];
  checkinTotal: number;
  prepNotes: SearchPrepNoteItem[];
  prepNoteTotal: number;
}
