# Stage 1: Build Angular frontend with Node.js 22
FROM --platform=linux/amd64 node:22-bullseye AS angular-build
WORKDIR /tum-apply
ENV NODE_OPTIONS=--max_old_space_size=4096

COPY package*.json ./
RUN npm ci

COPY prebuild.mjs ./
COPY angular.json tsconfig.json tsconfig.app.json ./
COPY ngsw-config.json ./

COPY build.gradle ./
COPY src/main/webapp ./src/main/webapp
RUN npm run build -- --configuration production

# Stage 2: Build Spring Boot backend with Gradle and Java 21
FROM gradle:8.7.0-jdk21 AS gradle-build
WORKDIR /tum-apply
COPY . .
# Copy Angular build output into Spring Boot static resources
COPY --from=angular-build /tum-apply/dist/tum-apply/ ./tum-apply/dist/tum-apply/
RUN gradle clean build -x test

# Stage 3: Minimal Java 21 image to run the app
FROM eclipse-temurin:21-jdk-alpine
VOLUME /tmp
COPY --from=gradle-build /tum-apply/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
