package com.dearmi.backend.infrastructure.config;

import com.dearmi.backend.common.converter.AesEncryptionConverter;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;

/**
 * AES 암호화 키 초기화 설정
 *
 * JPA AttributeConverter는 Spring이 아닌 JPA가 인스턴스화하므로
 * @Value 직접 주입이 불가. 이 Config에서 @PostConstruct 시점에
 * AesEncryptionConverter.initialize(key) 를 호출해 정적 키를 설정한다.
 */
@Configuration
public class EncryptionConfig {

    @Value("${encryption.key}")
    private String encryptionKey;

    @PostConstruct
    public void init() {
        AesEncryptionConverter.initialize(encryptionKey);
    }
}
