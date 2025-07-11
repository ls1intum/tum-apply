# 🔐 Authentication Flow in TUMApply

This document provides an overview of the authentication setup and login flow in **TUMApply**, using **Keycloak** and
OAuth 2.0 / OIDC.

## 🔗 Overview

TUMApply uses **Keycloak** as an identity provider. The client authenticates via OAuth 2.0 and obtains a JWT token. This
token is sent with each request and validated by the Spring Boot backend.

- A **Realm** called `tumapply`
- A **public client** called `tumapply-client`
- Three **test users** with password login:

  | Username     | Password    | Role        |
  | ------------ | ----------- | ----------- |
  | `admin1`     | `admin`     | `ADMIN`     |
  | `professor1` | `professor` | `PROFESSOR` |
  | `applicant1` | `applicant` | `APPLICANT` |

These users can authenticate with a password and receive a valid access token (JWT).

## 🚀 Starting Keycloak

To start Keycloak, please follow the instructions in the [Keycloak Setup](keycloak-setup.md) document.

## 🧪 Testing Login with Bruno

You can use [Bruno](https://www.usebruno.com/) for testing login via password grant:

1. Load the collection in `docs/TUMapply API/Authentication/collection.bru`
2. Use the POST `Keycloak Token` request
3. You should receive an access token:

```json
{
  "access_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6...",
  "expires_in": 300,
  "token_type": "Bearer"
}
```

## 🧠 What’s in the Token?

Use [jwt.io](https://jwt.io) to inspect the decoded token.

Example decoded JWT:

```json
{
  "preferred_username": "admin1",
  "given_name": "Admin",
  "family_name": "One",
  ...
}
```

## 🔐 Authorization Flow in Application

- **Client** sends `Authorization: Bearer <token>` in every request
- **Server** extracts and validates the token, retrieves user info like `preferred_username`, `given_name`,
  `family_name`, ...

The user’s **role is not synced from Keycloak**, but instead assigned and managed inside the TUMApply **database**.

## 👤 `/api/users/me` Endpoint

Returns current user’s details and roles.

- If user exists: returns full data
- If new user: creates one with `APPLICANT` role
- If not authenticated: returns 401

Example response:

```json
{
  "userId": "...",
  "email": "admin1@tumapply.local",
  "roles": ["APPLICANT"],
  "researchGroup": {
    "researchGroupId": "...",
    "name": "Data Science Group"
  }
}
```

## ✅ Summary

- Keycloak manages authentication, but not roles.
- User data is stored and managed in the TUMApply database.
- On first login, a new user is created with default role.
