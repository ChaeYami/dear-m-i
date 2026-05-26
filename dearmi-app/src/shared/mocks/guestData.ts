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
 * i18n: 텍스트 필드는 현재 앱 언어(i18n.language)에 맞춰 ko/en 로 분기한다.
 * 모든 export 는 함수(getXxx) 형태 — 게스트 hook 의 queryFn(런타임)에서 호출되므로
 * 언어 변경 시에도 다음 조회부터 즉시 반영된다.
 */
import i18n from '@/locales/i18n';
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

/** 현재 언어에 맞는 문자열 선택 */
const isKo = () => i18n.language === 'ko';
const L = (ko: string, en: string): string => (isKo() ? ko : en);
const LA = (ko: string[], en: string[]): string[] => (isKo() ? ko : en);

// ─── 일정 ─────────────────────────────────────────────────────────────────────

export const getGuestSchedules = (): HospitalSchedule[] => [
  {
    id: 'guest-schedule-1',
    hospitalName: L('마음정신건강의학과', 'Maeum Psychiatry Clinic'),
    doctorName: L('김민지 선생님', 'Dr. Minji Kim'),
    scheduledAt: todayPlus(3, 14, 30),
    memo: L('약 부작용 상담, 수면 패턴 변화', 'Discuss medication side effects, sleep pattern changes'),
    createdAt: todayPlus(-7),
    updatedAt: todayPlus(-7),
  },
  {
    id: 'guest-schedule-2',
    hospitalName: L('서울신경정신과', 'Seoul Neuropsychiatry'),
    doctorName: L('이준호 선생님', 'Dr. Junho Lee'),
    scheduledAt: todayPlus(-10, 11, 0),
    memo: '',
    createdAt: todayPlus(-30),
    updatedAt: todayPlus(-30),
  },
  {
    id: 'guest-schedule-3',
    hospitalName: L('마음정신건강의학과', 'Maeum Psychiatry Clinic'),
    doctorName: L('김민지 선생님', 'Dr. Minji Kim'),
    scheduledAt: todayPlus(-24, 14, 30),
    memo: L('초진', 'First visit'),
    createdAt: todayPlus(-30),
    updatedAt: todayPlus(-30),
  },
];

// ─── 진료 기록 ────────────────────────────────────────────────────────────────

const sampleSections = (): RecordSections => ({
  diagnosis: L(
    '주요우울장애 (재발 에피소드), 범불안장애 동반',
    'Major depressive disorder (recurrent episode), with generalized anxiety disorder',
  ),
  rxChanges: L(
    '에스시탈로프람 10mg → 15mg 증량. 알프라졸람 0.25mg 필요시 복용.',
    'Escitalopram increased 10mg → 15mg. Alprazolam 0.25mg as needed.',
  ),
  nextSteps: L(
    '2주 후 재방문. 매일 수면시간/감정 점수 기록.',
    'Revisit in 2 weeks. Record sleep hours / mood score daily.',
  ),
  keyTakeaway: L(
    '약 부작용(졸림)은 1-2주 내 적응 가능. 무리하지 말 것.',
    'Side effect (drowsiness) should ease within 1–2 weeks. Don’t overdo it.',
  ),
});

export const getGuestRecords = (): CounselingRecord[] => [
  {
    id: 'guest-record-1',
    scheduleId: 'guest-schedule-2',
    hospitalName: L('서울신경정신과', 'Seoul Neuropsychiatry'),
    content: L(
      '요즘 잠드는 데 오래 걸린다고 말씀드렸어요. 약 증량 결정. 다음 진료까지 매일 수면 시간 기록하기로 했어요.',
      'I mentioned it has been taking a long time to fall asleep lately. We decided to increase the dose. I will log my sleep time daily until the next visit.',
    ),
    emotionScore: 5,
    tags: LA(['수면', '약물조정'], ['Sleep', 'Medication change']),
    consultedAt: dateOnly(-10),
    sections: sampleSections(),
    visitSatisfaction: 8,
    createdAt: todayPlus(-10, 12, 0),
    updatedAt: todayPlus(-10, 12, 0),
  },
  {
    id: 'guest-record-2',
    scheduleId: 'guest-schedule-3',
    hospitalName: L('마음정신건강의학과', 'Maeum Psychiatry Clinic'),
    content: L(
      '초진. 최근 두 달간 기분이 가라앉고 무기력하다고 말씀드림. 진단평가 후 약 처방 시작.',
      'First visit. Reported low mood and lethargy over the past two months. Started medication after a diagnostic assessment.',
    ),
    emotionScore: 4,
    tags: LA(['초진', '진단'], ['First visit', 'Diagnosis']),
    consultedAt: dateOnly(-24),
    visitSatisfaction: 9,
    createdAt: todayPlus(-24, 15, 30),
    updatedAt: todayPlus(-24, 15, 30),
  },
];

// 무한 스크롤(timeline) 페이지 응답 모양
export const getGuestTimelinePage = () => {
  const records = getGuestRecords();
  return {
    content: records.map((r) => ({
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
    totalElements: records.length,
    totalPages: 1,
    isLimited: false,
  };
};

// ─── 감정 체크인 ──────────────────────────────────────────────────────────────

export const getGuestTodayCheckin = (): TodayCheckinResponse => ({
  checkedIn: true,
  checkin: {
    id: 'guest-checkin-today',
    checkedAt: dateOnly(0),
    emotionScore: 7,
    triggerTags: LA(['업무', '날씨'], ['Work', 'Weather']),
    memo: L('아침에 산책하고 나니 한결 가벼워졌어요.', 'Felt much lighter after a morning walk.'),
    sleepHours: 7,
    tookMedication: true,
    createdAt: todayPlus(0, 9, 0),
    updatedAt: todayPlus(0, 9, 0),
  },
});

export const getGuestCheckinHistory = (): CheckinHistoryResponse => ({
  isLimited: false,
  content: [
    getGuestTodayCheckin().checkin!,
    {
      id: 'guest-checkin-2',
      checkedAt: dateOnly(-1),
      emotionScore: 6,
      triggerTags: LA(['업무'], ['Work']),
      memo: L('회의가 많은 하루였어요. 피곤하지만 잘 견뎠어요.', 'A day full of meetings. Tired but got through it well.'),
      sleepHours: 6.5,
      tookMedication: true,
      createdAt: todayPlus(-1, 22, 0),
      updatedAt: todayPlus(-1, 22, 0),
    },
    {
      id: 'guest-checkin-3',
      checkedAt: dateOnly(-2),
      emotionScore: 4,
      triggerTags: LA(['수면부족'], ['Lack of sleep']),
      memo: L('잠이 부족해서 종일 가라앉았어요.', 'Felt down all day from lack of sleep.'),
      sleepHours: 4,
      tookMedication: false,
      createdAt: todayPlus(-2, 21, 30),
      updatedAt: todayPlus(-2, 21, 30),
    },
    {
      id: 'guest-checkin-4',
      checkedAt: dateOnly(-3),
      emotionScore: 8,
      triggerTags: LA(['가족', '식사'], ['Family', 'Meal']),
      memo: L('오랜만에 가족과 저녁 식사. 마음이 따뜻했어요.', 'Dinner with family after a while. It was heartwarming.'),
      sleepHours: 7.5,
      tookMedication: true,
      createdAt: todayPlus(-3, 22, 0),
      updatedAt: todayPlus(-3, 22, 0),
    },
    {
      id: 'guest-checkin-5',
      checkedAt: dateOnly(-4),
      emotionScore: 5,
      triggerTags: LA(['업무'], ['Work']),
      memo: L('평범한 하루.', 'An ordinary day.'),
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
      triggerTags: LA(['운동'], ['Exercise']),
      memo: L('오후에 가볍게 산책 30분.', 'A light 30-minute walk in the afternoon.'),
      sleepHours: 7.5,
      tookMedication: true,
      createdAt: todayPlus(-6, 22, 0),
      updatedAt: todayPlus(-6, 22, 0),
    },
  ] as DailyCheckin[],
});

export const getGuestCheckinSummary = (): CheckinSummary => ({
  averageEmotionScore: 6.1,
  averageSleepHours: 6.6,
  medicationRate: 0.86,
  topTriggerTags: LA(['업무', '수면부족', '가족'], ['Work', 'Lack of sleep', 'Family']),
  totalCheckins: 7,
});

// ─── 복약 ─────────────────────────────────────────────────────────────────────

export const getGuestMedicationSchedules = (): MedicationSchedule[] => [
  {
    id: 'guest-med-1',
    drugName: L('에스시탈로프람정 10mg', 'Escitalopram 10mg'),
    dosage: L('1정', '1 tablet'),
    singleDose: L('1정', '1 tablet'),
    drugCategory: L('항우울제', 'Antidepressant'),
    drugCaution: L('졸림, 메스꺼움 가능. 술 금지.', 'May cause drowsiness, nausea. No alcohol.'),
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
    drugName: L('알프라졸람정 0.25mg', 'Alprazolam 0.25mg'),
    dosage: L('1정', '1 tablet'),
    singleDose: L('1정', '1 tablet'),
    drugCategory: L('항불안제', 'Anti-anxiety'),
    drugCaution: L('필요 시에만 복용. 졸림 주의.', 'Take only as needed. Watch for drowsiness.'),
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

export const getGuestTodayMedication = (): TodayMedication => ({
  schedules: [
    {
      scheduleId: 'guest-med-1',
      drugName: L('에스시탈로프람정 10mg', 'Escitalopram 10mg'),
      dosage: L('1정', '1 tablet'),
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
      drugName: L('알프라졸람정 0.25mg', 'Alprazolam 0.25mg'),
      dosage: L('1정', '1 tablet'),
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
});

// ─── 처방전 ───────────────────────────────────────────────────────────────────

export const getGuestPrescriptions = (): Prescription[] => [
  {
    id: 1,
    scheduleId: 2,
    hospitalName: L('서울신경정신과', 'Seoul Neuropsychiatry'),
    prescribedAt: dateOnly(-10),
    ocrStatus: 'COMPLETED',
    medications: [
      {
        id: 'guest-pmed-1',
        medicationName: L('에스시탈로프람정 10mg', 'Escitalopram 10mg'),
        dosage: L('1일 1회', 'Once a day'),
        singleDose: L('1정', '1 tablet'),
        frequency: L('아침 식후', 'After breakfast'),
        durationDays: 30,
      },
      {
        id: 'guest-pmed-2',
        medicationName: L('알프라졸람정 0.25mg', 'Alprazolam 0.25mg'),
        dosage: L('필요 시', 'As needed'),
        singleDose: L('1정', '1 tablet'),
        frequency: L('취침 전', 'Before bed'),
        durationDays: 30,
      },
    ],
    createdAt: todayPlus(-10),
    updatedAt: todayPlus(-10),
  },
];

// ─── 준비 메모 ────────────────────────────────────────────────────────────────

export const getGuestPrepNotes = (): PrepNote[] => [
  {
    id: 'guest-prep-1',
    scheduleId: 'guest-schedule-1',
    content: L(
      '약 증량 이후 졸림이 심해서 출근에 영향이 있어요. 용량 조정 가능한지 여쭤보기.',
      'Drowsiness has been severe since the dose increase, affecting work. Ask whether the dose can be adjusted.',
    ),
    sections: {
      moodChanges: L('전반적으로 안정. 주말엔 살짝 가라앉음.', 'Generally stable. Slightly low on weekends.'),
      sideEffects: L('졸림 (특히 오전), 메스꺼움 약간', 'Drowsiness (especially mornings), mild nausea'),
      sleepAppetite: L('수면 7시간 안정, 식욕 정상', 'Sleep stable at 7 hours, appetite normal'),
      newSymptoms: L('특이사항 없음', 'Nothing notable'),
      questions: LA(
        ['약 시간 조정 가능? (아침 → 저녁)', '음주는 언제부터?'],
        ['Can the medication time be adjusted? (morning → evening)', 'When can I drink alcohol?'],
      ),
    },
    linkedNoteIds: [],
    createdAt: todayPlus(-2),
    updatedAt: todayPlus(-1),
  },
];
