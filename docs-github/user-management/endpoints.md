# 📡 API Endpoints – User Management

This document describes the REST endpoints available for user-related operations.

---

## 🔐 GET `/api/users/me`

Returns information about the currently authenticated user.

### Description

- Retrieves the user's data based on the JWT token provided in the request.
- If the user does not exist yet, the system will create a new user automatically and assign a default role.
- If the JWT is not present or invalid, an empty response is returned.

### Request

- **Method:** GET
- **URL:** `/api/users/me`
- **Auth Required:** ✅ Yes (JWT)
- **Headers:**
  - `Authorization: Bearer <token>`

### Response

- **200 OK** – User found and returned as `UserShortDTO`
- **200 OK (empty)** – No user (JWT missing or invalid)

### Example Response

```json
{
  "id": 42,
  "email": "jane.doe@tum.de",
  "firstName": "Jane",
  "lastName": "Doe",
  "role": "APPLICANT"
}
```

### Notes

- This endpoint is essential for determining the role and identity of the logged-in user.
- It is typically called immediately after login to bootstrap the client.
