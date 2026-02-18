import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { useCreateSideEffect } from '@/features/sideeffect/hooks/useSideEffect';
import { useAllMedicationSchedules } from '@/features/medication/hooks/useMedication';

const occurredPresets = (): { key: string; offsetMinutes: number }[] => ([
  { key: 'now', offsetMinutes: 0 },
  { key: 'today', offsetMinutes: 60 * 3 }, // ~3시간 전 default
  { key: 'yesterday', offsetMinutes: 60 * 24 },
]);

const offsetToIso = (offsetMinutes: number) => {
  const d = new Date();
  d.setMinutes(d.getMinutes() - offsetMinutes);
  return d.toISOString();
};

export const SideEffectLogScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<any>();
  const { t } = useTranslation(['sideeffect', 'common']);

  const [symptom, setSymptom] = useState('');
  const [occurredOffset, setOccurredOffset] = useState(0); // 'now'
  const [severity, setSeverity] = useState<number | null>(null);
  const [linkedMedId, setLinkedMedId] = useState<string | undefined>();
  const [showMedPicker, setShowMedPicker] = useState(false);
  const [notes, setNotes] = useState('');

  const { data: meds = [] } = useAllMedicationSchedules();
  const { mutate: create, isPending } = useCreateSideEffect();

  const handleSave = () => {
    if (!symptom.trim()) {
      customAlert(t('common:required_input'), t('sideeffect:validation_symptom_required'));
      return;
    }
    create(
      {
        symptom: symptom.trim(),
        occurredAt: offsetToIso(occurredOffset),
        severity: severity ?? undefined,
        medicationScheduleId: linkedMedId,
        notes: notes.trim() || undefined,
      },
      { onSuccess: () => navigation.goBack() },
    );
  };

  const styles = useMemo(() => makeStyles(colors), [colors]);
  const linkedMed = meds.find((m) => m.id === linkedMedId);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        variant="form"
        title={t('sideeffect:log_title')}
        onCancel={() => navigation.goBack()}
        onSave={handleSave}
        saveDisabled={isPending}
        saveLabel={t('sideeffect:save')}
      />

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.field}>
          <Text style={styles.label}>{t('sideeffect:symptom_label')}</Text>
          <TextInput
            style={styles.input}
            placeholder={t('sideeffect:symptom_placeholder')}
            placeholderTextColor={colors.textDisabled}
            value={symptom}
            onChangeText={setSymptom}
            autoFocus
          />
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('sideeffect:occurred_at_label')}</Text>
          <View style={styles.chipRow}>
            {occurredPresets().map((p) => (
              <TouchableOpacity
                key={p.key}
                style={[
                  styles.chip,
                  occurredOffset === p.offsetMinutes && styles.chipActive,
                ]}
                onPress={() => setOccurredOffset(p.offsetMinutes)}
              >
                <Text style={[
                  styles.chipText,
                  occurredOffset === p.offsetMinutes && styles.chipTextActive,
                ]}>{t(`sideeffect:${p.key}` as any)}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('sideeffect:severity_label')}</Text>
          <View style={styles.chipRow}>
            {[1, 2, 3, 4, 5].map((n) => (
              <TouchableOpacity
                key={n}
                style={[styles.severityChip, severity === n && styles.severityChipActive]}
                onPress={() => setSeverity(severity === n ? null : n)}
              >
                <Text style={[
                  styles.severityChipText,
                  severity === n && styles.severityChipTextActive,
                ]}>{n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={styles.severityScale}>
            {t('sideeffect:severity_1')} ↔ {t('sideeffect:severity_5')}
          </Text>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('sideeffect:med_link_label')}</Text>
          <TouchableOpacity
            style={styles.medSelector}
            onPress={() => setShowMedPicker((v) => !v)}
            activeOpacity={0.8}
          >
            <Text style={linkedMed ? styles.medText : styles.medPlaceholder}>
              {linkedMed ? linkedMed.drugName : t('sideeffect:med_link_none')}
            </Text>
            <Ionicons name={showMedPicker ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSub} />
          </TouchableOpacity>
          {showMedPicker && (
            <View style={styles.dropdown}>
              <TouchableOpacity
                style={styles.dropdownItem}
                onPress={() => { setLinkedMedId(undefined); setShowMedPicker(false); }}
              >
                <Text style={styles.dropdownItemText}>{t('sideeffect:med_link_none')}</Text>
              </TouchableOpacity>
              {meds.map((m) => (
                <TouchableOpacity
                  key={m.id}
                  style={[
                    styles.dropdownItem,
                    linkedMedId === m.id && styles.dropdownItemSelected,
                  ]}
                  onPress={() => { setLinkedMedId(m.id); setShowMedPicker(false); }}
                >
                  <Text style={styles.dropdownItemText}>{m.drugName}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>{t('sideeffect:notes_label')}</Text>
          <TextInput
            style={[styles.input, { minHeight: 80, paddingTop: sizes.spacing.md }]}
            placeholder={t('sideeffect:notes_placeholder')}
            placeholderTextColor={colors.textDisabled}
            value={notes}
            onChangeText={setNotes}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const makeStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { padding: sizes.spacing.lg, gap: sizes.spacing.lg, paddingBottom: 60 },
    field: { gap: sizes.spacing.sm },
    label: {
      fontSize: sizes.font.sm, fontFamily: fontFamily.semibold,
      color: colors.textSub, textTransform: 'uppercase', letterSpacing: 0.5,
    },
    input: {
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.divider,
      borderRadius: sizes.radius.md,
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: sizes.spacing.md,
      fontSize: sizes.font.md, color: colors.text,
    },
    chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: sizes.spacing.xs },
    chip: {
      paddingHorizontal: sizes.spacing.md, paddingVertical: sizes.spacing.sm,
      borderRadius: sizes.radius.full,
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.divider,
    },
    chipActive: { backgroundColor: colors.primaryMuted, borderColor: colors.primary },
    chipText: { fontSize: sizes.font.sm, color: colors.textSub },
    chipTextActive: { color: colors.primary, fontFamily: fontFamily.semibold },
    severityChip: {
      width: 44, height: 44, borderRadius: 22,
      alignItems: 'center', justifyContent: 'center',
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.divider,
    },
    severityChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    severityChipText: { fontSize: sizes.font.md, color: colors.textSub, fontFamily: fontFamily.medium },
    severityChipTextActive: { color: colors.textInverse, fontFamily: fontFamily.bold },
    severityScale: { fontSize: sizes.font.xs, color: colors.textDisabled },
    medSelector: {
      flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.divider,
      borderRadius: sizes.radius.md,
      paddingHorizontal: sizes.spacing.md, paddingVertical: sizes.spacing.md,
    },
    medText: { fontSize: sizes.font.md, color: colors.text, flex: 1 },
    medPlaceholder: { fontSize: sizes.font.md, color: colors.textDisabled, flex: 1 },
    dropdown: {
      backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.divider,
      borderRadius: sizes.radius.md, overflow: 'hidden',
    },
    dropdownItem: {
      paddingHorizontal: sizes.spacing.md, paddingVertical: sizes.spacing.md,
      borderBottomWidth: 1, borderBottomColor: colors.divider,
    },
    dropdownItemSelected: { backgroundColor: colors.primary + '10' },
    dropdownItemText: { fontSize: sizes.font.md, color: colors.text },
  });
