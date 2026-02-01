import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * 네트워크 연결 상태 훅
 * - 오프라인 여부를 실시간으로 감지
 * - OfflineBanner 컴포넌트와 함께 사용
 */
export const useNetworkStatus = () => {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [isInternetReachable, setIsInternetReachable] = useState<boolean>(true);

  useEffect(() => {
    // 초기 상태 즉시 확인
    NetInfo.fetch().then((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    // 네트워크 상태 변화 구독
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected ?? true);
      setIsInternetReachable(state.isInternetReachable ?? true);
    });

    return unsubscribe;
  }, []);

  return {
    /** 네트워크 연결 여부 */
    isConnected,
    /** 실제 인터넷 도달 가능 여부 */
    isInternetReachable,
    /** 오프라인 여부 (편의 속성) */
    isOffline: !isConnected || !isInternetReachable,
  };
};
