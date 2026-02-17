import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { AnimatedPressable } from '@/shared/components/AnimatedPressable';
import { CacheService } from '@/shared/cache';
import { CACHE_KEYS } from '@/constants/cacheKeys';
import { useSearch, useRecentSearches } from '@/features/search/hooks/useSearch';
import type { SearchType } from '@/features/search/api/searchApi';
import { PRESET_TAG_KEYS, expandTagForSearch } from '@/features/checkin/triggerTags';
import { SectionHeader } from '@/features/search/components/SearchResultSection';
import { useAuthStore } from '@/features/auth/store/authStore';
import { navigationRef } from '@/navigation/navigationRef';
import type { RootStackParamList } from '@/navigation/RootNavigator';
import { useRoute, type RouteProp } from '@react-navigation/native';

type Nav = StackNavigationProp<RootStackParamList, 'Search'>;

const useScopeMeta = (): Record<SearchType, { placeholder: string }> => {
  const { t } = useTranslation('common');
  return {
    RECORD: { placeholder: t('search_placeholder_record') },
    CHECKIN: { placeholder: t('search_placeholder_checkin') },
    PREPNOTE: { placeholder: t('search_placeholder_prepnote') },
  };
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

/** Keyword highlighting with primaryMuted background */
const HighlightText: React.FC<{
  text: string;
  keyword: string;
  style?: object;
  numberOfLines?: number;
  colors: any;
}> = ({ text, keyword, style, numberOfLines, colors }) => {
  if (!keyword.trim()) {
    return (
      <Text style={style} numberOfLines={numberOfLines}>
        {text}
      </Text>
    );
  }

  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const parts = text.split(new RegExp(`(${escaped})`, 'gi'));

  return (
    <Text style={style} numberOfLines={numberOfLines}>
      {parts.map((part, i) =>
        part.toLowerCase() === keyword.toLowerCase() ? (
          <Text
            key={i}
            style={{
              fontFamily: fontFamily.bold,
              color: colors.accent,
              backgroundColor: colors.accentMuted,
              borderRadius: 4,
            }}
          >
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
};

export const SearchScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<RouteProp<RootStackParamList, 'Search'>>();
  const scope = route.params?.scope as SearchType | undefined;
  const { t } = useTranslation('checkin');
  const { t: tCommon } = useTranslation('common');
  const SCOPE_META = useScopeMeta();
  const user = useAuthStore((s) => s.user);
  const isPremium = user?.plan === 'PREMIUM';

  const [keyword, setKeyword] = useState('');
  const [submitted, setSubmitted] = useState('');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const inputRef = useRef<TextInput>(null);

  const { load: loadRecent, save: saveRecent, remove: removeRecent } = useRecentSearches();
  const [recentSearches, setRecentSearches] = useState<string[]>(() => loadRecent());

  // 백엔드에 보낼 때는 key 를 한/영 전체 형태로 확장 — 레거시 문자열 데이터도 매칭
  const activeTags = useMemo(() => {
    if (scope !== 'CHECKIN') return undefined;
    return selectedTags.flatMap(expandTagForSearch);
  }, [scope, selectedTags]);
  const { data, isFetching, isDebouncing } = useSearch(submitted, scope, activeTags);

  const placeholder = scope ? SCOPE_META[scope].placeholder : tCommon('search_placeholder_all');
  const showRecords = !scope || scope === 'RECORD';
  const showCheckins = !scope || scope === 'CHECKIN';
  const showPrepNotes = !scope || scope === 'PREPNOTE';

  // 'none' 은 "특별한 이유 없음" — 필터 칩으로는 굳이 노출하지 않음 (폼에서만 의미 있음)
  const TRIGGER_TAGS = useMemo(
    () => PRESET_TAG_KEYS.filter((k) => k !== 'none'),
    [],
  );

  const toggleTag = useCallback((tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  }, []);

  const shadow = softShadow(colors);

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

  /** 검색 결과 탭 -> 해당 화면으로 딥링크 */
  const navigateToRecord = (id: string) => {
    navigation.goBack();
    setTimeout(() => {
      (navigationRef.current as any)?.navigate('Main', {
        screen: 'Care',
        params: { screen: 'RecordForm', params: { recordId: id } },
      });
    }, 300);
  };

  const navigateToPrepNote = (id: string, scheduleId?: string | null) => {
    navigation.goBack();
    setTimeout(() => {
      (navigationRef.current as any)?.navigate('Main', {
        screen: 'Care',
        params: {
          screen: 'PrepNoteForm',
          params: { noteId: id, scheduleId: scheduleId ?? undefined },
        },
      });
    }, 300);
  };

  const isLoading = isFetching || isDebouncing;
  const hasQuery = submitted.trim().length > 0 || (activeTags != null && activeTags.length > 0);

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.sm,
      gap: sizes.spacing.sm,
      backgroundColor: colors.surface,
      borderBottomWidth: 1,
      borderBottomColor: colors.divider,
    },
    searchBar: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: sizes.radius.full,
      borderWidth: 1,
      borderColor: colors.divider,
      paddingHorizontal: sizes.spacing.md,
      height: 52,
      gap: sizes.spacing.sm,
    },
    searchInput: {
      flex: 1,
      fontSize: sizes.font.md,
      fontFamily: fontFamily.regular,
      color: colors.text,
      padding: 0,
    },
    cancelBtn: { paddingVertical: sizes.spacing.xs, paddingHorizontal: sizes.spacing.xs },
    cancelText: { fontSize: sizes.font.md, fontFamily: fontFamily.medium, color: colors.textSub },
    content: { padding: sizes.spacing.lg, paddingBottom: 40 },
    freeBanner: {
      backgroundColor: colors.accentMuted,
      borderRadius: sizes.radius.xxl,
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
      fontFamily: fontFamily.regular,
      color: colors.textSub,
      lineHeight: 18,
    },
    freeBannerLink: {
      fontSize: sizes.font.xs,
      color: colors.primary,
      fontFamily: fontFamily.semibold,
    },
    spinner: { marginTop: sizes.spacing.xl },
    emptyWrap: { marginTop: sizes.spacing.xxl, alignItems: 'center' },
    emptyText: { fontSize: sizes.font.md, fontFamily: fontFamily.medium, color: colors.textSub },
    recentSection: { gap: sizes.spacing.sm },
    recentHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: sizes.spacing.sm,
    },
    recentTitle: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.bold,
      color: colors.textSub,
    },
    recentClearAll: { fontSize: sizes.font.xs, fontFamily: fontFamily.medium, color: colors.textDisabled },
    recentChipWrap: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sizes.spacing.sm,
    },
    recentChip: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.primaryMuted,
      borderRadius: sizes.radius.full,
      paddingHorizontal: 14,
      paddingVertical: 8,
      gap: 6,
    },
    recentChipText: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.medium,
      color: colors.text,
    },
    recentChipRemove: {
      marginLeft: 2,
    },
    resultCard: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      padding: sizes.spacing.lg,
      marginBottom: sizes.spacing.sm,
      gap: sizes.spacing.xs,
    },
    resultContent: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.regular,
      color: colors.text,
      lineHeight: 22,
    },
    resultMeta: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.regular,
      color: colors.textDisabled,
    },
  }), [colors]);

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 검색창 */}
      <View style={styles.header}>
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={18} color={colors.textDisabled} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            value={keyword}
            onChangeText={setKeyword}
            onSubmitEditing={() => handleSearch(keyword)}
            placeholder={placeholder}
            placeholderTextColor={colors.textDisabled}
            returnKeyType="search"
            autoFocus
          />
          {keyword.length > 0 && (
            <TouchableOpacity onPress={handleClear} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={colors.textDisabled} />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={8} style={styles.cancelBtn}>
          <Text style={styles.cancelText}>{tCommon('cancel')}</Text>
        </TouchableOpacity>
      </View>

      {/* 체크인 태그 필터 */}
      {scope === 'CHECKIN' && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            paddingHorizontal: sizes.spacing.md,
            paddingVertical: sizes.spacing.sm,
            gap: sizes.spacing.xs,
          }}
          keyboardShouldPersistTaps="handled"
        >
          {TRIGGER_TAGS.map((tagKey) => {
            const isActive = selectedTags.includes(tagKey);
            return (
              <TouchableOpacity
                key={tagKey}
                onPress={() => toggleTag(tagKey)}
                style={{
                  paddingHorizontal: 14,
                  paddingVertical: 7,
                  borderRadius: sizes.radius.full,
                  borderWidth: 1,
                  backgroundColor: isActive ? colors.accentMuted : colors.surface,
                  borderColor: isActive ? colors.accent : colors.divider,
                }}
              >
                <Text
                  style={{
                    fontSize: sizes.font.xs,
                    fontFamily: isActive ? fontFamily.semibold : fontFamily.regular,
                    color: isActive ? colors.accent : colors.textSub,
                  }}
                >
                  {t(`trigger_tags.${tagKey}`)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
      >
        {/* 무료 플랜 안내 배너 */}
        {!isPremium && (
          <View style={styles.freeBanner}>
            <Text style={styles.freeBannerText}>
              {tCommon('search_free_banner')}
            </Text>
            <TouchableOpacity
              onPress={() => {
                navigation.goBack();
                setTimeout(() => (navigationRef.current as any)?.navigate('Paywall'), 300);
              }}
            >
              <Text style={styles.freeBannerLink}>{tCommon('upgrade_arrow')}</Text>
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
            {(showRecords ? data.recordTotal : 0) === 0 &&
             (showCheckins ? data.checkinTotal : 0) === 0 &&
             (showPrepNotes ? data.prepNoteTotal : 0) === 0 ? (
              <View style={styles.emptyWrap}>
                <Text style={styles.emptyText}>{tCommon('search_no_result', { keyword: submitted })}</Text>
              </View>
            ) : (
              <>
                {/* 진료 기록 */}
                {showRecords && data.recordTotal > 0 && (
                  <View>
                    <SectionHeader title={tCommon('search_section_record')} count={data.recordTotal} />
                    {data.records.map((r) => (
                      <AnimatedPressable
                        key={r.id}
                        onPress={() => navigateToRecord(r.id)}
                        style={[styles.resultCard, shadow]}
                      >
                        <HighlightText
                          text={r.content}
                          keyword={submitted}
                          style={styles.resultContent}
                          numberOfLines={3}
                          colors={colors}
                        />
                        <Text style={styles.resultMeta}>{formatDate(r.createdAt)}</Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                )}

                {/* 하루 메모 */}
                {showCheckins && data.checkinTotal > 0 && (
                  <View>
                    <SectionHeader title={tCommon('search_section_checkin')} count={data.checkinTotal} />
                    {data.checkins.map((c) => (
                      <AnimatedPressable
                        key={c.id}
                        onPress={() => {/* 하루 메모 화면 미구현 */}}
                        style={[styles.resultCard, shadow]}
                      >
                        <HighlightText
                          text={c.memo ?? ''}
                          keyword={submitted}
                          style={styles.resultContent}
                          numberOfLines={3}
                          colors={colors}
                        />
                        <Text style={styles.resultMeta}>{c.checkedAt}</Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                )}

                {/* 준비 메모 */}
                {showPrepNotes && data.prepNoteTotal > 0 && (
                  <View>
                    <SectionHeader title={tCommon('search_section_prepnote')} count={data.prepNoteTotal} />
                    {data.prepNotes.map((p) => (
                      <AnimatedPressable
                        key={p.id}
                        onPress={() => navigateToPrepNote(p.id, p.scheduleId)}
                        style={[styles.resultCard, shadow]}
                      >
                        <HighlightText
                          text={p.content}
                          keyword={submitted}
                          style={styles.resultContent}
                          numberOfLines={3}
                          colors={colors}
                        />
                        <Text style={styles.resultMeta}>{formatDate(p.createdAt)}</Text>
                      </AnimatedPressable>
                    ))}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* 최근 검색어 (검색 전) — pill chips */}
        {!hasQuery && recentSearches.length > 0 && (
          <View style={styles.recentSection}>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>{tCommon('search_recent')}</Text>
              <TouchableOpacity onPress={handleClearAll} hitSlop={8}>
                <Text style={styles.recentClearAll}>{tCommon('search_clear_all')}</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.recentChipWrap}>
              {recentSearches.map((k) => (
                <AnimatedPressable
                  key={k}
                  onPress={() => handleSearch(k)}
                  style={styles.recentChip}
                >
                  <Ionicons name="search-outline" size={13} color={colors.textSub} />
                  <Text style={styles.recentChipText}>{k}</Text>
                  <TouchableOpacity onPress={() => handleRemoveRecent(k)} hitSlop={6} style={styles.recentChipRemove}>
                    <Ionicons name="close" size={13} color={colors.textDisabled} />
                  </TouchableOpacity>
                </AnimatedPressable>
              ))}
            </View>
          </View>
        )}

        {!hasQuery && recentSearches.length === 0 && (
          <View style={styles.emptyWrap}>
            <Text style={styles.emptyText}>{tCommon('search_empty_hint')}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};
