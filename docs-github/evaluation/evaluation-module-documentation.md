# Evaluation Module (Technical Documentation)

The **Evaluation Module** enables professors to evaluate applications within their research groups. It introduces workflows for structured decision-making (reviews), collaboration (internal comments, ratings), and applicant communication (accept/reject notifications). All operations are subject to strict authorization checks enforced by `CurrentUserService`.

---

## Reviews

### Server-Side Architecture

**Core Components:**

- `ApplicationEvaluationService` — orchestrates review logic (accept/reject), updates application state, persists review metadata, and triggers notifications via `AsyncEmailSender`.
- `ApplicationEvaluationRepository` / `ApplicationEvaluationRepositoryImpl` — provides persistence and query capabilities, including advanced filtering, search, and window navigation.
- `ApplicationReview` — domain entity storing decision metadata (reviewer, timestamp, reason/message).

**Key Behaviors:**

- **Accept flow:**
  - State transition: `SENT`/`IN_REVIEW` → `ACCEPTED`.
  - Optionally updates job state (`JobState.APPLICANT_FOUND`).
  - Optional applicant notification with professor-supplied message.

- **Reject flow:**
  - State transition: `SENT`/`IN_REVIEW` → `REJECTED`.
  - Notification uses predefined multilingual rejection templates (selected `RejectReason`).

- **Review persistence:**
  - Each decision is captured in an `ApplicationReview` entity and linked to the application.

- **Window queries:**
  - Implemented using **SQL window functions** (`ROW_NUMBER() OVER (ORDER BY …)`).
  - Purpose: efficiently determine the index of a given application in a filtered/sorted dataset.
  - Enables centered retrieval of a **window of applications** (carousel navigation) without loading the entire dataset.

- **Document download:**
  - All applicant files can be exported as a deterministic ZIP archive.
  - File naming based on `DocumentType` with optional numeric suffixes for duplicates.
  - Optional deterministic timestamps (`entry.setTime(0L)`) to allow reproducible binary output.

**Source Paths:**

- Service: `de/tum/cit/aet/evaluation/service/ApplicationEvaluationService.java`
- Repository: `de/tum/cit/aet/evaluation/repository/ApplicationEvaluationRepository.java`
- Repository Impl: `de/tum/cit/aet/evaluation/repository/impl/ApplicationEvaluationRepositoryImpl.java`

---

### Client-Side Architecture

**Core Components:**

- `ApplicationOverviewComponent` (`application-overview.component.ts`)
  - Provides paginated, sortable, and filterable tabular overviews of applications.
  - Synchronizes URL query params for deep-link consistency.

- `ApplicationDetailComponent` (`application-detail.component.ts`)
  - Renders a detailed carousel-like review view.
  - Handles application state transitions (e.g., marking as `IN_REVIEW`).
  - Integrates review dialogs and sub-sections for evaluation tasks.

- `ApplicationCarouselComponent`
  - Enables horizontal navigation between applications in detail view.

- `ReviewDialogComponent`
  - Encapsulates accept/reject workflows, including optional notifications and job-closing logic.

**Section Components (used within detail page):**

- `CommentSection` — inline collaborative notes (private to professors).
- `RatingSection` — per-professor scoring (−2 to +2).
- `DocumentSection` — renders individual applicant documents with inline preview/download.
- `DocumentDialog` — modal for grouped document downloads.
- `DescriptionList` — structured key-value display (e.g., metadata).
- `LinkList` — external reference links.
- `Prose` — sanitized rendering of formatted text.
- `Section` / `SubSection` — layout primitives for consistent structuring of detail content.

**Behavior:**

- Optimistic UI updates for state changes (accept/reject, rating, comments).
- Automatic reconciliation with server responses on failure.

---

## Comments

### Server-Side Architecture

**Core Components:**

- `InternalCommentService` — enforces authorization and ownership rules.
- `InternalCommentRepository` — persistence for `InternalComment` entities.

**Key Behaviors:**

- Comments are tied strictly to applications.
- Only authors can edit/delete their comments (`AccessDeniedException` if violated).
- Chronological ordering ensures review traceability.
- Endpoint access restricted to role `PROFESSOR`.

**Source Path:**

- Service: `de/tum/cit/aet/evaluation/service/InternalCommentService.java`

### Client-Side Architecture

- `CommentSection` (`comment-section.ts`)
  - Integrated directly into the detail page.
  - Provides create/update/delete functionality.
  - Optimistic UI updates; rollback on server error.
  - Edit/delete controls are visible only for the author of a comment.

---

## Ratings

### Server-Side Architecture

**Core Components:**

- `RatingService` — handles CRUD operations for ratings.
- `RatingRepository` — ensures integrity and efficient loading.
- `Rating` entity — captures per-professor rating values.

**Key Behaviors:**

- Values range from **−2 to 2** (5-point Likert scale).
- Constraint `uc_ratings_application_user` enforces uniqueness of `(application, user)` pairs.
- Operations:
  - Create new rating if none exists.
  - Update in-place if rating exists.
  - Delete if `null` passed.

- Query optimization:
  - Ratings loaded together with reviewer to avoid N+1 select issues.

**Source Path:**

- Service: `de/tum/cit/aet/evaluation/service/RatingService.java`

### Client-Side Architecture

- `RatingSection` (`rating-section.ts`)
  - Integrated into the detail page.
  - Displays current user’s rating distinctly from others.
  - Supports inline updates/removals with optimistic UI behavior.
  - Restores server values in case of persistence errors.
