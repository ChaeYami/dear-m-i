/**
 * Presentation 레이어
 * - Controller: HTTP 요청 처리, UseCase 호출
 * - DTO: 요청/응답 데이터 전송 객체
 * - Mapper: DTO <-> Domain 객체 변환 (MapStruct)
 *
 * 규칙:
 * - Controller는 반드시 UseCase interface만 호출 (impl 직접 참조 금지)
 * - Domain Entity를 외부로 직접 노출하지 않음
 */
package com.dearmi.backend.presentation;
