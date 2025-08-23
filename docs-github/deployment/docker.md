# 🐳 Docker & JHipster Control Center

## JHipster Control Center

JHipster Control Center can help you manage and control your application(s). Start a local control center server (
accessible at [http://localhost:7419](http://localhost:7419)) with:

```bash
docker compose -f src/main/docker/jhipster-control-center.yml up
```

---

## Docker Compose Support

To launch required third-party services, JHipster generates Docker Compose files in `src/main/docker/`.

Start services:

```bash
docker compose -f src/main/docker/services.yml up -d
```

Stop and remove containers:

```bash
docker compose -f src/main/docker/services.yml down
```

To disable Spring Boot's Docker Compose integration:

```yaml
spring:
  docker:
    compose:
      enabled: false
```

---

## Dockerize the Application

Build a Docker image of your app:

```bash
npm run java:docker
```

Or for arm64 (e.g. M1 Macs):

```bash
npm run java:docker:arm64
```

Run your app and services:

```bash
docker compose -f src/main/docker/app.yml up -d
```
