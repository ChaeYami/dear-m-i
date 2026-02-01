import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { colors, sizes } from '@/constants';

/**
 * 오프라인 상태 배너
 * - 네트워크 끊김 시 화면 상단에 자동 표시
 * - SafeAreaInsets 반영 (노치/상태바 영역 처리)
 */
export const OfflineBanner: React.FC = () => {
  const { isOffline } = useNetworkStatus();
  const insets = useSafeAreaInsets();

  if (!isOffline) return null;

  return (
    <View style={[styles.banner, { paddingTop: insets.top + sizes.spacing.sm }]}>
      <Text style={styles.text}>인터넷 연결이 없습니다. 일부 기능이 제한될 수 있어요.</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  banner: {
    backgroundColor: colors.warning,
    paddingHorizontal: sizes.spacing.md,
    paddingBottom: sizes.spacing.sm,
    alignItems: 'center',
  },
  text: {
    color: '#fff',
    fontSize: sizes.font.sm,
    fontWeight: sizes.fontWeight.medium,
    textAlign: 'center',
  },
});
