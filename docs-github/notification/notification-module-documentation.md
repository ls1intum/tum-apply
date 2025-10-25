# Notification Module

The **Notification Module** is responsible for delivering system-generated and user-triggered messages to applicants and professors. Its primary focus is **email communication**, covering both transactional notifications (e.g., application submission, acceptance, or rejection) and configurable custom messages (e.g., professor-specific templates).

The module is primarily implemented on the **server side**, with supporting client-side interfaces for **email settings** and **template management**.

---

## Concepts

### Email Object

At the core of the Notification Module is the **`Email` object**, a domain representation of a message to be sent. It abstracts over the transport mechanism (e.g., SMTP) and allows uniform handling of both automated and custom messages.

**Fields of an `Email`:**

| Field            | Type                | Description |
|------------------|---------------------|-------------|
| `to`             | `Set<User>`         | Primary recipients of the email. Must contain at least one user. |
| `cc`             | `Set<User>`         | Carbon-copy recipients. Optional. |
| `bcc`            | `Set<User>`         | Blind-carbon-copy recipients. Optional. |
| `researchGroup`  | `ResearchGroup`     | Reference to the research group context. Used to resolve templates. |
| `emailType`      | `EmailType`         | Classification of the email (e.g., `APPLICATION_SENT`, `APPLICATION_REJECTED`). Determines which template is applied. |
| `templateName`   | `String`            | Optional identifier of a template within the selected `emailType`. Defaults to `null`. |
| `content`        | `Object`            | Context object for template rendering. Must be an instance of `ResearchGroup`, `Job`, or `Application`. Required if `customBody` is not set. |
| `customSubject`  | `String`            | Overrides the subject line. If set, the subject of the selected template is ignored. |
| `customBody`     | `String` (HTML)     | Overrides the email body. If set, it is used as-is (HTML supported) and both `template` and `content` are ignored. |
| `sendAlways`     | `boolean`           | If `true`, the email is sent regardless of user preferences. Default: `false`. |
| `language`       | `Language`          | Language of the email, used to select the correct translation of the template. Default: `ENGLISH`. |
| `documentIds`    | `Set<UUID>`         | Optional set of document identifiers. The corresponding documents are attached to the email. |

This object is constructed by higher-level services and consumed by the **Email Service**.

---

### Asynchronous Sending

Sending email can be **slow and unreliable** due to:

* network latency,
* SMTP server load,
* invalid recipient addresses.

To avoid blocking user-facing actions (e.g., submitting an application), the module introduces an **AsyncEmailSender**.

* The **AsyncEmailSender** enqueues the email in a separate thread or executor.
* It then calls the **EmailService** in the background.
* This ensures that the application logic (e.g., marking an application as submitted) is not delayed by email delivery.

If sending fails, errors are logged, and retry policies can be applied without impacting the user.

---
## Services

The Notification Module is decomposed into several services, each with a clear responsibility. The workflow begins with the **AsyncEmailSender** and proceeds through the EmailService and its collaborators.

---

1. **AsyncEmailSender**

  * The **only entry point** for higher-level modules (e.g., ApplicationEvaluationService).
  * Accepts constructed `Email` objects and schedules them for **asynchronous delivery**.
  * Ensures business operations (e.g., application submission) are never blocked by email transmission.

---

2. **EmailService**

  * The **central coordinator** of email workflows.
  * Validates the `Email` object, resolves templates and placeholders, applies user notification settings, and attaches documents before sending.
  * Uses the Spring **`@Retryable`** mechanism to transparently retry transient mailing errors (e.g., SMTP connection issues).
  * Provides a **recovery method** (`@Recover`) that logs permanent failures after all retries are exhausted.
  * Supports two modes:
    * **Active sending** via `JavaMailSender` when email is enabled.
    * **Simulation** mode, logging the fully rendered email when email is disabled (e.g., during development).

---

3. **TemplateProcessingService**

  * Responsible for rendering template content.
  * Replaces placeholders with dynamic data (e.g., applicant name, job title).
  * Can render either plain subjects (`renderSubject`) or full HTML bodies (`renderTemplate`, `renderRawTemplate`).

---

4. **EmailTemplateService**

  * Provides access to stored **email templates** and their **translations**.
  * Fetches the correct `EmailTemplateTranslation` based on:
    * research group,
    * template name,
    * email type, and
    * language.
  * Ensures professors can define group-specific, localized communication styles.

---

5. **EmailSettingService**

  * Filters recipients based on their individual notification preferences.
  * Prevents sending unwanted messages by checking whether a user has opted in for the given `EmailType`.
  * Can be bypassed by setting `sendAlways = true` in the `Email` object (for critical administrative messages).


---

## Resources (Server–Side API)

The Notification Module exposes two REST resources:

1. **EmailTemplateResource**

  * CRUD operations for templates and their translations.
  * Used by professors to define how their research group communicates with applicants.
  * Supports multilingual editing.

2. **EmailSettingResource**

  * Endpoints for retrieving and updating notification preferences.
  * Each user can configure whether they want to receive emails about new applications, reviews, or other events.

---

## Client Components

Although the Notification Module is primarily server-side, two client-facing areas allow users to configure their notification preferences and professors to manage templates.

---

### 1. Email Settings Interface

**Components:**
- `SettingsComponent` (`src/main/webapp/app/shared/settings/settings.component.ts`)
  * Container component that determines the current user’s role (Professor or Applicant) via the `AccountService` and passes it down to the `EmailSettingsComponent`.
- `EmailSettingsComponent` (`src/main/webapp/app/shared/settings/email-settings/email-settings.component.ts`)
  * Displays grouped notification settings for the current role.
  * Uses toggle switches to enable or disable categories of notifications (e.g., “New Application Received”, “Application Accepted”).
  * Ensures professors and applicants only see the notification groups relevant to them.

**Purpose:**  
Gives end users control over which system notifications they want to receive. This reduces email fatigue and aligns the system with user preferences.

---

### 2. Email Template Management

**Components:**
- `ResearchGroupTemplates` (`src/main/webapp/app/usermanagement/research-group/research-group-templates/research-group-templates.ts`)
  * Lists available templates in a dynamic, pageable table.
  * Supports creating, editing, and deleting templates.
- `ResearchGroupTemplateEdit` (`src/main/webapp/app/usermanagement/research-group/research-group-template-edit/research-group-template-edit.ts`)
  * Provides a detailed editor for creating or updating templates.
  * Integrates a **Quill rich-text editor** with support for inserting dynamic placeholders (e.g., applicant name, job title).
  * Implements **autosave** every 3 seconds and on navigation/unload to prevent data loss.
  * Allows multilingual editing (English and German) for each template.

**Purpose:**  
Enables professors to define and customize how automated system emails are phrased and localized. This ensures research groups can communicate with applicants in a consistent and professional tone while maintaining flexibility.
