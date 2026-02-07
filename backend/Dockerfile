# ============================================================
# Stage 1: Build
# ============================================================
FROM eclipse-temurin:17-jdk AS builder

WORKDIR /app

# Gradle wrapper + 의존성 캐시 레이어 분리
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .

RUN chmod +x gradlew
RUN ./gradlew dependencies --no-daemon -q 2>/dev/null || true

# 소스 복사 후 빌드
COPY src src
RUN ./gradlew bootJar --no-daemon -x test

# ============================================================
# Stage 2: Run
# ============================================================
FROM eclipse-temurin:17-jre

WORKDIR /app

# 보안: root 아닌 전용 유저로 실행
RUN groupadd -r dearmi && useradd -r -g dearmi dearmi
USER dearmi

COPY --from=builder /app/build/libs/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-Dspring.profiles.active=prod", \
  "-jar", "app.jar"]
