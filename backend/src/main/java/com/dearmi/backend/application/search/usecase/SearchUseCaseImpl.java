package com.dearmi.backend.application.search.usecase;

import com.dearmi.backend.application.search.dto.*;
import com.dearmi.backend.domain.checkin.DailyCheckin;
import com.dearmi.backend.domain.checkin.DailyCheckinRepository;
import com.dearmi.backend.domain.counseling.CounselingRecord;
import com.dearmi.backend.domain.counseling.CounselingRecordRepository;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;

/**
 * 통합 검색 UseCase.
 *
 * <p><b>성능 노트 — 진료기록(CounselingRecord) 검색</b><br>
 * content 컬럼이 AES-256-GCM 으로 암호화되어 있어 DB LIKE 검색 불가능 →
 * 날짜 범위로만 DB 필터, 결과를 인메모리 복호화 후 {@code String.contains()} 매칭.
 * FREE 플랜 2개월 cutoff 로 충격 완화 중. PREMIUM + 수천 건 시 응답 지연 가능.
 *
 * <p><b>장기 개선 후보</b>: 검색용 bi-gram 토큰 컬럼 도입.
 * <ol>
 *   <li>레코드 저장/수정 시 본문에서 2글자 단위 토큰 추출 → 각 토큰을 SHA-256(token + perUserSalt)
 *       으로 해시 → JSONB array {@code search_tokens} 컬럼에 저장. salt 가 유저별이면
 *       cross-user 분석 불가, 단일 키 누출 시에도 평문 복원은 불가.</li>
 *   <li>검색어도 같은 방식으로 bi-gram + 해시 → {@code search_tokens @> :tokens} GIN 인덱스로 1차 필터.</li>
 *   <li>1차 후보만 복호화하여 false positive 제거 (해시 충돌 / 부분일치 정밀도 보정).</li>
 * </ol>
 * 도입 결정 트리거: PREMIUM 활성 유저 평균 보유 기록 1000건 초과 또는 검색 응답 P95 > 800ms.
 * 그 전까지는 현재 인메모리 방식 유지 (운영 단순성 우선).
 */
@Service
@RequiredArgsConstructor
public class SearchUseCaseImpl implements SearchUseCase {

    private final CounselingRecordRepository counselingRecordRepository;
    private final DailyCheckinRepository dailyCheckinRepository;
    private final PrepNoteRepository prepNoteRepository;
    private final SubscriptionRepository subscriptionRepository;

    @Override
    @Transactional(readOnly = true)
    public SearchResult search(SearchCommand command) {
        boolean isPremium = subscriptionRepository.findByUserId(command.userId())
                .map(s -> s.isPremium())
                .orElse(false);

        LocalDateTime recordCutoff   = isPremium ? null : LocalDateTime.now().minusMonths(2);
        LocalDate    checkinCutoff   = isPremium ? null : LocalDate.now().minusMonths(2);
        LocalDateTime prepNoteCutoff = isPremium ? null : LocalDateTime.now().minusMonths(2);

        int offset = command.page() * command.size();
        int limit  = command.size();

        List<RecordSearchResult>   records   = Collections.emptyList();
        long                       recordTotal = 0L;
        List<CheckinSearchResult>  checkins  = Collections.emptyList();
        long                       checkinTotal = 0L;
        List<PrepNoteSearchResult> prepNotes = Collections.emptyList();
        long                       prepNoteTotal = 0L;

        if (command.types().contains(SearchType.RECORD)) {
            // CounselingRecord.content 는 AES-256-GCM 암호화 → DB LIKE 불가
            // 날짜 범위만 DB에서 필터링 후 인메모리 키워드 매칭
            List<CounselingRecord> allRecords = recordCutoff != null
                    ? counselingRecordRepository
                        .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(
                                command.userId(), recordCutoff)
                    : counselingRecordRepository
                        .findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(command.userId());

            List<CounselingRecord> filtered = filterRecords(allRecords, command.keyword());
            recordTotal = filtered.size();
            records = filtered.stream()
                    .skip(offset)
                    .limit(limit)
                    .map(RecordSearchResult::from)
                    .toList();
        }

        if (command.types().contains(SearchType.CHECKIN)) {
            boolean hasTags = command.tags() != null && !command.tags().isEmpty();
            if (hasTags) {
                checkinTotal = dailyCheckinRepository.countByKeywordAndTags(
                        command.userId(), command.keyword(), command.tags(), checkinCutoff);
                List<DailyCheckin> checkinList = dailyCheckinRepository.searchByKeywordAndTags(
                        command.userId(), command.keyword(), command.tags(), checkinCutoff, offset, limit);
                checkins = checkinList.stream().map(CheckinSearchResult::from).toList();
            } else {
                checkinTotal = dailyCheckinRepository.countByKeyword(
                        command.userId(), command.keyword(), checkinCutoff);
                List<DailyCheckin> checkinList = dailyCheckinRepository.searchByKeyword(
                        command.userId(), command.keyword(), checkinCutoff, offset, limit);
                checkins = checkinList.stream().map(CheckinSearchResult::from).toList();
            }
        }

        if (command.types().contains(SearchType.PREPNOTE)) {
            prepNoteTotal = prepNoteRepository.countByKeyword(
                    command.userId(), command.keyword(), prepNoteCutoff);
            List<PrepNote> prepNoteList = prepNoteRepository.searchByKeyword(
                    command.userId(), command.keyword(), prepNoteCutoff, offset, limit);
            prepNotes = prepNoteList.stream().map(PrepNoteSearchResult::from).toList();
        }

        return new SearchResult(records, recordTotal, checkins, checkinTotal, prepNotes, prepNoteTotal);
    }

    private List<CounselingRecord> filterRecords(List<CounselingRecord> records, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return records;
        }
        String lowerKeyword = keyword.toLowerCase();
        return records.stream()
                .filter(r -> matchesKeyword(r, lowerKeyword))
                .toList();
    }

    private boolean matchesKeyword(CounselingRecord record, String lowerKeyword) {
        if (record.getContent() != null
                && record.getContent().toLowerCase().contains(lowerKeyword)) {
            return true;
        }
        if (record.getTags() != null) {
            return record.getTags().stream()
                    .anyMatch(tag -> tag.toLowerCase().contains(lowerKeyword));
        }
        return false;
    }
}
