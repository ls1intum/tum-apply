# Testing Guide

This document describes how to run and structure tests in TUMApply, both for the Spring Boot server and Angular client.

---

## Server-Side Testing (Spring Boot)

To run all backend tests including unit and integration tests, use:

```bash
./gradlew test integrationTest jacocoTestReport
```

### Test Types

- **Unit Tests**: Validate isolated components and logic (e.g., services, utils)
- **Integration Tests**: Test the interaction between components (e.g., REST endpoints, repositories)
- **Code Coverage**: Generated via `jacocoTestReport`

Test reports will be available under `build/reports/tests/` and `build/reports/jacoco/`.

---

## Client-Side Testing (Angular + Jest)

Client tests are powered by **Jest** and run independently from the backend:

```bash
./npmw test
```

Tests are colocated with components and services in the Angular structure.

### Example

```ts
describe('NavbarComponent', () => {
    it('should toggle theme', () => {
        const fixture = TestBed.createComponent(NavbarComponent);
    ...
    });
});
```

You can also run tests with code coverage:

```bash
./npmw test -- --coverage
```

---

## Code Quality & SonarQube

We use **SonarQube** to continuously inspect code quality. To start a local SonarQube server:

```bash
docker compose -f src/main/docker/sonar.yml up -d
```

Access it at [http://localhost:9001](http://localhost:9001)

Note: we have turned off forced authentication redirect for UI in [src/main/docker/sonar.yml](src/main/docker/sonar.yml)
for out of the box experience while trying out SonarQube, for real use cases turn it back on.

You can run a Sonar analysis with using
the [sonar-scanner](https://docs.sonarqube.org/display/SCAN/Analyzing+with+SonarQube+Scanner) or by using the gradle
plugin.

Then, run a Sonar analysis:

```
./gradlew -Pprod clean check jacocoTestReport sonarqube -Dsonar.login=admin -Dsonar.password=admin
```

Additionally, Instead of passing `sonar.password` and `sonar.login` as CLI arguments, these parameters can be configured
from [sonar-project.properties](sonar-project.properties) as shown below:

```
sonar.login=admin
sonar.password=admin
```

---

## Notes

- Make sure Docker is running before executing SonarQube commands
- Adjust test file naming (`*.spec.ts`, `*Test.java`) to ensure they are picked up
