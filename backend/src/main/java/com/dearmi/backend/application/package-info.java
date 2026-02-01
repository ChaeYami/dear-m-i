/**
 * Application 레이어
 * - UseCase interface: 비즈니스 유스케이스 정의
 * - UseCase impl: 유스케이스 구현체 (비즈니스 로직 오케스트레이션)
 * - Port interface: 외부 시스템 접근을 위한 포트 정의 (infrastructure가 구현)
 *
 * 규칙:
 * - Spring 의존성은 허용(@Service 등), 단 Domain 규칙을 침범하지 않음
 * - Domain 레이어에만 의존 가능 (infrastructure 직접 의존 금지)
 */
package com.dearmi.backend.application;
