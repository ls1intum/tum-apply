# ───────────────────────────────────────────
# 1️⃣  Build stage
# ───────────────────────────────────────────
FROM gradle:8.14-jdk21 AS builder
WORKDIR /workspace

# grab only what we need for compilation
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
COPY src ./src

# compile & package
RUN gradle bootWar --no-daemon

# ───────────────────────────────────────────
# 2️⃣  Runtime stage
# ───────────────────────────────────────────
FROM eclipse-temurin:21-jre
WORKDIR /app

# copy the WAR (or JAR) from the builder
COPY --from=builder /workspace/build/libs/*.war app.war

# if you run as WAR under embedded Tomcat:
EXPOSE 8080
ENTRYPOINT ["java","-jar","app.war","--spring.profiles.active=prod"]
