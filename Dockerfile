FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /build

COPY backend/pom.xml ./pom.xml
COPY backend/src ./src
RUN mvn -B -DskipTests package

FROM eclipse-temurin:21-jre
WORKDIR /app

COPY --from=build /build/target/livecall-api-0.1.0-SNAPSHOT.jar ./app.jar
ENV PORT=10000
EXPOSE 10000

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
