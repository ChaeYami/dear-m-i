import React, { useState, useMemo } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors, sizes } from '@/constants';

interface TriggerTagSelectorProps {
  selectedTags: string[];
  onChangeTags: (tags: string[]) => void;
}

export const TriggerTagSelector: React.FC<TriggerTagSelectorProps> = ({
  selectedTags,
  onChangeTags,
}) => {
  const { t } = useTranslation('checkin');
  const [customInput, setCustomInput] = useState('');

  const PRESET_TAGS = useMemo(() => [
    t('trigger_tags.family'), t('trigger_tags.friends'), t('trigger_tags.work_relations'),
    t('trigger_tags.partner'), t('trigger_tags.loneliness'),
    t('trigger_tags.work_stress'), t('trigger_tags.academic'), t('trigger_tags.burnout'),
    t('trigger_tags.sleep_lack'), t('trigger_tags.fatigue'), t('trigger_tags.pain'),
    t('trigger_tags.weather'), t('trigger_tags.financial'),
    t('trigger_tags.none'),
  ], [t]);

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

      <View style={styles.customRow}>
        <TextInput
          style={styles.customInput}
          placeholder={t('custom_input')}
          placeholderTextColor={colors.textDisabled}
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
          <Text style={styles.addBtnText}>{t('common:add')}</Text>
        </TouchableOpacity>
      </View>

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
              <Ionicons name="close-circle" size={14} color={colors.secondary} />
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
    borderColor: colors.divider,
  },
  chipSelected: {
    backgroundColor: colors.primaryLight + '25',
    borderColor: colors.primary,
  },
  chipText: {
    fontSize: sizes.font.sm,
    color: colors.textSub,
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
    backgroundColor: colors.surfaceSolid,
    borderWidth: 1,
    borderColor: colors.divider,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    paddingVertical: sizes.spacing.sm,
    fontSize: sizes.font.md,
    color: colors.text,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: sizes.radius.md,
    paddingHorizontal: sizes.spacing.md,
    justifyContent: 'center',
  },
  addBtnDisabled: { opacity: 0.4 },
  addBtnText: {
    color: colors.textInverse,
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
    backgroundColor: colors.secondaryLight + '25',
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
});
