#!/bin/bash

echo "🔄 Rebuilding Net Worth Tracker with latest changes..."

# Stop existing containers
echo "🛑 Stopping containers..."
docker compose down

# Rebuild images (no cache)
echo "📦 Rebuilding images..."
docker compose build --no-cache

# Start containers
echo "🚀 Starting containers..."
docker compose up -d

echo ""
echo "✅ App rebuilt and started!"
echo "📊 Dashboard: http://localhost:3000"
echo "🔧 API Docs: http://localhost:8000/docs"
