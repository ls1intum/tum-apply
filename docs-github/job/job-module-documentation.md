# TUMApply — Job Module: Developer Guide

Welcome! This document orients new contributors to the Job Module in **TUMApply**. It focuses on what you need to know to navigate the codebase, understand the core concepts, and make changes.

---

## 1) What this module does (at a glance)

The Job Module provides the UI and server-side logic for:
- Creating structured doctorate position postings (multi-step form)
- Managing positions (list, state badges, context-aware actions)
- Discovering positions (applicant-facing overview and detail views)

It is intentionally **role-aware**: some controls render only for professors, while applicants see read-only information.

---

## 2) Client-side

> Base path for the module: `src/main/webapp/app/job`

Common locations you’ll work with:

- **My Positions Dashboard** (professor view)
  - `job-overview/` - dashboard for managing my positions 

- **Find Positions Page** (applicant view)
  - `job-overview/job-overview-page/` – entry page for applicants to browse positions
  - `job-overview/job-card-list/` – list container, sorting/filter integration
  - `job-overview/job-card/` – single card for a position

- **Job Creation** (professor only)
  - `job-creation-form/` – multi-step form (stepper, validation, autosave)

- **Job Detail** (both roles)
  - `job-detail/` – applicant and professor views share the same base component, with role-based rendering

- **Options & Utilities**
  - `dropdown-options.ts` – central lists for select/sort options
  - `../../shared/constants/saving-states.ts` – shared saving-state labels

- **Shared UI Library**
  - `src/main/webapp/app/shared/components/`
    - **atoms**: `string-input`, `number-input`, `select`, `datepicker`, `button`, `tag`, `editor`, etc.
    - **molecules**: `progress-stepper`, `button-group`, `search-filter-sort-bar`, etc.
    - **organisms**: `dynamic-table`, etc.

- **Language**
  - `src/main/webapp/i18n/` (dictionaries to add translation keys)

> Tip: The module favors **reusable atomic components**. Prefer composing existing atoms/molecules before introducing new ones.

---

## 3) Server-side

> Base path for the module: `src/main/java/de/tum/cit/aet/job/`

### 3.1 Package map (what lives where)
- **`constants/`**
  - `Campus`, `CustomFieldType`, `FundingType`, `JobState`  
    Enum sources used across DTOs
- **`domain/`**
  - `Job`, `CustomField`
    JPA entities with validation annotations and state transition helpers.
- **`dto/`**
    Data transfer objects for API boundaries; separate create/update shapes.
- **`repository/`**
  - `JobRepository`, `CustomFieldRepository`  
    Spring Data repositories with custom query methods for filtering/sorting.
- **`service/`**
  - `JobService`  
    Core business logic: state transitions, validation, filtering, and orchestration of persistence.
- **`web/`**
  - `JobResource`  
    REST controller exposing endpoints for job operations.

---

## 4) Core concepts

### 4.1 Position state model
The UI recognizes these states and surfaces them via badges and available actions:
- **Draft** – not visible to applicants
- **Published** – visible to applicants
- **Applicant Found** – visible, but not accepting further applications
- **Closed** – not accepting applications

Action availability is state-dependent (e.g., **Delete** is only allowed for Draft, **Close** is only allowed for Published).

### 4.2 Role awareness
- **Professors** see management controls (create, edit, delete drafts, close published).
- **Applicants** see a read-only view with apply affordances (navigation to application flow is wired outside this module).

### 4.3 Form design & autosave
- Multi-step creation form with progressive disclosure.
- Inline validation and tooltips reduce user error.
- Autosave/draft-save prevents data loss; saving state strings are unified in `shared/constants/saving-states.ts`.

### 4.4 Sorting & filtering (client-side)
- Sorting and filter UIs are provided by `search-filter-sort-bar` and `filter-multiselect` (molecules), and fed by `dropdown-options.ts`.

### 4.5 Internationalization (DE/EN)
- All visible strings must be translation-driven.
- Add keys in the translation files and use the `translate` directive in templates.
- Keep labels short and consistent to preserve layout in both languages.

---

## 5) Key components to know

- **`JobOverviewPageComponent`**  
  Orchestrates the list view. Hosts the search/filter/sort bar and the card list.

- **`JobCardListComponent`**  
  Loads and renders position cards; applies current sort/filter model; handles empty/error states.

- **`JobCardComponent`**  
  Displays the compact card view (title, location, workload, dates, supervisor, etc.). Includes computed display helpers (e.g., formatted dates, relative times).

- **`JobCreationFormComponent`**  
  Multi-step form (Step 1: basics; Step 2: details; Step 3: summary). Manages validation, autosave, and summary before publish.

- **`JobDetailComponent`**  
  Structured details (overview, research group, description, tasks, requirements, data protection). Renders management controls when the viewer is the owning professor.

---

## 6) Testing and quality bars

### 6.1 Client-side tests

- Test runner: **Vitest**  
  Example command:
  ```bash
  npm run test:ci
  ```
- Coverage thresholds (CI): **95%** for statements/branches/functions/lines.  
  Keep unit tests close to the component you change. Prefer focused DOM and behavior tests (validation, visibility of actions, rendering of states, sorting/filter effects).

- Useful spec locations:
  - `src/test/webapp/app/job/job-creation-form/*.spec.ts`
  - `src/test/webapp/app/job/job-detail/*.spec.ts`
  - `src/test/webapp/app/job/job-overview/*.spec.ts`
  - `src/test/webapp/app/job/my-positions/*.spec.ts`
  - `src/test/webapp/app/shared/components/**` (atoms/molecules used by this module)

### 6.2 Server-side tests
  Useful test locations:
- `src/test/java/de/tum/cit/aet/job/web/rest/JobServiceTest.java`
- 
---

## 7) TL;DR for new devs

- Start in `src/main/webapp/app/job/`.
- Learn the **state model** (Draft/Published/Applicant Found/Closed) and how it controls **badges and actions**.
- Use the **shared atom/molecule** components and add DE/EN translations.
- Update **tests** and keep coverage above the CI thresholds.
- For list sorting/filter options, go through `dropdown-options.ts` and the `search-filter-sort-bar` + `job-card-list` wiring.

Happy developing! 🎉
