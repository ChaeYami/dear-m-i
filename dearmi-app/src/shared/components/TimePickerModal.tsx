import React, { useEffect, useState } from 'react';
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
  useEffect(() => {
    DateTimePickerAndroid.open({
      value: buildInitial(initialHour, initialMinute),
      mode: 'time',
      is24Hour: true,
      onChange: (event: DateTimePickerEvent, date?: Date) => {
        if (event.type === 'set' && date) {
          onConfirm(date.getHours(), date.getMinutes());
        } else {
          onClose();
        }
      },
    });
    // imperative 1회만 띄우고, 다이얼로그 자체가 모달 역할을 한다
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
