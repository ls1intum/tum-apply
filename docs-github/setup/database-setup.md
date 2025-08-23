# 🛠️ Database Setup & Test Data

This document describes how to set up the local database and import test data for TUMApply.
This project uses MySQL as a relational database. Follow the steps below to get started with the local setup:

---

## Requirements

- **Docker & Docker Compose**
  - [macOS Guide](https://docs.docker.com/desktop/install/mac-install/)
  - [Windows Guide](https://docs.docker.com/desktop/install/windows-install/)
- **MySQL Client** (`mysql` CLI) installed and available in `PATH

---

## Step 0: Install MySQL Client

Ensure you have the MySQL CLI installed on your system. This is required to run database commands and import data.

- **macOS**: Install MySQL CLI with Homebrew:

  ```bash
  brew install mysql-client
  echo 'export PATH="/opt/homebrew/opt/mysql-client/bin:$PATH"' >> ~/.zprofile
  source ~/.zprofile
  ```

- **Linux**: Install via package manager:

  ```bash
  sudo apt install mysql-client
  ```

- **Windows**:
  - Install via MySQL Installer
  - Use **Git Bash** to run `.sh` scripts
  - Ensure the MySQL `bin` directory is in your `PATH`

---

## Step 1: Start MySQL via Docker

```bash
docker compose -f src/main/docker/mysql.yml up -d
```

This launches a local MySQL instance with the database `tumapply`.

---

## Step 2: Apply Liquibase Migrations

```bash
./gradlew liquibaseUpdate
```

> If you encounter errors, ensure the MySQL container is running and reachable.

---

## Step 3: Import Example/Test Data

This script automatically imports all SQL files from the `src/main/resources/testdata/` folder, sorted alphabetically.

```bash
bash ./src/main/resources/testdata/import-testdata.sh
```

**Platform Notes:**

- **macOS**: Requires MySQL CLI to be installed via Homebrew (`brew install mysql-client`) and
  available in your `PATH`.
- **Linux**: Requires `mysql` CLI to be installed (`sudo apt install mysql-client` or equivalent).
- **Windows**: Use **Git Bash** to run this script. Make sure the MySQL CLI is installed (via MySQL Installer) and the
  `bin` folder is added to your `PATH`.

---

## Modifying the Schema

- Update Liquibase changelogs in `config/liquibase/changelog/`
- Add your file to `master.xml`
- Re-run with:

```bash
./gradlew liquibaseUpdate
```

---

## Troubleshooting

- ❌ `mysql CLI not found`: Ensure it is installed and on your system `PATH`
- ❌ `Public Key Retrieval is not allowed`: Add `allowPublicKeyRetrieval=true` to the JDBC URL
- ❌ `Access denied`: Use user `root` with an empty password if not configured otherwise
