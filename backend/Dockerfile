FROM gradle:8.14.3-jdk17 AS build

WORKDIR /workspace

COPY gradle gradle
COPY gradlew gradlew
COPY build.gradle settings.gradle ./
RUN chmod +x gradlew
COPY src src
RUN ./gradlew --no-daemon bootJar

FROM eclipse-temurin:17-jre

WORKDIR /app
RUN useradd --system --uid 10001 --create-home appuser \
    && mkdir -p /app/uploads \
    && chown -R appuser:appuser /app

COPY --from=build --chown=appuser:appuser /workspace/build/libs/*.jar /app/app.jar

USER appuser
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
