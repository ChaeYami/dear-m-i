import React, { useMemo, useState, useEffect } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Pressable } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { GlassView } from '@/shared/components/GlassView';

interface Props {
  visible: boolean;
  initialDate: string;
  /** 일정이 있는 날짜 (YYYY-MM-DD) 집합 */
  highlightedDates?: Set<string>;
  todayStr?: string;
  maxDate?: string;
  onConfirm: (date: string) => void;
  onClose: () => void;
}

const formatPickedDate = (dateStr: string, t: (k: string) => string, lang: string): string => {
  const d = new Date(dateStr);
  const weekdayKeys = ['weekday_sun', 'weekday_mon', 'weekday_tue', 'weekday_wed', 'weekday_thu', 'weekday_fri', 'weekday_sat'];
  const day = t(weekdayKeys[d.getDay()]);
  if (lang === 'ko') {
    return `${d.getMonth() + 1}월 ${d.getDate()}일 (${day})`;
  }
  const month = d.toLocaleDateString('en-US', { month: 'short' });
  return `${month} ${d.getDate()} (${day})`;
};

export const DatePickerModal: React.FC<Props> = ({
  visible,
  initialDate,
  highlightedDates = new Set(),
  todayStr,
  maxDate,
  onConfirm,
  onClose,
}) => {
  const { colors } = useTheme();
  const { t, i18n } = useTranslation('common');
  const [picked, setPicked] = useState(initialDate);
  const today = todayStr ?? new Date().toISOString().split('T')[0];

  useEffect(() => {
    if (visible) setPicked(initialDate);
  }, [visible, initialDate]);

  const markedDates = useMemo(() => {
    const marks: Record<string, any> = {};
    highlightedDates.forEach((d) => {
      marks[d] = {
        customStyles: {
          container: {},
          text: { color: colors.text, fontFamily: fontFamily.medium },
        },
      };
    });
    // 오늘 — 테두리만
    const isPickedToday = picked === today;
    if (!isPickedToday) {
      marks[today] = {
        ...(marks[today] ?? {}),
        customStyles: {
          container: { borderWidth: 1.5, borderColor: colors.primary, borderRadius: 18 },
          text: { color: colors.primary, fontFamily: fontFamily.bold },
        },
      };
    }
    // 선택 날짜 — 배경 채우기
    if (picked) {
      marks[picked] = {
        ...(marks[picked] ?? {}),
        customStyles: {
          container: {
            backgroundColor: colors.primary,
            borderRadius: 18,
            ...(isPickedToday ? { borderWidth: 2, borderColor: colors.primaryDark } : {}),
          },
          text: { color: colors.textInverse, fontFamily: fontFamily.bold },
        },
      };
    }
    // 일정 있는 날 점 표시 (선택/오늘 아닌 날만)
    highlightedDates.forEach((d) => {
      if (d !== picked && d !== today && marks[d]) {
        marks[d].customStyles.container = {
          ...marks[d].customStyles.container,
          backgroundColor: colors.primaryLight + '25',
          borderRadius: 18,
        };
      }
    });
    return marks;
  }, [highlightedDates, picked, today, colors]);

  const calendarTheme = useMemo(
    () => ({
      backgroundColor: 'transparent',
      calendarBackground: 'transparent',
      dayTextColor: colors.text,
      textDisabledColor: colors.textDisabled,
      monthTextColor: colors.text,
      arrowColor: colors.primary,
      textSectionTitleColor: colors.textSub,
      textMonthFontSize: sizes.font.lg,
      textMonthFontFamily: fontFamily.bold,
      textDayHeaderFontFamily: fontFamily.semibold,
      textDayFontFamily: fontFamily.medium,
    }),
    [colors],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      statusBarTranslucent
    >
      <GlassView intensity="subtle" showHighlight={false} style={StyleSheet.absoluteFill} pointerEvents="none" />
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable
          style={styles.cardWrap}
          onPress={(e) => e.stopPropagation()}
        >
        <View
          style={[
            styles.card,
            {
              backgroundColor: colors.surface,
              borderRadius: sizes.radius.xxl,
              borderWidth: 1,
              borderColor: colors.glassBorder,
              overflow: 'hidden',
            },
          ]}
        >
          <Text style={[styles.label, { color: colors.textSub, fontFamily: fontFamily.medium }]}>
            {t('date_picker_title')}
          </Text>
          <Text style={[styles.picked, { color: colors.text, fontFamily: fontFamily.bold }]}>
            {formatPickedDate(picked, t, i18n.language)}
          </Text>
          <View style={[styles.divider, { backgroundColor: colors.divider }]} />
          <Calendar
            current={picked}
            maxDate={maxDate}
            markingType="custom"
            markedDates={markedDates}
            onDayPress={(day) => setPicked(day.dateString)}
            enableSwipeMonths
            theme={calendarTheme}
          />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.actionBtn} hitSlop={8}>
              <Text style={[styles.actionText, { color: colors.textSub, fontFamily: fontFamily.medium }]}>
                {t('cancel')}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onConfirm(picked)}
              style={styles.actionBtn}
              hitSlop={8}
            >
              <Text style={[styles.actionText, { color: colors.primary, fontFamily: fontFamily.bold }]}>
                {t('confirm')}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.32)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sizes.spacing.lg,
  },
  cardWrap: {
    width: '100%',
    maxWidth: 420,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 24,
    elevation: 12,
  },
  card: {
    paddingVertical: sizes.spacing.lg,
    paddingHorizontal: sizes.spacing.md,
  },
  label: {
    fontSize: sizes.font.sm,
    paddingHorizontal: sizes.spacing.md,
  },
  picked: {
    fontSize: sizes.font.xxl,
    paddingHorizontal: sizes.spacing.md,
    marginTop: sizes.spacing.xs,
  },
  divider: {
    height: 1,
    marginVertical: sizes.spacing.md,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: sizes.spacing.lg,
    paddingHorizontal: sizes.spacing.md,
    paddingTop: sizes.spacing.md,
  },
  actionBtn: {
    paddingVertical: sizes.spacing.sm,
    paddingHorizontal: sizes.spacing.sm,
  },
  actionText: {
    fontSize: sizes.font.md,
  },
});
