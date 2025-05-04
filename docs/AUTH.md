# 🔐 Keycloak Setup for TUMApply (Authentication)

This document describes how to set up a local Keycloak instance for TUMApply. It is designed to be beginner-friendly and
assumes no prior Keycloak knowledge.

---

## 🧩 What will be set up?

By starting the Keycloak container, the following resources are created automatically:

- A **Realm** called `tumapply`
- A **public client** called `tumapply-client`
- Three **test users** with password login:

  | Username     | Password    |
  | ------------ | ----------- |
  | `admin1`     | `admin`     |
  | `professor1` | `professor` |
  | `applicant1` | `applicant` |

These users can authenticate with a password and receive an access token (JWT).

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
**Do not change the admin interface manually** unless you plan to re-export the JSON file afterward.

---

## 🔑 How to test login (Postman)

You can test the login flow using Postman:

**POST** `http://localhost:9080/realms/tumapply/protocol/openid-connect/token`  
**Body (x-www-form-urlencoded):**

```
client_id=tumapply-client
grant_type=password
username=admin1
password=admin
```

✅ You should receive a response like:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
  "expires_in": 300,
  "token_type": "Bearer",
  ...
}
```

---

## 🧠 What’s inside the access token?

Decoded, it will look like:

```json
{
  "preferred_username": "admin1",
  ...
}
```

You can view it using [jwt.io](https://jwt.io).

---

## 🔗 How is this used in the application?

- The **client** (Angular) should send the token in each request:
  ```
  Authorization: Bearer <access_token>
  ```
- The **server** (Spring Boot) validates the token and extracts user information such as `sub`, `email`, etc.  
  The user’s role is checked against the application’s own database.

You do not need to manually sync roles from Keycloak to your database. Authorization is fully handled on the server.

---

## 💡 Developer Notes

- The setup is designed to be **fully automatic** – no manual UI setup required
- To modify users or clients: edit `tumapply-realm.json` and restart the container with
  `docker compose down -v && docker compose up`

---
