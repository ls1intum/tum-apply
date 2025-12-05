#!/bin/bash
export MSYS_NO_PATHCONV=1

###############################################################################
# 🧪 TumApply Test Data Import Script
#
# This script imports all SQL files located in:
#   src/main/resources/testdata/ and its subdirectories, sorted alphabetically.
#
# ✅ Platform-independent:
#   - Works on macOS, Linux, and Windows (via Git Bash).
#
# ⚙️ Usage:
#   1. Add your test SQL files inside src/main/resources/testdata/
#      → Example: src/main/resources/testdata/usermanagement/01_users.sql
#
#   2. Run this script via terminal or Git Bash:
#      ./import-testdata.sh
#
# 🔐 DB Connection:
#   - Host:     127.0.0.1
#   - Port:     3306
#   - Username: root
#   - Password: (empty)
#   - Database: tumapply
#
# 🐳 Assumes that you are using the local Docker MySQL container
#     from your docker-compose file under src/main/docker/mysql.yml
#
# ❗ Ensure that:
#   - MySQL is running (check with `docker ps`)
#   - The database "tumapply" exists
#   - mysql CLI is installed and the command is available in your PATH (test via "mysql --version")
###############################################################################

# Configuration variables
DB_NAME="tumapply"
DB_USER="root"
DB_PASS=""
DB_HOST="127.0.0.1"
DB_PORT="3306"

# Path to testdata SQL files
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SQL_PATH="$SCRIPT_DIR"

echo "Importing SQL test data into MySQL database '$DB_NAME'..."
echo "Searching for SQL files in: $SQL_PATH"

# Check for mysql CLI
if ! command -v mysql &> /dev/null
then
  echo "mysql CLI not found. Please install MySQL client."
  exit 1
fi

# Ask user if they want to reset the DB (run drop script)
while true; do
  echo "Do you want to reset the database (run 00_drop_all_tables.sql)? (y/n)"
  read -p "Do you want to reset the database? (y/n): " RESET_DB
  if [[ "$RESET_DB" == "y" || "$RESET_DB" == "Y" ]]; then
    DROP_FILE="$SQL_PATH/00_drop_all_tables.sql"
    if [ -f "$DROP_FILE" ]; then
      echo "Resetting database..."
      mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" --password="$DB_PASS" "$DB_NAME" < "$DROP_FILE"
    else
      echo "Reset script not found at: $DROP_FILE"
      exit 1
    fi
    break
  elif [[ "$RESET_DB" == "n" || "$RESET_DB" == "N" ]]; then
    echo "Skipping database reset."
    break
  else
    echo "Invalid input. Please enter y or n."
  fi
done

# Find and run only SQL files under testdata folder (and subfolders)
# Find and run all SQL files except the reset script
find "$SQL_PATH" -type f -name "*.sql" ! -name "00_drop_all_tables.sql" | sort | while IFS= read -r file; do
  echo "Attempting to run: $file"
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" --password="$DB_PASS" "$DB_NAME" < "$file"

  if [ ! -s "$file" ]; then
    echo "WARNING: File is empty - $file"
  fi

  if [ $? -ne 0 ]; then
    echo "ERROR while importing $file"
    exit 1
  fi
done

echo "Success: All test data imported successfully."
