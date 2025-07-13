# 📄 API Endpoints – Job Management

This document describes the REST endpoints available for managing doctorate job postings within the system.

---

## 📥 POST `/api/jobs/create`

Creates a new job posting.

### Description

- Accepts full job details in the request body.
- Automatically assigns the job to the currently authenticated professor.

### Request

- **Method:** POST
- **URL:** `/api/jobs/create`
- **Auth Required:** ✅ Yes (JWT)
- **Body:** `JobFormDTO` (JSON)

### Response

- **200 OK** – Job created successfully
- **Body:** `JobFormDTO`

### Example Request Body

```json
{
  "title": "Doctoral Researcher in AI",
  "fieldOfStudies": "Informatics",
  "researchArea": "Artificial Intelligence",
  "location": "MUNICH",
  "startDate": "2025-10-01",
  "workload": 40,
  "contractDuration": 3,
  "fundingType": "SCHOLARSHIP",
  "description": "...",
  "tasks": "...",
  "requirements": "...",
  "supervisingProfessor": "5b550c4e-1234-4f12-9e5c-df1234567890",
  "state": "DRAFT"
}
```

---

## 🔁 PUT `/api/jobs/update/{jobId}`

Updates an existing job posting.

### Description

- Updates an existing job with new information.
- Requires the job ID and the updated data.

### Request

- **Method:** PUT
- **URL:** `/api/jobs/update/{jobId}`
- **Auth Required:** ✅ Yes
- **Body:** `JobFormDTO`

### Response

- **200 OK** – Job updated successfully
- **Body:** `JobFormDTO`

---

## 🗑 DELETE `/api/jobs/{jobId}`

Deletes a job posting.

### Description

- Deletes the specified job from the system.
- Only used on jobs that have not yet been published.

### Request

- **Method:** DELETE
- **URL:** `/api/jobs/{jobId}`
- **Auth Required:** ✅ Yes

### Response

- **204 No Content** – Job deleted successfully

---

## 🔄 PUT `/api/jobs/changeState/{jobId}`

Changes the state of a job posting.

### Description

- Used to change a job’s lifecycle state (e.g., `DRAFT`, `PUBLISHED`, `CLOSED`, `APPLICANT_FOUND`).
- If `CLOSED` or `APPLICANT_FOUND` is selected, the application statuses are automatically updated.

### Request

- **Method:** PUT
- **URL:** `/api/jobs/changeState/{jobId}`
- **Auth Required:** ✅ Yes
- **Query Params:**
  - `jobState`: `DRAFT` | `PUBLISHED` | `CLOSED` | `APPLICANT_FOUND` (required)
  - `shouldRejectRemainingApplications` (optional): `true` or `false`

### Response

- **200 OK** – Job state updated
- **Body:** `JobFormDTO`

---

## 📄 GET `/api/jobs/available`

Returns a paginated list of all **available** (PUBLISHED) job postings.

### Description

- Used by applicants to browse open positions.
- Supports filtering by title, field of studies, location, professor name, and workload.
- Supports dynamic sorting (manual for `professorName`).

### Request

- **Method:** GET
- **URL:** `/api/jobs/available`
- **Auth Required:** ❌ No
- **Query Parameters:**
  - `page` – Zero-based page number
  - `size` – Page size
  - `title`, `fieldOfStudies`, `location`, `professorName`, `workload` (optional filters)
  - `sortBy`, `direction` (e.g., `title`, `ASC`)

### Response

- **200 OK** – Paginated list of `JobCardDTO`

---

## 👨‍🏫 GET `/api/jobs/professor`

Returns a paginated list of jobs created by the authenticated professor.

### Description

- Returns all jobs (regardless of state) created by the logged-in user.
- Supports optional filtering by job title and state.
- Supports sorting.

### Request

- **Method:** GET
- **URL:** `/api/jobs/professor`
- **Auth Required:** ✅ Yes
- **Query Parameters:**
  - `page`, `size`
  - `title`, `state` (optional)
  - `sortBy`, `direction`

### Response

- **200 OK** – Paginated list of `CreatedJobDTO`

---

## 🔍 GET `/api/jobs/{jobId}`

Fetches general job information.

### Description

- Used for retrieving a summary view of a specific job.

### Request

- **Method:** GET
- **URL:** `/api/jobs/{jobId}`
- **Auth Required:** ❌ No

### Response

- **200 OK** – Returns `JobDTO`

---

## 🧾 GET `/api/jobs/detail/{jobId}`

Fetches full job details for use in the **Job Detail Page**.

### Description

- Returns all information needed to display the job detail view for applicants and professors.

### Request

- **Method:** GET
- **URL:** `/api/jobs/detail/{jobId}`
- **Auth Required:** ❌ No

### Response

- **200 OK** – Returns `JobDetailDTO`

---

## 📌 Notes

- All endpoints that modify data (`POST`, `PUT`, `DELETE`) require valid JWT authentication.
- Pagination and sorting follow the `PageDTO` and `SortDTO` standards used across the platform.
- Job states include: `DRAFT`, `PUBLISHED`, `CLOSED`, `APPLICANT_FOUND`.
