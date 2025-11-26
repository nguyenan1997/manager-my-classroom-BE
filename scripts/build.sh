#!/bin/bash

# Build script for the application

set -e

echo "Building PV LMS Backend..."

# Check if .env exists
if [ ! -f .env ]; then
  echo "Warning: .env file not found. Creating from .env.example..."
  cp .env.example .env
  echo "Please update .env with your configuration"
fi

# Install dependencies
echo "Installing dependencies..."
npm install

# Build Docker image (optional)
if [ "$1" == "--docker" ]; then
  echo "Building Docker image..."
  docker build -t pv-lms-backend:latest .
  echo "Docker image built successfully!"
fi

echo "Build completed!"

