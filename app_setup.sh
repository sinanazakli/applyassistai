#!/bin/bash
# ApplyAssistAI Interactive Setup Script for Ubuntu/WSL
# Goals:
# - No hardcoded DB name/user/password
# - If backend/.env exists and user keeps it: reuse credentials, DO NOT delete DB
# - If user overwrites backend/.env: ask for new credentials, THEN (and only then) reset DB
# - Ensure Alembic migrations are applied deterministically (Alembic is the source of truth)
# - No Base.metadata.create_all(...) in app/main.py (must be removed/disabled separately)

set -euo pipefail

echo "🚀 ApplyAssistAI Interactive Setup wird gestartet..."
echo ""

# ===========================================
# Helper Functions
# ===========================================

read_with_default() {
  local prompt="$1"
  local default="$2"
  local value
  read -r -p "$prompt [$default]: " value
  printf "%s" "${value:-$default}"
}

read_password() {
  local prompt="$1"
  local default="$2"
  local value
  read -r -s -p "$prompt [$default]: " value
  echo ""
  printf "%s" "${value:-$default}"
}

die() {
  echo "❌ $1" >&2
  exit 1
}

require_cmd() {
  command -v "$1" >/dev/null 2>&1 || die "Command not found: $1"
}

# URL-encode ONLY the password part for a safe DATABASE_URL
# (keeps script self-contained; avoids python/perl dependency)
urlencode() {
  local s="$1"
  local out=""
  local i c hex
  for ((i=0; i<${#s}; i++)); do
    c="${s:i:1}"
    case "$c" in
      [a-zA-Z0-9.~_-]) out+="$c" ;;
      *) printf -v hex '%%%02X' "'$c"; out+="$hex" ;;
    esac
  done
  printf "%s" "$out"
}

# Parse DATABASE_URL into components
# Supports: postgresql://USER:PASS@HOST:PORT/DB
parse_database_url() {
  local url="$1"

  if [[ "$url" =~ ^postgresql://([^:]+):([^@]+)@([^:]+):([0-9]+)/(.+)$ ]]; then
    DB_USER="${BASH_REMATCH[1]}"
    DB_PASS="${BASH_REMATCH[2]}"
    DB_HOST="${BASH_REMATCH[3]}"
    DB_PORT="${BASH_REMATCH[4]}"
    DB_NAME="${BASH_REMATCH[5]}"
  else
    die "Konnte DATABASE_URL nicht parsen. Erwartetes Format: postgresql://USER:PASS@HOST:PORT/DBNAME"
  fi
}

# ===========================================
# System Checks and Installation
# ===========================================

echo "📦 Aktualisiere Paketliste..."
sudo apt-get update -qq

echo ""
echo "🐘 Pruefe/Installiere PostgreSQL..."
if ! command -v psql >/dev/null 2>&1; then
  sudo apt-get install -y postgresql postgresql-contrib
  echo "✅ PostgreSQL installiert"
else
  echo "✅ PostgreSQL bereits installiert"
fi

echo ""
echo "Starte PostgreSQL Service..."
sudo service postgresql start
echo "✅ PostgreSQL Service gestartet"

echo ""
echo "🐍 Pruefe/Installiere Python..."
if ! command -v python3 >/dev/null 2>&1; then
  sudo apt-get install -y python3 python3-pip python3-venv
  echo "✅ Python3 installiert"
else
  echo "✅ Python3 bereits installiert"
fi

echo ""
echo "📦 Pruefe/Installiere Node.js..."
if ! command -v node >/dev/null 2>&1; then
  echo "Installiere Node.js (20.x)..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
  sudo apt-get install -y nodejs
  echo "✅ Node.js installiert"
else
  echo "✅ Node.js bereits installiert"
fi

require_cmd curl
require_cmd openssl
require_cmd psql
require_cmd python3
require_cmd npm

# ===========================================
# .env Configuration (FIRST!)
# ===========================================

ENV_FILE="backend/.env"

DB_USER=""
DB_PASS=""
DB_HOST="localhost"
DB_PORT="5432"
DB_NAME=""
OPENAI_KEY=""
RESET_DB=false

echo ""
echo "📝 Konfiguration"
echo "=========================================="

if [ -f "$ENV_FILE" ]; then
  echo "⚠️  .env Datei existiert bereits: $ENV_FILE"
  read -r -p "Moechtest du sie ueberschreiben und neue Konfiguration eingeben? (j/N): " overwrite
  if [[ ! "$overwrite" =~ ^[jJ]$ ]]; then
    echo "✅ Behalte bestehende .env Konfiguration"
    echo "ℹ️  Lese DATABASE_URL aus bestehender .env..."
    # shellcheck disable=SC1090
    source "$ENV_FILE"

    if [ -z "${DATABASE_URL:-}" ]; then
      die "In $ENV_FILE fehlt DATABASE_URL. Bitte ueberschreiben und neu eingeben."
    fi

    parse_database_url "$DATABASE_URL"

    echo "  Datenbank: $DB_NAME"
    echo "  User:      $DB_USER"
    echo "  Host:      $DB_HOST:$DB_PORT"

    RESET_DB=false
  else
    echo "✅ .env wird ueberschrieben"
    RESET_DB=true
  fi
else
  echo "ℹ️  Keine .env gefunden. Es wird eine neue erstellt."
  RESET_DB=true
fi

echo ""

if [ "$RESET_DB" = true ]; then
  echo "📝 Datenbank-Konfiguration"
  echo "=========================================="
  echo "ℹ️  Hinweis: sudo wird dein System-Passwort abfragen, um die DB einzurichten."
  echo ""

  DB_NAME="$(read_with_default "Datenbank-Name" "applyassistai")"
  DB_USER="$(read_with_default "Datenbank-User" "applyassist")"
  DB_PASS="$(read_password "Datenbank-Passwort" "applyassist")"
  echo ""

  read -r -p "OpenAI API Key (kannst du spaeter in .env eintragen) [leer lassen]: " OPENAI_KEY
  echo ""

  # sanitize newline chars
  DB_NAME="$(echo -n "$DB_NAME" | tr -d '\n\r')"
  DB_USER="$(echo -n "$DB_USER" | tr -d '\n\r')"
  DB_PASS="$(echo -n "$DB_PASS" | tr -d '\n\r')"

  # URL encode password to survive special characters
  DB_PASS_ENC="$(urlencode "$DB_PASS")"

  echo "📝 Erstelle/aktualisiere .env Datei..."
  cat > "$ENV_FILE" <<EOF
DATABASE_URL=postgresql://${DB_USER}:${DB_PASS_ENC}@${DB_HOST}:${DB_PORT}/${DB_NAME}
SECRET_KEY=your-secret-key-$(openssl rand -hex 32)
OPENAI_API_KEY=${OPENAI_KEY:-your-openai-api-key-here}
EOF
  echo "✅ .env Datei erstellt/aktualisiert: $ENV_FILE"
fi

# At this point we MUST have DB vars; if we reused .env, they are already parsed.
if [ -z "$DB_NAME" ] || [ -z "$DB_USER" ] || [ -z "$DB_PASS" ]; then
  # If we reused .env, DB_PASS might still be URL-encoded; that's fine for DATABASE_URL,
  # but we need the real password to ALTER USER. We can’t safely decode in bash.
  # Therefore: if .env was reused, we do NOT reset DB, and we do NOT need plaintext.
  # But we still want to run alembic -> it will use DATABASE_URL.
  # Ensure DATABASE_URL exists.
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  if [ -z "${DATABASE_URL:-}" ]; then
    die "DATABASE_URL fehlt. Bitte .env korrigieren oder ueberschreiben."
  fi
else
  # DB_PASS here is plaintext only when RESET_DB=true (user just entered it)
  :
fi

# ===========================================
# Backend Setup (venv + deps)
# ===========================================

echo ""
echo "🐍 Backend Setup..."
cd backend || die "backend/ Verzeichnis nicht gefunden"

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

echo "Installiere Python-Abhaengigkeiten..."
# shellcheck disable=SC1091
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt
echo "✅ Python-Abhaengigkeiten installiert"

# Load env vars for alembic/app (ensures DATABASE_URL is visible)
set -a
# shellcheck disable=SC1091
source .env
set +a

# ===========================================
# Database Setup
# - If .env overwritten => reset DB (drop/recreate) for a clean, deterministic state
# - Else => do NOT delete; just ensure DB exists and run migrations
# ===========================================

echo ""
echo "🗄️  Richte Datenbank ein..."
echo "  Modus: $([ "$RESET_DB" = true ] && echo "RESET (Drop & Recreate)" || echo "REUSE (keine Loeschung)")"

# We only have plaintext DB_PASS when RESET_DB=true.
# For REUSE mode, we avoid password operations to not require decoding.
if [ "$RESET_DB" = true ]; then
  # Ensure role exists, always set password
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "DO \$\$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = '${DB_USER}') THEN
    CREATE ROLE ${DB_USER} LOGIN PASSWORD '${DB_PASS}';
  END IF;
END
\$\$;"

  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "ALTER USER ${DB_USER} WITH PASSWORD '${DB_PASS}';"

  # Drop and recreate DB deterministically
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "DROP DATABASE IF EXISTS ${DB_NAME};"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"

  echo "✅ Datenbank und User im Reset-Modus bereit"
else
  # REUSE mode: create missing role/db only (no password change)
  sudo -u postgres psql -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_roles WHERE rolname='${DB_USER}'" | grep -q 1 || \
    sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE ROLE ${DB_USER} LOGIN;"

  sudo -u postgres psql -v ON_ERROR_STOP=1 -tc "SELECT 1 FROM pg_database WHERE datname='${DB_NAME}'" | grep -q 1 || \
    sudo -u postgres psql -v ON_ERROR_STOP=1 -c "CREATE DATABASE ${DB_NAME} OWNER ${DB_USER};"

  sudo -u postgres psql -v ON_ERROR_STOP=1 -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
  sudo -u postgres psql -v ON_ERROR_STOP=1 -d "${DB_NAME}" -c "GRANT ALL ON SCHEMA public TO ${DB_USER};"

  echo "✅ Datenbank (Reuse-Modus) bereit"
fi

# ===========================================
# Alembic Migrations (must succeed)
# ===========================================

echo ""
echo "Fuehre Datenbank-Migrationen aus (Alembic ist die Quelle der Wahrheit)..."

if [ -f "alembic.ini" ] && [ -d "alembic/versions" ]; then
  alembic upgrade head
  echo "✅ Datenbank-Migrationen abgeschlossen"
else
  die "Alembic ist nicht konfiguriert (alembic.ini oder alembic/versions fehlt)."
fi

cd .. || die "Projekt-Root nicht gefunden"

# ===========================================
# Frontend Setup
# ===========================================

echo ""
echo "⚛️  Frontend Setup..."
cd frontend || die "frontend/ Verzeichnis nicht gefunden"

echo "Installiere Node-Abhaengigkeiten..."
npm install
echo "✅ Node-Abhaengigkeiten installiert"

cd .. || die "Projekt-Root nicht gefunden"

# ===========================================
# Finished
# ===========================================

echo ""
echo "=========================================="
echo "✨ Setup abgeschlossen!"
echo "=========================================="
echo ""
echo "Naechste Schritte:"
if [ "$RESET_DB" = true ] && [ -z "$OPENAI_KEY" ]; then
  echo "1. Bearbeite backend/.env und fuege deinen OPENAI_API_KEY ein (falls noch nicht gesetzt)"
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
