## Application Overview for Applicants

The **Application Overview** page allows applicants to view and manage all their submitted applications in one place. The interface presents a paginated table with key information about each application, such as the job title, research group, application status, and submission date.

### Purpose

This page gives applicants a **centralized overview** of their applications, and allows them to:

- View application details
- Withdraw applications
- Edit drafts
- Delete unsent applications

### Interface Overview

The overview is presented as a dynamic, paginated table. Each row represents one application and includes the following columns:

| Column             | Description                                             |
| ------------------ | ------------------------------------------------------- |
| **Position Title** | The title of the job posting applied to                 |
| **Research Group** | The research group offering the job                     |
| **Status**         | Current state of the application (e.g., SENT, REJECTED) |
| **Created**        | How long ago the application was submitted              |
| **Actions**        | Available operations (View, Edit, Withdraw, Delete)     |

Status values are shown as **badges** with visual color cues, for example:

- `Draft` - Grey
- `Submitted` - Blue
- `Accepted` - Green
- `Rejected` - Red
- `Withdrawn` - Black

### Navigation & Actions

Each application row contains action buttons based on the application’s current state:

| State(s)                        | Available Actions           |
| ------------------------------- | --------------------------- |
| `SAVED`                         | **Edit**, **Delete**        |
| `SENT`, `IN_REVIEW`, `REJECTED` | **Withdraw**                |
| Any                             | **View** (always available) |

#### View Details

Click **View** to navigate to the [Application Detail](#application-detail-page) page.

#### Edit Application

If the application is still in the `SAVED` state, the applicant can click **Update** to resume editing the application.

#### Withdraw Application

Applicants can withdraw submitted applications (`SENT`, `IN_REVIEW`, or `REJECTED`) by clicking **Withdraw**. A confirmation prompt will appear before the action is executed.

#### Delete Application

Applications in `SAVED` state (i.e., drafts) can be deleted. Deletion is permanent and will prompt a confirmation before proceeding.

### Pagination

The component automatically loads applications page-by-page using lazy loading (triggered by scrolling or navigation). The total number of applications is fetched once on component load.

---

### Technical Details

- The table uses `jhi-dynamic-table`, a reusable component for data tables based on the primeng
- Template references (`#stateTemplate` and `#actionTemplate`) define how status badges and action buttons are rendered.
- All text is fully internationalized using the `ngx-translate` library.
- Data is fetched from the backend using `ApplicationResourceService.getApplicationPages(...)` and `getApplicationPagesLength(...)`.
