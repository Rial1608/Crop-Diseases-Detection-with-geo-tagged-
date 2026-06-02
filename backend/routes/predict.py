"""
Prediction routes – uses the globally loaded DiseaseDetector for inference.
"""
from fastapi import APIRouter, UploadFile, File, Form, HTTPException
from typing import Optional
import io
import numpy as np
from PIL import Image

router = APIRouter(prefix="/api", tags=["Prediction"])


# ── Helper: preprocess exactly like training ──────────────────────────────────
def _preprocess_image(img: Image.Image, target_size: int = 224) -> np.ndarray:
    """
    Resize → RGB → float32 → /255.0   (matches ImageDataGenerator rescale=1./255)
    Returns shape (target_size, target_size, 3) float32 in [0, 1].
    """
    # Ensure RGB
    if img.mode == "RGBA":
        bg = Image.new("RGB", img.size, (255, 255, 255))
        bg.paste(img, mask=img.split()[3])
        img = bg
    elif img.mode != "RGB":
        img = img.convert("RGB")

    # Resize with high-quality resampling
    img = img.resize((target_size, target_size), Image.Resampling.LANCZOS)

    # To numpy, normalise
    arr = np.array(img, dtype=np.float32) / 255.0
    return arr  # (224, 224, 3)


# ── POST /api/predict ─────────────────────────────────────────────────────────
@router.post("/predict")
async def predict_disease(
    file: UploadFile = File(...),
    latitude: Optional[float] = Form(None),
    longitude: Optional[float] = Form(None),
):
    """
    Upload a plant leaf image and receive a disease prediction.
    """
    try:
        print(f"[RECV] file={file.filename}, lat={latitude}, lng={longitude}")

        # ── 1. Read & validate image ─────────────────────────────────────────
        image_bytes = await file.read()
        if not image_bytes:
            raise HTTPException(status_code=400, detail="Empty file uploaded")
        print(f"[INFO] Image size: {len(image_bytes)} bytes")

        try:
            img = Image.open(io.BytesIO(image_bytes))
            img.verify()
            # Re-open after verify (verify closes the file)
            img = Image.open(io.BytesIO(image_bytes))
            print(f"[OK] Valid image: {img.format} {img.size} {img.mode}")
        except Exception as e:
            print(f"[ERROR] Invalid image: {e}")
            raise HTTPException(status_code=400, detail=f"Invalid or corrupt image file: {e}")

        # ── 2. Preprocess ────────────────────────────────────────────────────
        from utils.constants import IMAGE_SIZE, MODEL_CONFIDENCE_THRESHOLD
        image_array = _preprocess_image(img, target_size=IMAGE_SIZE)
        print(f"[OK] Preprocessed: shape={image_array.shape}, dtype={image_array.dtype}, "
              f"min={image_array.min():.3f}, max={image_array.max():.3f}")

        # ── 3. Run prediction via global detector ────────────────────────────
        from services import app_state
        if app_state.disease_detector is None:
            raise HTTPException(
                status_code=503,
                detail="Model not loaded. Check server startup logs for errors.",
            )
        _detector = app_state.disease_detector

        result = _detector.predict(image_array, original_image=img)
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("error", "Prediction failed"))

        prediction = result["prediction"]
        print(f"[OK] Prediction: {prediction['disease_name']} ({prediction['confidence']:.2f}%)")

        # ── 4. Confidence threshold warning ──────────────────────────────────
        if prediction.get("is_uncertain"):
            result["warning"] = (
                "Low confidence - the model is not sure about this prediction. "
                "Please upload a clearer, well-lit image of the affected leaf."
            )

        # ── 5. Weather data ──────────────────────────────────────────────────
        if latitude is None:
            latitude = 28.6139
        if longitude is None:
            longitude = 77.2090

        weather_data = None
        try:
            from services.weather_service import WeatherService
            ws = WeatherService()
            weather_data = ws.get_weather(latitude, longitude)
        except Exception as e:
            print(f"[WARN] Weather fetch failed: {e}")
            weather_data = {
                "temperature": 25, "humidity": 60, "rainfall": 0,
                "wind_speed": 0, "condition": "Unknown", "is_demo": True,
            }

        # ── 6. Risk analysis ─────────────────────────────────────────────────
        is_diseased = prediction.get("is_diseased", False)
        risk_analysis = None
        try:
            from services.risk_calculator import RiskCalculator
            rc = RiskCalculator()
            risk_analysis = rc.calculate_overall_risk(
                disease_confidence=prediction["confidence"],
                temperature=weather_data.get("temperature", 25),
                humidity=weather_data.get("humidity", 60),
                rainfall=weather_data.get("rainfall", 0),
                latitude=latitude,
                longitude=longitude,
                is_diseased=is_diseased,
            )
        except Exception as e:
            print(f"[WARN] Risk calculation failed: {e}")
            risk_analysis = {
                "risk_score": 0 if not is_diseased else 50,
                "risk_level": "LOW" if not is_diseased else "MEDIUM",
                "risk_color": "#22c55e" if not is_diseased else "#f59e0b",
                "message": "Risk analysis unavailable",
                "recommendation": "Monitor your crops regularly",
            }

        # ── 7. Build response ────────────────────────────────────────────────
        response = {
            "success": True,
            "mode": result.get("mode", "UNKNOWN"),
            "prediction": prediction,
            "disease_info": result.get("disease_info", {}),
            "risk_analysis": risk_analysis,
            "weather_data": weather_data,
            "all_predictions": result.get("all_predictions", []),
            "heatmap_image": result.get("heatmap_image"),
            "model_info": {
                "name": "SmartCrop Disease Detection",
                "total_classes": _detector.num_classes,
                "mode": result.get("mode", "UNKNOWN"),
            },
        }
        if "warning" in result:
            response["warning"] = result["warning"]

        return response

    except HTTPException:
        raise
    except Exception as e:
        print(f"[ERROR] Error in predict route: {e}")
        import traceback; traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


# ── GET /api/predict/info ─────────────────────────────────────────────────────
@router.get("/predict/info")
async def predict_info():
    """Return metadata about the loaded model."""
    try:
        from services import app_state
        if app_state.disease_detector:
            return app_state.disease_detector.get_model_info()
    except Exception:
        pass

    from utils.constants import NUM_CLASSES
    return {
        "model": "SmartCrop Disease Detection",
        "version": "1.0.0",
        "total_classes": NUM_CLASSES,
        "supported_formats": ["jpg", "jpeg", "png", "gif", "bmp"],
        "input_size": [224, 224, 3],
    }
