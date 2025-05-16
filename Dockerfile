ARG WAR_FILE_STAGE="builder"


FROM --platform=$BUILDPLATFORM docker.io/library/eclipse-temurin:21-jdk AS builder
RUN echo "Installing build dependencies" \
  && apt-get update && apt-get install -y --no-install-recommends python3 build-essential \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /opt/tum-apply

COPY gradlew gradlew.bat ./
COPY build.gradle gradle.properties settings.gradle ./
COPY gradle gradle/

COPY package.json package-lock.json ./

RUN \
  # Mount global cache for Gradle (project cache in /opt/tum-apply/.gradle doesn't seem to be populated)
  --mount=type=cache,target=/root/.gradle/caches \
  # Mount cache for npm
  --mount=type=cache,target=/opt/tum-apply/.npm \
  # Create .npm directory if not yet available
  mkdir -p /opt/tum-apply/.npm \
  # Set .npm directory as npm cache
  && ./gradlew -i --stacktrace --no-daemon -Pprod -Pwar npmSetCacheDockerfile \
  # Pre-populate the npm and gradle caches if related files change (see COPY statements above)
  && ./gradlew -i --stacktrace --no-daemon -Pprod -Pwar npm_ci

COPY . .

RUN \
  # Mount global cache for Gradle (project cache in /opt/tum-apply/.gradle doesn't seem to be populated)
  --mount=type=cache,target=/root/.gradle/caches \
  # Mount cache for npm
  --mount=type=cache,target=/opt/tum-apply/.npm \
  # Mount cache for the Angular CLI
  --mount=type=cache,target=/opt/tum-apply/.cache \
  # Build the .war file
  ./gradlew -i --stacktrace --no-daemon -Pprod -Pwar clean bootWar

FROM docker.io/library/alpine:3.21.3 AS external_builder

ARG WAR_FILE_PATH="/opt/tum-apply/build/libs"

# transfer the .war file from the current directory to the default WAR_FILE_PATH
WORKDIR ${WAR_FILE_PATH}
COPY ./build/libs/*.war tum-apply.war

FROM ${WAR_FILE_STAGE} AS war_file

FROM docker.io/library/eclipse-temurin:21-jdk AS runtime

#default path of the built .war files
ARG WAR_FILE_PATH="/opt/tum-apply/build/libs"
#default UID/GID of the artemis user
ARG UID=1337
ARG GID=1337

RUN echo "Installing needed dependencies" \
  && apt-get update && apt-get install -y --no-install-recommends locales graphviz wget \
  && apt-get clean \
  && rm -rf /var/lib/apt/lists/*

RUN \
  echo "Fixing locales" \
  && sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen \
  && locale-gen
ENV LC_ALL=en_US.UTF-8
ENV LANG=en_US.UTF-8
ENV LANGUAGE=en_US.UTF-8



WORKDIR /opt/tum-apply

COPY --from=war_file ${WAR_FILE_PATH}/*.war tum-apply.war

EXPOSE 8080


CMD [ "java", \
"-Djdk.tls.ephemeralDHKeySize=2048", \
"-DLC_CTYPE=UTF-8", \
"-Dfile.encoding=UTF-8", \
"-Dsun.jnu.encoding=UTF-8", \
"-Djava.security.egd=file:/dev/./urandom", \
"-Xmx5120m", \
"-Xms2560m", \
"--add-modules", "java.se", \
"--add-exports", "java.base/jdk.internal.ref=ALL-UNNAMED", \
"--add-exports", "java.naming/com.sun.jndi.ldap=ALL-UNNAMED", \
"--add-opens", "java.base/java.lang=ALL-UNNAMED", \
"--add-opens", "java.base/java.nio=ALL-UNNAMED", \
"--add-opens", "java.base/sun.nio.ch=ALL-UNNAMED", \
"--add-opens", "java.management/sun.management=ALL-UNNAMED", \
"--add-opens", "jdk.management/com.sun.management.internal=ALL-UNNAMED", \
"-jar", "/opt/tum-apply/tum-apply.war" ]
