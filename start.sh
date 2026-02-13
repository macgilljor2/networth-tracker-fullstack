#!/bin/bash

echo "🚀 Starting Net Worth Tracker..."

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker Desktop first."
    exit 1
fi

# Build and start containers
echo "📦 Building containers (this may take a few minutes on first run)..."
docker compose up --build -d

echo ""
echo "✅ App is starting..."
echo "📊 Dashboard: http://localhost:3000"
echo "🔧 API Docs: http://localhost:8000/docs"
echo ""
echo "To view logs: ./logs.sh"
echo "To stop: ./stop.sh"
