# 🐳 Docker

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
