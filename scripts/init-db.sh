#!/bin/bash

# Database initialization script
# This script creates the database schema

echo "Initializing database..."

# Wait for PostgreSQL to be ready
until PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -c '\q' 2>/dev/null; do
  echo "PostgreSQL is unavailable - sleeping"
  sleep 1
done

echo "PostgreSQL is up - executing schema"

# Run schema SQL
PGPASSWORD=$DB_PASSWORD psql -h "$DB_HOST" -U "$DB_USER" -d "$DB_NAME" -f /app/config/db-schema.sql

echo "Database initialization completed!"

