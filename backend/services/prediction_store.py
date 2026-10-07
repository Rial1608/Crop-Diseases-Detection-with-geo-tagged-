"""
Prediction Store – persists each detection to a JSON file so that
the map can show real risk zones generated from uploaded images.
"""
import json
import os
import shutil
import uuid
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional

# Uploads are saved next to this file → backend/uploads/
BACKEND_DIR = Path(__file__).resolve().parent.parent
UPLOADS_DIR = BACKEND_DIR / "uploads"
STORE_PATH  = BACKEND_DIR / "predictions_store.json"

UPLOADS_DIR.mkdir(exist_ok=True)


# ── Helpers ──────────────────────────────────────────────────────────────────

def _load() -> List[Dict]:
    """Load all stored predictions from disk."""
    if not STORE_PATH.exists():
        return []
    try:
        with open(STORE_PATH, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception:
        return []


def _save(records: List[Dict]) -> None:
    """Persist records to disk (keep max 500)."""
    try:
        with open(STORE_PATH, "w", encoding="utf-8") as f:
            json.dump(records[-500:], f, indent=2)
    except Exception as e:
        print(f"[WARN] Could not save prediction store: {e}")


# ── Public API ────────────────────────────────────────────────────────────────

def save_prediction(
    image_bytes: bytes,
    filename: str,
    latitude: float,
    longitude: float,
    prediction: Dict,
    risk_analysis: Dict,
) -> Dict:
    """
    Save the uploaded image to disk and record the prediction.
    Returns the saved record (includes image_url).
    """
    # ── 1. Save image file ────────────────────────────────────────────────
    ext     = Path(filename).suffix.lower() or ".jpg"
    uid     = uuid.uuid4().hex[:12]
    fname   = f"{uid}{ext}"
    fpath   = UPLOADS_DIR / fname
    with open(fpath, "wb") as f:
        f.write(image_bytes)

    # ── 2. Build record ───────────────────────────────────────────────────
    record = {
        "id":           uid,
        "timestamp":    datetime.utcnow().isoformat() + "Z",
        "filename":     fname,
        "image_url":    f"/uploads/{fname}",   # served as static
        "latitude":     latitude,
        "longitude":    longitude,
        "disease_name": prediction.get("disease_name", "Unknown"),
        "disease_class":prediction.get("disease_class", ""),
        "confidence":   round(prediction.get("confidence", 0), 2),
        "is_diseased":  prediction.get("is_diseased", False),
        "risk_level":   risk_analysis.get("risk_level", "LOW"),
        "risk_score":   risk_analysis.get("risk_score", 0),
        "risk_color":   risk_analysis.get("risk_color", "#22c55e"),
    }

    # ── 3. Append + persist ───────────────────────────────────────────────
    records = _load()
    records.append(record)
    _save(records)

    print(f"[STORE] Saved prediction: {record['disease_name']} @ ({latitude:.4f}, {longitude:.4f}) → {fname}")
    return record


def get_all_predictions() -> List[Dict]:
    """Return all stored predictions (newest first)."""
    return list(reversed(_load()))


def get_map_zones_from_predictions() -> List[Dict]:
    """
    Build dynamic map zones from recorded predictions.
    Each unique (lat, lng) rounded to 2 decimal places becomes one zone.
    The zone risk is the highest risk seen at that location.
    Returns list of zone dicts compatible with the existing MapService format.
    """
    RISK_RANK = {"HIGH": 3, "MEDIUM": 2, "LOW": 1}
    records = _load()

    # Group by rounded coordinates
    buckets: Dict[str, Dict] = {}
    for r in records:
        lat = round(r["latitude"],  2)
        lng = round(r["longitude"], 2)
        key = f"{lat},{lng}"

        if key not in buckets:
            buckets[key] = {
                "lat":         lat,
                "lng":         lng,
                "risk":        r["risk_level"],
                "detections":  [],
                "name":        f"Detection Zone ({lat:.2f}, {lng:.2f})",
            }

        # Upgrade risk if this record is higher
        existing_rank = RISK_RANK.get(buckets[key]["risk"], 1)
        new_rank      = RISK_RANK.get(r["risk_level"], 1)
        if new_rank > existing_rank:
            buckets[key]["risk"] = r["risk_level"]

        buckets[key]["detections"].append({
            "id":           r["id"],
            "disease_name": r["disease_name"],
            "confidence":   r["confidence"],
            "timestamp":    r["timestamp"],
            "image_url":    r["image_url"],
        })

    zones = []
    for key, b in buckets.items():
        zones.append({
            "name":       b["name"],
            "lat":        b["lat"],
            "lng":        b["lng"],
            "risk":       b["risk"],
            "radius":     2,          # km – default display radius
            "detections": b["detections"],
            "count":      len(b["detections"]),
            "source":     "upload",   # distinguishes from static demo zones
        })

    return zones
