import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';

import '@/locales/i18n';
import { RootNavigator } from '@/navigation/RootNavigator';
import { queryClient } from '@/shared/api/queryClient';

/**
 * 앱 루트 컴포넌트
 * - SafeAreaProvider: 노치/홈 인디케이터 영역 처리
 * - QueryClientProvider: React Query 전역 설정
 * - RootNavigator: 앱 시작 → 버전 체크 → 토큰 복원 → 분기
 */
export default function App() {
  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="auto" />
        <RootNavigator />
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
