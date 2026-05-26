import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';

/** 키워드 하이라이팅 */
export const HighlightText: React.FC<{
  text: string;
  keyword: string;
  style?: object;
  numberOfLines?: number;
}> = ({ text, keyword, style, numberOfLines }) => {
  const { colors } = useTheme();

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
          <Text key={i} style={{ color: colors.primary, fontWeight: '700' as const, backgroundColor: colors.primary + '18' }}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
};

/** 섹션 헤더 */
export const SectionHeader: React.FC<{ title: string; count: number }> = ({ title, count }) => {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  return (
    <View style={styles.sectionHeader}>
      <Text style={[styles.sectionTitle, { color: colors.textSub }]}>{title}</Text>
      <Text style={[styles.sectionCount, { color: colors.textDisabled }]}>{t('search_count', { count })}</Text>
    </View>
  );
};

/** 개별 결과 카드 */
export const ResultCard: React.FC<{
  content: string;
  keyword: string;
  meta?: string;
  onPress: () => void;
}> = ({ content, keyword, meta, onPress }) => {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.divider }]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <HighlightText
        text={content}
        keyword={keyword}
        style={[styles.cardContent, { color: colors.text }]}
        numberOfLines={3}
      />
      {meta && <Text style={[styles.cardMeta, { color: colors.textDisabled }]}>{meta}</Text>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: sizes.spacing.xs,
    marginTop: sizes.spacing.md,
    marginBottom: sizes.spacing.xs,
  },
  sectionTitle: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: sizes.font.xs,
  },
  card: {
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    borderWidth: 1,
    marginBottom: sizes.spacing.sm,
    gap: sizes.spacing.xs,
  },
  cardContent: {
    fontSize: sizes.font.md,
    lineHeight: 22,
  },
  cardMeta: {
    fontSize: sizes.font.xs,
  },
});
