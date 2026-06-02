"""
FastAPI application for Smart Crop Disease Detection & Risk Prediction System
"""
import sys
import os
from pathlib import Path
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import JSONResponse
from dotenv import load_dotenv

# Add backend directory to sys.path for absolute imports
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Load environment variables
load_dotenv()

# Initialize services
from services import app_state

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifecycle management."""
    print("=" * 70)
    print("[STARTUP] Smart Crop Disease Detection System")
    print("=" * 70)

    # ── Step 1: Verify TensorFlow ────────────────────────────────────────
    try:
        import tensorflow as tf
        print(f"[OK] TensorFlow {tf.__version__} / Keras {tf.keras.__version__}")
    except ImportError as exc:
        # Hard stop – TensorFlow is required, not optional
        raise RuntimeError(
            "TensorFlow is not installed. "
            "Run: pip install tensorflow pillow numpy"
        ) from exc

    # ── Step 2: Resolve model path ───────────────────────────────────────
    keras_path = backend_dir / "model" / "model.keras"
    env_model_path = os.getenv("MODEL_PATH", "").strip()
    if env_model_path:
        model_path = str(
            Path(env_model_path).resolve()
            if not os.path.isabs(env_model_path)
            else Path(env_model_path)
        )
    else:
        model_path = str(keras_path)

    print(f"[CHECK] Model path : {model_path}")
    print(f"[CHECK] File exists: {Path(model_path).exists()}")

    # ── Step 3: Load model – failure is fatal ────────────────────────────
    try:
        from services.disease_detector import DiseaseDetector
        app_state.disease_detector = DiseaseDetector(model_path=model_path)
        print("[OK] DiseaseDetector ready – LIVE predictions enabled")
    except Exception as exc:
        import traceback
        traceback.print_exc()
        # Re-raise so the server exits with a visible error instead of
        # silently serving demo/fake predictions.
        raise RuntimeError(
            f"[FATAL] Could not load model from '{model_path}'. "
            "Fix the error above, then restart the server."
        ) from exc

    print("=" * 70)
    print("[OK] 🟢 RUNNING IN REAL MODE")
    print("[OK] Core features: predict ✓, weather ✓, risk ✓, map ✓")
    print("[OK] Report feature: ✓ Enabled" if report_available else "[WARNING] Report feature: ✗ Disabled (reportlab missing)")
    print("[OK] Server ready to accept requests")
    print("=" * 70)
    yield
    print("[SHUTDOWN] Shutting down application...")

# Create FastAPI app
app = FastAPI(
    title="Smart Crop Disease Detection API",
    description="AI-powered system for crop disease detection and risk prediction",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS Middleware
allowed_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000,http://localhost:5173").split(",")

# In development, allow all localhost origins (any port) to avoid CORS issues
# when Vite falls back to a different port (e.g. 5174, 5175, etc.)
environment = os.getenv("ENVIRONMENT", "development")
if environment == "development":
    app.add_middleware(
        CORSMiddleware,
        allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
else:
    app.add_middleware(
        CORSMiddleware,
        allow_origins=allowed_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

# ── Include routes ────────────────────────────────────────────────────────────
# Core routes (required for functionality)
from routes import predict, weather, risk, map as map_routes

app.include_router(predict.router)
app.include_router(weather.router)
app.include_router(risk.router)
app.include_router(map_routes.router)

# Optional: Report route (requires reportlab)
report_available = False
try:
    from routes import report
    app.include_router(report.router)
    report_available = True
    print("[OK] Report module loaded – PDF download feature enabled")
except ImportError as e:
    print(f"[WARNING] Report module import failed: {e}")
    print("[WARNING] PDF download feature will be disabled")
    print("[INFO] To enable: pip install reportlab")
except Exception as e:
    print(f"[WARNING] Report module error: {e}")
    print("[WARNING] PDF download feature will be disabled")

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information."""
    endpoints = {
        "predict": "/api/predict (POST) - Upload image for disease detection",
        "weather": "/api/weather (GET) - Get weather data",
        "risk": "/api/risk/estimate (GET) - Estimate disease risk",
        "map": "/api/map/zones (GET) - Get risk zones",
        "docs": "/docs - Swagger UI documentation",
        "redoc": "/redoc - ReDoc documentation",
    }
    
    # Conditionally add report endpoint
    if report_available:
        endpoints["report"] = "/api/download-report (POST) - Generate PDF report"
    
    return {
        "message": "Smart Crop Disease Detection & Risk Prediction API",
        "version": "1.0.0",
        "endpoints": endpoints,
        "features": {
            "predictions": "✓ Enabled",
            "weather": "✓ Enabled",
            "risk_analysis": "✓ Enabled",
            "map": "✓ Enabled",
            "pdf_reports": "✓ Enabled" if report_available else "✗ Disabled (reportlab not installed)",
        },
        "status": "running",
    }

@app.get("/health")
async def health_check():
    """Health check endpoint with feature status."""
    return {
        "status": "healthy",
        "version": "1.0.0",
        "mode": "REAL" if app_state.disease_detector else "UNKNOWN",
        "features": {
            "predictions": "enabled",
            "weather": "enabled",
            "risk_analysis": "enabled",
            "map": "enabled",
            "pdf_reports": "enabled" if report_available else "disabled",
        },
        "notes": [] if report_available else ["reportlab not installed – PDF download feature disabled"],
    }

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": str(exc),
            "detail": "Internal server error",
        },
    )

if __name__ == "__main__":
    import uvicorn
    
    host = os.getenv("API_HOST", "0.0.0.0")
    port = int(os.getenv("API_PORT", 8000))
    environment = os.getenv("ENVIRONMENT", "development")
    
    print(f"\n[APP] Smart Crop Disease Detection System")
    print(f"[HOST] {host}:{port}")
    print(f"[ENV] Environment: {environment}")
    print(f"[DOCS] API Docs: http://{host}:{port}/docs\n")
    
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        reload=environment == "development",
        log_level="info",
    )
