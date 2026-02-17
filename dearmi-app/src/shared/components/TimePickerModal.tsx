import React, { useEffect, useRef, useState } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, Platform,
} from 'react-native';
import DateTimePicker, {
  DateTimePickerAndroid,
  type DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';

interface Props {
  visible: boolean;
  initialHour: number;
  initialMinute: number;
  onConfirm: (hour: number, minute: number) => void;
  onClose: () => void;
}

const buildInitial = (h: number, m: number) => {
  const d = new Date();
  d.setHours(h, Math.max(0, Math.min(59, m)), 0, 0);
  return d;
};

/**
 * 시간 선택 모달.
 * - iOS: Modal 안에 네이티브 spinner 렌더링 + 취소/확인 버튼
 * - Android: 네이티브 time picker 다이얼로그를 imperative API 로 호출 (즉시 오픈, 자체 버튼 포함)
 *
 * 네이티브 컴포넌트를 쓰므로 WheelPicker 마운트 비용이 없어 지연 없이 바로 뜬다.
 */
export const TimePickerModal: React.FC<Props> = (props) => {
  if (!props.visible) return null;

  if (Platform.OS === 'android') {
    return <AndroidTimePicker {...props} />;
  }
  return <IosTimePicker {...props} />;
};

const AndroidTimePicker: React.FC<Props> = ({ initialHour, initialMinute, onConfirm, onClose }) => {
  // 콜백을 ref 로 홀드 — effect 의존성을 비워 재실행 없이 최신 콜백 호출
  const onConfirmRef = useRef(onConfirm);
  const onCloseRef = useRef(onClose);
  onConfirmRef.current = onConfirm;
  onCloseRef.current = onClose;

  // 다이얼로그가 현재 열려있는지 추적 — 이미 사용자가 닫았는데 cleanup 이 dismiss 를
  // 추가 호출해 터치 핸들러 상태를 교란하던 문제 방지
  const dialogOpenRef = useRef(false);

  useEffect(() => {
    let cancelled = false;

    // 다음 tick 에서 오픈 — 진행 중인 렌더/네이티브 애니메이션 완료 후
    const t = setTimeout(() => {
      if (cancelled) return;
      dialogOpenRef.current = true;
      DateTimePickerAndroid.open({
        value: buildInitial(initialHour, initialMinute),
        mode: 'time',
        is24Hour: true,
        onChange: (event: DateTimePickerEvent, date?: Date) => {
          dialogOpenRef.current = false;
          if (event.type === 'set' && date) {
            onConfirmRef.current(date.getHours(), date.getMinutes());
          } else {
            onCloseRef.current();
          }
        },
      });
    }, 0);

    return () => {
      cancelled = true;
      clearTimeout(t);
      // 이미 사용자 확정/취소로 닫힌 경우엔 dismiss 호출하지 않음
      if (dialogOpenRef.current) {
        DateTimePickerAndroid.dismiss('time').catch(() => {});
      }
    };
  }, []);

  return null;
};

const IosTimePicker: React.FC<Props> = ({
  initialHour, initialMinute, onConfirm, onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  const [value, setValue] = useState(() => buildInitial(initialHour, initialMinute));

  const styles = getStyles(colors);

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.card} onStartShouldSetResponder={() => true}>
          <Text style={styles.label}>{t('time_picker_title')}</Text>
          <DateTimePicker
            value={value}
            mode="time"
            display="spinner"
            is24Hour
            onChange={(_: DateTimePickerEvent, d?: Date) => { if (d) setValue(d); }}
            textColor={colors.text}
            themeVariant="dark"
            style={styles.picker}
          />
          <View style={styles.divider} />
          <View style={styles.actions}>
            <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
              <Text style={[styles.actionText, { color: colors.textSub }]}>{t('cancel')}</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => onConfirm(value.getHours(), value.getMinutes())}
              style={styles.actionBtn}
            >
              <Text style={[styles.actionText, { color: colors.primary, fontFamily: fontFamily.bold }]}>{t('confirm')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Pressable>
    </Modal>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    backdrop: {
      flex: 1, backgroundColor: 'rgba(0,0,0,0.4)',
      alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28,
    },
    card: {
      width: '100%', maxWidth: 320, backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      paddingTop: sizes.spacing.lg, paddingBottom: sizes.spacing.lg, paddingHorizontal: sizes.spacing.lg,
      alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
    },
    label: {
      fontSize: sizes.font.sm, fontFamily: fontFamily.medium, color: colors.textSub,
      marginBottom: sizes.spacing.xs,
    },
    picker: {
      alignSelf: 'stretch',
    },
    divider: {
      height: 1, backgroundColor: colors.divider, alignSelf: 'stretch',
      marginTop: sizes.spacing.sm, marginBottom: sizes.spacing.xs,
    },
    actions: {
      flexDirection: 'row', justifyContent: 'flex-end', gap: sizes.spacing.lg, alignSelf: 'stretch',
    },
    actionBtn: { paddingVertical: sizes.spacing.sm, paddingHorizontal: sizes.spacing.sm },
    actionText: { fontSize: sizes.font.md, fontFamily: fontFamily.medium },
  });
