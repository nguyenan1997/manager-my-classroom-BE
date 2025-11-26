#!/bin/bash

# Run script for the application

set -e

echo "Starting PV LMS Backend..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "Error: .env file not found. Please create it from .env.example"
  exit 1
fi

# Check if running with Docker
if [ "$1" == "--docker" ]; then
  echo "Starting with Docker Compose..."
  docker-compose up -d
  echo "Services started! Backend is available at http://localhost:3000"
  echo "PostgreSQL is available at localhost:5432"
  echo "Use 'docker-compose logs -f' to view logs"
  exit 0
fi

# Run locally
echo "Starting locally..."
npm start

