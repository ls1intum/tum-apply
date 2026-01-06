# Local Development Environment

This document explains how to set up and run the TUMApply project locally for development.

---

## Prerequisites

Make sure you have the following installed:

- **Java 25**
- **Node.js v20+** and **npm** (installed via `./npmw` wrapper)
- **Docker** and **Docker Compose**
- **MySQL CLI**
- **Git**
- **Spring AI compatible instance** (for example via LM Studio, see below)

---

## Initial Setup

Install npm dependencies:

```bash
npm install
```

Make sure Docker Desktop is running, then execute:

```bash
docker compose -f docker/local-setup/services.yml up -d
```

Start the server and client development servers in two separate terminals:

```bash
# Terminal 1 - Start Spring Boot without client build
./gradlew -x webapp

# Terminal 2 - Start Angular dev server
npm run start
```

---

## Spring AI

To be able to run the server you need a working Spring AI instance. You can either use a remote instance or set up a
local one using LM Studio. Follow the instructions in the [Spring AI Setup Guide](./spring-ai.md) to get started.

---

## Angular CLI Usage

You can use Angular CLI commands to generate new code:

```bash
ng generate component my-component
```

This will create and update the relevant files inside `src/main/webapp/app/`:

```
create src/main/webapp/app/my-component/my-component.component.html
create src/main/webapp/app/my-component/my-component.component.ts
update src/main/webapp/app/app.config.ts
```

---

## Developer Tools

We use:

- **Angular CLI** for client tooling
- **npm scripts** for project tasks (`./npmw run`)
- **Browser Auto-Refresh** with hot-reload enabled by default

---

## Notes

- Only run `npm install` when dependencies change
- You can run `npm help` to get more info about available commands
- If you encounter unexpected build issues, try running `./gradlew clean build` to reset the environment.
