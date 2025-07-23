## 📝 Application Editing Wizard

Applicants can **create** or **edit** their applications in a guided three-step process with auto-save functionality:

### Step 1: Personal & Contact Information

### Step 2: Academic Background & Transcript Uploads

### Step 3: Application Details & Document Uploads

A **progress stepper** displays the steps and their state, enabling users to navigate forwards/backwards, auto-save drafts, and finally **send** the application.

---

### Purpose

This component allows applicants to:

- **Create** a new application or **edit** an existing one.
- Complete the form in steps, with real-time validation.
- **Auto-save** progress while filling out the form.
- Upload relevant documents: transcripts, CV, reference letters.
- Submit the final application once all required fields are filled.

---

### Page Layout & User Flow

#### Form Wizard

- Uses a **three-step progress stepper** (via `jhi-progress-stepper`), integrating each page as a templated panel.
- Custom step buttons:

  - **Next** / **Prev**: navigate with validation checks.
  - **Cancel** (on Step 1): automatically autosaves and returns.
  - **Send** (on Step 3): final submission.

#### Auto-Save & Submission Strategy

- Automatically **saves draft** every 3 seconds when form changes are detected and `savingState` is `SAVING`.
- On navigation ("_Next_"/"_Previous_"), partial updates and document rename updates are triggered.
- Final "**send**" action (**SENT**) submits application.
- The form maintains save status via UI badge (`SAVING` → `SAVED`).

---

### Step Overview

| Step | Component                           | Purpose                                              | Documents                         |
| ---- | ----------------------------------- | ---------------------------------------------------- | --------------------------------- |
| 1    | `ApplicationCreationPage1Component` | Personal info (name, email, language, address…)      | None                              |
| 2    | `ApplicationCreationPage2Component` | Academic info (degrees, grades)                      | Bachelor/master transcript upload |
| 3    | `ApplicationCreationPage3Component` | Application details (motivation, skills, start date) | CV & reference uploads            |

---

### User Flow Summary

1. **Navigate** to `/create/{jobId}` to create a new application, or `/edit/{applicationId}` to update existing.
2. **Step 1**: Enter personal info (name, contact, address). Click _Next_ (valid only if required fields filled).
3. **Step 2**: Enter academic details. Upload bachelor/master transcripts. _Next_ enabled when form valid.
4. **Step 3**: Enter desired start date, motivation, skills, experiences. Upload CV/reference if needed.
5. **Send** finalizes the application by submitting it to the backend.
6. At any point, users can **navigate back** or **cancel**, and auto-save ensures draft isn't lost.
