# User Flow Documentation 📚

## 1. User Flow Overview 🔄

The Job Module consists of two main user types with distinct workflows:

- **Applicants**: Browse and apply for doctorate positions
- **Professors**: Create, manage, and monitor their posted positions

---

## 2. User Workflows Description 📋

### 2.1 Applicant Workflow 🎓

#### Step 1: Browse Available Positions

Navigate to the "Find Positions" page to discover available doctorate opportunities displayed as job cards.

--TODO: Screencast of Find Positions --

#### Step 2: View Position Details

Click on any job card to access the detailed job information page, which includes:

- Key details
- Complete job description
- tasks and responsibilities
- Eligibility criteria
- Research area description

The bottom of the page features an "Apply" button that allows applicants to start the doctorate application process.
Applicants can navigate back to the previous page using the "Back" button, if they prefer to browse further positions.

--TODO: Screencast of Job Details (Applicant)--

### 2.2 Professor Workflow 👨‍🏫

#### Step 1: Create New Position 📝

Professors can navigate to the Job Creation Form when clicking on "Create Position" in the sidebar, and access the job creation form through a multi-step process:

##### Page 1: Basic Information

Fill out fundamental details including:

- Job Title
- Research Area
- Field of Studies
- Funding Type
- Optional contract duration

##### Page 2: Position Details

Complete essential information for applicants:

- Detailed job description
- Key tasks and responsibilities
- Eligibility criteria requirements

##### Page 3: Additional Information

Review and confirm additional details:

- Data privacy information (displayed for all positions)

If professors would like to continue updating the job details at a later date, they can save the currently filled-out job as a draft.

--TODO: Screencast of job creation form--

#### Step 2: Manage Positions Dashboard 📊

Navigate to "My Positions" page to view all created doctorate positions with dynamic action buttons:

##### Available Actions:

- **👁️ View Details**: Access complete position information
- **✏️ Edit/Refine**: Available for draft positions to make changes before publishing
- **🗑️ Delete**: Remove draft positions that won't be published
- **🔒 Close**: Close published positions and notify all applicants

--TODO: Screencast of My Positions --

#### Step 3: Edit Draft Positions ✏️

Access the editing interface for draft positions where:

- All previously saved information is pre-filled
- Professors can refine details before publishing
- Changes can be made to any section of the form

--TODO: Screencast of editing page --

#### Step 4: Professor Job Detail View 🔍

View position details from the professor perspective, which includes:

- Current job state indicator
- Dynamic action buttons based on position status
- Enhanced controls compared to applicant view

--TODO: Screencast of job detail page (Professor) --

#### Step 5: Job Closing / Deletion 🔒🗑️

Manage the lifecycle end of a position.

**Closing a Published Position**:

- When the professor clicks the "Close" button on a published position, the system updates the job’s state from **Published** to **Closed**.
- A status badge visibly reflects this change in the interface.
- Notifications are automatically sent to all applicants who previously submitted applications for the position, informing them that positions will no longer be reviewed.

**Deleting a Draft Position**:

- A professor can also delete a draft position using the **Delete** button.
- Upon confirmation, the draft is permanently removed from the dashboard and cannot be recovered.

## --TODO: Add screencast of closing a published position and deleting a draft position --

## 3. Key Features Summary ⭐

### For Applicants:

- 🔍 **Position Discovery**: Browse available positions through intuitive job cards
- 📖 **Detailed Information**: Access comprehensive job details before applying
- 📝 **Easy Application**: Streamlined application process

### For Professors:

- 📋 **Multi-step Creation**: Structured form for complete position definition
- 🎛️ **Dynamic Management**: Context-aware action buttons for position control
- 📊 **Centralized Dashboard**: All positions managed from single interface
- ✏️ **Flexible Editing**: Edit drafts with pre-filled information
- 🔄 **Status Management**: Real-time position state tracking

---

## 4. Position States 🔄

| State               | Description                                                                                     | Available Actions  |
| ------------------- | ----------------------------------------------------------------------------------------------- | ------------------ |
| **Draft**           | Position created but not published                                                              | Edit, Delete, View |
| **Published**       | Position live and accepting applications                                                        | View, Close        |
| **Applicant Found** | An applicant has been selected; position remains visible but not accepting further applications | View               |
| **Closed**          | Position no longer accepting applications                                                       | View               |

---

## 5. User Experience Highlights 🌟

- **Intuitive Navigation**: Clear pathways for both user types
- **Pre-filled Forms**: Editing maintains previously saved information
- **Dynamic Interface**: Action buttons adapt to current position state
- **Comprehensive Management**: Complete position lifecycle control
