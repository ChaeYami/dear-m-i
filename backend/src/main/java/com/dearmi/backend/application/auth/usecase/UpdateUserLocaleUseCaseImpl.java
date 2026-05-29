package com.dearmi.backend.application.auth.usecase;

import com.dearmi.backend.common.exception.CustomException;
import com.dearmi.backend.common.exception.ErrorCode;
import com.dearmi.backend.domain.user.User;
import com.dearmi.backend.domain.user.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.UUID;

@Service
@RequiredArgsConstructor
public class UpdateUserLocaleUseCaseImpl implements UpdateUserLocaleUseCase {

    private final UserRepository userRepository;

    @Override
    @Transactional
    public void updateLocale(UUID userId, String locale) {
        User user = userRepository.findByIdAndDeletedAtIsNull(userId)
                .orElseThrow(() -> new CustomException(ErrorCode.NOT_FOUND));
        user.updatePreferredLocale(normalize(locale));
        userRepository.save(user);
    }

    /** 지원 로케일(ko/en)로 정규화. 비대상은 KR 게이팅(기본 ko). */
    private String normalize(String locale) {
        if (locale == null) return "ko";
        String l = locale.toLowerCase();
        if (l.startsWith("en")) return "en";
        return "ko";
    }
}
