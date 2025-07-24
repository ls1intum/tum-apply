# Error Handling in TUMApply

This document describes the unified error handling approach in TUMApply, including how exceptions are structured,
when to use which type, and what response clients can expect from the API.

---

## 📦 API Error Response Format

All handled exceptions in TUMApply return a structured JSON object like this:

```json
{
  "timestamp": "2025-05-13T14:12:45.123Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Field must not be null",
  "path": "/api/users",
  "errorCode": "VALIDATION_ERROR",
  "fieldErrors": [
    {
      "objectName": "CreateUserRequest",
      "field": "email",
      "message": "must not be null"
    }
  ]
}
```

---

## 🧱 Exception Classes Overview

| Class                                | HTTP Status          | Use Case Description                                     |
| ------------------------------------ | -------------------- | -------------------------------------------------------- |
| `AccessDeniedException`              | `403 FORBIDDEN`      | User is authenticated but not authorized                 |
| `EntityNotFoundException`            | `404 NOT_FOUND`      | Entity not found in the database                         |
| `InternalServerException`            | `500 INTERNAL_ERROR` | Unhandled application error                              |
| `InvalidParameterException`          | `400 BAD_REQUEST`    | Manually detected invalid input                          |
| `MailingException`                   | `500 INTERNAL_ERROR` | Sending an email failed                                  |
| `OperationNotAllowedException`       | `400 BAD_REQUEST`    | Action is not permitted in current context               |
| `ResourceAlreadyExistsException`     | `409 CONFLICT`       | Entity with conflicting value already exists             |
| `UnauthorizedException`              | `401 UNAUTHORIZED`   | User is not authenticated                                |
| `UploadException`                    | `400 BAD_REQUEST`    | File upload failed                                       |
| `Validation Error` (Spring built-in) | `400 BAD_REQUEST`    | Automatically triggered by `@Valid`, shows `fieldErrors` |

---

## ✅ When to Use Which Exception

| Situation                              | Exception                                                   |
| -------------------------------------- | ----------------------------------------------------------- |
| Entity with given ID not found         | `EntityNotFoundException.forId("User", userId)`             |
| Email already in use                   | `ResourceAlreadyExistsException("Email already exists")`    |
| Missing or invalid manual input        | `InvalidParameterException("Invalid start date")`           |
| Business rule not met                  | `OperationNotAllowedException("Status change not allowed")` |
| User is logged in but lacks permission | `AccessDeniedException("Only admins can delete users")`     |
| User is not logged in or token expired | `UnauthorizedException("Login required")`                   |
| PDF file upload failed                 | `UploadException("Invalid file format")`                    |
| Email cannot be sent                   | `MailingException("SMTP server not available")`             |
| Unexpected logic error                 | `InternalServerException("Uncaught exception", cause)`      |
| Input DTO with @Valid fails            | Automatically handled → results in `VALIDATION_ERROR`       |

---

## 🎯 How to Use in Code

### Use with Optional values

```java
User user = getOrThrow(userRepository.findById(id), () -> EntityNotFoundException.forId("User", id));

```

### Manual input validation

```java
if(!email.contains("@")){
        throw new

InvalidParameterException("Invalid email format");
}
```

---

## 🧠 ErrorCode Enum

Each handled exception maps to a unique `ErrorCode` enum value used in API responses:

```java
public enum ErrorCode {
  ACCESS_DENIED,
  ENTITY_NOT_FOUND,
  INTERNAL_ERROR,
  INVALID_PARAMETER,
  MAILING_ERROR,
  OPERATION_NOT_ALLOWED,
  RESOURCE_ALREADY_EXISTS,
  UNAUTHORIZED,
  UPLOAD_FAILED,
  VALIDATION_ERROR,
}

```

These are included in the `ApiError` to help the client differentiate and react accordingly.

---

## 🧩 Field-Level Validation Errors

If a request fails validation (e.g. `@NotNull`, `@Size`) the response includes `fieldErrors`, a list of:

```json
{
  "objectName": "CreateUserRequest",
  "field": "email",
  "message": "must not be null"
}
```

These are represented by the `ValidationFieldError` class.

---

## 🧪 Testing Exceptions

There are automated tests under `GlobalExceptionHandlerTest.java` that verify:

- All exceptions are properly mapped to HTTP status codes
- `ApiError` JSON structure is correct
- `errorCode` and `fieldErrors` are returned correctly

---

## 📘 Best Practices

- Use `OptionalUtils.getOrThrow(...)` to fetch entities cleanly.
- Only throw exceptions that are semantically meaningful.
- Prefer custom exceptions over generic ones.
- Include `ErrorCode` consistently.
- Add unit tests for expected exception behavior.

---
