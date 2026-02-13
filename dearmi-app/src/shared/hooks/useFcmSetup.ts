import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import notificationApi from '@/features/notification/api';

/**
 * FCM 푸시 알림 초기 설정
 * - 실기기 여부 확인
 * - 권한 요청
 * - FCM 토큰 획득 후 서버에 등록
 * MainTabNavigator에서 한 번만 호출
 */
export const useFcmSetup = () => {
  useEffect(() => {
    setupFcm();
  }, []);

  const setupFcm = async () => {
    // 실기기가 아니면 푸시 알림 불가 (시뮬레이터 제외)
    if (!Device.isDevice) return;

    // 권한 확인 및 요청
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') return;

    // Android 알림 채널 설정
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: '기본 알림',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
      });
    }

    try {
      const tokenData = await Notifications.getDevicePushTokenAsync();
      await notificationApi.registerToken({
        fcmToken: tokenData.data,
      });
    } catch (e) {
      // FCM 토큰 등록 실패는 무시 (알림 미수신으로 이어질 수 있으나 앱 동작에 영향 없음)
    }
  };
};
