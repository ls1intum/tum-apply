# 🛠️ Keycloak Setup for TUMApply

This document describes how to set up and manage the Keycloak instance for **TUMApply**.

---

## 🔧 Start Keycloak via Docker

To start the Keycloak container with the required realm:

```bash
docker compose -f src/main/docker/keycloak.yml up --build
```

- URL: [http://localhost:9080/](http://localhost:9080/)
- Admin UI: [http://localhost:9080/admin](http://localhost:9080/admin)
- Admin credentials:  
  Username: `admin`  
  Password: `admin`

---

## 📁 Realm Import

Keycloak automatically imports the realm configuration from `keycloak/realm-config/tumapply-realm.json`.

This includes:

- Realm: `tumapply`
- Client: `tumapply-client`
- Test users with roles

⚠️ Manual changes in the Keycloak UI will be lost after restarting unless exported back to this file.

---

## 👥 Test Users

| Username     | Password    | Role        |
| ------------ | ----------- | ----------- |
| `admin1`     | `admin`     | `ADMIN`     |
| `professor1` | `professor` | `PROFESSOR` |
| `applicant1` | `applicant` | `APPLICANT` |

---

## 🔄 Reset Keycloak

To reset the Keycloak volume and re-import the realm:

```bash
docker compose down -v && docker compose up
```

---

## ⚠️ Production Notes

- We use a different deployed Keycloak instance in production. (https://keycloak.aet.cit.tum.de/)
- Do **not** use `start-dev` or `KC_DB=dev-file` in production.
- Always follow [Keycloak's production guide](https://www.keycloak.org/server/configuration).
