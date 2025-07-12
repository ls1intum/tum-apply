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

## Initial Setup

Install npm dependencies via the wrapper:

```bash
./npmw install
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

Use `./npmw` for consistent dependency management:

- Install a new package:

  ```bash
  ./npmw install --save --save-exact <package-name>
  ```

- Install TypeScript types:

  ```bash
  ./npmw install --save-dev --save-exact @types/<package>
  ```

- Update dependencies:
  ```bash
  ./npmw update
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

- Only run `./npmw install` when dependencies change
- You can run `./npmw help` to get more info about available commands
