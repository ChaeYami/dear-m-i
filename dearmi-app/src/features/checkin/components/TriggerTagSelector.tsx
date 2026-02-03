import React, { useState } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { colors, sizes } from '@/constants';

const PRESET_TAGS = [
  // 대인 관계
  '가족 갈등', '친구 문제', '직장 관계', '연인 문제', '외로움',
  // 업무·학업
  '업무 스트레스', '학업 압박', '번아웃',
  // 신체
  '수면 부족', '피로', '신체 통증',
  // 기타
  '날씨', '경제적 걱정',
  '특별한 이유 없음',
];

interface TriggerTagSelectorProps {
  selectedTags: string[];
  onChangeTags: (tags: string[]) => void;
}

export const TriggerTagSelector: React.FC<TriggerTagSelectorProps> = ({
  selectedTags,
  onChangeTags,
}) => {
  const [customInput, setCustomInput] = useState('');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChangeTags(selectedTags.filter((t) => t !== tag));
    } else {
      onChangeTags([...selectedTags, tag]);
    }
  };

  const addCustomTag = () => {
    const trimmed = customInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      onChangeTags([...selectedTags, trimmed]);
    }
    setCustomInput('');
  };

  const isCustomTag = (tag: string) => !PRESET_TAGS.includes(tag);

  return (
    <View style={styles.container}>
      {/* 프리셋 태그 */}
      <View style={styles.tagGrid}>
        {PRESET_TAGS.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <TouchableOpacity
              key={tag}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleTag(tag)}
              activeOpacity={0.75}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {tag}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 커스텀 태그 입력 */}
      <View style={styles.customRow}>
        <TextInput
          style={styles.customInput}
          placeholder="직접 입력"
          placeholderTextColor={colors.text.disabled}
          value={customInput}
          onChangeText={setCustomInput}
          onSubmitEditing={addCustomTag}
          returnKeyType="done"
          blurOnSubmit={false}
          maxLength={20}
        />
        <TouchableOpacity
          style={[styles.addBtn, !customInput.trim() && styles.addBtnDisabled]}
          onPress={addCustomTag}
          disabled={!customInput.trim()}
        >
          <Text style={styles.addBtnText}>추가</Text>
        </TouchableOpacity>
      </View>

      {/* 커스텀 태그 칩 표시 */}
      {selectedTags.filter(isCustomTag).length > 0 && (
        <View style={styles.customTags}>
          {selectedTags.filter(isCustomTag).map((tag) => (
            <TouchableOpacity
              key={tag}
              style={styles.customChip}
              onPress={() => toggleTag(tag)}
              activeOpacity={0.75}
            >
              <Text style={styles.customChipText}>{tag}</Text>
              <Text style={styles.customChipRemove}>x</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { gap: sizes.spacing.sm },
  tagGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizes.spacing.xs,
  },
  chip: {
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: 6,
    borderRadius: sizes.radius.full,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
  },
  chipSelected: {
    backgroundColor: colors.primary + '15',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: sizes.font.sm,
    color: colors.text.secondary,
  },
  chipTextSelected: {
    color: colors.primary,
    fontWeight: sizes.fontWeight.semibold,
  },
  customRow: {
    flexDirection: 'row',
    gap: sizes.spacing.sm,
  },
  customInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    fontSize: sizes.font.md,
    color: colors.text.primary,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: {
    color: colors.text.onPrimary,
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.semibold,
  },
  customTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: sizes.spacing.xs,
  },
  customChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.secondary + '15',
    paddingHorizontal: sizes.spacing.sm,
    paddingVertical: 4,
    borderRadius: sizes.radius.full,
    gap: 4,
  },
  customChipText: {
    fontSize: sizes.font.xs,
    color: colors.secondary,
    fontWeight: sizes.fontWeight.medium,
  },
  customChipRemove: {
    fontSize: sizes.font.sm,
    color: colors.secondary,
    fontWeight: sizes.fontWeight.bold,
  },
});
