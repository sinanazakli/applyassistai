#!/bin/bash

# ApplyAssistAI Start Script for Ubuntu/WSL
# Starts both backend and frontend servers

echo "🚀 ApplyAssistAI wird gestartet..."
echo ""

# Start PostgreSQL if not running
echo "📦 Pruefe PostgreSQL..."
if ! sudo service postgresql status > /dev/null 2>&1; then
    echo "Starte PostgreSQL..."
    sudo service postgresql start
fi
echo "✅ PostgreSQL laeuft"

echo ""
echo "🎯 Starte Backend und Frontend..."
echo ""
echo "Backend laeuft auf: http://localhost:8000"
echo "Frontend laeuft auf: http://localhost:5173"
echo ""
echo "Druecke Strg+C um beide Server zu stoppen"
echo ""

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "🛑 Stoppe Server..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    echo "✅ Server gestoppt"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Start backend
cd backend
source venv/bin/activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000 &
BACKEND_PID=$!
cd ..

# Start frontend
cd frontend
npm run dev &
FRONTEND_PID=$!
cd ..

# Wait for both processes
wait
