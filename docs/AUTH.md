# 🔐 Keycloak & Role-Based Authentication Setup for TUMApply

This document describes how to set up and understand the authentication and authorization system in **TUMApply**.  
It uses **Keycloak** for login and a **Spring Boot server** for secure role-based access control.

---

## 🧩 What will be set up?

By starting the Keycloak container, the following resources are created automatically:

- A **Realm** called `tumapply`
- A **public client** called `tumapply-client`
- Three **test users** with password login:

| Username     | Password    | Role        |
| ------------ | ----------- | ----------- |
| `admin1`     | `admin`     | `ADMIN`     |
| `professor1` | `professor` | `PROFESSOR` |
| `applicant1` | `applicant` | `APPLICANT` |

These users can authenticate with a password and receive a valid access token (JWT).

---

## 🚀 How to start Keycloak

```bash
docker compose -f ../src/main/docker/services.yml up --build
```

- This will spin up a local Keycloak instance at:  
  `http://localhost:9080/`
- The admin UI is available at:  
  `http://localhost:9080/admin`
- Admin credentials:  
  Username: `admin`  
  Password: `admin`

---

## 📁 Realm Import

Keycloak automatically imports everything from the file `keycloak/realm-config/tumapply-realm.json`.  
This file defines the realm, users, and client.

**Do not change the admin interface manually**, unless you plan to re-export the JSON file afterward.

---

## 🔑 Testing Login via Bruno

You can test the login flow using [Bruno](https://www.usebruno.com/):

1. Open Bruno and load the request collection at:  
   `docs/TUMapply API/Authentication/collection.bru`

2. Use the POST `Keycloak Token` request in the Authentication folder.

✅ You should receive a JSON response like:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
  "expires_in": 300,
  "token_type": "Bearer"
}
```

---

## 🧠 What’s inside the JWT token?

Decoded, it will look like:

```json
{
  "preferred_username": "admin1",
  "given_name": "Admin",
  "family_name": "One",
  ...
}
```

You can view and debug it using [jwt.io](https://jwt.io).

---

## 🔗 How this is used in the application

- The **client** (Angular) must send the token in each request:
  ```
  Authorization: Bearer <access_token>
  ```
- The **server** (Spring Boot) validates the token and extracts user information such as `preferred_username`,
  `given_name`, `family_name`.

The user’s **role is not synced from Keycloak**, but instead assigned and managed inside the TUMApply **database**.

---

## 🛡️ Roles and Authorization

### 🎭 Available Roles

The application supports the following roles (assigned in the DB):

- `APPLICANT`
- `PROFESSOR`
- `ADMIN`

Roles are not assigned via Keycloak – they are provisioned in the server database.

---

### 🔐 Role Handling on the Server

- On first login, users are automatically created (if not existing) and assigned a role.
- Role assignments are stored in `UserResearchGroupRole`.
- Roles are loaded together with the user using a JPA `@EntityGraph`.

---

### 🔧 Authorization in Code

TUMApply uses a **layered authorization strategy**, combining annotations and runtime access checks:

---

#### ✅ Role Checks with `@PreAuthorize`

Use `@PreAuthorize("hasRole('ROLE')")` to restrict access to users with specific roles.

🔹 Best used in **Controller methods** to block unauthorized roles early.  
🔹 Checks only **roles**, not ownership of specific data.

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

```java

@CheckAccess
@PostMapping("/api/research-groups/{researchGroupId}/jobs")
public ResponseEntity<JobDTO> createJob(@PathVariable UUID researchGroupId, @RequestBody JobDTO jobDTO) {
    ...
}
```

You can also specify what type of access should be checked:

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

---

### 🔍 How to Check Roles on the Client

In the Angular client, you can determine the currently logged-in user's role(s) by calling the `/api/users/me` endpoint
after login.

#### Notes:

- The response contains the `roles` array, which can include one or multiple roles.
- Make sure the token is sent with the request (automatically added if using the HTTP interceptor).
- Use this role information to control visibility of menus, routes, and functionality in the UI.

---

### 👤 `/api/users/me` Endpoint

The `GET /api/users/me` endpoint allows the client to fetch details of the currently logged-in user.

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

- `AuthenticationService.java` – user creation and role loading
- `CustomJwtAuthenticationConverter.java` – maps JWT to authorities
- `SecurityConfiguration.java` – configures access restrictions
- `UserRepository.java` – uses `@EntityGraph` to preload roles

---

## 💡 Developer Notes

- The setup is designed to be **fully automatic** – no manual UI setup required
- To modify users or clients, edit the `tumapply-realm.json` and restart with:
  ```bash
  docker compose down -v && docker compose up
  ```
