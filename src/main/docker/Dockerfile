# Stage 1: Build Angular frontend with Node.js 22
FROM --platform=linux/amd64 node:22 AS angular-build
WORKDIR /app
COPY . .
RUN npm install && npm run build

# Stage 2: Build Spring Boot backend with Gradle and Java 21
FROM gradle:8.7.0-jdk21 AS gradle-build
WORKDIR /app
COPY . .
# Copy Angular build output into Spring Boot static resources
COPY --from=angular-build /app/webapp/dist/tum-apply/ ./src/main/resources/static/
RUN gradle clean build -x test

# Stage 3: Minimal Java 21 image to run the app
FROM eclipse-temurin:21-jdk-alpine
VOLUME /tmp
COPY --from=gradle-build /app/build/libs/*.jar app.jar
ENTRYPOINT ["java", "-jar", "/app.jar"]
