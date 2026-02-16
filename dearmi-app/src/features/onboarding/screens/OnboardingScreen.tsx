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
import { useTranslation } from 'react-i18next';
import { useTheme, sizes, fontFamily } from '@/shared/theme';
import { GlassCard } from '@/shared/components/GlassCard';
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

const usePages = (): Page[] => {
  const { t } = useTranslation('common');
  return [
    { icon: 'calendar-outline', title: t('onboarding_schedule_title'), description: t('onboarding_schedule_desc') },
    { icon: 'happy-outline', title: t('onboarding_checkin_title'), description: t('onboarding_checkin_desc') },
    { icon: 'medical-outline', title: t('onboarding_medication_title'), description: t('onboarding_medication_desc') },
    { icon: 'document-text-outline', title: t('onboarding_ocr_title'), description: t('onboarding_ocr_desc') },
  ];
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const OnboardingScreen: React.FC = () => {
  const { colors, isDark } = useTheme();
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const { t } = useTranslation('common');
  const PAGES = usePages();
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

  const bgGradientColors: [string, string, string] = isDark
    ? [colors.background, colors.surfaceElevated, colors.background]
    : ['#F7F4F0', '#EEE8F8', '#FDF5F2'];

  return (
    <LinearGradient
      colors={bgGradientColors}
      locations={[0, 0.5, 1]}
      start={{ x: 0.5, y: 0 }}
      end={{ x: 0.5, y: 1 }}
      style={styles.container}
    >
    <SafeAreaView style={styles.container}>
      {/* 헤더: 닫기 + 다시 보지 않기 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={closeOnly} hitSlop={12} style={styles.headerLeftBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <TouchableOpacity onPress={closeAndRemember} hitSlop={12}>
          <Text style={[styles.dontShowText, { color: colors.textSub }]}>{t('onboarding_dont_show_again')}</Text>
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
            <GlassCard style={styles.iconCard} intensity={40}>
              <View style={styles.iconInner}>
                <Ionicons name={page.icon} size={48} color={colors.primary} />
              </View>
            </GlassCard>
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
                { backgroundColor: idx === currentPage ? colors.primary : colors.primaryMuted },
                idx === currentPage && styles.dotActive,
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => {
            if (isLastPage) {
              closeOnly();
            } else {
              goToPage(currentPage + 1);
            }
          }}
          activeOpacity={0.85}
          style={styles.primaryBtn}
        >
          {isLastPage ? (
            <LinearGradient
              colors={[colors.primaryVivid, colors.primaryVividDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.primaryBtnGradient}
            >
              <Text style={[styles.primaryBtnText, { color: colors.textInverse }]}>
                {t('onboarding_start')}
              </Text>
            </LinearGradient>
          ) : (
            <View style={[styles.primaryBtnGradient, { backgroundColor: colors.primary }]}>
              <Text style={[styles.primaryBtnText, { color: colors.textInverse }]}>
                {t('onboarding_next')}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
    </LinearGradient>
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
  iconCard: {
    marginBottom: sizes.spacing.lg,
    borderRadius: sizes.radius.xxl,
  },
  iconInner: {
    width: 100,
    height: 100,
    alignItems: 'center',
    justifyContent: 'center',
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
    borderRadius: sizes.radius.full,
    overflow: 'hidden',
  },
  primaryBtnGradient: {
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
