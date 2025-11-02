# Keycloak Development Setup

This document provides instructions for running and managing the Keycloak instance used for local development in
TUMApply only. For production Keycloak setup and configuration, please refer to the separate documentation available in
`docs-github/auth/keycloak/production`.

---

## Keycloak Docker Container

**⚠️ Warning: All commands below must be executed from the project root directory. Running them from inside
`docs-github/...` will fail.**

### ▶️ Start Keycloak

To start the Keycloak docker container with the required realm configuration, run this command from the project root:

The first startup may take up to a minute as Keycloak initializes and imports the realm configuration.

```bash
docker compose -f src/main/docker/keycloak.yml up --build
```

### Verify Setup

After running the above command, two URLs will be available:

| Service       | URL                                     | Description             | Username | Password |
| ------------- | --------------------------------------- | ----------------------- | -------- | -------- |
| Admin Console | <http://localhost:9080/admin>           | Keycloak Management UI  | admin    | admin    |
| Realm         | <http://localhost:9080/realms/tumapply> | TUMApply realm endpoint |          |          |

- Open the Admin Console at `http://localhost:9080/admin` and log in with username `admin` and password `admin`.
- Navigate to the TUMApply realm and verify that the test users listed below are present.
- Confirm that the realm configuration is loaded and the server is responsive.

### View Keycloak Logs

To view the Keycloak logs run the following command:

```bash
docker logs -f tumapply-keycloak-1
```

### 🛑 Stop Keycloak

To stop the Keycloak docker container run the following command:

**⚠️ Warning: This command will remove all data.**

```bash
docker compose -f src/main/docker/keycloak.yml down
```

### 🔄 Reset Keycloak

To reset the Keycloak volume and re-import the realm configuration:

```bash
docker compose -f src/main/docker/keycloak.yml down && docker compose -f src/main/docker/keycloak.yml up --build
```

---

## 📁 Realm Import

Keycloak imports the realm configuration from `src/main/docker/realm-config/tumapply-realm.json` during startup.

**Note:** Any manual changes made in the Keycloak Admin UI are **not persisted** after container restarts unless
explicitly exported back to the realm JSON file.

To apply changes made to the realm configuration file (`tumapply-realm.json`), restart Keycloak with:

```bash
docker compose -f src/main/docker/keycloak.yml down
docker compose -f src/main/docker/keycloak.yml up --build
```

---

## 👥 Test Users

The following test users are included for local development and testing purposes:

| Username     | Password    | Role / Description              |
| ------------ | ----------- | ------------------------------- |
| `admin1`     | `admin`     | System administrator test user  |
| `professor1` | `professor` | Professor test user             |
| `professor2` | `professor` | Second professor test user      |
| `applicant1` | `applicant` | Applicant test user             |
| `applicant2` | `applicant` | Applicant test user (external)  |
| `applicant3` | `applicant` | Applicant test user (long name) |

The realm also contains the service account users `service-account-realm-management`and
`service-account-tumapply-otp-admin`, which are used by the server and should not be used for normal login/testing.

---

## ⚠️ Common Issues

- **Port 9080 already in use:** Change the port in `src/main/docker/keycloak.yml` or stop the other container using it.
- **"Invalid configuration" error:** Check the Keycloak logs and JSON syntax in
  `src/main/docker/realm-config/tumapply-realm.json`.
- **Realm not visible in Admin Console:** Verify the realm file path in `src/main/docker/keycloak.yml` is correct.
- **Login fails:** Double-check user credentials against the test users table above.

---

## ℹ️ Important Notes

This local Keycloak environment uses an embedded **in-memory database** and is intended for local development only. All
Keycloak data, including users, sessions, and tokens, are temporary and deleted when the container is stopped or
removed.

It should **not** be used for persistent or shared data.

For production Keycloak setup and management, please refer to the other Keycloak documentation files in
`docs-github/auth/keycloak/production`.
