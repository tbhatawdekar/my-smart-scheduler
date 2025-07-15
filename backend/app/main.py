from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .auth import router as auth_router
from .calendar import router as calendar_router

app = FastAPI(
    title="Smart Scheduler API",
    description="A smart scheduler that prioritizes your wellbeing with Google Calendar integration",
    version="1.0.0"
)

# Add CORS middleware for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:8000"],  # Add your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth_router, prefix="/auth", tags=["Authentication"])
app.include_router(calendar_router, prefix="/api", tags=["Calendar"])

@app.get("/")
async def root():
    """Root endpoint with basic info"""
    return {
        "message": "Smart Scheduler API",
        "version": "1.0.0",
        "endpoints": {
            "authentication": "/auth/login",
            "calendar_events": "/api/day",
            "insert_event": "/api/insert"
        }
    }

@app.get("/login")
async def login_redirect():
    """Redirect /login to /auth/login for convenience"""
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="/auth/login")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "service": "smart-scheduler-api"} 