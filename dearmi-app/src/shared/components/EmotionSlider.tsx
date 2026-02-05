import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';

/** 점수 구간별 색상 (소프트 톤) — 테마 독립적 */
export const getEmotionColor = (score: number): string => {
  if (score <= 3) return '#E8A5A5';
  if (score <= 6) return '#F0C97A';
  return '#8BC4A8';
};

export const getEmotionLabel = (score: number): string => {
  if (score <= 2) return '매우 힘듦';
  if (score <= 4) return '힘듦';
  if (score <= 6) return '보통';
  if (score <= 8) return '좋음';
  return '매우 좋음';
};

export const useEmotionLabel = () => {
  const { t } = useTranslation();
  return (score: number): string => {
    if (score <= 2) return t('emotion_very_bad');
    if (score <= 4) return t('emotion_bad');
    if (score <= 6) return t('emotion_normal');
    if (score <= 8) return t('emotion_good');
    return t('emotion_very_good');
  };
};

interface EmotionSliderProps {
  value: number;
  onChange: (score: number) => void;
  disabled?: boolean;
}

export const EmotionSlider: React.FC<EmotionSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const emotionLabel = useEmotionLabel();
  const activeColor = getEmotionColor(value);

  return (
    <View style={{ gap: sizes.spacing.sm }}>
      <View style={{ flexDirection: 'row', gap: 4 }}>
        {STEPS.map((n) => {
          const isSelected = n === value;
          const isPast = n < value;
          const stepColor = getEmotionColor(n);
          return (
            <TouchableOpacity
              key={n}
              onPress={() => !disabled && onChange(n)}
              activeOpacity={0.75}
              style={[
                {
                  flex: 1,
                  height: 36,
                  borderRadius: sizes.radius.md,
                  borderWidth: 1.5,
                  borderColor: colors.disabled,
                  backgroundColor: colors.surface,
                  alignItems: 'center',
                  justifyContent: 'center',
                },
                (isSelected || isPast) && {
                  backgroundColor: stepColor,
                  borderColor: stepColor,
                },
                isSelected && { transform: [{ scaleY: 1.15 }] },
              ]}
            >
              <Text
                style={[
                  {
                    fontFamily: fontFamily.semibold,
                    fontSize: sizes.font.xs,
                    color: colors.textDisabled,
                  },
                  (isSelected || isPast) && { color: '#FFFFFF' },
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: sizes.spacing.sm }}>
        <Text
          style={{
            fontFamily: fontFamily.bold,
            fontSize: sizes.font.xl,
            color: activeColor,
          }}
        >
          {value}{t('score_unit')}
        </Text>
        <Text
          style={{
            fontFamily: fontFamily.medium,
            fontSize: sizes.font.sm,
            color: activeColor,
          }}
        >
          {emotionLabel(value)}
        </Text>
      </View>
    </View>
  );
};

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];
