package com.dearmi.backend.search;

import com.dearmi.backend.application.search.dto.*;
import com.dearmi.backend.application.search.usecase.SearchUseCaseImpl;
import com.dearmi.backend.domain.checkin.DailyCheckin;
import com.dearmi.backend.domain.checkin.DailyCheckinRepository;
import com.dearmi.backend.domain.record.CounselingRecord;
import com.dearmi.backend.domain.record.CounselingRecordRepository;
import com.dearmi.backend.domain.prepnote.PrepNote;
import com.dearmi.backend.domain.prepnote.PrepNoteRepository;
import com.dearmi.backend.domain.subscription.Subscription;
import com.dearmi.backend.domain.subscription.SubscriptionRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SearchUseCaseImplTest {

    @Mock private CounselingRecordRepository counselingRecordRepository;
    @Mock private DailyCheckinRepository dailyCheckinRepository;
    @Mock private PrepNoteRepository prepNoteRepository;
    @Mock private SubscriptionRepository subscriptionRepository;

    @InjectMocks
    private SearchUseCaseImpl searchUseCase;

    @Test
    @DisplayName("FREE 플랜: 상담 기록 조회 시 2개월 날짜 필터가 적용된다")
    void free_plan_uses_date_cutoff_for_records() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(counselingRecordRepository
                .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(eq(userId), any()))
                .thenReturn(List.of());

        SearchCommand command = new SearchCommand(userId, "불안", Set.of(SearchType.RECORD), null, 0, 20);
        searchUseCase.search(command);

        verify(counselingRecordRepository)
                .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(eq(userId), any());
        verify(counselingRecordRepository, never())
                .findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(any());
    }

    @Test
    @DisplayName("PREMIUM 플랜: 상담 기록 전체 기간 조회")
    void premium_plan_fetches_all_records() {
        UUID userId = UUID.randomUUID();
        Subscription premium = Subscription.builder().userId(userId).build();
        premium.upgradeToPremium(java.time.LocalDateTime.now(), java.time.LocalDateTime.now().plusYears(1));
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.of(premium));
        when(counselingRecordRepository.findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId))
                .thenReturn(List.of());

        searchUseCase.search(new SearchCommand(userId, "스트레스", Set.of(SearchType.RECORD), null, 0, 20));

        verify(counselingRecordRepository).findByUserIdAndDeletedAtIsNullOrderByCreatedAtDesc(userId);
    }

    @Test
    @DisplayName("상담 기록 인메모리 키워드 필터: content 매칭")
    void record_in_memory_filter_by_content() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());

        CounselingRecord matching = CounselingRecord.builder()
                .userId(userId).content("불안감이 심해졌어요").tags(List.of()).build();
        CounselingRecord notMatching = CounselingRecord.builder()
                .userId(userId).content("오늘은 괜찮았어요").tags(List.of()).build();

        when(counselingRecordRepository
                .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(eq(userId), any()))
                .thenReturn(List.of(matching, notMatching));

        SearchResult result = searchUseCase.search(
                new SearchCommand(userId, "불안", Set.of(SearchType.RECORD), null, 0, 20));

        assertThat(result.records()).hasSize(1);
        assertThat(result.records().get(0).content()).contains("불안감");
        assertThat(result.recordTotal()).isEqualTo(1);
    }

    @Test
    @DisplayName("상담 기록 인메모리 키워드 필터: tags 매칭")
    void record_in_memory_filter_by_tags() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());

        CounselingRecord matching = CounselingRecord.builder()
                .userId(userId).content("기록").tags(List.of("스트레스", "불안")).build();
        CounselingRecord notMatching = CounselingRecord.builder()
                .userId(userId).content("기록").tags(List.of("수면")).build();

        when(counselingRecordRepository
                .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(eq(userId), any()))
                .thenReturn(List.of(matching, notMatching));

        SearchResult result = searchUseCase.search(
                new SearchCommand(userId, "스트레스", Set.of(SearchType.RECORD), null, 0, 20));

        assertThat(result.records()).hasSize(1);
        assertThat(result.recordTotal()).isEqualTo(1);
    }

    @Test
    @DisplayName("keyword null/blank 이면 상담 기록 전체 반환")
    void blank_keyword_returns_all_records() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());

        CounselingRecord r1 = CounselingRecord.builder()
                .userId(userId).content("내용1").tags(List.of()).build();
        CounselingRecord r2 = CounselingRecord.builder()
                .userId(userId).content("내용2").tags(List.of()).build();

        when(counselingRecordRepository
                .findByUserIdAndDeletedAtIsNullAndCreatedAtAfterOrderByCreatedAtDesc(eq(userId), any()))
                .thenReturn(List.of(r1, r2));

        SearchResult result = searchUseCase.search(
                new SearchCommand(userId, "  ", Set.of(SearchType.RECORD), null, 0, 20));

        assertThat(result.records()).hasSize(2);
        assertThat(result.recordTotal()).isEqualTo(2);
    }

    @Test
    @DisplayName("체크인 검색: QueryDSL 경로 사용")
    void checkin_search_delegates_to_repository() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());

        DailyCheckin checkin = DailyCheckin.builder()
                .userId(userId).checkedAt(LocalDate.now()).emotionScore((short) 3).memo("피곤함").build();

        when(dailyCheckinRepository.countByKeyword(eq(userId), eq("피곤"), any())).thenReturn(1L);
        when(dailyCheckinRepository.searchByKeyword(eq(userId), eq("피곤"), any(), eq(0), eq(20)))
                .thenReturn(List.of(checkin));

        SearchResult result = searchUseCase.search(
                new SearchCommand(userId, "피곤", Set.of(SearchType.CHECKIN), null, 0, 20));

        assertThat(result.checkins()).hasSize(1);
        assertThat(result.checkinTotal()).isEqualTo(1);
    }

    @Test
    @DisplayName("준비 메모 검색: QueryDSL 경로 사용")
    void prepnote_search_delegates_to_repository() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());

        PrepNote note = PrepNote.builder()
                .userId(userId).content("복용 중인 약 목록 확인").build();

        when(prepNoteRepository.countByKeyword(eq(userId), eq("약"), any())).thenReturn(1L);
        when(prepNoteRepository.searchByKeyword(eq(userId), eq("약"), any(), eq(0), eq(20)))
                .thenReturn(List.of(note));

        SearchResult result = searchUseCase.search(
                new SearchCommand(userId, "약", Set.of(SearchType.PREPNOTE), null, 0, 20));

        assertThat(result.prepNotes()).hasSize(1);
        assertThat(result.prepNoteTotal()).isEqualTo(1);
    }

    @Test
    @DisplayName("types 에 없는 도메인은 조회하지 않는다")
    void does_not_query_excluded_types() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(dailyCheckinRepository.countByKeyword(any(), any(), any())).thenReturn(0L);
        when(dailyCheckinRepository.searchByKeyword(any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of());

        searchUseCase.search(new SearchCommand(userId, "불안", Set.of(SearchType.CHECKIN), null, 0, 20));

        verifyNoInteractions(counselingRecordRepository);
        verifyNoInteractions(prepNoteRepository);
    }

    @Test
    @DisplayName("페이지네이션: 2페이지 조회 시 올바른 offset 전달")
    void pagination_passes_correct_offset() {
        UUID userId = UUID.randomUUID();
        when(subscriptionRepository.findByUserId(userId)).thenReturn(Optional.empty());
        when(prepNoteRepository.countByKeyword(any(), any(), any())).thenReturn(0L);
        when(prepNoteRepository.searchByKeyword(any(), any(), any(), anyInt(), anyInt()))
                .thenReturn(List.of());

        searchUseCase.search(new SearchCommand(userId, null, Set.of(SearchType.PREPNOTE), null, 2, 10));

        ArgumentCaptor<Integer> offsetCaptor = ArgumentCaptor.forClass(Integer.class);
        ArgumentCaptor<Integer> limitCaptor = ArgumentCaptor.forClass(Integer.class);
        verify(prepNoteRepository).searchByKeyword(any(), any(), any(),
                offsetCaptor.capture(), limitCaptor.capture());
        assertThat(offsetCaptor.getValue()).isEqualTo(20); // page=2, size=10 → offset=20
        assertThat(limitCaptor.getValue()).isEqualTo(10);
    }
}
