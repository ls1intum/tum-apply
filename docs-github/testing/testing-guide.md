# Testing Guide

This document describes how to write and  run and structure tests in TUMApply, both for the Spring Boot server and Angular client.

---
## 📂 Test Location & Structure (Mirror Source)

To ensure maintainability, we strictly follow a **Mirror Structure**. This means the directory hierarchy in the test folder must **exactly match** the package structure of the source code.

Test files are located in : `src/test`

---
### Test Types

- **Unit Tests**: Validate isolated components and logic (e.g., services, utils)
- **Integration Tests**: Test the interaction between components (e.g., REST endpoints, repositories)
- **Code Coverage**: Generated via `jacocoTestReport`

Test reports will be available under `build/reports/tests/` and `build/reports/jacoco/`.

---

## Client-Side Testing (Angular)

- Test runner: **Vitest**  
  Example command:
  ```bash
  npm run test:ci
  ```
- View coverage report of tests:
  ```bash
  open build/test-results/lcov-report/index.html
  ```

- Coverage thresholds (CI): **95%** for statements/branches/functions/lines.  
  Keep unit tests close to the component you change. Prefer focused DOM and behavior tests (validation, visibility of actions, rendering of states, sorting/filter effects).


You can also run tests with code coverage:

```bash
./npmw test -- --coverage
```
---
## Server-Side Testing (Spring Boot)

### Tools
- **JUnit 5:** The main testing framework.
- **AssertJ:** Used for fluent assertions.
- **Mockito:** For mocking dependencies in isolated unit tests.

```bash
# Run all tests
./gradlew test
