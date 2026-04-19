/**
 * 게스트 모드 요청 차단 시 throw 되는 sentinel 에러.
 *
 * axiosInstance 의 request 인터셉터가 isGuest && 쓰기 메서드 일 때 던지고,
 * queryClient 의 mutation 기본 onError 가 잡아서 customAlert + 로그인 유도.
 *
 * 별도 파일에 두는 이유: queryClient ↔ axiosInstance ↔ authStore 순환 의존 회피.
 */
export class GuestModeError extends Error {
  readonly isGuestModeError = true;
  constructor() {
    super('Operation blocked in guest mode');
    this.name = 'GuestModeError';
  }
}

export const isGuestModeError = (err: unknown): err is GuestModeError =>
  err instanceof GuestModeError ||
  (typeof err === 'object' &&
    err !== null &&
    (err as { isGuestModeError?: boolean }).isGuestModeError === true);
