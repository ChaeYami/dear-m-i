/**
 * 게스트(둘러보기) 모드 샘플 데이터 — App Store 5.1.1(v) 대응.
 *
 * 회원가입 없이 입장한 사용자가 각 화면의 UI/기능을 체험할 수 있도록
 * 정적이지만 "오늘" 기준으로 자연스럽게 보이는 더미 데이터를 제공한다.
 *
 * 모든 ID 는 `guest-*` 접두어로 시작 → 실제 mutation 호출이 발생해도
 * 백엔드에서 식별 가능 (사실 useGuestGuard 가 호출 자체를 막아주지만,
 * 안전망으로 ID 자체도 구분되도록).
 *
 * i18n 은 적용하지 않음 — 게스트 더미 데이터는 한국어 고정.
 * 영어 사용자에게도 한국어 샘플이 노출되지만 UI 자체가 한국어 위주라 무방.
 * (필요시 t() 키로 분리 가능)
 */
import type {
  HospitalSchedule,
  CounselingRecord,
  RecordSections,
  DailyCheckin,
  TodayCheckinResponse,
  CheckinHistoryResponse,
  CheckinSummary,
  TodayMedication,
  MedicationSchedule,
  Prescription,
  PrepNote,
} from '@/shared/types/domain.types';

/** 오늘 자정 기준 날짜 더하기 → ISO 8601 */
const todayPlus = (days: number, hour = 10, minute = 0): string => {
  const d = new Date();
  d.setHours(hour, minute, 0, 0);
  d.setDate(d.getDate() + days);
  return d.toISOString();
};

/** YYYY-MM-DD 형식 (오늘에서 days 더한 날짜) */
const dateOnly = (days: number): string => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
};

// ─── 일정 ─────────────────────────────────────────────────────────────────────

export const GUEST_SCHEDULES: HospitalSchedule[] = [
  {
    id: 'guest-schedule-1',
    hospitalName: '마음정신건강의학과',
    doctorName: '김민지 선생님',
    scheduledAt: todayPlus(3, 14, 30),
    memo: '약 부작용 상담, 수면 패턴 변화',
    createdAt: todayPlus(-7),
    updatedAt: todayPlus(-7),
  },
  {
    id: 'guest-schedule-2',
    hospitalName: '서울신경정신과',
    doctorName: '이준호 선생님',
    scheduledAt: todayPlus(-10, 11, 0),
    memo: '',
    createdAt: todayPlus(-30),
    updatedAt: todayPlus(-30),
  },
  {
    id: 'guest-schedule-3',
    hospitalName: '마음정신건강의학과',
    doctorName: '김민지 선생님',
    scheduledAt: todayPlus(-24, 14, 30),
    memo: '초진',
    createdAt: todayPlus(-30),
    updatedAt: todayPlus(-30),
  },
];

// ─── 진료 기록 ────────────────────────────────────────────────────────────────

const SAMPLE_SECTIONS: RecordSections = {
  diagnosis: '주요우울장애 (재발 에피소드), 범불안장애 동반',
  rxChanges: '에스시탈로프람 10mg → 15mg 증량. 알프라졸람 0.25mg 필요시 복용.',
  nextSteps: '2주 후 재방문. 매일 수면시간/감정 점수 기록.',
  keyTakeaway: '약 부작용(졸림)은 1-2주 내 적응 가능. 무리하지 말 것.',
};

export const GUEST_RECORDS: CounselingRecord[] = [
  {
    id: 'guest-record-1',
    scheduleId: 'guest-schedule-2',
    hospitalName: '서울신경정신과',
    content:
      '요즘 잠드는 데 오래 걸린다고 말씀드렸어요. 약 증량 결정. 다음 진료까지 매일 수면 시간 기록하기로 했어요.',
    emotionScore: 5,
    tags: ['수면', '약물조정'],
    consultedAt: dateOnly(-10),
    sections: SAMPLE_SECTIONS,
    visitSatisfaction: 8,
    createdAt: todayPlus(-10, 12, 0),
    updatedAt: todayPlus(-10, 12, 0),
  },
  {
    id: 'guest-record-2',
    scheduleId: 'guest-schedule-3',
    hospitalName: '마음정신건강의학과',
    content:
      '초진. 최근 두 달간 기분이 가라앉고 무기력하다고 말씀드림. 진단평가 후 약 처방 시작.',
    emotionScore: 4,
    tags: ['초진', '진단'],
    consultedAt: dateOnly(-24),
    visitSatisfaction: 9,
    createdAt: todayPlus(-24, 15, 30),
    updatedAt: todayPlus(-24, 15, 30),
  },
];

// 무한 스크롤(timeline) 페이지 응답 모양
export const GUEST_TIMELINE_PAGE = {
  content: GUEST_RECORDS.map((r) => ({
    type: 'record' as const,
    id: r.id,
    scheduleId: r.scheduleId,
    hospitalName: r.hospitalName,
    content: r.content,
    emotionScore: r.emotionScore,
    tags: r.tags,
    createdAt: r.createdAt,
  })),
  page: 0,
  size: 20,
  totalElements: GUEST_RECORDS.length,
  totalPages: 1,
  isLimited: false,
};

// ─── 감정 체크인 ──────────────────────────────────────────────────────────────

export const GUEST_TODAY_CHECKIN: TodayCheckinResponse = {
  checkedIn: true,
  checkin: {
    id: 'guest-checkin-today',
    checkedAt: dateOnly(0),
    emotionScore: 7,
    triggerTags: ['업무', '날씨'],
    memo: '아침에 산책하고 나니 한결 가벼워졌어요.',
    sleepHours: 7,
    tookMedication: true,
    createdAt: todayPlus(0, 9, 0),
    updatedAt: todayPlus(0, 9, 0),
  },
};

export const GUEST_CHECKIN_HISTORY: CheckinHistoryResponse = {
  isLimited: false,
  content: [
    GUEST_TODAY_CHECKIN.checkin!,
    {
      id: 'guest-checkin-2',
      checkedAt: dateOnly(-1),
      emotionScore: 6,
      triggerTags: ['업무'],
      memo: '회의가 많은 하루였어요. 피곤하지만 잘 견뎠어요.',
      sleepHours: 6.5,
      tookMedication: true,
      createdAt: todayPlus(-1, 22, 0),
      updatedAt: todayPlus(-1, 22, 0),
    },
    {
      id: 'guest-checkin-3',
      checkedAt: dateOnly(-2),
      emotionScore: 4,
      triggerTags: ['수면부족'],
      memo: '잠이 부족해서 종일 가라앉았어요.',
      sleepHours: 4,
      tookMedication: false,
      createdAt: todayPlus(-2, 21, 30),
      updatedAt: todayPlus(-2, 21, 30),
    },
    {
      id: 'guest-checkin-4',
      checkedAt: dateOnly(-3),
      emotionScore: 8,
      triggerTags: ['가족', '식사'],
      memo: '오랜만에 가족과 저녁 식사. 마음이 따뜻했어요.',
      sleepHours: 7.5,
      tookMedication: true,
      createdAt: todayPlus(-3, 22, 0),
      updatedAt: todayPlus(-3, 22, 0),
    },
    {
      id: 'guest-checkin-5',
      checkedAt: dateOnly(-4),
      emotionScore: 5,
      triggerTags: ['업무'],
      memo: '평범한 하루.',
      sleepHours: 7,
      tookMedication: true,
      createdAt: todayPlus(-4, 22, 0),
      updatedAt: todayPlus(-4, 22, 0),
    },
    {
      id: 'guest-checkin-6',
      checkedAt: dateOnly(-5),
      emotionScore: 6,
      triggerTags: [],
      memo: '',
      sleepHours: 7,
      tookMedication: true,
      createdAt: todayPlus(-5, 22, 0),
      updatedAt: todayPlus(-5, 22, 0),
    },
    {
      id: 'guest-checkin-7',
      checkedAt: dateOnly(-6),
      emotionScore: 7,
      triggerTags: ['운동'],
      memo: '오후에 가볍게 산책 30분.',
      sleepHours: 7.5,
      tookMedication: true,
      createdAt: todayPlus(-6, 22, 0),
      updatedAt: todayPlus(-6, 22, 0),
    },
  ] as DailyCheckin[],
};

export const GUEST_CHECKIN_SUMMARY: CheckinSummary = {
  averageEmotionScore: 6.1,
  averageSleepHours: 6.6,
  medicationRate: 0.86,
  topTriggerTags: ['업무', '수면부족', '가족'],
  totalCheckins: 7,
};

// ─── 복약 ─────────────────────────────────────────────────────────────────────

export const GUEST_MEDICATION_SCHEDULES: MedicationSchedule[] = [
  {
    id: 'guest-med-1',
    drugName: '에스시탈로프람정 10mg',
    dosage: '1정',
    singleDose: '1정',
    drugCategory: '항우울제',
    drugCaution: '졸림, 메스꺼움 가능. 술 금지.',
    timesPerDay: 1,
    startDate: dateOnly(-14),
    endDate: dateOnly(16),
    morning: true,
    afternoon: false,
    evening: false,
    bedtime: false,
    morningTime: '09:00:00',
  },
  {
    id: 'guest-med-2',
    drugName: '알프라졸람정 0.25mg',
    dosage: '1정',
    singleDose: '1정',
    drugCategory: '항불안제',
    drugCaution: '필요 시에만 복용. 졸림 주의.',
    timesPerDay: 1,
    startDate: dateOnly(-7),
    endDate: dateOnly(23),
    morning: false,
    afternoon: false,
    evening: false,
    bedtime: true,
    bedtimeTime: '22:30:00',
  },
];

export const GUEST_TODAY_MEDICATION: TodayMedication = {
  schedules: [
    {
      scheduleId: 'guest-med-1',
      drugName: '에스시탈로프람정 10mg',
      dosage: '1정',
      timesPerDay: 1,
      startDate: dateOnly(-14),
      endDate: dateOnly(16),
      slots: [
        {
          timeSlot: 'MORNING',
          notifyTime: '09:00:00',
          status: 'TAKEN',
          logId: 'guest-log-1',
        },
      ],
    },
    {
      scheduleId: 'guest-med-2',
      drugName: '알프라졸람정 0.25mg',
      dosage: '1정',
      timesPerDay: 1,
      startDate: dateOnly(-7),
      endDate: dateOnly(23),
      slots: [
        {
          timeSlot: 'BEDTIME',
          notifyTime: '22:30:00',
          status: null,
          logId: null,
        },
      ],
    },
  ],
};

// ─── 처방전 ───────────────────────────────────────────────────────────────────

export const GUEST_PRESCRIPTIONS: Prescription[] = [
  {
    id: 1,
    scheduleId: 2,
    hospitalName: '서울신경정신과',
    prescribedAt: dateOnly(-10),
    ocrStatus: 'COMPLETED',
    medications: [
      {
        id: 'guest-pmed-1',
        medicationName: '에스시탈로프람정 10mg',
        dosage: '1일 1회',
        singleDose: '1정',
        frequency: '아침 식후',
        durationDays: 30,
      },
      {
        id: 'guest-pmed-2',
        medicationName: '알프라졸람정 0.25mg',
        dosage: '필요 시',
        singleDose: '1정',
        frequency: '취침 전',
        durationDays: 30,
      },
    ],
    createdAt: todayPlus(-10),
    updatedAt: todayPlus(-10),
  },
];

// ─── 준비 메모 ────────────────────────────────────────────────────────────────

export const GUEST_PREP_NOTES: PrepNote[] = [
  {
    id: 'guest-prep-1',
    scheduleId: 'guest-schedule-1',
    content:
      '약 증량 이후 졸림이 심해서 출근에 영향이 있어요. 용량 조정 가능한지 여쭤보기.',
    sections: {
      moodChanges: '전반적으로 안정. 주말엔 살짝 가라앉음.',
      sideEffects: '졸림 (특히 오전), 메스꺼움 약간',
      sleepAppetite: '수면 7시간 안정, 식욕 정상',
      newSymptoms: '특이사항 없음',
      questions: ['약 시간 조정 가능? (아침 → 저녁)', '음주는 언제부터?'],
    },
    linkedNoteIds: [],
    createdAt: todayPlus(-2),
    updatedAt: todayPlus(-1),
  },
];
