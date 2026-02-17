import type { TFunction } from 'i18next';
import i18n from '@/locales/i18n';

/**
 * 체크인 트리거 태그 유틸리티.
 *
 * DB 에는 예전에 번역된 문자열(예: "가족 갈등")이 그대로 저장된 레거시 레코드가 있고,
 * 신규 레코드는 키(예: "family")로 저장한다.
 * 렌더 시점에는 현재 앱 언어로 표시되도록 `displayTag` 를 통해 해석하고,
 * 편집/저장 시에는 `normalizeTag` 로 key 형태로 정규화한다.
 */

export const PRESET_TAG_KEYS = [
  'family',
  'friends',
  'work_relations',
  'partner',
  'loneliness',
  'work_stress',
  'academic',
  'burnout',
  'sleep_lack',
  'fatigue',
  'pain',
  'weather',
  'financial',
  'none',
] as const;

export type TriggerTagKey = typeof PRESET_TAG_KEYS[number];

/**
 * 저장된 값이 어떤 언어로든 프리셋 태그의 번역값이면 해당 key 를 반환.
 * 이미 key 자체여도 매칭되고, 매칭 실패 시 null (= 커스텀 태그).
 */
export const findPresetKey = (value: string): TriggerTagKey | null => {
  for (const key of PRESET_TAG_KEYS) {
    if (value === key) return key;
    const ko = i18n.t(`checkin:trigger_tags.${key}`, { lng: 'ko' });
    const en = i18n.t(`checkin:trigger_tags.${key}`, { lng: 'en' });
    if (value === ko || value === en) return key;
  }
  return null;
};

/**
 * DB 에서 읽은 태그 값을 편집/저장용으로 정규화.
 * 프리셋이면 key, 커스텀이면 raw 그대로.
 */
export const normalizeTag = (value: string): string => findPresetKey(value) ?? value;

/**
 * 렌더: key 면 현재 언어로 번역, 커스텀이면 raw 반환.
 */
export const displayTag = (value: string, t: TFunction): string => {
  const key = findPresetKey(value);
  return key ? t(`trigger_tags.${key}`) : value;
};

/**
 * 검색 쿼리용 태그 확장.
 * 프리셋 key 를 모든 가능한 DB 저장 형태({key, ko_translation, en_translation})로 확장해
 * 레거시 한글/영문 데이터와 신규 key 데이터가 모두 매칭되도록 한다.
 * 커스텀 태그는 그대로 반환.
 */
export const expandTagForSearch = (value: string): string[] => {
  const key = findPresetKey(value);
  if (!key) return [value];
  const ko = i18n.t(`checkin:trigger_tags.${key}`, { lng: 'ko' });
  const en = i18n.t(`checkin:trigger_tags.${key}`, { lng: 'en' });
  return Array.from(new Set([key, ko, en]));
};
