import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SectionList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { customAlert } from '@/shared/components/CustomAlert';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { usePrepNotes, useDeletePrepNote } from '@/features/prepnote/hooks/usePrepNote';
import { useTabBarSafeBottom } from '@/shared/hooks/useTabBarSafeBottom';
import { LoadingSpinner } from '@/shared/components/LoadingSpinner';
import type { PrepNote } from '@/shared/types/domain.types';
import type { ScheduleStackParamList } from '@/navigation/ScheduleNavigator';

type Nav = StackNavigationProp<ScheduleStackParamList, 'PrepNoteList'>;

type Section = {
  title: string;
  scheduleId?: string;
  data: PrepNote[];
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`;
};

export const PrepNoteListScreen: React.FC = () => {
  const { colors } = useTheme();
  const navigation = useNavigation<Nav>();
  const tabBarSafeBottom = useTabBarSafeBottom();
  const { data: notes = [], isLoading } = usePrepNotes();
  const { mutate: deleteNote } = useDeletePrepNote();

  const sections: Section[] = useMemo(() => {
    const linked = notes.filter((n) => n.scheduleId);
    const unlinked = notes.filter((n) => !n.scheduleId);

    // 일정별 그룹핑
    const scheduleMap = new Map<string, PrepNote[]>();
    linked.forEach((n) => {
      const key = n.scheduleId!;
      const existing = scheduleMap.get(key) ?? [];
      scheduleMap.set(key, [...existing, n]);
    });

    const linkedSections: Section[] = Array.from(scheduleMap.entries()).map(
      ([scheduleId, items]) => ({
        title: `일정 ${scheduleId.slice(0, 8)}…`, // 실제로는 scheduleId로 일정 이름 조회 필요
        scheduleId,
        data: items,
      })
    );

    const result: Section[] = [...linkedSections];
    if (unlinked.length > 0) {
      result.push({ title: '일정 없음', data: unlinked });
    }
    return result;
  }, [notes]);

  const handleDelete = (note: PrepNote) => {
    customAlert('메모 삭제', '이 준비 메모를 삭제할까요?', [
      { text: '취소', style: 'cancel' },
      {
        text: '삭제',
        style: 'destructive',
        onPress: () => deleteNote(note.id),
      },
    ]);
  };

  const styles = useMemo(() => StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    header: {
      height: sizes.headerHeight,
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: sizes.spacing.lg,
    },
    backBtn: {
      fontSize: sizes.font.md,
      color: colors.primary,
      fontFamily: fontFamily.medium,
    },
    headerTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    headerRight: { width: 48 },
    listContent: { padding: sizes.spacing.lg, paddingBottom: 100, gap: sizes.spacing.sm },
    sectionHeader: {
      paddingVertical: sizes.spacing.xs,
      marginTop: sizes.spacing.md,
    },
    sectionTitle: {
      fontSize: sizes.font.xs,
      fontFamily: fontFamily.bold,
      color: colors.textSub,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    card: {
      backgroundColor: colors.surface,
      borderRadius: sizes.radius.lg,
      padding: sizes.spacing.md,
      borderWidth: 1,
      borderColor: colors.divider,
      gap: sizes.spacing.sm,
    },
    cardContent: {
      fontSize: sizes.font.md,
      color: colors.text,
      lineHeight: 22,
    },
    cardFooter: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardDate: {
      fontSize: sizes.font.xs,
      color: colors.textDisabled,
    },
    deleteBtn: { paddingHorizontal: sizes.spacing.xs },
    deleteBtnText: {
      fontSize: sizes.font.xs,
      color: colors.error,
      fontFamily: fontFamily.medium,
    },
    emptyWrap: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: sizes.spacing.md,
      paddingHorizontal: sizes.spacing.xl,
    },
    emptyIcon: { fontSize: 48 },
    emptyTitle: {
      fontSize: sizes.font.lg,
      fontFamily: fontFamily.bold,
      color: colors.text,
    },
    emptyDesc: {
      fontSize: sizes.font.md,
      color: colors.textSub,
      textAlign: 'center',
      lineHeight: 22,
    },
    fab: {
      position: 'absolute',
      bottom: tabBarSafeBottom + sizes.spacing.md,
      right: sizes.spacing.xl,
      width: 56,
      height: 56,
      borderRadius: 28,
      backgroundColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.35,
      shadowRadius: 8,
      elevation: 8,
    },
    fabIcon: {
      fontSize: 28,
      color: colors.textInverse,
      lineHeight: 32,
    },
  }), [colors, tabBarSafeBottom]);

  if (isLoading) return <LoadingSpinner fullscreen />;

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
          <Ionicons name="chevron-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>진료 준비 메모</Text>
        <View style={styles.headerRight} />
      </View>

      {notes.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Ionicons name="create-outline" size={48} color={colors.textDisabled} />
          <Text style={styles.emptyTitle}>준비 메모가 없어요</Text>
          <Text style={styles.emptyDesc}>진료 전 궁금한 점이나{'\n'}증상을 미리 기록해 보세요.</Text>
        </View>
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderSectionHeader={({ section }) => (
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() =>
                navigation.navigate('PrepNoteForm', {
                  noteId: item.id,
                  scheduleId: item.scheduleId ?? undefined,
                })
              }
              activeOpacity={0.75}
            >
              <Text style={styles.cardContent} numberOfLines={3}>
                {item.content}
              </Text>
              <View style={styles.cardFooter}>
                <Text style={styles.cardDate}>{formatDate(item.updatedAt)}</Text>
                <TouchableOpacity onPress={() => handleDelete(item)} hitSlop={8} style={styles.deleteBtn}>
                  <Text style={styles.deleteBtnText}>삭제</Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('PrepNoteForm', {})}
        activeOpacity={0.85}
      >
        <Ionicons name="add" size={28} color={colors.textInverse} />
      </TouchableOpacity>
    </SafeAreaView>
  );
};
