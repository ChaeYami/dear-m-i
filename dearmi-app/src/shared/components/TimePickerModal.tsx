import React, { useState, useRef } from 'react';
import {
  Modal, View, Text, StyleSheet, TouchableOpacity, Pressable, TextInput,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import WheelPicker from '@quidone/react-native-wheel-picker';
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';

interface Props {
  visible: boolean;
  initialHour: number;
  initialMinute: number;
  onConfirm: (hour: number, minute: number) => void;
  onClose: () => void;
}

const pad = (n: number) => String(n).padStart(2, '0');

// 무한 스크롤 시뮬레이션: 데이터를 여러 번 반복
// 각 항목에 고유 index를 value로 사용, realValue로 실제 시/분 값 추적
const REPEATS = 5;
const MID = Math.floor(REPEATS / 2);

interface WheelItem { value: number; label: string; realValue: number }

const buildData = (count: number): WheelItem[] => {
  const items: WheelItem[] = [];
  for (let r = 0; r < REPEATS; r++) {
    for (let i = 0; i < count; i++) {
      items.push({ value: r * count + i, label: pad(i), realValue: i });
    }
  }
  return items;
};

const HOUR_DATA = buildData(24);
const MINUTE_DATA = buildData(60);

/** 실제 값 → 중간 반복 위치의 고유 value */
const toMidValue = (realVal: number, cycleSize: number) => MID * cycleSize + realVal;

/** visible=false → unmount, true → fresh mount */
export const TimePickerModal: React.FC<Props> = (props) => {
  if (!props.visible) return null;
  return <TimePickerInner {...props} />;
};

const TimePickerInner: React.FC<Props> = ({
  initialHour, initialMinute, onConfirm, onClose,
}) => {
  const { colors } = useTheme();
  const { t } = useTranslation('common');
  // 고유 value (중간 반복 위치 기준)
  const [hourVal, setHourVal] = useState(toMidValue(initialHour, 24));
  const [minVal, setMinVal] = useState(toMidValue(Math.max(0, Math.min(59, initialMinute)), 60));
  const [editField, setEditField] = useState<'h' | 'm' | null>(null);
  const [editText, setEditText] = useState('');
  const inputRef = useRef<TextInput>(null);

  const hour = hourVal % 24;
  const minute = minVal % 60;

  const startEdit = (field: 'h' | 'm') => {
    setEditField(field);
    setEditText(pad(field === 'h' ? hour : minute));
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const finishEdit = () => {
    const parsed = parseInt(editText, 10);
    if (!isNaN(parsed)) {
      if (editField === 'h') setHourVal(toMidValue(Math.max(0, Math.min(23, parsed)), 24));
      else setMinVal(toMidValue(Math.max(0, Math.min(59, parsed)), 60));
    }
    setEditField(null);
  };

  const styles = getStyles(colors);

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <Pressable style={styles.backdrop} onPress={onClose}>
          <Pressable style={styles.card} onPress={() => { if (editField) finishEdit(); }}>
            <Text style={styles.label}>{t('time_picker_title')}</Text>

            {/* 탭하면 직접 입력 */}
            <View style={styles.displayRow}>
              {editField === 'h' ? (
                <TextInput
                  ref={inputRef}
                  style={[styles.displayInput, { borderColor: colors.primary, color: colors.text }]}
                  value={editText} onChangeText={setEditText}
                  onBlur={finishEdit} onSubmitEditing={finishEdit}
                  keyboardType="number-pad" maxLength={2} selectTextOnFocus
                />
              ) : (
                <TouchableOpacity onPress={() => startEdit('h')}>
                  <Text style={styles.displayNum}>{pad(hour)}</Text>
                </TouchableOpacity>
              )}
              <Text style={styles.displayColon}>:</Text>
              {editField === 'm' ? (
                <TextInput
                  ref={inputRef}
                  style={[styles.displayInput, { borderColor: colors.primary, color: colors.text }]}
                  value={editText} onChangeText={setEditText}
                  onBlur={finishEdit} onSubmitEditing={finishEdit}
                  keyboardType="number-pad" maxLength={2} selectTextOnFocus
                />
              ) : (
                <TouchableOpacity onPress={() => startEdit('m')}>
                  <Text style={styles.displayNum}>{pad(minute)}</Text>
                </TouchableOpacity>
              )}
            </View>
            <Text style={[styles.hint, { color: colors.textDisabled }]}>
              {editField ? t('time_picker_hint_apply') : t('time_picker_hint_edit')}
            </Text>

            {/* 휠 피커 */}
            <View style={styles.wheelsRow}>
              <WheelPicker
                data={HOUR_DATA}
                value={hourVal}
                onValueChanged={({ item }: { item: WheelItem }) => setHourVal(item.value)}
                itemHeight={44}
                visibleItemCount={5}
                width={90}
                itemTextStyle={{
                  fontSize: 20,
                  fontFamily: fontFamily.medium,
                  color: colors.textDisabled,
                }}
                overlayItemStyle={{
                  backgroundColor: colors.primaryMuted,
                  borderRadius: sizes.radius.lg,
                }}
              />
              <Text style={styles.colon}>:</Text>
              <WheelPicker
                data={MINUTE_DATA}
                value={minVal}
                onValueChanged={({ item }: { item: WheelItem }) => setMinVal(item.value)}
                itemHeight={44}
                visibleItemCount={5}
                width={90}
                itemTextStyle={{
                  fontSize: 20,
                  fontFamily: fontFamily.medium,
                  color: colors.textDisabled,
                }}
                overlayItemStyle={{
                  backgroundColor: colors.primaryMuted,
                  borderRadius: sizes.radius.lg,
                }}
              />
            </View>

            <View style={styles.divider} />
            <View style={styles.actions}>
              <TouchableOpacity onPress={onClose} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: colors.textSub }]}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => onConfirm(hour, minute)} style={styles.actionBtn}>
                <Text style={[styles.actionText, { color: colors.primary, fontFamily: fontFamily.bold }]}>{t('confirm')}</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </GestureHandlerRootView>
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
      width: '100%', maxWidth: 300, backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      paddingTop: sizes.spacing.xl, paddingBottom: sizes.spacing.lg, paddingHorizontal: sizes.spacing.lg,
      alignItems: 'center',
      shadowColor: '#000', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.15, shadowRadius: 24, elevation: 12,
    },
    label: {
      fontSize: sizes.font.sm, fontFamily: fontFamily.medium, color: colors.textSub,
    },
    displayRow: {
      flexDirection: 'row', alignItems: 'center', marginVertical: sizes.spacing.md,
    },
    displayNum: {
      fontSize: sizes.font.xxl + 4, fontFamily: fontFamily.bold, color: colors.text,
    },
    displayColon: {
      fontSize: sizes.font.xxl + 4, fontFamily: fontFamily.bold, color: colors.textSub,
      marginHorizontal: sizes.spacing.xs,
    },
    displayInput: {
      fontSize: sizes.font.xxl + 4, fontFamily: fontFamily.bold,
      textAlign: 'center', minWidth: 60,
      borderWidth: 2, borderRadius: sizes.radius.lg,
      paddingHorizontal: sizes.spacing.sm, paddingVertical: sizes.spacing.xs,
    },
    hint: {
      fontSize: sizes.font.xs, marginBottom: sizes.spacing.sm,
    },
    wheelsRow: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    },
    colon: {
      fontSize: 24, fontFamily: fontFamily.bold, color: colors.textSub,
      paddingHorizontal: sizes.spacing.sm,
    },
    divider: {
      height: 1, backgroundColor: colors.divider, alignSelf: 'stretch',
      marginTop: sizes.spacing.md, marginBottom: sizes.spacing.sm,
    },
    actions: {
      flexDirection: 'row', justifyContent: 'flex-end', gap: sizes.spacing.lg, alignSelf: 'stretch',
    },
    actionBtn: { paddingVertical: sizes.spacing.sm, paddingHorizontal: sizes.spacing.sm },
    actionText: { fontSize: sizes.font.md, fontFamily: fontFamily.medium },
  });
