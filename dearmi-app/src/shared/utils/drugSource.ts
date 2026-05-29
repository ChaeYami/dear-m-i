import type { DrugRegion } from '@/shared/types/domain.types';

/**
 * 약품 정보 출처 지역에 따른 상세 외부 링크 / i18n 라벨 키.
 * 출처는 처방 당시 region 에 묶이므로(앱 언어가 아니라 응답의 region 기준) 분기한다.
 * - KR: 식품의약품안전처 nedrug
 * - US: U.S. NLM DailyMed (set_id 는 itemSeq 에 저장됨)
 */

/** 약품 상세 외부 링크. itemSeq(코드) 있으면 직접 상세, 없으면 약품명 검색. */
export const drugDetailUrl = (
  region: DrugRegion | null | undefined,
  drugName: string,
  itemSeq?: string | null
): string => {
  const name = encodeURIComponent(drugName ?? '');
  if (region === 'US') {
    return itemSeq
      ? `https://dailymed.nlm.nih.gov/dailymed/drugInfo.cfm?setid=${itemSeq}`
      : `https://dailymed.nlm.nih.gov/dailymed/search.cfm?query=${name}`;
  }
  // KR (기본)
  return itemSeq
    ? `https://nedrug.mfds.go.kr/pbp/CCBBB01/getItemDetail?itemSeq=${itemSeq}`
    : `https://nedrug.mfds.go.kr/searchDrug?searchYn=true&page=1&drug_name=${name}`;
};

/** 외부 링크 버튼 라벨 i18n 키 (prescription 네임스페이스 내 키만 반환) */
export const drugLinkLabelKey = (region: DrugRegion | null | undefined): string =>
  region === 'US' ? 'drug_dailymed_link' : 'drug_nedrug_link';

/** 출처 표기 i18n 키 (prescription 네임스페이스 내 키만 반환) */
export const drugSourceKey = (region: DrugRegion | null | undefined): string =>
  region === 'US' ? 'drug_info_source_us' : 'drug_info_source';
