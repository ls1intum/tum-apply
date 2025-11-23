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

### 2.2 Authorization and Security

**Endpoint Security:**
- `@ApplicantOrAdmin` — Restricts access to applicants (owners) or system administrators.
  - Used for: Create, Update, Delete, Upload, Withdraw operations.
  - Enforces ownership check: Applicant can only access their own applications.

- `@ProfessorOrAdmin`
  - Works analogously to `@ApplicantOrAdmin`.

- `@Authenticated` — Requires any authenticated user (applicant or professor).
  - Used for: Read operations (GetById, GetDocumentIds).
  - Professors can view applications they're evaluating.

**Service-Level Authorization:**
- `CurrentUserService` provides authenticated user context.
- Ownership validation: Compares `application.applicant.userId` with `currentUser.userId`.
- Throws `AccessDeniedException` for unauthorized access attempts.

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

## 4) Endpoint Error Handling

**Validation Errors:**

- `@Valid` annotations trigger Bean Validation framework.
- Returns `400 Bad Request` with detailed error messages.
- User interface displays field-level validation errors.

**Authorization Errors:**

- `AccessDeniedException` returns `403 Forbidden`.
- Client handles via global error interceptor.
- Displays user-friendly error toast message.

**Not Found Errors:**

- Returns `404 Not Found` for invalid application IDs.
- User interface gracefully handles missing resources.

**Server Errors:**

- Unhandled exceptions return `500 Internal Server Error`.
- Logged with full stack trace for debugging.
- User interface displays generic error message to user.

**Custom Exceptions:**

We have a set of custom exceptions (e.g. for specific conflict scenarios or business logic errors) that can be utilized:
`src/main/java/de/tum/cit/aet/core/exception`
## 5) Performance Optimizations

The following points are some of several strategies used across the TUMApply application to boost the performance and responsiveness of the site: 

**DTO Projections:**

- Direct projection to DTOs via JPQL constructor expressions avoids unnecessary entity hydration.
- Reduces memory footprint and serialization overhead.
- Example: `SELECT new ApplicationOverviewDTO(...) FROM Application a...`

**Pagination:**

- Criteria API enables database-level pagination (LIMIT / OFFSET).
- Prevents loading entire datasets into memory.
- Configurable page size (default 25, max 100).
- Use the helper class **`PageUtil`** located in:
  `src/main/java/de/tum/cit/aet/core/util/PageUtil.java`.

**Lazy Loading:**

- Client table component loads data on-demand via lazy load events.
- Supports infinite scroll and traditional pagination UI patterns.

**Bulk Operations:**

- Bulk state updates use JPQL UPDATE queries instead of entity loading.
- Significantly faster for batch operations (e.g., closing all applications for a job).

**Cascade Operations:**

- Configured cascade types ensure efficient deletion:
  - `CascadeType.ALL` on CustomFieldAnswers and InternalComments.
  - `orphanRemoval = true` ensures orphaned entities are cleaned up.

**Document Reference Strategy:**

- Separate document loading via dedicated endpoint (`getDocumentDictionaryIds`).
- Prevents eager loading of heavy document metadata in list views.
- Client requests document IDs only when rendering detail view.
