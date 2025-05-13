# Stage 1: Build the application
FROM gradle:8.3-jdk21 AS build

WORKDIR /app

# Copy Gradle wrapper and build files to cache dependencies
COPY gradlew settings.gradle build.gradle /app/
COPY gradle /app/gradle

# Download dependencies to cache them
RUN ./gradlew dependencies --no-daemon

# Copy the source code
COPY ../../../src/main/java /app/src/main/java
COPY ../../../src/main/resources /app/src/main/resources
COPY ../../../src/test/java /app/src/test/java
COPY ../../../src/test/resources /app/src/test/resources

# Build the application
RUN ./gradlew build -x test --no-daemon

# Stage 2: Create the runtime image
FROM eclipse-temurin:21

WORKDIR /app

# Copy the built JAR file from the build stage
COPY --from=build /app/build/libs/*.jar /app/server.jar

# Create a non-root user for running the application
RUN addgroup --system spring && adduser --system spring --ingroup spring

USER spring:spring

# Expose the application port
EXPOSE 8080

# Run the application
ENTRYPOINT ["java", "-Djava.security.egd=file:/dev/./urandom", "-jar", "/app/server.jar"]
