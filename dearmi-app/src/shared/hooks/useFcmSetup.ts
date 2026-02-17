import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import notificationApi from '@/features/notification/api';
import i18n from '@/locales/i18n';

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
        name: i18n.t('common:default_notification_channel'),
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#6C63FF',
      });
    }

    // 복약 알림: 복용/건너뜀 액션 버튼 카테고리 등록
    //   iOS: APNs aps.category 와 매칭되어 시스템이 액션 버튼을 렌더
    //   Android: FCM data payload 의 categoryId 와 매칭되어 expo-notifications 가 재빌드
    //
    // opensAppToForeground 플랫폼별 분기:
    //   - iOS: false → 앱 안 열고 짧은 background JS 컨텍스트에서 API 호출
    //   - Android: true → kill 상태일 때 JS 리스너가 안 떠서, 앱 열며 확실히 처리
    const opensForeground = Platform.OS === 'android';
    await Notifications.setNotificationCategoryAsync('MEDICATION_REMINDER', [
      {
        identifier: 'TAKEN',
        buttonTitle: i18n.t('settings:medication_status_taken'),
        options: { opensAppToForeground: opensForeground },
      },
      {
        identifier: 'SKIPPED',
        buttonTitle: i18n.t('settings:medication_status_skipped'),
        options: { opensAppToForeground: opensForeground, isDestructive: true },
      },
    ]);

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
