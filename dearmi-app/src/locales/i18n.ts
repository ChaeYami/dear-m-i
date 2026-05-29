import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { getLocales } from 'expo-localization';
import { CacheService } from '@/shared/cache/CacheService';

// ko
import koCommon from './ko/common.json';
import koAuth from './ko/auth.json';
import koSchedule from './ko/schedule.json';
import koRecord from './ko/record.json';
import koCheckin from './ko/checkin.json';
import koPrescription from './ko/prescription.json';
import koSubscription from './ko/subscription.json';
import koSettings from './ko/settings.json';
import koNotifications from './ko/notifications.json';
import koPrepnote from './ko/prepnote.json';
import koSideeffect from './ko/sideeffect.json';

// en
import enCommon from './en/common.json';
import enAuth from './en/auth.json';
import enSchedule from './en/schedule.json';
import enRecord from './en/record.json';
import enCheckin from './en/checkin.json';
import enPrescription from './en/prescription.json';
import enSubscription from './en/subscription.json';
import enSettings from './en/settings.json';
import enNotifications from './en/notifications.json';
import enPrepnote from './en/prepnote.json';
import enSideeffect from './en/sideeffect.json';

const LANGUAGE_KEY = 'app_language';

/** MMKV에 저장된 언어 설정 또는 기기 언어 감지 */
const getInitialLanguage = (): string => {
  const saved = CacheService.get<string>(LANGUAGE_KEY);
  if (saved === 'ko' || saved === 'en') return saved;

  const deviceLang = getLocales()[0]?.languageCode ?? 'en';
  return deviceLang === 'ko' ? 'ko' : 'en';
};

i18n.use(initReactI18next).init({
  lng: getInitialLanguage(),
  fallbackLng: 'en',
  ns: ['common', 'auth', 'schedule', 'record', 'checkin', 'prescription', 'subscription', 'settings', 'notifications', 'prepnote', 'sideeffect'],
  defaultNS: 'common',
  resources: {
    ko: {
      common: koCommon,
      auth: koAuth,
      schedule: koSchedule,
      record: koRecord,
      checkin: koCheckin,
      prescription: koPrescription,
      subscription: koSubscription,
      settings: koSettings,
      notifications: koNotifications,
      prepnote: koPrepnote,
      sideeffect: koSideeffect,
    },
    en: {
      common: enCommon,
      auth: enAuth,
      schedule: enSchedule,
      record: enRecord,
      checkin: enCheckin,
      prescription: enPrescription,
      subscription: enSubscription,
      settings: enSettings,
      notifications: enNotifications,
      prepnote: enPrepnote,
      sideeffect: enSideeffect,
    },
  },
  interpolation: { escapeValue: false },
});

/** 언어 변경 + MMKV 저장 + 백엔드 동기화 */
export const changeLanguage = async (lang: 'ko' | 'en') => {
  await i18n.changeLanguage(lang);
  CacheService.set(LANGUAGE_KEY, lang);
  // 백엔드 선호 로케일 동기화 (약품 region 라우팅 + 푸시 다국어).
  // axiosInstance ↔ i18n 순환 import 방지 위해 지연 require. 비로그인/실패는 무시.
  try {
    await require('@/features/auth/api').authApi.updateLocale(lang);
  } catch {
    // 비로그인·게스트·네트워크 실패 — 다음 로그인 시 동기화에서 보정
  }
};

export default i18n;
