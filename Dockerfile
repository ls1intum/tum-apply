# Stage 1: Build Angular frontend with Node.js 22
FROM --platform=linux/amd64 node:20-slim AS angular-build
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 build-essential \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /tum-apply

COPY package*.json ./
RUN --mount=type=cache,target=/tum-apply/.npm \
    npm ci

COPY prebuild.mjs ./
COPY angular.json tsconfig.json tsconfig.app.json ./
COPY ngsw-config.json ./

COPY build.gradle ./
COPY src/main/webapp ./src/main/webapp
RUN --mount=type=cache,target=/tum-apply/.npm \
    npm run build -- --configuration production

# Stage 2: Build Spring Boot backend with Gradle and Java 21
FROM --platform=linux/amd64 gradle:8.7.0-jdk21 AS gradle-build

USER root
RUN apt-get update \
 && apt-get install -y --no-install-recommends python3 build-essential \
 && rm -rf /var/lib/apt/lists/*

WORKDIR /tum-apply

COPY gradlew settings.gradle build.gradle gradle.properties ./
COPY gradle ./gradle

RUN --mount=type=cache,target=/root/.gradle/caches \
    ./gradlew dependencies --no-daemon

COPY . .
# Copy Angular build output into Spring Boot static resources
COPY --from=angular-build /tum-apply/dist/tum-apply/ ./tum-apply/dist/tum-apply/
RUN --mount=type=cache,target=/root/.gradle/caches \
    ./gradlew clean bootWar -x test --no-daemon

# Stage 3: Minimal Java 21 image to run the app
FROM eclipse-temurin:21-jdk-alpine
WORKDIR /tum-apply

COPY --from=gradle-build /tum-apply/build/libs/*.war ./app.war

EXPOSE 8080
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "app.war", "--spring.profiles.active=dev"]
