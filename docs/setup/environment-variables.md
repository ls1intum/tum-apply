# Environment Configuration Guide

## What is a `.env.local` file?

Local environment config file used for development.

- Contains private keys, secrets, or other variables specific to your local machine.
- Never committed or deployed – listed in [.gitignore](../../.gitignore) by default.
- You can find an example in [.env.example](../../.env.example) under the root of
  the project.

---

## Where does it go?

Located in the root of the project (next to `.editorconfig`, `.gitattributes`, `package.json`, `jest.conf.js`, ...).  
**File name:** `.env.local`

---

## What goes inside?

All variables relevant to the client and server build (e.g. Keycloak config, feature toggles).

**Format:**

```env
SERVER_URL=https://localhost:8080/api
KEYCLOAK_REALM=test-realm
KEYCLOAK_CLIENT_ID=web-client
```

---

## How is it used?

The Angular build process automatically injects these variables at build time.

Accessed in the code via:

**Java:**

```java
@Value("${KEYCLOAK_URL:http://localhost:9080}")
```

**JavaScript (dotenv):**

```ts
process.env.KEYCLOAK_URL;
```

---

## How to add a new variable?

1. Add the new variable to your `.env.local`.
2. Add the same variable with an **example value** (do not expose secrets) to [.env.example](../../.env.example) and
   explain what this
   variable is for.
3. If relevant for testing or deployment, also add it to GitHub (see **Adding a new variable (test/prod)**).
4. Use it in code (see **How it is used**).
5. Adapt workflows and deployments if needed.

---

## 🚀 Test & Production Environments (GitHub Actions)

### Where are test/prod variables defined?

In **GitHub Repository Settings** → **Environments** → `Test-server` / `Production`

There are two different kinds of variables:

- **Environment secrets**: For client secrets, keys, passwords, etc.
- **Environment variables**: All non-security relevant values

---

### How are they used?

During GitHub Action runs:

- All environment variables and secrets are injected dynamically into the build process.
- No secrets are ever hardcoded or stored in the code.

---

### Adding a new variable (test/prod)

1. Define the variable in GitHub Secrets/Variables.
2. Ensure it’s included in the deploy/build workflow.

---

## 🚫 Important Notes

- `.env.local` **must never be committed or deployed** – it may contain sensitive secrets.
- Production and Test secrets **must only live in GitHub Secrets**, not in code or artifacts.
- A shared [.env.example](../../.env.example) file exists in the repository and documents all required variables.
  - **Keep this file always up to date** so that users can use it as a template.
  - **Explain all variables** you change or add.
