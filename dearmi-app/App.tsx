import React from 'react';
import { ActivityIndicator, Text, TextInput, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClientProvider } from '@tanstack/react-query';
import { useFonts } from 'expo-font';

import '@/locales/i18n';
import { RootNavigator } from '@/navigation/RootNavigator';
import { queryClient } from '@/shared/api/queryClient';
import { ThemeProvider, useTheme } from '@/shared/theme';
import { CustomAlertProvider } from '@/shared/components/CustomAlert';
import { PhoneWidthContainer } from '@/shared/components/PhoneWidthContainer';

// 모든 Text/TextInput에 SUIT-Regular 기본 적용
const defaultTextStyle = { fontFamily: 'Pretendard-Regular' };
(Text as any).defaultProps = {
  ...((Text as any).defaultProps ?? {}),
  style: [defaultTextStyle, (Text as any).defaultProps?.style],
};
(TextInput as any).defaultProps = {
  ...((TextInput as any).defaultProps ?? {}),
  style: [defaultTextStyle, (TextInput as any).defaultProps?.style],
};

function StatusBarThemed() {
  const { isDark } = useTheme();
  return <StatusBar style={isDark ? 'light' : 'dark'} />;
}

export default function App() {
  const [fontsLoaded] = useFonts({
    'Pretendard-Regular': require('./assets/fonts/Pretendard-Regular.ttf'),
    'Pretendard-Medium': require('./assets/fonts/Pretendard-Medium.ttf'),
    'Pretendard-SemiBold': require('./assets/fonts/Pretendard-SemiBold.ttf'),
    'Pretendard-Bold': require('./assets/fonts/Pretendard-Bold.ttf'),
  });

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <QueryClientProvider client={queryClient}>
          <CustomAlertProvider>
            <StatusBarThemed />
            <PhoneWidthContainer>
              <RootNavigator />
            </PhoneWidthContainer>
          </CustomAlertProvider>
        </QueryClientProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
