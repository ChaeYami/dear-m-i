/**
 * Domain 레이어 (핵심 비즈니스 규칙)
 * - Entity: 비즈니스 핵심 도메인 객체
 * - DomainService: 여러 Entity에 걸친 도메인 로직
 * - Exception: 도메인 규칙 위반 예외
 * - Repository interface: 영속성 추상화 (implementation은 infrastructure에)
 *
 * 규칙:
 * - Spring 프레임워크 의존성(@Repository, @Service 등) 절대 금지
 * - 순수 Java/Jakarta 어노테이션만 허용 (@Entity, @Column 등 JPA는 허용)
 * - 외부 레이어에 의존하지 않음 (최내부 레이어)
 */
package com.dearmi.backend.domain;
