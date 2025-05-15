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

You can restrict controller access with annotations:

```java
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<?> adminEndpoint() {}

```

Or check them programmatically:

```java
SecurityUtils.hasCurrentUserAnyOfAuthorities("ADMIN","PROFESSOR");
```

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
