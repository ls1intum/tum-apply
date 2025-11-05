# TUMApply — General Developer Guide

This guide covers **cross-cutting conventions** and shared building blocks used across TUMApply.

---

## 1) Client-side foundations

### 1.1 Shared UI Library

**Path:** `src/main/webapp/app/shared/components/`

- **atoms**  
  `string-input`, `number-input`, `select`, `datepicker`, `button`, `tag`, `editor`, etc.  
  Small, single-purpose building blocks with no external layout assumptions.

- **molecules**  
  `progress-stepper`, `button-group`, `search-filter-sort-bar`, etc.  
  Compose atoms into richer interactions; keep API surface minimal and predictable.

- **organisms**  
  `dynamic-table`, etc.  
  Page-level sections that orchestrate molecules/atoms; should remain data-agnostic where possible.

> **Tip:** Favor **reusable atomic components**. Prefer composing existing atoms/molecules before introducing new ones. When you must add a component:
> - Avoid embedding business logic; bubble events and accept data/config via inputs.
> - Provide i18n-ready labels (see §3).

---

### 1.2 Language (i18n)

**Path:** `src/main/webapp/i18n/`

- Store translation **dictionaries** here (DE/EN).
- All user-visible strings must be **translation-driven**.
- Add keys to the dictionaries and use the project’s `translate` directive in templates.
- **Keep labels short and consistent** to preserve layout in both languages.
- When adding new UI, verify both **German** and **English** renderings (wrapping, truncation, tooltip lengths).

---

## 2) Server-side foundations

### 2.1 Data Transfer Objects (DTOs)

**Path:** `src/main/java/**/dto/`

- DTOs define **API boundaries** between client and server.
- Keep **create/update** shapes separate from **read** shapes where it improves clarity.
- Avoid leaking persistence concerns (IDs, timestamps) into write DTOs unless required.
- Validate DTOs at the boundary; map cleanly to domain entities within services.

---

## 3) UI patterns

### 3.1 Sorting & filtering (client-side)

- Use **molecules**: `search-filter-sort-bar`, `filter-multiselect`.  
  Use the **atom**: `sorting`.
- Feed options from `dropdown-options.ts` to keep labels/values centralized.
- Keep UI state (selected filters, sort key/order, search term) **serializable** so it can be:
  - Reflected in the URL (optional)
  - Passed to list components
  - Logged in tests
- Handle **empty** and **error** states explicitly in list components.

---

## 4) Testing & quality

### Client-side

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
