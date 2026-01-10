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
    echo "${value:-$default}"
}

# Function to read passwords (without echo)
read_password() {
    local prompt="$1"
    local default="$2"
    local value
    read -s -p "$prompt [$default]: " value
    echo ""  # New line after silent input
    echo "${value:-$default}"
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
    
    # PostgreSQL Root-Passwort (für Admin-Operationen)
    echo "ℹ️  PostgreSQL 'postgres' User Passwort wird benoetigt"
    POSTGRES_PASS=$(read_password "PostgreSQL 'postgres' User Passwort" "postgres")
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
else
    # Ask for postgres password even when using existing .env
    echo "ℹ️  PostgreSQL 'postgres' User Passwort wird benoetigt fuer Datenbank-Setup"
    POSTGRES_PASS=$(read_password "PostgreSQL 'postgres' User Passwort" "postgres")
    echo ""
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

# Set postgres password for psql commands
export PGPASSWORD="$POSTGRES_PASS"

# Check if database exists
DB_EXISTS=$(psql -U postgres -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME'" 2>/dev/null || echo "")

if [ "$DB_EXISTS" = "1" ]; then
    echo "ℹ️  Datenbank '$DB_NAME' existiert bereits - verwende bestehende Daten"
    
    # Check if user exists
    USER_EXISTS=$(psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "")
    
    if [ "$USER_EXISTS" = "1" ]; then
        # User exists - only update password
        psql -U postgres -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
        echo "✅ Passwort für User '$DB_USER' aktualisiert"
    else
        # Create user
        psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
        echo "✅ User '$DB_USER' erstellt"
    fi
    
    # Grant privileges (just to be sure)
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;" 2>/dev/null || true
    psql -U postgres -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;" 2>/dev/null || true
    echo "✅ Privileges aktualisiert"
    
else
    echo "ℹ️  Datenbank '$DB_NAME' existiert nicht - erstelle neue Datenbank"
    
    # Check if user exists
    USER_EXISTS=$(psql -U postgres -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" 2>/dev/null || echo "")
    
    if [ "$USER_EXISTS" != "1" ]; then
        psql -U postgres -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASS';"
        echo "✅ User '$DB_USER' erstellt"
    else
        psql -U postgres -c "ALTER USER $DB_USER WITH PASSWORD '$DB_PASS';"
        echo "✅ Passwort für existierenden User '$DB_USER' aktualisiert"
    fi
    
    # Create database
    psql -U postgres -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
    echo "✅ Datenbank '$DB_NAME' erstellt"
    
    # Grant privileges
    psql -U postgres -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    psql -U postgres -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO $DB_USER;"
    echo "✅ Privileges gewährt"
fi

unset PGPASSWORD

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
