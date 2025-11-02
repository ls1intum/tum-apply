# Local Keycloak Setup

This document provides instructions for running and managing the Keycloak instance used for local development in
TUMApply.

---

## 🔧 Start Keycloak locally via Docker

To start the Keycloak container with the required realm configuration, run this command from the project root:

**⚠️ Warning: This command must be executed from the project root directory. Running it from inside `docs-github/...`
will fail.**

```bash
docker compose -f src/main/docker/keycloak.yml up --build
```

---

## 📁 Realm Import

Keycloak imports the realm configuration from `src/main/docker/realm-config/tumapply-realm.json` during startup.

**Note:** Any manual changes made in the Keycloak Admin UI are **not persisted** after container restarts unless
explicitly exported back to the realm JSON file.

---

## 👥 Test Users (Local Development Only)

The following test users are included for local development and testing purposes:

| Username     | Password    | Role / Description              |
|--------------|-------------|---------------------------------|
| `admin1`     | `admin`     | System administrator test user  |
| `professor1` | `professor` | Professor test user             |
| `professor2` | `professor` | Second professor test user      |
| `applicant1` | `applicant` | Applicant test user             |
| `applicant2` | `applicant` | Applicant test user (external)  |
| `applicant3` | `applicant` | Applicant test user (long name) |

The realm also contains the service account user `service-account-tumapply-otp-admin`, which is used by the OTP admin
client and should not be used for normal login/testing.

---

## 🔄 Reset Keycloak

To reset the Keycloak volume and re-import the realm configuration:

```bash
docker compose down -v && docker compose up
```

---

## ⚠️ Production Notes

- For production, a separate Keycloak instance is
  used: [https://keycloak.aet.cit.tum.de/](https://keycloak.aet.cit.tum.de/)
- The production instance is managed by the AET admins.
- Do **not** use `start-dev` or `KC_DB=dev-file` settings in production environments.
- Always follow [Keycloak's official production configuration guide](https://www.keycloak.org/server/configuration).

---

## 📚 Additional Documentation

For more detailed information on Keycloak setup and management, please refer to the following files:

- `keycloak-overview.md`
- `keycloak-configuration.md`
- `keycloak-users.md`
