import { createMMKV } from 'react-native-mmkv';

/**
 * MMKV 기반 로컬 캐시 서비스 (react-native-mmkv v4+)
 * - 비민감 데이터 고속 저장소 (민감 정보는 expo-secure-store 사용)
 * - JSON 직렬화/역직렬화를 자동 처리
 */
const storage = createMMKV({ id: 'dearmi-app-storage' });

export const CacheService = {
  /** 값 저장 (JSON 직렬화) */
  set: <T>(key: string, value: T): void => {
    storage.set(key, JSON.stringify(value));
  },

  /** 값 조회 (JSON 역직렬화), 없으면 null */
  get: <T>(key: string): T | null => {
    const raw = storage.getString(key);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as T;
    } catch {
      return null;
    }
  },

  /** 특정 키 삭제 */
  delete: (key: string): void => {
    storage.remove(key);
  },

  /** 전체 캐시 초기화 (로그아웃 시 호출) */
  clearAll: (): void => {
    storage.clearAll();
  },

  /** 키 존재 여부 확인 */
  contains: (key: string): boolean => {
    return storage.contains(key);
  },
};
