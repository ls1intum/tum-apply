# Data Export (Technical Documentation)

This document describes the privacy-relevant server capabilities for **User Data Export** (GDPR-style self-service export).

For retention jobs and cleanup/anonymization behavior, see [data-retention.md](data-retention.md).

---

## 1) User Data Export

### 1.1 Purpose

The data export flow allows authenticated users to request a ZIP archive containing:

- a structured JSON summary of their personal/application/staff data,
- uploaded documents,
- uploaded images.

The export is produced asynchronously and delivered via a token-based download link.

### 1.2 User journey (what a user experiences)

1. The user opens the Privacy page while logged in and clicks **Export my data**.
2. The request is accepted immediately (`202 Accepted`) and enters queue processing.
3. Export generation runs asynchronously in the backend scheduler.
4. After successful generation, the user receives an email with a download link.
5. The user downloads a ZIP file containing JSON summary + documents + images.

#### Button behavior in UI

- The export button is disabled when:
  - the user is not logged in,
  - an export is currently in creation,
  - cooldown is still active.

---

### 1.3 User-facing timings (defaults)

- **How quickly is the request processed?**
  - Requests are processed by `aet.data-export.cron` (default `0 0 2 * * *`).
  - In practice, users should expect processing by the **next scheduler run**.
  - This means it is typically handled overnight and may take up to about one scheduler interval depending on request time.

- **How often can a user request an export?**
  - Once every **7 days** (cooldown from `lastRequestedAt`).

- **How long is the download link valid?**
  - `aet.data-export.expires-days` (default **7 days**).

- **When is the export deleted?**
  - The current flow enforces link expiry after 7 days.
  - There is no user-facing delete endpoint in this module; lifecycle states include deleted variants, but expiry is the guaranteed behavior users should rely on.

---

### 1.4 Server-side architecture

#### Core components

- `UserDataExportResource`
  - REST entry points for status, request creation, and download.
- `UserDataExportService`
  - Orchestrates request lifecycle, cooldown checks, scheduled processing, token validation, and email notification.
- `DataExportRequest` + `DataExportRequestRepository`
  - Persistence model and query API for request status tracking.
- `UserDataSectionProvider` ecosystem
  - Modular providers contribute export sections via:
    - `UserSettingsExportProvider`
    - `ApplicantDataExportProvider`
    - `StaffDataExportProvider`
- `UserDataExportBuilder`
  - Aggregates provider output into a `UserDataExportDTO`.
- `UserExportZipWriter`
  - Writes ZIP archive with JSON summary + binary files (documents/images).
- `AsyncEmailSender`
  - Sends "export ready" notifications asynchronously.

#### Key design principle

Export section collection is provider-based (Open/Closed style): new export sections can be added without changing the orchestrator logic.

---

### 1.5 Request lifecycle and state machine

`DataExportState` values:

- `REQUESTED`
- `IN_CREATION`
- `EMAIL_SENT`
- `DOWNLOADED`
- `DOWNLOADED_DELETED`
- `DELETED`
- `FAILED`

#### Downloadable states

- `EMAIL_SENT`
- `DOWNLOADED`

#### Typical happy path

1. User requests export → state `REQUESTED`.
2. Scheduled processor starts work → state `IN_CREATION`.
3. ZIP created + token generated + email sent → state `EMAIL_SENT`.
4. User downloads file → state updated to `DOWNLOADED`.

If processing fails at any point, request is marked as `FAILED`.

---

### 1.6 API endpoints

Base path: `/api/users`

- `GET /data-export/status` (authenticated)
  - Returns `DataExportStatusDTO` with:
    - current status,
    - last request timestamp,
    - next allowed request timestamp,
    - remaining cooldown seconds,
    - download token (when applicable).

- `POST /data-export` (authenticated)
  - Accepts a new request.
  - Returns `202 Accepted`.
  - Can return:
    - `409` if a request is already actively being created,
    - `429` if weekly cooldown is not yet over.

- `GET /data-export/download/{token}` (authenticated)
  - Returns ZIP file stream with `Content-Disposition` attachment header.
  - Token is validated against the current user.
  - Can return conflict/not-found style errors when token is invalid, expired, or not yet downloadable.

> Note: The service also contains a token-only retrieval method (without user ownership check), but the exposed resource currently uses authenticated download.

---

### 1.7 Scheduling and processing

`UserDataExportService#processPendingDataExports` runs on:

- `aet.data-export.cron` (default: `0 0 2 * * *`)

For each pending (`REQUESTED`) item:

1. Set state to `IN_CREATION`.
2. Collect user data from all `UserDataSectionProvider`s.
3. Write ZIP archive using `UserExportZipWriter`.
4. Persist metadata (`filePath`, `readyAt`, `expiresAt`, `downloadToken`).
5. Set state to `EMAIL_SENT`.
6. Send async email with download link.

---

### 1.8 Cooldown and expiry behavior

- **Request cooldown**: once per 7 days (derived from `lastRequestedAt`).
- **Link expiry**: `aet.data-export.expires-days` (default: `7`).

Validation checks on download:

- request exists,
- request belongs to user (for authenticated endpoint),
- not expired,
- state is downloadable,
- file path is set and exists on disk.

---

### 1.9 ZIP structure and file handling

`UserExportZipWriter` generates archives in configured export root and includes:

- `data_export_summary.json`
- `documents/uploaded/...`
- `images/...`

Security and robustness details:

- image paths are normalized and validated against configured image root,
- path traversal is blocked,
- missing/invalid files raise `UserDataExportException`.

---

## 2) Configuration reference

### 2.1 Data export

- `aet.data-export.cron`
  - Scheduler for processing pending exports.
  - Default: `0 0 2 * * *`

- `aet.data-export.expires-days`
  - Download-link validity window.
  - Default: `7`

- `aet.data-export.root`
  - Filesystem root for export ZIP files.

- `aet.storage.image-root`
  - Root for image resolution while packaging exports.

- `aet.client.url`
  - Base URL used to build download links in notification emails.

## 3) Error and conflict model

### Data export errors

- `TooManyRequestsException`
  - Weekly request cooldown violated.
- `TimeConflictException`
  - Active request exists, or download is expired/not ready.
- `EntityNotFoundException`
  - Unknown token (or token not belonging to user in authenticated flow).
- `UserDataExportException`
  - Missing/unreadable export file, ZIP assembly issues, invalid storage path.

## 4) Source map

### Data export source map

- `de/tum/cit/aet/core/web/UserDataExportResource.java`
- `de/tum/cit/aet/core/service/UserDataExportService.java`
- `de/tum/cit/aet/core/domain/DataExportRequest.java`
- `de/tum/cit/aet/core/constants/DataExportState.java`
- `de/tum/cit/aet/core/service/export/UserExportZipWriter.java`
- `de/tum/cit/aet/core/service/export/UserDataSectionProvider.java`
- `de/tum/cit/aet/core/service/export/UserDataExportBuilder.java`
- `de/tum/cit/aet/core/service/export/UserSettingsExportProvider.java`
- `de/tum/cit/aet/core/service/export/ApplicantDataExportProvider.java`
- `de/tum/cit/aet/core/service/export/StaffDataExportProvider.java`
