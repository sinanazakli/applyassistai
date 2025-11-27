from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .database import engine, Base
from .routes import auth_routes, interview_routes, dashboard_routes

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="ApplyAssistAI",
    description="AI-powered interview training platform",
    version="1.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000"],  # Frontend URLs
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_routes.router)
app.include_router(interview_routes.router)
app.include_router(dashboard_routes.router)

@app.get("/")
def root():
    """Root endpoint"""
    return {
        "message": "Welcome to ApplyAssistAI API",
        "version": "1.0.0",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
