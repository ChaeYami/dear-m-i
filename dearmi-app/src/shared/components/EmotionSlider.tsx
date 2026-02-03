import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTranslation } from 'react-i18next';
import { sizes } from '@/constants';

/** 점수 구간별 색상 (1-3: red, 4-6: amber, 7-10: green) */
export const getEmotionColor = (score: number): string => {
  if (score <= 3) return '#EF4444';
  if (score <= 6) return '#F59E0B';
  return '#10B981';
};

export const getEmotionLabel = (score: number): string => {
  // i18n 미적용 컨텍스트용 fallback (useEmotionLabel hook 권장)
  if (score <= 2) return '매우 힘듦';
  if (score <= 4) return '힘듦';
  if (score <= 6) return '보통';
  if (score <= 8) return '좋음';
  return '매우 좋음';
};

/** i18n 적용된 감정 레이블 (컴포넌트 내에서 사용) */
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

/**
 * 감정 점수 슬라이더 (1–10)
 * - 탭으로 선택, 점수별 색상 변화
 * - 1–3: red / 4–6: amber / 7–10: green
 */
export const EmotionSlider: React.FC<EmotionSliderProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const { t } = useTranslation();
  const emotionLabel = useEmotionLabel();
  const activeColor = getEmotionColor(value);

  return (
    <View style={styles.container}>
      {/* 점수 스텝 */}
      <View style={styles.track}>
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
                styles.step,
                (isSelected || isPast) && { backgroundColor: stepColor, borderColor: stepColor },
                isSelected && styles.stepSelected,
              ]}
            >
              <Text
                style={[
                  styles.stepText,
                  (isSelected || isPast) && styles.stepTextActive,
                ]}
              >
                {n}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* 현재 점수 + 레이블 */}
      <View style={styles.labelRow}>
        <Text style={[styles.scoreText, { color: activeColor }]}>{value}{t('score_unit')}</Text>
        <Text style={[styles.labelText, { color: activeColor }]}>
          {emotionLabel(value)}
        </Text>
      </View>
    </View>
  );
};

const STEPS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10];

const styles = StyleSheet.create({
  container: { gap: sizes.spacing.sm },
  track: {
    flexDirection: 'row',
    gap: 4,
  },
  step: {
    flex: 1,
    height: 36,
    borderRadius: sizes.radius.sm,
    borderWidth: 1.5,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepSelected: {
    transform: [{ scaleY: 1.15 }],
  },
  stepText: {
    fontSize: sizes.font.xs,
    fontWeight: sizes.fontWeight.semibold,
    color: '#9CA3AF',
  },
  stepTextActive: {
    color: '#FFFFFF',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: sizes.spacing.sm,
  },
  scoreText: {
    fontSize: sizes.font.xl,
    fontWeight: sizes.fontWeight.bold,
  },
  labelText: {
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.medium,
  },
});
