#!/bin/bash

# Start only the backend server

echo "🐍 Starte Backend..."

# Start PostgreSQL if not running
if ! sudo service postgresql status > /dev/null 2>&1; then
    echo "Starte PostgreSQL..."
    sudo service postgresql start
fi

cd backend
source venv/bin/activate

echo ""
echo "Backend laeuft auf: http://localhost:8000"
echo "API Docs: http://localhost:8000/docs"
echo ""

uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
