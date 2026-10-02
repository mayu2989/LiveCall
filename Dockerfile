
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY backend/pom.xml .
RUN mvn -B -q dependency:go-offline

COPY backend/src ./src
RUN mvn -B -q -DskipTests package \
 && cp target/*.jar /build/app.jar


FROM eclipse-temurin:21-jre-alpine
WORKDIR /app


RUN addgroup -S app && adduser -S app -G app
USER app

COPY --from=build --chown=app:app /build/app.jar ./app.jar

ENV JAVA_TOOL_OPTIONS="-XX:+UseSerialGC \
 -XX:MaxRAMPercentage=70 \
 -XX:TieredStopAtLevel=1 \
 -Xss512k \
 -XX:+ExitOnOutOfMemoryError"

EXPOSE 10000
ENTRYPOINT ["java", "-jar", "/app/app.jar"]
