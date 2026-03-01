# Testing Guide

This document describes how to write and run and structure tests in TUMApply, both for the Spring Boot server and Angular client.

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

### Architecture Rules (ArchUnit)

The class `src/test/java/de/tum/cit/aet/TechnicalStructureTest.java` contains architecture rules that run as part of server-side tests.

Newly added ArchUnit rule text and purpose:

- `declare @ExportedUserData or @NoUserDataExportRequired`
  - Function: every class annotated with `@Entity` must explicitly document its export decision.
  - Why: this prevents silently missing entities in user data export flows by forcing an explicit opt-in (`@ExportedUserData`) or opt-out (`@NoUserDataExportRequired`).

- `reference a @Component provider implementing UserDataSectionProvider`
  - Function: any entity marked with `@ExportedUserData` must map to a valid, Spring-managed export provider.
  - Why: this guarantees exported entities are backed by executable export logic and can be collected consistently.

When adding a new entity, always choose one of these two annotations. If you mark it as exported, ensure the configured provider exists, implements `UserDataSectionProvider`, and is annotated with `@Component`.

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

Run all tests with:

```bash
 ./gradlew test
```

Generate test coverage report with:

```bash
 ./gradlew test jacocoTestReport
```

View coverage report of tests:

```bash
 open build/reports/jacoco/test/html/index.html
```
