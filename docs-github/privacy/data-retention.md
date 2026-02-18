# Data Retention (Technical Documentation)

This document describes the privacy-relevant server capabilities for **Data Retention** (scheduled cleanup/anonymization of stale records).

For the self-service export flow, see [data-export.md](data-export.md).

---

## 1) Overview

The retention subsystem performs scheduled cleanup/anonymization for two areas:

- **User retention** (inactive non-admin users),
- **Applicant retention** (old application-centric data).

Both flows support runtime limits and dry-run operation to make production execution safer.

### 1.1 User-facing behavior (what users should expect)

- Retention is **automatic**; users do not manually trigger it.
- Inactivity windows determine eligibility for cleanup/anonymization.
- Before full user deletion, warning emails are sent in advance.
- Deletion work is done in daily scheduled batches, so exact processing time is tied to scheduler windows.

### 1.2 User-facing timelines (current defaults)

- **User retention inactivity threshold:** `365` days (`user.retention.inactive-days-before-deletion`).
- **User warning lead time:** 28 days before deletion (`DAYS_BEFORE_DELETION_WARNING` in service).
- **User retention execution:** daily at `03:17` UTC by default (`user.retention.cron: 0 17 3 * * *`).

- **Applicant retention threshold:** `188` days (`applicant.retention.days-before-deletion`).
- **Applicant retention default mode:** disabled (`enabled: false`) and dry-run (`dry-run: true`) in current app defaults.
- **Applicant retention execution (if enabled):** daily at `02:37` UTC by default (`applicant.retention.cron: 0 37 2 * * *`).

---

### 1.3 What is deleted vs anonymized

- **Applicant accounts:** application-related records and uploaded documents are deleted according to the retention flow.
- **Professor/employee accounts:** authored/owned data is anonymized or reassigned to configured deleted-user placeholder where required.
- **General user data:** settings/roles/profile references are removed as part of final cleanup.

---

## 2) User retention

### 2.1 Server-side architecture

#### Core components

- `UserRetentionJob`
  - Scheduled execution, runtime boundaries, pagination strategy.
- `UserRetentionService`
  - User classification and concrete delete/anonymize behavior.
- `UserRetentionProperties`
  - Runtime configuration and anonymized fallback user settings.

---

### 2.2 Scheduled jobs

- **Delete/anonymize inactive users**
  - Cron: `user.retention.cron` (default in job: `0 17 3 * * *`, UTC)
  - Method: `UserRetentionJob#deleteUserData`

- **Warn users before deletion**
  - Cron: `user.retention.cron` with fallback default `0 0 3 * * *` (UTC)
  - Method: `UserRetentionJob#warnUserOfDataDeletion`
  - Sends warning emails through `AsyncEmailSender` with `EmailType.USER_DATA_DELETION_WARNING`.

> Note: both methods use the same property key (`user.retention.cron`) but different fallback defaults in code.

---

### 2.3 Classification model

`UserRetentionService` classifies each candidate user into:

- `SKIP_ADMIN`
- `APPLICANT`
- `PROFESSOR_OR_EMPLOYEE`
- `UNKNOWN`

Admins are skipped as a safety net even when repository-level filtering already excludes them.

---

### 2.4 Cleanup/anonymization behavior

#### APPLICANT

- Deletes applications and dependent records (reviews, ratings, comments, interview links/slots, document dictionaries).
- Deletes uploaded documents owned by the user.
- Deletes applicant profile data.

#### PROFESSOR_OR_EMPLOYEE

- Uses `deletedUserId` placeholder config for anonymization/reassignment.
- Dissociates images from original user.
- Reassigns and closes supervised jobs.
- Anonymizes creator links in internal comments and email templates.

#### General cleanup (applied after category-specific handling)

- Deletes email settings.
- Deletes profile image references.
- Deletes user settings.
- Deletes user research-group role mappings.
- Deletes user account record.

#### UNKNOWN

- Logged; currently no category-specific operation before general cleanup decision points.

---

### 2.5 Dry-run and runtime limits

`UserRetentionJob` supports:

- `dryRun=true` mode (log-only behavior in service),
- `batchSize` paging,
- `maxRuntimeMinutes` hard time window per run.

For dry-run, paging advances through pages; for real deletion, paging repeatedly starts at page 0 to avoid offset drift after deletions.

---

## 3) Applicant retention

### 3.1 Server-side architecture

#### Core components

- `ApplicantRetentionJob`
  - Scheduled execution with runtime guardrails.
- `ApplicantRetentionService`
  - Transactional cascade-like deletion orchestration for application-owned data.
- `ApplicantRetentionProperties`
  - Configuration (`applicant.retention.*`).

---

### 3.2 Scheduled execution

- Cron: `applicant.retention.cron` (default in job: `0 27 3 * * *`, UTC)
- Method: `ApplicantRetentionJob#deleteApplicantData`

> In `application.yml`, the configured default value is currently `0 37 2 * * *`.

---

### 3.3 Processing model

The job reads candidate application IDs as slices and delegates to service.

For each application (`dryRun=false`):

1. Load application with related details.
2. Collect linked document IDs.
3. Delete dependent entities first (reviews, comments, document dictionaries, interviewees).
4. Delete associated documents.
5. Delete the application.

In `dryRun=true`, actions are only logged.

---

## 4) Configuration reference

### 4.1 User retention (`user.retention.*`)

- `enabled`
- `dryRun`
- `inactiveDaysBeforeDeletion`
- `daysBeforeApplicantDataDeletion`
- `batchSize`
- `maxRuntimeMinutes`
- `cron`
- `deletedUserId`
- `deletedUserEmail`
- `deletedUserFirstName`
- `deletedUserLastName`
- `deletedUserLanguage`

### 4.2 Applicant retention (`applicant.retention.*`)

- `enabled`
- `dryRun`
- `daysBeforeDeletion` (validated with a minimum constraint)
- `batchSize`
- `maxRuntimeMinutes`
- `cron`

---

## 5) Operational notes

- Retention runs are intentionally log-heavy for traceability and auditability.
- Missing candidates during run are handled gracefully (skip + log) to keep the job resilient.
- Scheduler loops stop on either empty result sets or runtime deadline.

---

## 6) Source map

- `de/tum/cit/aet/core/retention/UserRetentionJob.java`
- `de/tum/cit/aet/core/retention/UserRetentionService.java`
- `de/tum/cit/aet/core/config/UserRetentionProperties.java`
- `de/tum/cit/aet/core/retention/ApplicantRetentionJob.java`
- `de/tum/cit/aet/core/retention/ApplicantRetentionService.java`
- `de/tum/cit/aet/core/retention/ApplicantRetentionProperties.java`
