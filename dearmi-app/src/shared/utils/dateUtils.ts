/**
 * 로케일별 날짜 포맷 유틸
 */

const MONTH_NAMES_EN = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/**
 * 날짜를 로케일에 맞게 포맷
 * ko: 2026년 4월 10일
 * en: Apr 10, 2026
 */
export const formatDate = (date: string | Date, locale: string = 'ko'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const year = d.getFullYear();
  const month = d.getMonth();
  const day = d.getDate();

  if (locale === 'ko') {
    return `${year}년 ${month + 1}월 ${day}일`;
  }
  return `${MONTH_NAMES_EN[month]} ${day}, ${year}`;
};

/**
 * 날짜+시간을 로케일에 맞게 포맷
 * ko: 4/10 14:30
 * en: 4/10 2:30 PM
 */
export const formatDateTime = (date: string | Date, locale: string = 'ko'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = d.getMonth() + 1;
  const day = d.getDate();
  const hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');

  if (locale === 'ko') {
    return `${month}/${day} ${hours.toString().padStart(2, '0')}:${minutes}`;
  }

  const period = hours >= 12 ? 'PM' : 'AM';
  const h12 = hours % 12 || 12;
  return `${month}/${day} ${h12}:${minutes} ${period}`;
};

/**
 * 날짜만 간략하게 포맷
 * ko: 4월 10일
 * en: Apr 10
 */
export const formatShortDate = (date: string | Date, locale: string = 'ko'): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  const month = d.getMonth();
  const day = d.getDate();

  if (locale === 'ko') {
    return `${month + 1}월 ${day}일`;
  }
  return `${MONTH_NAMES_EN[month]} ${day}`;
};
