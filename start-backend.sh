#!/bin/bash

# Script to start all backend services in separate terminal windows

echo "Starting all backend services..."

# Get the absolute path of the script's directory
SCRIPT_DIR=$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" &> /dev/null && pwd)

# List of services
SERVICES=("api-gateway" "services/user-service" "services/template-service" "services/onboarding-service" "services/analytics-service")

for service in "${SERVICES[@]}"; do
    SERVICE_PATH="$SCRIPT_DIR/backend/$service"
    SERVICE_NAME=$(basename "$SERVICE_PATH")
    echo "Starting $SERVICE_NAME..."

    # Use a 'here document' to pass the command to osascript, which is more robust
    osascript <<EOF
tell application "Terminal"
    do script "cd '$SERVICE_PATH' && npm start"
end tell
EOF
done

echo "All backend services are starting in new terminal windows."
