-- Gemelo Digital: PostgreSQL init script
-- Creates 4 databases (one per microservice)

CREATE DATABASE purchases_db;
CREATE DATABASE energy_db;
CREATE DATABASE food_db;
CREATE DATABASE gamification_db;
CREATE DATABASE finances_db;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE purchases_db TO gemelo;
GRANT ALL PRIVILEGES ON DATABASE energy_db TO gemelo;
GRANT ALL PRIVILEGES ON DATABASE food_db TO gemelo;
GRANT ALL PRIVILEGES ON DATABASE gamification_db TO gemelo;
GRANT ALL PRIVILEGES ON DATABASE finances_db TO gemelo;
