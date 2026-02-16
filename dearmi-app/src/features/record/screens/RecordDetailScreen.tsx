import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { softShadow } from '@/shared/theme/shadows';
import { ScreenHeader } from '@/shared/components/ScreenHeader';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import { getEmotionColor } from '@/shared/components/EmotionSlider';
import { useRecordDetail, useDeleteRecord } from '@/features/record/hooks/useRecord';
import type { CareStackParamList as RecordStackParamList } from '@/navigation/CareNavigator';

type Nav = StackNavigationProp<RecordStackParamList, 'RecordDetail'>;
type Route = RouteProp<RecordStackParamList, 'RecordDetail'>;

const formatDate = (dateStr: string, locale: string) => {
  const d = new Date(dateStr + (dateStr.includes('T') ? '' : 'T00:00:00'));
  if (locale === 'ko') {
    return `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`;
  }
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
};

export const RecordDetailScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const { t, i18n } = useTranslation(['record', 'common']);
  const { recordId } = useRoute<Route>().params;
  const { data: record, isLoading } = useRecordDetail(recordId);
  const { mutate: deleteRecord } = useDeleteRecord();

  const handleDelete = () => {
    customAlert(t('record:delete_title'), t('record:delete_message'), [
      { text: t('common:cancel'), style: 'cancel' },
      {
        text: t('common:delete'),
        style: 'destructive',
        onPress: () => deleteRecord(recordId, { onSuccess: () => navigation.goBack() }),
      },
    ]);
  };

  if (isLoading) return <LoadingSpinner fullscreen />;
  if (!record) return null;

  const emotionColor = record.emotionScore != null ? getEmotionColor(record.emotionScore) : colors.primary;
  const displayDate = record.consultedAt
    ? formatDate(record.consultedAt, i18n.language)
    : formatDate(record.createdAt.split('T')[0], i18n.language);
  const dateKind = record.consultedAt ? t('record:date_visit') : t('record:date_created');

  const styles = getStyles(colors);

  return (
    <SafeAreaView style={styles.container}>
      <ScreenHeader
        variant="back"
        title={t('record:visit_relation_title')}
        rightContent={
          <View style={styles.headerActions}>
            <TouchableOpacity onPress={() => navigation.navigate('RecordForm', { recordId })} hitSlop={12}>
              <Ionicons name="create-outline" size={22} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleDelete} hitSlop={12}>
              <Ionicons name="trash-outline" size={22} color={colors.error} />
            </TouchableOpacity>
          </View>
        }
      />

      <ScrollView contentContainerStyle={styles.content}>
        {/* 날짜 + 병원 */}
        <View style={[styles.card, softShadow(colors)]}>
          <View style={styles.dateRow}>
            <Ionicons name="calendar-outline" size={16} color={colors.textSub} />
            <Text style={styles.dateText}>{displayDate}</Text>
            <Text style={styles.dateKind}>{dateKind}</Text>
          </View>
          {record.hospitalName && (
            <View style={styles.hospitalRow}>
              <Ionicons name="medkit-outline" size={16} color={colors.primary} />
              <Text style={styles.hospitalName}>{record.hospitalName}</Text>
            </View>
          )}
        </View>

        {/* 컨디션 */}
        {record.emotionScore != null && (
          <View style={[styles.card, softShadow(colors)]}>
            <Text style={styles.sectionLabel}>{t('record:condition')}</Text>
            <View style={styles.emotionRow}>
              <View style={[styles.emotionBadge, { backgroundColor: emotionColor + '20', borderColor: emotionColor + '40' }]}>
                <Text style={[styles.emotionScore, { color: emotionColor }]}>{record.emotionScore}{t('common:score_unit')}</Text>
              </View>
              <View style={styles.emotionBarBg}>
                <View style={[styles.emotionBarFill, { width: `${record.emotionScore * 10}%`, backgroundColor: emotionColor }]} />
              </View>
            </View>
          </View>
        )}

        {/* 상담 내용 */}
        <View style={[styles.card, softShadow(colors)]}>
          <Text style={styles.sectionLabel}>{t('record:content_label')}</Text>
          <Text style={styles.contentText}>{record.content}</Text>
        </View>

        {/* 태그 */}
        {record.tags && record.tags.length > 0 && (
          <View style={[styles.card, softShadow(colors)]}>
            <Text style={styles.sectionLabel}>{t('record:tags_label')}</Text>
            <View style={styles.tagRow}>
              {record.tags.map((tag) => (
                <View key={tag} style={[styles.tag, { backgroundColor: colors.accentMuted }]}>
                  <Text style={[styles.tagText, { color: colors.accent }]}>#{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const getStyles = (colors: ReturnType<typeof useTheme>['colors']) =>
  StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.md,
    },
    content: {
      padding: sizes.spacing.lg,
      gap: sizes.spacing.md,
      paddingBottom: 40,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.xxl,
      padding: sizes.spacing.lg,
      gap: sizes.spacing.sm,
    },
    dateRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.xs,
    },
    dateText: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.medium,
      color: colors.textSub,
    },
    dateKind: {
      fontSize: sizes.font.xs,
      color: colors.textDisabled,
    },
    hospitalRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.xs,
    },
    hospitalName: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.semibold,
      color: colors.primary,
    },
    sectionLabel: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.semibold,
      color: colors.textSub,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    emotionRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: sizes.spacing.md,
    },
    emotionBadge: {
      paddingHorizontal: sizes.spacing.md,
      paddingVertical: 4,
      borderRadius: sizes.radius.full,
      borderWidth: 1,
    },
    emotionScore: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.bold,
    },
    emotionBarBg: {
      flex: 1,
      height: 6,
      borderRadius: 3,
      backgroundColor: colors.disabled,
      overflow: 'hidden',
    },
    emotionBarFill: {
      height: '100%',
      borderRadius: 3,
    },
    contentText: {
      fontSize: sizes.font.md,
      fontFamily: fontFamily.regular,
      color: colors.text,
      lineHeight: 24,
    },
    tagRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: sizes.spacing.xs,
    },
    tag: {
      paddingHorizontal: sizes.spacing.sm,
      paddingVertical: 4,
      borderRadius: sizes.radius.full,
    },
    tagText: {
      fontSize: sizes.font.sm,
      fontFamily: fontFamily.medium,
    },
  });
