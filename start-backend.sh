#!/bin/bash

# Script to start all backend services in separate terminal windows

echo "Starting all backend services..."

# Get the absolute path of the script's directory
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

# List of services
SERVICES=("api-gateway" "services/user-service" "services/template-service" "services/onboarding-service" "services/analytics-service" "services/integration-service" "services/notification-service")

# Find the absolute path to npm
NPM_PATH=$(which npm)

if [ -z "$NPM_PATH" ]; then
  echo "Error: npm not found in PATH.  Please ensure Node.js and npm are installed."
  exit 1
fi

for service in "${SERVICES[@]}"; do
  SERVICE_PATH="$SCRIPT_DIR/backend/$service"
  SERVICE_NAME=$(basename "$SERVICE_PATH")
  echo "Starting $SERVICE_NAME..."

  # Use a 'here document' to pass the command to osascript, which is more robust
  osascript <<EOF
tell application "Terminal"
    activate
    do script "cd '$SERVICE_PATH' && $NPM_PATH install && $NPM_PATH start"
end tell
EOF
done

echo "All backend services are starting in new terminal windows."