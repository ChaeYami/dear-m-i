import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, sizes } from '@/constants';

/** 키워드 하이라이팅 */
export const HighlightText: React.FC<{
  text: string;
  keyword: string;
  style?: object;
  numberOfLines?: number;
}> = ({ text, keyword, style, numberOfLines }) => {
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
          <Text key={i} style={highlightStyle.mark}>
            {part}
          </Text>
        ) : (
          part
        )
      )}
    </Text>
  );
};

const highlightStyle = StyleSheet.create({
  mark: {
    color: colors.primary,
    fontWeight: '700' as const,
    backgroundColor: colors.primary + '18',
  },
});

/** 섹션 헤더 */
export const SectionHeader: React.FC<{ title: string; count: number }> = ({ title, count }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    <Text style={styles.sectionCount}>{count}건</Text>
  </View>
);

/** 개별 결과 카드 */
export const ResultCard: React.FC<{
  content: string;
  keyword: string;
  meta?: string;
  onPress: () => void;
}> = ({ content, keyword, meta, onPress }) => (
  <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
    <HighlightText
      text={content}
      keyword={keyword}
      style={styles.cardContent}
      numberOfLines={3}
    />
    {meta && <Text style={styles.cardMeta}>{meta}</Text>}
  </TouchableOpacity>
);

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
    fontWeight: sizes.fontWeight.bold,
    color: colors.text.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  sectionCount: {
    fontSize: sizes.font.xs,
    color: colors.text.disabled,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: sizes.radius.md,
    padding: sizes.spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: sizes.spacing.sm,
    gap: sizes.spacing.xs,
  },
  cardContent: {
    fontSize: sizes.font.md,
    color: colors.text.primary,
    lineHeight: 22,
  },
  cardMeta: {
    fontSize: sizes.font.xs,
    color: colors.text.disabled,
  },
});
