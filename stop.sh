#!/bin/bash

# Stop all servers

echo "🛑 Stoppe alle Server..."

# Stop Node processes (Frontend)
echo "Stoppe Frontend (Node)..."
pkill -f "vite" || true
pkill -f "npm run dev" || true

# Stop Python processes (Backend)
echo "Stoppe Backend (Python)..."
pkill -f "uvicorn" || true

# Optionally stop PostgreSQL
read -p "PostgreSQL auch stoppen? (j/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Jj]$ ]]; then
    sudo service postgresql stop
    echo "PostgreSQL gestoppt"
fi

echo "✅ Alle Server gestoppt"
