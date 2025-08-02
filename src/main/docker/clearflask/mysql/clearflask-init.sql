CREATE DATABASE IF NOT EXISTS clearflask CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER IF NOT EXISTS 'clearflask'@'%' IDENTIFIED BY 'clearflask';
GRANT ALL PRIVILEGES ON clearflask.* TO 'clearflask'@'%';
FLUSH PRIVILEGES;
