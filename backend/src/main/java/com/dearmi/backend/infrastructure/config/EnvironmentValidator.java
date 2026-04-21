package com.dearmi.backend.infrastructure.config;

import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.env.Environment;
import org.springframework.stereotype.Component;

import java.util.Arrays;
import java.util.Set;

/**
 * 부트스트랩 시점에 활성 Spring 프로파일을 검증.
 * prod 와 local/dev 가 동시에 활성화되면 부팅 중단 — DevAuthController 같은
 * 디버그 엔드포인트가 운영에 노출되는 사고를 막는다.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class EnvironmentValidator {

    private static final Set<String> DANGEROUS_WITH_PROD = Set.of("local", "dev");

    private final Environment environment;

    @PostConstruct
    public void validate() {
        String[] active = environment.getActiveProfiles();
        log.info("[Bootstrap] Active Spring profiles: {}", Arrays.toString(active));

        Set<String> activeSet = Set.of(active);
        if (activeSet.contains("prod")) {
            for (String dangerous : DANGEROUS_WITH_PROD) {
                if (activeSet.contains(dangerous)) {
                    throw new IllegalStateException(
                            "[Bootstrap] FATAL: prod 프로파일과 " + dangerous +
                                    " 프로파일이 동시에 활성화됨. 디버그용 엔드포인트(DevAuthController 등)가 " +
                                    "운영에 노출될 수 있어 부팅을 중단합니다. active=" + Arrays.toString(active)
                    );
                }
            }
        }
    }
}
