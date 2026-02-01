package com.dearmi.backend.common.entity;

import jakarta.persistence.Column;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.MappedSuperclass;
import lombok.Getter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.time.LocalDateTime;

/**
 * 공통 시간 필드를 가지는 모든 Entity의 부모 클래스
 * - createdAt: 생성 시각 (자동 설정, 수정 불가)
 * - updatedAt: 마지막 수정 시각 (자동 갱신)
 * - deletedAt: 소프트 삭제 시각 (null이면 정상, 값이 있으면 삭제됨)
 *
 * 사용 방법: Entity 클래스에서 extends BaseTimeEntity
 * JPA Auditing 활성화 필요: @EnableJpaAuditing (JpaConfig에서 설정)
 */
@Getter
@MappedSuperclass
@EntityListeners(AuditingEntityListener.class)
public abstract class BaseTimeEntity {

    /** 생성 시각 - 최초 저장 시 자동 설정, 이후 변경 불가 */
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private LocalDateTime createdAt;

    /** 마지막 수정 시각 - 저장/수정 시 자동 갱신 */
    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    /** 소프트 삭제 시각 - null이면 활성 상태, 값이 있으면 삭제된 상태 */
    @Column(name = "deleted_at")
    private LocalDateTime deletedAt;

    /**
     * 소프트 삭제 처리
     * - deletedAt에 현재 시각을 설정
     */
    public void softDelete() {
        this.deletedAt = LocalDateTime.now();
    }

    /**
     * 삭제 여부 확인
     *
     * @return 삭제된 경우 true
     */
    public boolean isDeleted() {
        return this.deletedAt != null;
    }
}
