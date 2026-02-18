## 🛡️ Roles and Authorization

### 🎭 Available Roles

The application supports the following roles (assigned in the DB):

- `APPLICANT`
- `EMPLOYEE`
- `PROFESSOR`
- `ADMIN`

Roles are not assigned via Keycloak – they are provisioned in the server database.

---

### 🔐 Role Handling on the Server

- On first login, users are automatically created (if not existing) and assigned a role.
- Role assignments are stored in `UserResearchGroupRole`.
- Roles are loaded together with the user using a JPA `@EntityGraph`.

---

### 👥 Employee Role (Server-Verified)

The employee role is implemented via controller-level security annotations in the backend:

- `@ProfessorOrEmployee` → endpoint is available to **both EMPLOYEE and PROFESSOR**.
- `@ProfessorOrEmployeeOrAdmin` → endpoint is available to **EMPLOYEE, PROFESSOR, and ADMIN**.

The following capabilities are verified from server controller methods annotated with the employee-enabled annotations:

| Area                   | Employee capability                                                                                                                                                | Annotation used on endpoint   | Professors can do this too? |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------- | --------------------------- |
| Evaluation             | Accept/reject applications, open applications, list evaluation overviews/details, download applicant documents, list job names                                     | `@ProfessorOrEmployee`        | ✅ Yes                      |
| Internal collaboration | Read/create/update/delete internal comments, read/update application ratings                                                                                       | `@ProfessorOrEmployee`        | ✅ Yes                      |
| Interviews             | Full interview workflow: overview, upcoming interviews, process details, create/delete slots, assign slots, add interviewees, update assessments, send invitations | `@ProfessorOrEmployee`        | ✅ Yes                      |
| Jobs                   | Create/update/delete jobs, change job state, list research-group jobs, view protected job details                                                                  | `@ProfessorOrEmployeeOrAdmin` | ✅ Yes                      |
| Email templates        | List, get, create, and update research-group templates                                                                                                             | `@ProfessorOrEmployee`        | ✅ Yes                      |
| Research groups        | View own group members, read group details, update research group data                                                                                             | `@ProfessorOrEmployeeOrAdmin` | ✅ Yes                      |
| Images and banners     | View default and research-group banners, list own uploads, upload job banners                                                                                      | `@ProfessorOrEmployeeOrAdmin` | ✅ Yes                      |
| Export                 | Export job preview to PDF                                                                                                                                          | `@ProfessorOrEmployee`        | ✅ Yes                      |
| AI support             | Generate job draft stream, translate/persist job descriptions                                                                                                      | `@ProfessorOrEmployeeOrAdmin` | ✅ Yes                      |

#### ❌ Explicitly not allowed for employees

The following actions are explicitly restricted by annotations that **exclude EMPLOYEE**:

- Delete email templates (`@Professor` on `DELETE /api/email-templates/{templateId}`).
- Delete images (`@ProfessorOrAdmin` on `DELETE /api/images/{imageId}`).
- Add/remove research group members (`@ProfessorOrAdmin` on `/api/research-groups/members`).
- Search users available for research-group assignment (`@ProfessorOrAdmin` on `/api/users/available-for-research-group`).
- Use admin-only endpoints such as research-group moderation and admin creation flows (`@Admin`).

---

### 🔧 Authorization in Code

TUMApply uses a **layered authorization strategy**, combining annotations and runtime access checks:

---

#### ✅ Role Checks with `@PreAuthorize`

Use `@PreAuthorize("hasRole('ROLE')")` to restrict access to users with specific roles.

🔹 Best used in **Controller methods** to block unauthorized roles early.  
🔹 Checks only **roles**, not ownership of specific data.

**When and how to use:**  
Use `@PreAuthorize` when you want to restrict access based purely on the user's role membership, such as allowing only
admins or professors to access certain endpoints. This is a declarative, compile-time check that is easy to apply on
controller methods to prevent unauthorized access before any business logic is executed.

```java

@PreAuthorize("hasRole('ADMIN')")
@GetMapping("/api/admin/config")
public ResponseEntity<?> getAdminConfig() {
    ...
}
```

---

#### 🔍 Access Checks with `currentUserService.hasAccessTo(...)`

Use `currentUserService.hasAccessTo(object)` to check **if the current user can access a specific resource**.

🔹 Best used inside **Service methods**  
🔹 Checks based on ownership or Research Group relationship  
🔹 Avoids duplicate database calls – you already have the resource

**When and how to use:**  
Use `hasAccessTo(...)` when you have already loaded the resource object and want to verify if the current user has
permission to access it based on ownership or affiliation. This method enables fine-grained runtime access control
beyond simple role checks.

You can also use `currentUserService.assertAccessTo(object)` to throw an `AccessDeniedException` if access is denied.
This avoids repetitive checks and makes your code cleaner:

```java
currentUserService.assertAccessTo(job);
```

```java
Job job = jobService.getJob(jobId);
if(!currentUserService.

hasAccessTo(job)){
        throw new

AccessDeniedException("Access to this job is not allowed.");
}
```

✅ This supports:

- `Job`
- `Application`
- `CustomFieldAnswer`
- `ApplicationReview`
- `InternalComment`
- `CustomField`
- `ResearchGroup`

---

#### 🧩 `@CheckAccess` for Request Parameters

Use `@CheckAccess` to automatically check access **based on method parameters** – especially useful in controller
methods.

🔹 Best used for **POST/PUT/DELETE** methods where the parameter (e.g. `researchGroupId`) is directly passed  
🔹 Uses AOP (`CheckAccessAspect`) to extract IDs and validate permission

**When and how to use:**  
Use `@CheckAccess` when your controller methods receive IDs or objects with a getResearchGroupId method as parameters
and you want to enforce access control automatically before executing the method. This reduces boilerplate and
centralizes access logic for parameter-based authorization.

You can customize the type of access being checked using the `target` parameter:

```java

@CheckAccess
@PostMapping("/api/research-groups/{researchGroupId}/jobs")
public ResponseEntity<JobDTO> createJob(@PathVariable UUID researchGroupId, @RequestBody JobDTO jobDTO) {
    ...
}
```

```java

@CheckAccess(target = AccessTarget.PROFESSOR_ID)
public ResponseEntity<?> getJobsForProfessor(@PathVariable UUID professorId) {
    ...
}
```

📌 `@CheckAccess` supports these targets:

- `RESEARCH_GROUP_ID` (default)
- `USER_ID`
- `PROFESSOR_ID`

---

### 🧠 When to Use What?

| Use case                                | Use `@PreAuthorize` | Use `hasAccessTo(...)` | Use `@CheckAccess`       |
| --------------------------------------- | ------------------- | ---------------------- | ------------------------ |
| Block roles like APPLICANT early        | ✅ Yes              | ❌ No                  | ❌ No                    |
| Check if user owns a Job or Application | ❌ No               | ✅ Yes                 | ✅ If param ID is passed |
| POST with researchGroupId in path       | ❌ No               | ❌ No                  | ✅ Yes                   |
| Service logic with full object          | ❌ No               | ✅ Yes                 | ❌ No                    |

All approaches work together – use them **in combination** for best clarity and security.

Important: Use `@PreAuthorize` to restrict access based on roles (e.g., "is this user a professor?"). Use
`hasAccessTo(...)` or `@CheckAccess` to restrict access based on ownership or affiliation with a resource (e.g., does
this user belong to the research group that owns this application?).

---

### 🔍 How to Check Roles on the Client

In the Angular client, you can determine the currently logged-in user's role(s) by calling the `/api/users/me` endpoint
after login.

### 👤 `/api/users/me` Endpoint

The `GET /api/users/me` endpoint allows the client to fetch details of the currently logged-in user.

#### Notes:

- The response contains the `roles` array, which can include one or multiple roles.
- Make sure the token is sent with the request (automatically added if using the HTTP interceptor).
- Use this role information to control visibility of menus, routes, and functionality in the UI.

#### Behavior:

- ✅ **Authenticated and user exists**: returns user data and roles.
- 🆕 **Authenticated but user not in DB**: creates new user with data from the JWT and assigns role `APPLICANT`.
- ❌ **Unauthenticated**: returns `401 Unauthorized`.

#### Example response:

```json
{
  "userId": "fcf4722e-757f-427f-bae1-1c960b0dd531",
  "email": "admin1@tumapply.local",
  "firstName": "Admin",
  "lastName": "One",
  "roles": ["APPLICANT"],
  "researchGroup": {
    "researchGroupId": "00000000-0000-0000-0000-000000000002",
    "name": "Data Science Group"
  }
}
```

---

### 🛠️ Role Management Behavior

- Users are identified by their **email** (from the JWT `email` claim).
- On first login:
  - A new user is created with default values (`selectedLanguage = 'en'` etc.).
  - The `APPLICANT` role is assigned **if no role exists** for the user.
- Roles are linked using the `UserResearchGroupRole` entity.

---

### 📁 Related Files

- `ServerAuthenticationService.java` – user creation and role loading
- `CustomJwtAuthenticationConverter.java` – maps JWT to authorities
- `SecurityConfiguration.java` – configures access restrictions
- `UserRepository.java` – uses `@EntityGraph` to preload roles
- `CurrentUserService.java`

---

## 💡 Developer Notes

- The setup is designed to be **fully automatic** – no manual UI setup required
- To modify users or clients, edit the `tumapply-realm.json` and restart with:
  ```bash
  docker compose down -v && docker compose up
  ```

---

## 🔄 Summary of Access Handling

- Use `@PreAuthorize(...)` on controller methods to restrict by role
- Use `@CheckAccess` on controller methods when IDs like `researchGroupId` or `professorId` are directly passed
- Use `currentUserService.hasAccessTo(...)` in service logic when you already have the full object
- Use `currentUserService.assertAccessTo(...)` if you want to throw an exception when access is denied
