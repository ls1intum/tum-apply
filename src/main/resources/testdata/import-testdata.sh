#!/bin/bash

###############################################################################
# 🧪 TumApply Testdata Import Script
#
# This script imports all test data SQL files located in:
#   src/main/resources/testdata/ and its subfolders.
#
# ⚙️ Usage:
#   1. Place all your test SQL files inside src/main/resources/testdata/
#      → Example: src/main/resources/testdata/usermanagement/01_users.sql
#
#   2. Run this script: import-testdata.sh
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
###############################################################################

# Configuration variables
DB_NAME="tumapply"
DB_USER="root"
DB_PASS=""
DB_HOST="127.0.0.1"
DB_PORT="3306"

# Path to testdata SQL files
SQL_PATH="src/main/resources/testdata"

echo "🚀 Importing SQL test data into MySQL database '$DB_NAME'..."

# Check for mysql CLI
if ! command -v mysql &> /dev/null
then
  echo "❌ mysql CLI not found. Please install MySQL client."
  exit 1
fi

# Find and run only SQL files under testdata folder (and subfolders)
find "$SQL_PATH" -type f -name "*.sql" | sort | while read file; do
  echo "📄 Running: $file"
  mysql -h "$DB_HOST" -P "$DB_PORT" -u "$DB_USER" --password="$DB_PASS" "$DB_NAME" < "$file"

  if [ $? -ne 0 ]; then
    echo "❌ Error while importing $file"
    exit 1
  fi
done

echo "✅ All test data imported successfully."
