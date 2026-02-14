#!/bin/bash
LOG_FILE="/tmp/networth-tracker.log"
cd /Users/jmacgillivray/Development/networth_tracker_app

# Add Docker to PATH
export PATH="/usr/local/bin:/opt/homebrew/bin:$PATH"

echo "Starting at $(date)" >> "$LOG_FILE"

# Start containers in background
echo "Starting docker containers..." >> "$LOG_FILE"
docker compose start >> "$LOG_FILE" 2>&1 &
DOCKER_PID=$!

# Open loading page immediately
echo "Opening loading page..." >> "$LOG_FILE"
osascript -e 'tell application "Safari" to make new document with properties {URL:"file:///Users/jmacgillivray/Development/networth_tracker_app/loading.html"}' >> "$LOG_FILE" 2>&1

# Poll until frontend is ready
echo "Waiting for frontend..." >> "$LOG_FILE"
until curl -s http://localhost:3000 >> "$LOG_FILE" 2>&1; do
    sleep 1
done

# Navigate to real app
echo "Frontend ready, navigating..." >> "$LOG_FILE"
osascript -e 'tell application "Safari" to set URL of front document to "http://localhost:3000"' >> "$LOG_FILE" 2>&1

echo "Done at $(date)" >> "$LOG_FILE"
