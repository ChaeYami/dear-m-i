import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import type {
  MedicationHistory,
  MedicationStats,
  MedicationLogItem,
  MedicationLogStatus,
  TimeSlotType,
} from '@/shared/types/domain.types';

/** i18n t 함수 (네임스페이스 prefix 키 사용) */
type TFunc = (key: string, options?: Record<string, unknown>) => string;

const SLOT_ORDER: TimeSlotType[] = ['MORNING', 'AFTERNOON', 'EVENING', 'BEDTIME'];

const SLOT_KEY: Record<TimeSlotType, string> = {
  MORNING: 'settings:medication_morning',
  AFTERNOON: 'settings:medication_afternoon',
  EVENING: 'settings:medication_evening',
  BEDTIME: 'settings:medication_bedtime',
};

const STATUS_KEY: Record<MedicationLogStatus, string> = {
  TAKEN: 'settings:medication_status_taken',
  SKIPPED: 'settings:medication_status_skipped',
  MISSED: 'settings:medication_status_missed',
};

const STATUS_COLOR: Record<MedicationLogStatus, string> = {
  TAKEN: '#10B981',
  SKIPPED: '#F59E0B',
  MISSED: '#EF4444',
};

const esc = (s: string): string =>
  String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

/** ISO/타임스탬프에서 HH:MM 추출 (없으면 '-') */
const timeOf = (takenAt?: string): string => {
  if (!takenAt) return '-';
  const m = takenAt.match(/(\d{2}):(\d{2})/);
  return m ? `${m[1]}:${m[2]}` : '-';
};

const buildHtml = (history: MedicationHistory, stats: MedicationStats | null, t: TFunc): string => {
  // 날짜별 그룹핑 → 최신 날짜 먼저
  const byDate = new Map<string, MedicationLogItem[]>();
  for (const log of history.logs) {
    const arr = byDate.get(log.logDate) ?? [];
    arr.push(log);
    byDate.set(log.logDate, arr);
  }
  const dates = [...byDate.keys()].sort((a, b) => b.localeCompare(a));

  const rowsHtml = dates
    .map((date) => {
      const logs = byDate
        .get(date)!
        .slice()
        .sort((a, b) => SLOT_ORDER.indexOf(a.timeSlot) - SLOT_ORDER.indexOf(b.timeSlot));
      return logs
        .map((l, i) => {
          const dateCell =
            i === 0 ? `<td class="date" rowspan="${logs.length}">${esc(date)}</td>` : '';
          const color = STATUS_COLOR[l.status];
          return `<tr>
            ${dateCell}
            <td>${esc(t(SLOT_KEY[l.timeSlot]))}</td>
            <td class="drug">${esc(l.drugName)}</td>
            <td><span class="badge" style="color:${color};background:${color}1A">${esc(t(STATUS_KEY[l.status]))}</span></td>
            <td class="time">${esc(timeOf(l.takenAt))}</td>
          </tr>`;
        })
        .join('');
    })
    .join('');

  const ratePct = stats ? Math.round(stats.completionRate * 100) : 0;
  const total = stats?.totalLogs ?? history.logs.length;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<style>
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, 'Apple SD Gothic Neo', 'Noto Sans KR', 'Helvetica Neue', sans-serif;
    color: #2B2B33; margin: 0; padding: 32px;
  }
  .brand { font-size: 13px; color: #8B7EBD; font-weight: 700; letter-spacing: 1.2px; }
  h1 { font-size: 22px; margin: 4px 0 2px; }
  .meta { font-size: 12px; color: #7A7A88; margin-bottom: 20px; }
  .summary { display: flex; gap: 10px; margin-bottom: 22px; }
  .card { flex: 1; border: 1px solid #ECE8F5; border-radius: 12px; padding: 12px 14px; }
  .card .label { font-size: 11px; color: #7A7A88; }
  .card .value { font-size: 20px; font-weight: 700; margin-top: 2px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { text-align: left; background: #F5F2FB; color: #5B5570; padding: 8px 10px; font-weight: 600; }
  td { padding: 8px 10px; border-bottom: 1px solid #F0EEF6; vertical-align: top; }
  td.date { font-weight: 700; white-space: nowrap; background: #FBFAFE; }
  td.drug { font-weight: 600; }
  td.time { color: #9A9AA8; white-space: nowrap; }
  .badge { display: inline-block; padding: 2px 8px; border-radius: 999px; font-size: 11px; font-weight: 700; }
  .empty { color: #9A9AA8; padding: 24px 0; text-align: center; }
  .footer { margin-top: 18px; font-size: 10px; color: #B5B5C0; text-align: right; }
</style>
</head>
<body>
  <div class="brand">DearMI</div>
  <h1>${esc(t('settings:medication_pdf_doc_title'))}</h1>
  <div class="meta">${esc(t('settings:medication_pdf_period'))}: ${esc(history.startDate || '-')} ~ ${esc(history.endDate || '-')}</div>
  <div class="summary">
    <div class="card"><div class="label">${esc(t('settings:medication_pdf_total'))}</div><div class="value">${total}</div></div>
    <div class="card"><div class="label">${esc(t('settings:medication_status_taken'))}</div><div class="value" style="color:#10B981">${stats?.takenCount ?? '-'}</div></div>
    <div class="card"><div class="label">${esc(t('settings:medication_status_skipped'))}</div><div class="value" style="color:#F59E0B">${stats?.skippedCount ?? '-'}</div></div>
    <div class="card"><div class="label">${esc(t('settings:medication_pdf_rate'))}</div><div class="value" style="color:#8B7EBD">${ratePct}%</div></div>
  </div>
  <table>
    <thead><tr>
      <th>${esc(t('settings:medication_pdf_col_date'))}</th>
      <th>${esc(t('settings:medication_pdf_col_slot'))}</th>
      <th>${esc(t('settings:medication_pdf_col_drug'))}</th>
      <th>${esc(t('settings:medication_pdf_col_status'))}</th>
      <th>${esc(t('settings:medication_pdf_col_time'))}</th>
    </tr></thead>
    <tbody>${rowsHtml || `<tr><td colspan="5" class="empty">—</td></tr>`}</tbody>
  </table>
  <div class="footer">${esc(t('settings:medication_pdf_footer'))}</div>
</body>
</html>`;
};

/**
 * 복약 이력을 PDF 로 생성해 공유 시트로 내보낸다 (앱 측 생성: expo-print → expo-sharing).
 * 한글 폰트는 기기 WebView 가 렌더하므로 별도 임베딩 불필요.
 */
export const exportMedicationHistoryPdf = async (args: {
  history: MedicationHistory;
  stats: MedicationStats | null;
  t: TFunc;
}): Promise<void> => {
  const html = buildHtml(args.history, args.stats, args.t);
  const { uri } = await Print.printToFileAsync({ html });

  if (!(await Sharing.isAvailableAsync())) {
    throw new Error('sharing-unavailable');
  }
  await Sharing.shareAsync(uri, {
    mimeType: 'application/pdf',
    dialogTitle: args.t('settings:medication_pdf_dialog'),
    UTI: 'com.adobe.pdf',
  });
};
