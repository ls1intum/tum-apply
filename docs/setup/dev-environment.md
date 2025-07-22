# Local Development Environment

This document explains how to set up and run the TUMApply project locally for development.

---

## Prerequisites

Make sure you have the following installed:

- **Java 21**
- **Node.js v20+** and **npm** (installed via `./npmw` wrapper)
- **Docker** and **Docker Compose**
- **MySQL CLI**
- **Git**

---

## Environment Variables

Environment-specific values are stored in a `.env.local` file in the root of the project.

- Copy `.env.example` to `.env.local`:
  ```bash
  cp .env.example .env.local
  ```
- Fill in the required secrets or configuration values. Please ask your team lead for the necessary secrets if needed.
- Never commit your `.env.local` file – it may contain sensitive information.

For details on each variable and how environments are handled in development, test, and production, refer to
the [Environment Configuration Guide](environment-variables.md).

---

## Initial Setup

Install npm dependencies:

```bash
npm install
```

Start the server and client development servers in two separate terminals:

```bash
# Terminal 1 - Start Spring Boot without client build
./gradlew -x webapp

# Terminal 2 - Start Angular dev server
npm run start
```

---

## Managing Dependencies

Use `npm` for consistent dependency management:

- Install a new package:

  ```bash
  npm install --save --save-exact <package-name>
  ```

- Install TypeScript types:

  ```bash
  npm install --save-dev --save-exact @types/<package>
  ```

- Update dependencies:
  ```bash
  npm run update
  ```

---

## Angular CLI Usage

You can use Angular CLI commands to generate new code:

```bash
ng generate component my-component
```

This will create and update the relevant files inside `src/main/webapp/app/:

```
create src/main/webapp/app/my-component/my-component.component.html
create src/main/webapp/app/my-component/my-component.component.ts
update src/main/webapp/app/app.config.ts
```

---

## Webpack and Runtime Assets

If you install libraries with JS or CSS files (e.g., Leaflet), make sure to import them:

```ts
// src/main/webapp/app/app.config.ts
import 'leaflet/dist/leaflet.js';

// src/main/webapp/content/scss/vendor.scss
@import
'leaflet/dist/leaflet.css';
```

---

## Developer Tools

We use:

- **Angular CLI** for client tooling
- **Webpack** for bundling
- **npm scripts** for project tasks (`./npmw run`)
- **Browser Auto-Refresh** with hot-reload enabled by default

---

## Notes

- Only run `npm install` when dependencies change
- You can run `npm help` to get more info about available commands
