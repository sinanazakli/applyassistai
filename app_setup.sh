#!/bin/bash

# ApplyAssistAI Interactive Setup Script for Ubuntu/WSL
# This script provides an interactive setup with database configuration

set -e  # Exit on error

echo "🚀 ApplyAssistAI Interactive Setup wird gestartet..."
echo ""

# ===========================================
# Helper Functions
# ===========================================

# Function to read input with default value
read_with_default() {
    local prompt="$1"
    local default="$2"
    local value
    read -p "$prompt [$default]: " value
    printf "%s" "${value:-$default}"
}

# Function to read passwords (without echo)
read_password() {
    local prompt="$1"
    local default="$2"
    local value
    read -s -p "$prompt [$default]: " value
    echo ""  # New line after silent input for display
    printf "%s" "${value:-$default}"  # Use printf to avoid adding newline
}

# ===========================================
# System Checks and Installation
# ===========================================

# Update package list
echo "📦 Aktualisiere Paketliste..."
sudo apt-get update -qq

# Install PostgreSQL
echo ""
echo "🐘 Installiere PostgreSQL..."
if ! command -v psql &> /dev/null; then
    sudo apt-get install -y postgresql postgresql-contrib
    echo "✅ PostgreSQL installiert"
else
    echo "✅ PostgreSQL bereits installiert"
fi

# Start PostgreSQL service
echo ""
echo "Starte PostgreSQL Service..."
sudo service postgresql start
echo "✅ PostgreSQL Service gestartet"

# Install Python dependencies
echo ""
echo "🐍 Pruefe Python Installation..."
if ! command -v python3 &> /dev/null; then
    echo "Installiere Python3..."
    sudo apt-get install -y python3 python3-pip python3-venv
    echo "✅ Python3 installiert"
else
    echo "✅ Python3 bereits installiert"
fi

# Install Node.js
echo ""
echo "📦 Pruefe Node.js Installation..."
if ! command -v node &> /dev/null; then
    echo "Installiere Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
    echo "✅ Node.js installiert"
else
    echo "✅ Node.js bereits installiert"
fi

# ===========================================
# .env Configuration (FIRST!)
# ===========================================

ENV_FILE="backend/.env"
SKIP_DB_CONFIG=false

echo ""
echo "📝 Konfiguration"
echo "=========================================="

# Check if .env exists FIRST
if [ -f "$ENV_FILE" ]; then
    echo "⚠️  .env Datei existiert bereits!"
    read -p "Moechtest du sie ueberschreiben und neue Konfiguration eingeben? (j/N): " overwrite
    if [[ ! "$overwrite" =~ ^[jJ]$ ]]; then
        echo "✅ Behalte bestehende .env Konfiguration"
        echo "ℹ️  Lese Datenbank-Credentials aus bestehender .env..."
        
        # Parse DATABASE_URL from .env
        source "$ENV_FILE"
        
        # Extract credentials from DATABASE_URL
        # Format: postgresql://USER:PASS@HOST:PORT/DBNAME
        if [[ $DATABASE_URL =~ postgresql://([^:]+):([^@]+)@([^:]+):([^/]+)/(.+) ]]; then
            DB_USER="${BASH_REMATCH[1]}"
            DB_PASS="${BASH_REMATCH[2]}"
            DB_HOST="${BASH_REMATCH[3]}"
            DB_PORT="${BASH_REMATCH[4]}"
            DB_NAME="${BASH_REMATCH[5]}"
            
            echo "  Datenbank: $DB_NAME"
            echo "  User: $DB_USER"
            echo "  Host: $DB_HOST:$DB_PORT"
            
            SKIP_DB_CONFIG=true
        else
            echo "⚠️  Konnte DATABASE_URL nicht parsen. Bitte neu eingeben."
            SKIP_DB_CONFIG=false
        fi
    else
        echo "✅ .env wird ueberschrieben"
        SKIP_DB_CONFIG=false
    fi
fi

echo ""

# ===========================================
# Interactive Database Configuration
# ===========================================

if [ "$SKIP_DB_CONFIG" = false ]; then
    echo "📝 Datenbank-Konfiguration"
    echo "=========================================="
    echo "ℹ️  Hinweis: sudo wird dein System-Passwort abfragen um die Datenbank einzurichten"
    echo ""
    
    # Datenbank-Credentials abfragen
    DB_NAME=$(read_with_default "Datenbank-Name" "applyassistai")
    DB_USER=$(read_with_default "Datenbank-User" "applyassist")
    DB_PASS=$(read_password "Datenbank-Passwort" "applyassist")
    echo ""
    
    # OPENAI_API_KEY abfragen
    read -p "OpenAI API Key (kannst du spaeter in .env eintragen) [leer lassen]: " OPENAI_KEY
    echo ""
    
    # Create .env file
    echo "📝 Erstelle .env Datei..."
    cat > "$ENV_FILE" <<EOF
DATABASE_URL=postgresql://$DB_USER:$DB_PASS@localhost:5432/$DB_NAME
SECRET_KEY=your-secret-key-$(openssl rand -hex 32)
OPENAI_API_KEY=${OPENAI_KEY:-your-openai-api-key-here}
EOF
    echo "✅ .env Datei erstellt/aktualisiert"
fi

# ===========================================
# Backend Setup
# ===========================================

echo ""
echo "🐍 Backend Setup..."
cd backend

# Create virtual environment
if [ ! -f "venv/bin/activate" ]; then
    if [ -d "venv" ]; then
        echo "⚠️  Entferne ungueltige Virtual Environment..."
        rm -rf venv
    fi
    echo "Erstelle Python Virtual Environment..."
    python3 -m venv venv
    echo "✅ Virtual Environment erstellt"
else
    echo "ℹ️  Virtual Environment existiert bereits"
fi

# Activate virtual environment and install dependencies
echo "Installiere Python-Abhaengigkeiten..."
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt
echo "✅ Python-Abhaengigkeiten installiert"

# ===========================================
# Database Setup (NO DELETION!)
# ===========================================

echo ""
echo "🗄️  Richte Datenbank ein..."

# Create user if not exists (same approach as setup.sh)
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"

# Update password if user already exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_roles WHERE rolname = '$DB_USER'" | grep -q 1 && \
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"

# Create database if not exists
sudo -u postgres psql -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
    sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
# Grant schema privileges (needed for public schema)
sudo -u postgres psql -d $DB_NAME -c "GRANT ALL ON SCHEMA public TO $DB_USER;"

echo "✅ Datenbank und User bereit"

# ===========================================
# Alembic Migrations
# ===========================================

echo ""
echo "Fuehre Datenbank-Migrationen aus..."
if [ -f "alembic.ini" ] && [ -d "alembic/versions" ]; then
    if alembic upgrade head; then
        echo "✅ Datenbank-Migrationen abgeschlossen"
    else
        echo "⚠️  Alembic-Migrationen fehlgeschlagen"
        echo "    Das kann passieren wenn die Datenbank bereits existiert"
        echo "    Du kannst dies manuell beheben mit: cd backend && alembic upgrade head"
    fi
else
    echo "⚠️  Alembic nicht konfiguriert. Ueberspringe Migrationen."
fi

cd ..

# ===========================================
# Frontend Setup
# ===========================================

echo ""
echo "⚛️  Frontend Setup..."
cd frontend

# Install Node dependencies - continue even if backend had issues
echo "Installiere Node-Abhaengigkeiten..."
if npm install; then
    echo "✅ Node-Abhaengigkeiten installiert"
else
    echo "❌ Fehler beim Installieren der Node-Abhaengigkeiten"
    echo "   Versuche es manuell mit: cd frontend && npm install"
fi

cd ..

# ===========================================
# Finished
# ===========================================

echo ""
echo "=========================================="
echo "✨ Setup abgeschlossen!"
echo "=========================================="
echo ""
echo "Naechste Schritte:"
if [ "$SKIP_DB_CONFIG" = false ] && [ -z "$OPENAI_KEY" ]; then
    echo "1. Bearbeite backend/.env und fuege deinen OPENAI_API_KEY ein"
    echo "2. Fuehre ./start.sh aus, um die App zu starten"
else
    echo "1. Fuehre ./start.sh aus, um die App zu starten"
fi
echo ""
echo "URLs:"
echo "  Frontend: http://localhost:5173"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
