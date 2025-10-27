# Application Module (Technical Documentation)

The **Application Module** enables applicants to create, manage, and submit doctoral applications through a structured multi-step workflow. It introduces comprehensive application lifecycle management (creation, editing, submission, withdrawal, deletion), document upload capabilities, and real-time status tracking. All operations are subject to strict authorization checks enforced by security annotations.

---

## Table of Contents

- [Application Management](#application-management)
  - [Server-Side Architecture](#server-side-architecture)
  - [Client-Side Architecture](#client-side-architecture)
- [Domain Model](#domain-model)
  - [Core Entities](#core-entities)
  - [Data Transfer Objects](#data-transfer-objects)
- [Key Workflows](#key-workflows)
  - [Quick Reference](#quick-reference)
  - [Application Creation Workflow](#application-creation-workflow)
  - [Application Update Workflow](#application-update-workflow)
  - [Application Submission Workflow](#application-submission-workflow)
  - [Application Withdrawal Workflow](#application-withdrawal-workflow)
  - [Document Upload Workflow](#document-upload-workflow)
- [Authorization and Security](#authorization-and-security)
- [Performance Optimizations](#performance-optimizations)
- [Integration Points](#integration-points)
- [Error Handling](#error-handling)
- [Future Features](#future-features)
  - [CustomFieldAnswer](#customfieldanswer)

---

## Application Management

### Server-Side Architecture

**Source Paths:**

- Service: `de/tum/cit/aet/application/service/ApplicationService.java`
- Repository: `de/tum/cit/aet/application/repository/ApplicationRepository.java`
- Repository Impl: `de/tum/cit/aet/application/repository/impl/ApplicationEntityRepositoryImpl.java`
- Resource: `de/tum/cit/aet/application/web/ApplicationResource.java`

**Core Components:**

- `ApplicationService` — orchestrates application lifecycle logic (create, update, submit, withdraw, delete), manages state transitions, coordinates with external modules (Document Module, Job Posting Module), and ensures data consistency through transactional operations.
- `ApplicationRepository` / `ApplicationEntityRepositoryImpl` — provides persistence and query capabilities, including JPQL-based DTO projections, paginated queries using Criteria API, and bulk state update operations.
- `Application` — domain entity storing application metadata (state, timestamps, applicant responses) with relationships to Job, Applicant, and supporting entities ([CustomFieldAnswer](#customfieldanswer), InternalComment).

**Key Behaviors:**

- **Creation flow:**

  - Validates job availability and checks for duplicate applications (same applicant + job).
  - State initialization: `SAVED` (draft state).
  - Creates bidirectional relationships between Application, Applicant, and Job entities.
  - Returns `ApplicationForApplicantDTO` with pre-populated applicant profile data for form initialization.

- **Update flow:**

  - Authorization: Only applicants owning the application (or admins) can update.
  - Allowed states: `SAVED` only (prevents modification of submitted applications).
  - Updates applicant profile data alongside application-specific fields (motivation, skills, projects).
  - Transactional consistency ensures atomic updates across Application and Applicant entities.
  - Returns updated `ApplicationForApplicantDTO` for immediate UI synchronization.

- **Submit flow:**

  - State transition: `SAVED` → `SENT`.
  - Sets `appliedAt` timestamp for audit trail.
  - Prevents further modifications by rejecting updates on non-SAVED applications.
  - Triggers notification workflows (delegated to separate Notification Module).

- **Withdrawal flow:**

  - State transition: `SENT` / `IN_REVIEW` → `WITHDRAWN`.
  - Preserves application data for audit compliance.
  - Updates implemented via bulk update query for efficiency.
  - Triggers stakeholder notifications about withdrawal.

- **Deletion flow:**

  - Allowed only for `SAVED` (draft) applications.
  - Cascade deletion of associated entities: [CustomFieldAnswers](#customfieldanswer), InternalComments, DocumentDictionary references.
  - Actual document files handled by separate Document Module.
  - Returns `204 No Content` on success.

- **Document management:**

  - Delegates file storage to Document Module via `DocumentService`.
  - Maintains `DocumentDictionary` entries linking documents to applications.
  - Supports multiple document types: `CV`, `BACHELOR_TRANSCRIPT`, `MASTER_TRANSCRIPT`, `REFERENCES`.
  - Provides document renaming and deletion capabilities.
  - Returns `DocumentInformationHolderDTO` set after upload operations.

- **Pagination queries:**

  - Implemented using **JPA Criteria API** in `ApplicationEntityRepositoryImpl`.
  - Purpose: efficiently retrieve paginated application overviews with filtering capabilities.
  - Constructs dynamic queries with joins (Application → Job → ResearchGroup).
  - Projects directly to `ApplicationOverviewDTO` to minimize data transfer.
  - Supports sorting by creation date (descending by default).
  - Enables scalable list views without loading entire datasets.

- **Bulk state updates:**

  - Used during job state transitions (`CLOSED`, `APPLICANT_FOUND`).
  - Updates all applications for a job based on conditional logic:
    - `SAVED` → `JOB_CLOSED` (draft applications for closed positions).
    - `SENT` / `IN_REVIEW` → `JOB_CLOSED` when job closes without selection.
    - `SENT` / `IN_REVIEW` → `REJECTED` when position is filled.
  - Implemented via JPQL bulk update with CASE expression for conditional state mapping.

- **DTO projections:**

  - Uses JPQL constructor expressions for efficient data retrieval.
  - `findDtoById`: Single application with nested DTOs (ApplicantDTO, JobCardDTO).
  - Avoids N+1 select problems through explicit LEFT JOINs.
  - Returns fully populated DTOs suitable for immediate UI rendering.

---

### Client-Side Architecture

**Core Components:**

- `ApplicationOverviewForApplicantComponent` (`application-overview-for-applicant.component.ts`)
  - Provides paginated, sortable tabular overview of applicant's applications.
  - Uses signal-based reactive state management for loading states and data.
  - Integrates `DynamicTableComponent` for consistent table rendering.
  - Handles lazy loading via `TableLazyLoadEvent` for performance optimization.
  - Implements action buttons (View, Update, Withdraw, Delete) with conditional visibility based on application state.

- `ApplicationCreationFormComponent` (`application-creation-form.component.ts`)
  - Implements multi-step wizard workflow with four stages:
    1. Personal Information (`application-creation-page1`)
    2. Education + Document Uploads (`application-creation-page2`)
    3. Application Details + Document Uploads (`application-creation-page3`)
    4. Summary + Consent (`application-detail-for-applicant` in preview mode)
  - Features automatic progress saving with visual feedback (`saving`, `saved`, `error` states).
  - Uses `ProgressStepperComponent` for visual step navigation.
  - Implements bi-directional data flow with child form components.
  - Validates required consents (privacy policy, doctoral requirements) before submission.
  - Provides confirmation dialog before final submission.

- `ApplicationDetailForApplicantComponent` (`application-detail-for-applicant.component.ts`)
  - Renders comprehensive application view with dual modes:
    - **Preview mode**: Used within submission workflow (step 4) with passed-in data.
    - **Standalone mode**: Full detail page with data fetched from backend.
  - Displays structured sections: Position Overview, Personal Statements, Personal Information, Documents.
  - Integrates `DocumentViewerComponent` for inline document preview.
  - Provides state-conditional actions: Update (SAVED), Withdraw (SENT / IN_REVIEW), Delete (SAVED).
  - Uses computed signals for reactive data resolution (preview vs. actual).

**Section Components (used within pages):**

- `ApplicationCreationPage1Component` — Personal information form (name, contact, links).
- `ApplicationCreationPage2Component` — Education data + transcript uploads (Bachelor / Master).
- `ApplicationCreationPage3Component` — Application-specific fields + CV / reference uploads.
- `ApplicationStateForApplicantsComponent` — Displays application state as color-coded badge.
- `DocumentViewerComponent` — Renders document previews with download functionality.
- `UploadButtonComponent` — Handles file uploads with validation and progress tracking.
- `ConfirmDialog` — Modal confirmation for destructive actions (delete, withdraw, submit).
- `DynamicTableComponent` — Reusable table with pagination, sorting, custom templates.
- `ProgressStepperComponent` — Visual step indicator for multi-step workflows.

**Behavior:**

- **Multi-step form workflow:**
  - Progressive disclosure pattern reduces cognitive load.
  - Each step validates independently before allowing progression.
  - Data persists across steps via parent component signals.
  - Summary step provides complete preview before submission.

- **Auto-save functionality:**
  - Triggered on every value change with 500ms debounce.
  - Visual feedback via badge: "Saving..." → "Saved" → "Error".
  - Handles concurrent saves via sequential promise chaining.
  - Graceful error handling with user notification.

- **Optimistic UI updates:**
  - State changes (withdraw, delete) reflected immediately in UI.
  - Automatic rollback on server error with toast notification.
  - Refresh mechanisms trigger data reload after successful operations.

- **Lazy loading and pagination:**
  - Table loads data on-demand via `TableLazyLoadEvent`.
  - Calculates page number from `first` and `rows` parameters.
  - Stores last event for refresh operations (post-delete / withdraw).
  - Loading state prevents double-fetching during navigation.

- **Conditional action rendering:**
  - Action buttons visibility controlled by application state:
    - `SAVED`: Update, Delete
    - `SENT` / `IN_REVIEW`: View, Withdraw
    - Other states: View only
  - Prevents invalid state transitions through UI constraints.

- **Document integration:**
  - Upload handlers pass `applicationId` and `documentType` to child components.
  - Document IDs fetched separately for efficient rendering.
  - Supports multiple documents per type (transcripts, references).
  - Preview mode displays documents without edit capabilities.

---

## Domain Model

### Core Entities

**Application:**
- Central aggregator for all application-related data.
- Tracks state transitions through `ApplicationState` enum.
- Maintains relationships to:
  - `Applicant` (ManyToOne) — Owner of the application.
  - `Job` (ManyToOne) — Position being applied for.
  - `ApplicationReview` (OneToOne) — Evaluation decision (managed by Evaluation Module).
  - `CustomFieldAnswer` (OneToMany) — Job-specific question responses.
  - `InternalComment` (OneToMany) — Professor comments (managed by Evaluation Module).
- Timestamps: `createdAt`, `lastModifiedAt` (via `AbstractAuditingEntity`), `appliedAt`.
- Application-specific fields: `desiredStartDate`, `projects`, `specialSkills`, `motivation`.

**Applicant:**
- Extends User entity via OneToOne relationship with shared primary key.
- Stores applicant-specific profile data:
  - Address: `street`, `postalCode`, `city`, `country`.
  - Bachelor's degree: `bachelorDegreeName`, `bachelorUniversity`, grade fields.
  - Master's degree: `masterDegreeName`, `masterUniversity`, grade fields.
- Contains collection of `submittedApplications` (OneToMany to Application).
- Enables profile reuse across multiple applications.

**User:**
- Shared entity supporting multiple roles (Applicant, Professor).
- Core fields: `userId` (UUID), `email`, `firstName`, `lastName`, authentication data.
- Optional fields: `gender`, `nationality`, `birthday`, `phoneNumber`, contact URLs.
- References: `researchGroup` (for professors), `postedJobs` (OneToMany).
- Supports late initialization: Applicant profile created on first application creation.

**Document / DocumentDictionary:**
- **Document**: Stores actual file metadata (`path`, `mimeType`, `sizeBytes`, `sha256Id` for deduplication).

- **DocumentDictionary**: Junction entity linking documents to applications / applicants.
  - Flexible associations: Can link to `application`, `applicant`, or `customFieldAnswer`.
  - Stores `documentType` enum and user-defined `name`.
  - Enables document reuse across multiple applications.
- Managed by separate Document Module; Application Module maintains references only.

**ApplicationState Enum:**
- `SAVED` — Draft application, editable by applicant.
- `SENT` — Submitted, under initial review.
- `IN_REVIEW` — Actively being evaluated by professors.
- `ACCEPTED` — Offer extended (managed by Evaluation Module).
- `REJECTED` — Application declined (managed by Evaluation Module).
- `WITHDRAWN` — Applicant withdrew application.
- `JOB_CLOSED` — Position closed before evaluation completed.

### Data Transfer Objects

**ApplicationForApplicantDTO:**

- Comprehensive DTO for full application data transfer.
- Nested structure: Contains `ApplicantDTO` (with nested `UserDTO`) and `JobCardDTO`.
- Used for: Creation response, update response, detail page data.
- Includes all editable fields plus job information.
- Factory method: `getFromEntity(Application)` for entity-to-DTO conversion.

**UpdateApplicationDTO:**

- Minimal DTO for update operations.
- Contains: `applicationId`, `ApplicantDTO`, application-specific fields, `applicationState`.
- Validates `applicationId` and `applicant` as required.
- Optimizes network payload by excluding read-only job data.

**ApplicationOverviewDTO:**

- Lightweight DTO for list views.
- Constructor projection built via JPQL in repository.
- Contains: `applicationId`, `jobId`, `jobTitle`, `researchGroup`, `applicationState`, `timeSinceCreation`.
- `timeSinceCreation`: Computed relative time string (e.g., "2 hours ago") via `UiTextFormatter`.

**ApplicationDetailDTO:**

- Specialized DTO for detail view rendering.
- Flattened structure for UI convenience (denormalized job and applicant data).
- Contains: Application fields, job summary, applicant summary, supervisor name.
- Factory method: `getFromEntity(Application, Job)` with explicit job parameter.
- Used by standalone detail page and preview mode.

**ApplicationDocumentIdsDTO:**

- Document reference container for efficient document loading.
- Separates document IDs by type:
  - `cvDocumentDictionaryId` (UUID) — Single CV document.
  - `bachelorDocumentDictionaryIds` (Set<UUID>) — Bachelor transcripts.
  - `masterDocumentDictionaryIds` (Set<UUID>) — Master transcripts.
  - `referenceDocumentDictionaryIds` (Set<UUID>) — Reference letters.
- Enables lazy loading of document previews in UI.
- Prevents fetching full document metadata when not needed.

---

## Key Workflows

### Quick Reference
- Create Application: `POST /api/applications/create/{jobId}`
- Update Application: `PUT /api/applications`
- Submit Application: `PUT /api/applications` (state=SENT)
- Withdraw: `PUT /api/applications/withdraw/{id}`

### Application Creation Workflow

1. **Initiation:**
   - User navigates to job detail and clicks "Apply".
   - Frontend sends POST request to `/api/applications/create/{jobId}`.
   - `ApplicationResource` invokes `ApplicationService.createApplication(jobId)`.

2. **Validation:**
   - Service fetches job entity and validates availability.
   - Checks for existing application: Same applicant + same job.
   - Returns existing draft if found (prevents duplicates).

3. **Entity Creation:**
   - Creates new `Application` entity with state `SAVED`.
   - Links to `Applicant` (fetches via `CurrentUserService`).
   - Links to `Job` via provided `jobId`.
   - Persists to database via `ApplicationRepository.save()`.

4. **Response:**
   - Constructs `ApplicationForApplicantDTO` via JPQL projection.
   - Pre-populates applicant profile data from User / Applicant entities.
   - Returns DTO to frontend for form initialization.

5. **Frontend Handling:**
   - Receives DTO and navigates to multi-step form.
   - Populates form fields with applicant data.
   - Enters draft editing mode with auto-save enabled.

### Application Update Workflow

1. **Auto-Save Trigger:**
   - User modifies any form field in multi-step wizard.
   - Change event propagates to parent `ApplicationCreationFormComponent`.
   - Debounced (500ms) save operation triggered.

2. **Update Request:**
   - Frontend constructs `UpdateApplicationDTO` from current form state.
   - Sends PUT request to `/api/applications`.
   - Includes `applicationId` for target identification.

3. **Server-Side Processing:**
   - `ApplicationService.updateApplication(dto)` receives request.
   - Validates application exists and is in `SAVED` state.
   - Verifies current user owns application (authorization check).
   - Updates both `Application` and `Applicant` entities transactionally.

4. **Persistence:**
   - JPA dirty checking detects modified fields.
   - Automatic `lastModifiedAt` timestamp update via `AbstractAuditingEntity`.
   - Transaction commits, ensuring atomic updates.

5. **Response Handling:**
   - Service returns updated `ApplicationForApplicantDTO`.
   - Frontend updates saving state badge to "Saved".
   - Form remains in edit mode for continued modifications.

### Application Submission Workflow

1. **Submission Initiation:**

   - User completes all form steps and reaches summary page.
   - Validates privacy consent and doctoral requirements checkboxes.
   - Clicks "Submit Application" button.
   - Confirmation dialog appears with submission warning.

2. **Final Validation:**
   - Frontend validates all required fields are complete.
   - Checks all mandatory documents are uploaded.
   - Verifies consent checkboxes are checked.

3. **Submission Request:**
   - Sends final PUT request with `UpdateApplicationDTO`.
   - State explicitly set to `SENT` in DTO.
   - `ApplicationService` processes state transition.

4. **State Transition:**
   - Validates current state is `SAVED`.
   - Updates `state` to `SENT`.
   - Sets `appliedAt` timestamp for audit trail.
   - Persists changes to database.

5. **Post-Submission:**
   - Triggers notification workflow (separate Notification Module).
   - Returns success response to frontend.
   - Frontend displays success toast and navigates to overview page.
   - Application now read-only (no further edits allowed).

### Application Withdrawal Workflow

1. **Withdrawal Request:**
   - Applicant navigates to submitted application detail page.
   - Clicks "Withdraw" button (visible only for `SENT` / `IN_REVIEW` states).
   - Confirmation dialog appears with withdrawal warning.

2. **Server-Side Processing:**
   - Frontend sends PUT request to `/api/applications/withdraw/{applicationId}`.
   - `ApplicationService.withdrawApplication(applicationId)` processes request.
   - Validates application exists and is in withdrawable state.

3. **State Update:**
   - Executes bulk update query: `UPDATE Application SET state = 'WITHDRAWN' WHERE applicationId = :id`.
   - Efficient single-query update without entity loading.
   - Preserves all application data for audit compliance.

4. **Notification:**
   - Triggers notification to supervisors about withdrawal.
   - Updates job posting module about applicant pool change.

5. **Frontend Response:**
   - Displays success toast message.
   - Refreshes application data to show new `WITHDRAWN` state.
   - Updates action buttons (removes Withdraw, shows only View).

### Document Upload Workflow

1. **Upload Trigger:**
   - User clicks upload button in step 2 (Education) or step 3 (Application Details).
   - File selection dialog appears.
   - User selects one or more files.

2. **Client-Side Validation:**
   - Validates file types (PDF, DOC, DOCX, JPG, PNG).
   - Checks file size limits (e.g., max 10MB per file).
   - Displays validation errors if constraints violated.

3. **Upload Request:**
   - Constructs multipart / form-data request.
   - Sends POST to `/api/applications/upload-documents/{applicationId}/{documentType}`.
   - Includes file array and metadata.

4. **Server-Side Processing:**
   - `ApplicationResource` delegates to `ApplicationService`.
   - Service invokes `DocumentService` (separate module) for file storage.
   - `DocumentService` performs:
     - Virus scanning.
     - SHA256 hash calculation for deduplication.
     - File system persistence.
     - `Document` entity creation.

5. **Dictionary Entry Creation:**
   - `ApplicationService` creates `DocumentDictionary` entry.
   - Links `Document` to `Application` via foreign key.
   - Sets `documentType` and user-provided `name`.
   - Persists entry via repository.

6. **Response:**
   - Returns `Set<DocumentInformationHolderDTO>` containing document metadata.
   - Frontend updates document ID signals.
   - Document preview components render uploaded files.
   - Upload button updates to show success state.

---

## Authorization and Security

**Endpoint Security:**
- `@ApplicantOrAdmin` — Restricts access to applicants (owners) or system administrators.
  - Used for: Create, Update, Delete, Upload, Withdraw operations.
  - Enforces ownership check: Applicant can only access their own applications.
- `@Authenticated` — Requires any authenticated user (applicant or professor).
  - Used for: Read operations (GetById, GetDocumentIds).
  - Professors can view applications they're evaluating.

**Service-Level Authorization:**
- `CurrentUserService` provides authenticated user context.
- Ownership validation: Compares `application.applicant.userId` with `currentUser.userId`.
- Throws `AccessDeniedException` for unauthorized access attempts.

**State-Based Access Control:**

- **SAVED**: Full CRUD access by owning applicant.
- **SENT / IN\_REVIEW**: Read-only for applicant, withdraw allowed.
- **ACCEPTED / REJECTED / WITHDRAWN**: Read-only for all parties.
- **JOB\_CLOSED**: Read-only, indicates position no longer available.

---

## Performance Optimizations

**DTO Projections:**

- Direct projection to DTOs via JPQL constructor expressions avoids unnecessary entity hydration.
- Reduces memory footprint and serialization overhead.
- Example: `SELECT new ApplicationOverviewDTO(...) FROM Application a...`

**Pagination:**

- Criteria API enables database-level pagination (LIMIT / OFFSET).
- Prevents loading entire datasets into memory.
- Configurable page size (default 25, max 100).

**Lazy Loading:**

- Frontend table component loads data on-demand via lazy load events.
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

---

## Integration Points

**Job Posting Module:**

- Application creation requires valid `jobId` from Job Posting Module.
- Job state changes trigger bulk application state updates.
- Job closure cascades to related applications (state → `JOB_CLOSED`).

**Evaluation Module:**

- Applications in `SENT` / `IN_REVIEW` states available for professor review.
- Evaluation decisions update application state to `ACCEPTED` / `REJECTED`.
- Internal comments stored in Application entity but managed by Evaluation Module.

**Document Module:**

- Delegates all file storage operations to DocumentService.
- Maintains `DocumentDictionary` references linking documents to applications.
- Supports document preview and download via Document Module APIs.

**Notification Module:**

- Triggers email notifications on state transitions:
  - Application submission → Notifies supervisors.
  - Application withdrawal → Notifies supervisors.
  - State changes (Accept / Reject) → Notifies applicants (handled by Evaluation Module).

**Authentication Module:**

- User and Applicant entities shared with Authentication Module.
- `CurrentUserService` provides authenticated user context.
- Keycloak integration for single sign-on and external identity providers.

---

## Error Handling

**Validation Errors:**

- `@Valid` annotations trigger Bean Validation framework.
- Returns `400 Bad Request` with detailed error messages.
- Frontend displays field-level validation errors.

**Authorization Errors:**

- `AccessDeniedException` returns `403 Forbidden`.
- Frontend handles via global error interceptor.
- Displays user-friendly error toast message.

**Not Found Errors:**

- Returns `404 Not Found` for invalid application IDs.
- Frontend gracefully handles missing resources.

**Conflict Errors:**

- Duplicate application detection returns existing draft (no error thrown).
- State transition validation prevents invalid operations (e.g., editing submitted application).
- Returns `409 Conflict` for invalid state transitions.

**Server Errors:**

- Unhandled exceptions return `500 Internal Server Error`.
- Logged with full stack trace for debugging.
- Frontend displays generic error message to user.

## Future Features

### CustomFieldAnswer
- Stores responses to job-specific custom questions.
- Links to both `Application` and `CustomField` (defined in Job Posting Module).
- Supports multiple answer types through flexible schema.