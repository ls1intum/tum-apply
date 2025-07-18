# `ApplicationResource` API Documentation

Base URL: `/api/applications`

This REST controller manages the lifecycle of applications within the Tum Apply system. It includes endpoints to create, retrieve, update, delete, and manage application documents.

---

## Application Endpoints

These endpoints manage the core functionality around applications themselves - creating, updating, retrieving, and deleting applications.

### Create Application

**POST** `/create/{jobId}/applicant/{applicantId}`
Creates a new application for a specific job and applicant.

- **Path Parameters:**

  - `jobId` (UUID): ID of the job
  - `applicantId` (UUID): ID of the applicant _(temporary; should be removed when user context is handled server-side)_

- **Returns:** `ApplicationForApplicantDTO`

Throws:

- **OperationNotAllowedException**: if the applicant has already applied to the job
- **EntityNotFoundException**: if either the job or applicant doesn't exist

---

### Get Application by ID

**GET** `/{applicationId}`
Retrieves an application by its ID.

- **Path Parameter:** `applicationId` (UUID)
- **Returns:** `ApplicationForApplicantDTO` or `404 Not Found`

---

### Get Applications of an Applicant

**GET** `/applicant/{applicantId}`
Returns all applications submitted by a given applicant.

- **Path Parameter:** `applicantId` (UUID)
- **Returns:** `Set<ApplicationForApplicantDTO>`

---

### Get Applications of a Job

**GET** `/job/{jobId}`
Returns all applications for a specific job.

- **Path Parameter:** `jobId` (UUID)
- **Returns:** `Set<ApplicationForApplicantDTO>`

---

### Update Application

**PUT** `/`
Updates an existing application.

- **Body:** `UpdateApplicationDTO`
- **Returns:** `ApplicationForApplicantDTO`

---

### Withdraw Application

**PUT** `/withdraw/{applicationId}`
Withdraws an application.

- **Path Parameter:** `applicationId` (UUID)
- **Returns:** `200 OK`

---

### Delete Application

**DELETE** `/{applicationId}`
Deletes an application.

- **Path Parameter:** `applicationId` (UUID)
- **Returns:** `204 No Content`

Throws:

- **EntityNotFoundException**: if application does not exist

---

### Get Paginated Applications

**GET** `/pages`
Returns a paginated list of applications.

- **Query Parameters:**

  - `pageSize` (int, default: 25)
  - `pageNumber` (int, default: 0)

- **Returns:** `List<ApplicationOverviewDTO>`

---

### Get Total Number of Applications

**GET** `/pages/length/{applicantId}`
Returns the total count of applications for a specific applicant.

- **Path Parameter:** `applicantId` (UUID)
- **Returns:** `Long`

---

### Get Application Details

**GET** `/{applicationId}/detail`
Returns a detailed view of an application for display.

- **Authorization:** `APPLICANT`
- **Path Parameter:** `applicationId` (UUID)
- **Returns:** `ApplicationDetailDTO`

Throws:

- **EntityNotFoundException**: if application does not exist

---

## Document Management Endpoints

These endpoints allow users to upload, delete, rename, and retrieve documents attached to applications.

### Upload Documents to Application

**POST** `/upload-documents/{applicationId}/{documentType}`
Uploads one or more documents to an application.

- **Authorization:** `APPLICANT`
- **Consumes:** `multipart/form-data`
- **Path Parameters:**

  - `applicationId` (UUID)
  - `documentType` (enum `DocumentType`)

- **Form Parameter:** `files` (List of `MultipartFile`)
- **Returns:** `Set<DocumentInformationHolderDTO>`
- **Throws:**
  - `NotImplementedException` for unsupported `documentType`s
  - `EntityNotFoundException`: if user not found when uploading

---

### Get Document IDs of Application

**GET** `/getDocumentIds/{applicationId}`
Returns the document dictionary IDs associated with an application.

- **Path Parameter:** `applicationId` (UUID)
- **Returns:** `ApplicationDocumentIdsDTO`
- **Throws:** `IllegalArgumentException`: if `applicationId` is `null`

---

### Rename Document

**PUT** `/rename-document/{documentDictionaryId}`
Renames a document in an application.

- **Authorization:** `APPLICANT`
- **Path Parameter:** `documentDictionaryId` (UUID)
- **Query Parameter:** `newName` (String)
- **Returns:** `200 OK`

---

### Delete Document from Application

**DELETE** `/delete-document/{documentDictionaryId}`
Deletes a specific document from an application.

- **Authorization:** `APPLICANT`
- **Path Parameter:** `documentDictionaryId` (UUID)
- **Returns:** `204 No Content`

---

### Batch Delete Documents by Type

**DELETE** `/batch-delete-document/{applicationId}/{documentType}`
Deletes all documents of a given type from an application.

- **Authorization:** `APPLICANT`
- **Path Parameters:**

  - `applicationId` (UUID)
  - `documentType` (enum `DocumentType`)

- **Returns:** `204 No Content`
- **Throws:** `EntityNotFoundException`: if application does not exist
