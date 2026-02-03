import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { colors, sizes } from '@/constants';
import { CacheService } from '@/shared/cache';
import { CACHE_KEYS } from '@/constants/cacheKeys';
import { useSearch, useRecentSearches } from '@/features/search/hooks/useSearch';
import { SectionHeader, ResultCard } from '@/features/search/components/SearchResultSection';
import { useAuthStore } from '@/features/auth/store/authStore';
import { navigationRef } from '@/navigation/navigationRef';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'Search'>;

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export const SearchScreen: React.FC = () => {
  const navigation = useNavigation<Nav>();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';

  const [keyword, setKeyword] = useState('');
  const [submitted, setSubmitted] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { load: loadRecent, save: saveRecent, remove: removeRecent } = useRecentSearches();
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecent());

  const { data, isFetching, isDebouncing } = useSearch(submitted);

  const handleSearch = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      setKeyword(trimmed);
      setSubmitted(trimmed);
      saveRecent(trimmed);
      setRecentSearches(loadRecent());
      inputRef.current?.blur();
    },
    [saveRecent, loadRecent]
  );

  const handleClear = () => {
    setKeyword('');
    setSubmitted('');
    inputRef.current?.focus();
  };

  const handleRemoveRecent = (k: string) => {
    removeRecent(k);
    setRecentSearches(loadRecent());
  };

  const handleClearAll = () => {
    CacheService.delete(CACHE_KEYS.RECENT_SEARCHES);
    setRecentSearches([]);
  };

  /** 검색 결과 탭 → 해당 화면으로 딥링크 */
  const navigateToRecord = (id: string) => {
    navigation.goBack();
    setTimeout(() => {
      (navigationRef.current as any)?.navigate('Main', {
        screen: 'Record',
        params: { screen: 'RecordForm', params: { recordId: id } },
      });
    }, 300);
  };

  const navigateToPrepNote = (id: string, scheduleId?: string | null) => {
    navigation.goBack();
    setTimeout(() => {
      (navigationRef.current as any)?.navigate('Main', {
        screen: 'Schedule',
        params: {
          screen: 'PrepNoteForm',
          params: { noteId: id, scheduleId: scheduleId ?? undefined },
        },
      });
    }, 300);
  };

  const isLoading = isFetching || isDebouncing;
  const hasQuery = submitted.trim().length > 0;

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 검색창 */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => handleSearch(keyword)}
            placeholder="진료 기록, 준비 메모 검색"
            placeholderTextColor={colors.text.disabled}
            returnKeyType="search"
            autoFocus
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={8}>
              <Text style={styles.clearBtn}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>취소</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* 무료 플랜 안내 배너 */}
        {!isPremium && (
          <View style={styles.freeBanner}>
            <Text style={styles.freeBannerText}>
              무료 플랜에서는 최근 2개월 이내 결과만 검색돼요.
            </Text>
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
                setTimeout(() => (navigationRef.current as any)?.navigate('Paywall'), 300);
              }}
            >
              <Text style={styles.freeBannerLink}>업그레이드 →</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 검색 중 */}
        {hasQuery && isLoading && (
          <ActivityIndicator style={styles.spinner} color={colors.primary} />
        )}

        {/* 검색 결과 */}
        {hasQuery && !isLoading && data && (
          <>
            {data.recordTotal === 0 && data.checkinTotal === 0 && data.prepNoteTotal === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>'{submitted}'에 대한 결과가 없어요.</Text>
              </View>
            ) : (
              <>
                {/* 진료 기록 */}
                {data.recordTotal > 0 && (
                  <View>
                    <SectionHeader title="진료 기록" count={data.recordTotal} />
                    {data.records.map((r) => (
                      <ResultCard
                        key={r.id}
                        content={r.content}
                        keyword={submitted}
                        meta={formatDate(r.createdAt)}
                        onPress={() => navigateToRecord(r.id)}
                      />
                    ))}
                  </View>
                )}

                {/* 하루 메모 */}
                {data.checkinTotal > 0 && (
                  <View>
                    <SectionHeader title="하루 메모" count={data.checkinTotal} />
                    {data.checkins.map((c) => (
                      <ResultCard
                        key={c.id}
                        content={c.memo ?? ''}
                        keyword={submitted}
                        meta={c.checkedAt}
                        onPress={() => {/* 하루 메모 화면 미구현 */}}
                      />
                    ))}
                  </View>
                )}

                {/* 준비 메모 */}
                {data.prepNoteTotal > 0 && (
                  <View>
                    <SectionHeader title="준비 메모" count={data.prepNoteTotal} />
                    {data.prepNotes.map((p) => (
                      <ResultCard
                        key={p.id}
                        content={p.content}
                        keyword={submitted}
                        meta={formatDate(p.createdAt)}
                        onPress={() => navigateToPrepNote(p.id, p.scheduleId)}
                      />
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* 최근 검색어 (검색 전) */}
        {!hasQuery && recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>최근 검색어</Text>
              <TouchableOpacity onPress={handleClearAll} hitSlop={8}>
                <Text style={styles.recentClearAll}>전체 삭제</Text>
              </TouchableOpacity>
            </View>
            {recentSearches.map((k) => (
              <View key={k} style={styles.recentItem}>
                <TouchableOpacity style={styles.recentKeyword} onPress={() => handleSearch(k)}>
                  <Text style={styles.recentIcon}>🔍</Text>
                  <Text style={styles.recentText}>{k}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleRemoveRecent(k)} hitSlop={8}>
                  <Text style={styles.recentRemove}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {!hasQuery && recentSearches.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>검색어를 입력해 보세요.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    gap: sizes.spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background,
    borderRadius: sizes.radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: sizes.spacing.md,
    height: 40,
    gap: sizes.spacing.sm,
  },
  searchIcon: { fontSize: 14 },
  searchInput: {
    flex: 1,
    fontSize: sizes.font.md,
    color: colors.text.primary,
    padding: 0,
  },
  clearBtn: {
    fontSize: 13,
    color: colors.text.disabled,
    fontWeight: sizes.fontWeight.bold,
  },
  cancelBtn: { paddingVertical: sizes.spacing.xs },
  cancelText: { fontSize: sizes.font.md, color: colors.text.secondary },
  content: { padding: sizes.spacing.lg, paddingBottom: 40 },
  freeBanner: {
    backgroundColor: colors.primary + '10',
    borderRadius: sizes.radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '30',
    padding: sizes.spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizes.spacing.md,
    gap: sizes.spacing.sm,
  },
  freeBannerText: {
    flex: 1,
    fontSize: sizes.font.xs,
    color: colors.text.secondary,
    lineHeight: 18,
  },
  freeBannerLink: {
    fontSize: sizes.font.xs,
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  spinner: { marginTop: sizes.spacing.xl },
  emptyWrap: { marginTop: sizes.spacing.xxl, alignItems: 'center' },
  emptyText: { fontSize: sizes.font.md, color: colors.text.secondary },
  recentSection: { gap: sizes.spacing.xs },
  recentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: sizes.spacing.xs,
  },
  recentTitle: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.secondary,
  },
  recentClearAll: { fontSize: sizes.font.xs, color: colors.text.disabled },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: sizes.spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  recentKeyword: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
  },
  recentIcon: { fontSize: 13, color: colors.text.disabled },
  recentText: { fontSize: sizes.font.md, color: colors.text.primary },
  recentRemove: {
    fontSize: 13,
    color: colors.text.disabled,
    paddingHorizontal: sizes.spacing.xs,
  },
});
