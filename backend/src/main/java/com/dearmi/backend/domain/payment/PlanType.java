package com.dearmi.backend.domain.payment;

import lombok.Getter;
import lombok.RequiredArgsConstructor;

/**
 * 웹 결제 플랜 타입.
 * 앱 내 IAP와 별개로 토스페이먼츠(Android + 웹) 전용.
 */
@Getter
@RequiredArgsConstructor
public enum PlanType {
    MONTHLY(4_900),
    YEARLY(39_900);

    private final int amount;
}
