# 🔐 Keycloak Overview

Keycloak is an open-source identity and access management solution that serves as the **central identity provider** for
the TUMApply project. It handles user authentication, identity federation, and token issuance, ensuring secure
communication between the client, server, and external identity providers. Keycloak is used in both development and
production environments to manage authentication flows and provide seamless integration with various identity sources.
Detailed documentation on setup, impersonation, and maintenance is available in the linked `.md` files below.

TUMApply uses **Keycloak** as the central **identity provider and authentication system**, including support for
identity federation.  
Keycloak handles user authentication, login, token issuance, and session management via **OpenID Connect (OIDC)**.  
Fine-grained authorization, such as research-group access, user roles, and data ownership, is enforced within the
**TUMApply server**.  
User roles are assigned and managed within the TUMApply database upon first login.

---

## Role Separation

| Responsibility                       | Location         |
| ------------------------------------ | ---------------- |
| Authentication (login, tokens)       | Keycloak         |
| Authorization (roles, access checks) | Spring Boot / DB |
| User creation on first login         | TUMApply server  |
| Role storage                         | Database         |

---

## Related Files

- [`authentication-flow.md`](../authentication-flow.md) – Login flow and token handling
- [`authorization.md`](../authorization.md) – Application roles and access checks
- [`development/setup.md`](./development/setup.md) – Development Keycloak Setup
- [`production/setup.md`](./production/setup.md) – Production Keycloak Setup
- [`keycloak-realm-and-clients.md`](./keycloak-realm-and-clients.md) – Realm and client setup
- [`keycloak-impersonation.md`](./keycloak-impersonation.md) – Impersonation configuration

---

## External References

- [Official Keycloak Documentation](https://www.keycloak.org/documentation)
- [Keycloak Server Administration Guide](https://www.keycloak.org/docs/latest/server_admin/)
- [Keycloak API Documentation](https://www.keycloak.org/docs-api/latest/rest-api/index.html)
- [Keycloak Release Notes](https://www.keycloak.org/docs/latest/release_notes/)
