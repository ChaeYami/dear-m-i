import { useEffect } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import notificationApi from '@/features/notification/api';
import i18n from '@/locales/i18n';

/**
 * 푸시 알림 초기 설정 (Expo Push Service)
 * - 실기기 여부 확인
 * - 권한 요청
 * - Expo Push 토큰 (`ExponentPushToken[...]`) 획득 후 서버에 등록
 *
 * iOS/Android 단일 토큰 형식. Expo 가 내부적으로 APNs/FCM 분배.
 * 백엔드는 이 토큰을 Expo Push API (https://exp.host/--/api/v2/push/send) 로 그대로 전송.
 * MainTabNavigator에서 한 번만 호출.
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
    // opensAppToForeground: true — 앱이 킬 상태여도 JS 가 확실히 깨어 핸들러가 실행되도록.
    // (opensAppToForeground: false 는 Android/iOS 모두 킬 상태에서 reliable 하지 않아
    //  액션이 API 호출까지 이어지지 않는 케이스가 있음)
    // RootNavigator 가 useLastNotificationResponse 로 런치 응답을 잡아 API + 캐시 invalidate 수행,
    // 사용자는 곧바로 복약 관리 탭의 반영된 상태를 확인할 수 있다.
    await Notifications.setNotificationCategoryAsync('MEDICATION_REMINDER', [
      {
        identifier: 'TAKEN',
        buttonTitle: i18n.t('settings:medication_status_taken'),
        options: { opensAppToForeground: true },
      },
      {
        identifier: 'SKIPPED',
        buttonTitle: i18n.t('settings:medication_status_skipped'),
        options: { opensAppToForeground: true, isDestructive: true },
      },
    ]);

    try {
      // Expo Push token 발급 — projectId 필수 (EAS Build 환경에서도 동일하게 동작).
      // iOS 는 APNs 키, Android 는 FCM 서버 키를 Expo 가 대신 관리한다.
      const projectId =
        Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
      if (!projectId) return;

      const tokenData = await Notifications.getExpoPushTokenAsync({ projectId });
      await notificationApi.registerToken({
        fcmToken: tokenData.data,
      });
    } catch (e) {
      // 토큰 등록 실패는 무시 (알림 미수신으로 이어질 수 있으나 앱 동작에 영향 없음)
    }
  };
};
