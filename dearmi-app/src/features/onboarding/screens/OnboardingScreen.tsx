import React, { useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { StackNavigationProp } from '@react-navigation/stack';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { CacheService } from '@/shared/cache/CacheService';
import { CACHE_KEYS } from '@/constants/cacheKeys';
import type { RootStackParamList } from '@/navigation/RootNavigator';

type Nav = StackNavigationProp<RootStackParamList, 'Onboarding'>;
type Route = RouteProp<RootStackParamList, 'Onboarding'>;

interface Page {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  description: string;
}

const PAGES: Page[] = [
  {
    icon: 'calendar-outline',
    title: '진료 일정 관리',
    description:
      '병원 방문 일정을 등록하면 하루 전과 당일 아침에 알림을 보내드려요.\n준비 메모도 함께 작성할 수 있어요.',
  },
  {
    icon: 'happy-outline',
    title: '하루 메모',
    description:
      '오늘의 감정과 수면, 떠오르는 생각을 기록해보세요.\n감정 그래프로 내 마음의 흐름을 한눈에 볼 수 있어요.',
  },
  {
    icon: 'medical-outline',
    title: '복약 관리',
    description:
      '복약 일정을 등록하면 시간에 맞춰 알림이 와요.\n매일 복용 여부를 체크해 이력을 남길 수 있어요.',
  },
  {
    icon: 'document-text-outline',
    title: '처방전 자동 인식 (PREMIUM)',
    description:
      '처방전을 사진으로 찍으면 약품 정보를 자동으로 인식해요.\n복약 일정도 한 번에 등록할 수 있어요.',
  },
];

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const OnboardingScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const forceShow = route.params?.forceShow ?? false;

  const [currentPage, setCurrentPage] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const page = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
    if (page !== currentPage) setCurrentPage(page);
  };

  const goToPage = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * SCREEN_WIDTH, animated: true });
  };

  const closeAndRemember = () => {
    CacheService.set(CACHE_KEYS.ONBOARDING_COMPLETED, true);
    navigation.goBack();
  };

  const closeOnly = () => {
    // forceShow 모드 (마이 → 도움말 진입) 에서는 ONBOARDING_COMPLETED 를 건드리지 않음
    if (!forceShow) {
      CacheService.set(CACHE_KEYS.ONBOARDING_COMPLETED, true);
    }
    navigation.goBack();
  };

  const isLastPage = currentPage === PAGES.length - 1;

  const gradientColors: [string, string] = isDark
    ? [colors.background, colors.primaryMuted]
    : [colors.primaryLight, colors.primary];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 헤더: 닫기 + 다시 보지 않기 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={closeOnly} hitSlop={12} style={styles.headerLeftBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={closeAndRemember} hitSlop={12}>
          <Text style={[styles.dontShowText, { color: colors.textSub }]}>다시 보지 않기</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        bounces={false}
      >
        {PAGES.map((page, idx) => (
          <View key={idx} style={[styles.page, { width: SCREEN_WIDTH }]}>
            <LinearGradient
              colors={gradientColors}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconCircle}
            >
              <Ionicons name={page.icon} size={64} color={colors.textInverse} />
            </LinearGradient>
            <Text style={[styles.title, { color: colors.text }]}>{page.title}</Text>
            <Text style={[styles.description, { color: colors.textSub }]}>{page.description}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 하단: dot indicator + 다음/시작하기 버튼 */}
      <View style={styles.footer}>
        <View style={styles.dots}>
          {PAGES.map((_, idx) => (
            <View
              key={idx}
              style={[
                styles.dot,
                { backgroundColor: idx === currentPage ? colors.primary : colors.divider },
                idx === currentPage && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, { backgroundColor: colors.primary }]}
          onPress={() => {
            if (isLastPage) {
              closeOnly();
            } else {
              goToPage(currentPage + 1);
            }
          }}
          activeOpacity={0.85}
        >
          <Text style={[styles.primaryBtnText, { color: colors.textInverse }]}>
            {isLastPage ? '시작하기' : '다음'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    height: sizes.headerHeight,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: sizes.spacing.lg,
  },
  headerLeftBtn: { padding: sizes.spacing.xs },
  dontShowText: {
    fontSize: sizes.font.sm,
    fontFamily: fontFamily.medium,
    textDecorationLine: 'underline',
  },
  page: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: sizes.spacing.xxl,
    gap: sizes.spacing.lg,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: sizes.spacing.lg,
  },
  title: {
    fontSize: sizes.font.xxl,
    fontFamily: fontFamily.bold,
    textAlign: 'center',
  },
  description: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.regular,
    textAlign: 'center',
    lineHeight: 24,
  },
  footer: {
    paddingHorizontal: sizes.spacing.lg,
    paddingBottom: sizes.spacing.xl,
    gap: sizes.spacing.lg,
  },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: sizes.spacing.xs,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dotActive: {
    width: 24,
  },
  primaryBtn: {
    height: sizes.buttonHeight.lg,
    borderRadius: sizes.radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryBtnText: {
    fontSize: sizes.font.md,
    fontFamily: fontFamily.bold,
  },
});
