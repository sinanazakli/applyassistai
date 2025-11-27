# 🚀 ApplyAssistAI - Schnellstart

Eine KI-gestützte Interview-Trainingsplattform mit React Frontend und FastAPI Backend.

---

## 📋 Plattform-spezifische Anleitungen

### 🐧 **WSL-Ubuntu (EMPFOHLEN)**
👉 **[WSL-SETUP.md](WSL-SETUP.md)** - Komplette Anleitung für WSL

**Schnellstart:**
```bash
wsl
cd /mnt/c/Users/azakl/OneDrive/bootcamp/ApplyAssistAI
chmod +x setup.sh start.sh
./setup.sh
./start.sh
```

---

### 🪟 **Windows (mit Docker)**
👉 **[QUICKSTART.md](QUICKSTART.md)** - Anleitung für Windows mit Docker

**Schnellstart:**
```powershell
.\setup.ps1
.\start.ps1
```

---

### 🪟 **Windows (ohne Docker)**
👉 **[POSTGRES-SETUP.md](POSTGRES-SETUP.md)** - PostgreSQL manuell installieren

**Schnellstart:**
```powershell
.\setup-with-postgres.ps1
.\start.ps1
```

---

## 🎯 Verfügbare Scripts

### Linux/WSL (`.sh`)
- `setup.sh` - Komplettes Setup
- `start.sh` - Backend + Frontend starten
- `start-backend.sh` - Nur Backend
- `start-frontend.sh` - Nur Frontend
- `stop.sh` - Alle Server stoppen

### Windows (`.ps1`)
- `setup.ps1` - Setup mit Docker
- `setup-with-postgres.ps1` - Setup mit PostgreSQL
- `start.ps1` - Backend + Frontend starten
- `start-backend.ps1` - Nur Backend
- `start-frontend.ps1` - Nur Frontend
- `stop.ps1` - Alle Server stoppen

---

## 🌐 URLs nach dem Start

- **Frontend:** http://localhost:5173
- **Backend API:** http://localhost:8000
- **API Dokumentation:** http://localhost:8000/docs
- **Alternative API Docs:** http://localhost:8000/redoc

---

## 🔑 Konfiguration

Bearbeite `backend/.env` und füge deinen OpenAI API Key ein:

```env
OPENAI_API_KEY=sk-...dein-api-key...
```

---

## 🛠️ Technologie-Stack

- **Frontend:** React + Vite + TailwindCSS
- **Backend:** FastAPI + Python
- **Datenbank:** PostgreSQL
- **AI:** OpenAI GPT-4
- **State Management:** Zustand
- **Charts:** Recharts

---

## 📚 Projekt-Struktur

```
ApplyAssistAI/
├── backend/              # FastAPI Backend
│   ├── app/
│   │   ├── models.py    # Datenbank-Modelle
│   │   ├── routes/      # API-Routen
│   │   ├── services/    # Business-Logik
│   │   └── main.py      # App-Einstiegspunkt
│   ├── requirements.txt
│   └── .env
├── frontend/            # React Frontend
│   ├── src/
│   │   ├── components/  # React-Komponenten
│   │   ├── pages/       # Seiten
│   │   ├── utils/       # Hilfsfunktionen
│   │   └── App.jsx
│   └── package.json
└── docker-compose.yml   # Docker-Konfiguration
```

---

## 🤝 Entwicklung

### Backend entwickeln
```bash
cd backend
source venv/bin/activate  # Linux/WSL
# ODER
.\venv\Scripts\Activate.ps1  # Windows
uvicorn app.main:app --reload
```

### Frontend entwickeln
```bash
cd frontend
npm run dev
```

### Neue Datenbank-Migration
```bash
cd backend
source venv/bin/activate
alembic revision --autogenerate -m "Beschreibung"
alembic upgrade head
```

---

## 📝 Lizenz

Dieses Projekt wurde für Bildungszwecke erstellt.

---

**Viel Erfolg mit ApplyAssistAI! 🎉**

Fuehre Datenbank-Migrationen aus...
INFO  [alembic.runtime.migration] Context impl PostgresqlImpl.
INFO  [alembic.runtime.migration] Will assume transactional DDL.
INFO  [alembic.runtime.migration] Running upgrade  -> 001, Initial migration
✅ Datenbank-Migrationen abgeschlossen

⚛️  Frontend Setup...
Installiere Node-Abhaengigkeiten...

added 3 packages, and audited 202 packages in 5s        

30 packages are looking for funding
  run `npm fund` for details

2 moderate severity vulnerabilities

To address all issues (including breaking changes), run:
  npm audit fix --force

Run `npm audit` for details.
npm notice
npm notice New major version of npm available! 10.8.2 ->
 11.6.4
npm notice Changelog: https://github.com/npm/cli/releases/tag/v11.6.4
npm notice To update run: npm install -g npm@11.6.4     
npm notice
✅ Node-Abhaengigkeiten installiert

==========================================
✨ Setup abgeschlossen!
==========================================

Naechste Schritte:
1. Bearbeite backend/.env und fuege deinen OPENAI_API_KEY ein
2. Fuehre ./start.sh aus, um die App zu starten

URLs:
  Frontend: http://localhost:5173
  Backend:  http://localhost:8000
  API Docs: http://localhost:8000/docs