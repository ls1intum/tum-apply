# Realms

There are three realms in total:

1. **`master`**
2. **`tumapply`**
3. **`external_login`**

The `tumapply` realm is used in
the development environment, while the `external_login` realm is used in production. These two realms are functionally
equivalent but have different names depending on the environment. The `master` realm exists in both development and
production environments; however, it is only visible to and managed by AET Admins in production.

In production, the `external_login` realm is persistent, and structural changes can only be performed by authorized AET
Admins.

---

# Clients

The following clients are used across environments with specific purposes:

- **`tumapply-client`**: Used by the client for direct authentication with Keycloak, supporting login methods such as
  Google and TUM login.
- **`tumapply-server-client`**: Used by the server when users log in via email and password. The server exchanges user
  credentials for a token with Keycloak using this client.
- **`tumapply-otp-admin`**: Used for OTP-based logins. The server sends the OTP to Keycloak and impersonates the user
  using this client ID.
- **System clients**: These include `account`, `account-console`, `admin-cli`, `broker`, `realm-management`,
  `security-admin-console`, and others. They serve infrastructure and internal Keycloak functions necessary for managing
  accounts, administration, and security.

## Differences Between Development and Production

- Development includes the `master` and `tumapply` realms, while production only includes the `external_login` realm.
- Configuration and clients are nearly identical across environments to ensure consistency.
