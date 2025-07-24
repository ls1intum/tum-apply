## Application Detail for Applicants

The **Application Detail** page provides applicants with a comprehensive view of a specific job application they have submitted. This page is **read-only** and is primarily used for reviewing application contents and uploaded documents.

### Purpose

This page allows applicants to:

- Review all saved information in a structured and readable format
- Verify the contents of their application
- Access any documents uploaded as part of the application (e.g., CV, references, degree certificates)

It is typically accessed by clicking **View** on an application from the [Application Overview](./application-overview-page.md) page.

---

### Interface Overview

The detail view is composed of a single, well-structured layout divided into three vertical sections:

| Section    | Contents                                                   |
| ---------- | ---------------------------------------------------------- |
| **Left**   | Personal and educational background, social links          |
| **Middle** | Free-text answers: motivation, skills, research experience |
| **Right**  | Attached documents (CV, certificates, references, etc.)    |

The layout is responsive and scrollable if content overflows the view height.

---

### Content Breakdown

#### Header

At the top, the page displays the job title the application is associated with:

```html
<h1 jhiTranslate="entity.application_detail.applicant.header" ... />
```

#### Personal Details (Left Column)

This includes:

- **Preferred Language**
- **Desired Start Date**
- **Gender**
- **Nationality**
- Links to **Website** and **LinkedIn** (disabled if empty)

Each of these is rendered in a **card** format using reusable templates for clean layout and translation.

#### Educational Background (Left Column)

Two additional cards provide details for:

- **Bachelor's Degree**
  - Name of the degree
  - Grade (with icon indicator)
  - University

- **Master's Degree** (if present)
  - Name of the degree
  - Grade
  - University

#### Motivation & Skills (Middle Column)

Three sections are rendered using icons and headers:

| Icon        | Section Title                  | Field Used                    |
| ----------- | ------------------------------ | ----------------------------- |
| 🚀 `rocket` | Motivation                     | `application().motivation`    |
| 🧠 `brain`  | Special Skills                 | `application().specialSkills` |
| ⚗️ `flask`  | Research Experience / Projects | `application().projects`      |

These are rendered using a generic `textCardTemplate`.

#### Documents (Right Column)

The right column contains the `jhi-document-group` component, which displays grouped document uploads related to the application. These include:

- CV
- Bachelor / Master degree certificates
- Reference letters

The `documentIds` object passed to this component is fetched via the backend call to `getDocumentDictionaryIds()`.

---

### Technical Details

- The component fetches data based on the route param `application_id`.
- It retrieves:
  - **Application content**: via `getApplicationForDetailPage(...)`
  - **Document references**: via `getDocumentDictionaryIds(...)`

- The layout is composed of:
  - `ApplicationDetailCardComponent` - defines the left and middle content
  - `DocumentGroupComponent` - handles file display and download

- Templates inside `application-detail-card.component.html` allow consistent rendering of common content blocks (e.g., `infoRow`, `textCardTemplate`, `card_header`)

---

### Error Handling

- If the route does not contain a valid `application_id`, an error alert is shown.
- If document IDs cannot be fetched, an alert is triggered as a fallback.
