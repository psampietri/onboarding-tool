#!/bin/bash

# Script to install npm dependencies for all services and the frontend

echo "Installing all project dependencies..."

# Get the absolute path of the script's directory
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

# List of all package.json locations
PROJECTS=(
    "backend/api-gateway"
    "backend/services/user-service"
    "backend/services/template-service"
    "backend/services/onboarding-service"
    "backend/services/analytics-service"
    "backend/services/integration-service"
    "frontend"
)

for project in "${PROJECTS[@]}"; do
    PROJECT_PATH="$SCRIPT_DIR/$project"
    echo ""
    echo "--- Installing dependencies for $project ---"
    cd "$PROJECT_PATH" || exit
    npm install
    cd "$SCRIPT_DIR" || exit
done

echo ""
echo "All dependencies installed successfully!"
