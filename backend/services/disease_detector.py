"""
Disease detection service.
Loads the trained Keras model once at startup and reuses it for all inference.
Demo mode has been completely removed - if the model cannot be loaded the
server raises an exception so the problem is immediately visible in logs.
"""
import json
import logging
import os
from pathlib import Path
from typing import Dict, List, Optional

import numpy as np

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Resolve paths relative to this file so the service works regardless of cwd
# ---------------------------------------------------------------------------
_BACKEND_DIR = Path(__file__).resolve().parent.parent
_DEFAULT_MODEL_PATH = _BACKEND_DIR / "model" / "model.keras"
_CLASS_INDICES_PATH = _BACKEND_DIR / "model" / "class_indices.json"

# ---------------------------------------------------------------------------
# Constants (imported from utils - kept for backward-compat with other routes)
# ---------------------------------------------------------------------------
from utils.constants import (
    DISEASE_TREATMENTS,
    DEFAULT_TREATMENT,
    MODEL_CONFIDENCE_THRESHOLD,
    TOP_K_PREDICTIONS,
    IMAGE_SIZE,
    get_treatment,
)
from utils.helpers import format_disease_name


# ---------------------------------------------------------------------------
# DiseaseDetector
# ---------------------------------------------------------------------------
class DiseaseDetector:
    """Loads the trained model once and performs real inference."""

    def __init__(self, model_path: Optional[str] = None):
        self.model = None
        self.is_loaded = False

        # ── Resolve model path ───────────────────────────────────────────────
        resolved_path = Path(model_path) if model_path else _DEFAULT_MODEL_PATH
        if not resolved_path.is_absolute():
            resolved_path = (_BACKEND_DIR / resolved_path).resolve()

        # ── Load class names from class_indices.json ────────────────────────
        self.class_names: List[str] = self._load_class_names()
        self.num_classes: int = len(self.class_names)
        print(f"[OK] Classes loaded: {self.num_classes} classes")
        print(f"[OK] Class list: {self.class_names}")

        # ── Load model (raises on failure - no fallback) ─────────────────────
        self._load_model(str(resolved_path))

    # ── Class name loading ───────────────────────────────────────────────────
    @staticmethod
    def _load_class_names() -> List[str]:
        """
        Load class names from class_indices.json.
        class_indices.json format: {"class_name": index, ...}
        We reverse it to get a list indexed by prediction index.
        Raises FileNotFoundError / ValueError if the file is missing or corrupt.
        """
        if not _CLASS_INDICES_PATH.exists():
            raise FileNotFoundError(
                f"class_indices.json not found at {_CLASS_INDICES_PATH}. "
                "Ensure the file exists in the model/ directory."
            )

        with open(_CLASS_INDICES_PATH, "r", encoding="utf-8") as f:
            class_indices: Dict[str, int] = json.load(f)

        if not class_indices:
            raise ValueError("class_indices.json is empty.")

        # Build idx -> class_name mapping
        idx_to_class: Dict[int, str] = {v: k for k, v in class_indices.items()}
        max_idx = max(idx_to_class.keys())
        class_names = [idx_to_class[i] for i in range(max_idx + 1)]

        print(f"[OK] Loaded class_indices.json from {_CLASS_INDICES_PATH}")
        return class_names

    # ── Model loading ────────────────────────────────────────────────────────
    def _load_model(self, model_path: str):
        """
        Load the Keras model from disk.
        Raises RuntimeError with a clear message if loading fails.
        No silent fallback to demo mode.
        """
        import tensorflow as tf

        path = Path(model_path)
        if not path.exists():
            raise FileNotFoundError(
                f"Model file not found: {path}\n"
                "Run model/migrate_model.py to create a compatible model file."
            )

        print(f"[LOAD] Loading model from: {path}")
        try:
            self.model = tf.keras.models.load_model(str(path), compile=False)
            self.is_loaded = True

            print(f"[OK] Model loaded successfully")
            print(f"     Input shape  : {self.model.input_shape}")
            print(f"     Output shape : {self.model.output_shape}")
            print(f"     Parameters   : {self.model.count_params():,}")

            # Warn if output size mismatches class list
            out_size = self.model.output_shape[-1]
            if out_size != self.num_classes:
                print(
                    f"[WARN] Model output size ({out_size}) != "
                    f"class_indices entries ({self.num_classes}). "
                    "Check that model and class_indices.json are in sync."
                )

        except Exception as exc:
            logger.exception("Model load failed: %s", model_path)
            raise RuntimeError(
                f"Failed to load model from '{path}': {exc}\n"
                "Check the model file is not corrupt and was saved with "
                "a compatible Keras version. Run model/migrate_model.py "
                "to rebuild a compatible model."
            ) from exc

    # ── Public prediction API ────────────────────────────────────────────────
    def predict(self, image_array: np.ndarray, original_image=None) -> Dict:
        """
        Run inference on a pre-processed image array.

        Args:
            image_array: float32 numpy array, shape (H, W, 3), values in [0, 1].
            original_image: optional PIL Image used for Grad-CAM overlay.

        Returns:
            dict with keys:
                success (bool), mode (str), prediction (dict),
                all_predictions (list), probabilities (list),
                heatmap_image (str | None)
        """
        if not self.is_loaded or self.model is None:
            return {
                "success": False,
                "mode": "ERROR",
                "error": "Model is not loaded. Check server startup logs.",
                "prediction": {},
                "all_predictions": [],
                "probabilities": [],
                "heatmap_image": None,
            }

        try:
            # Ensure batch dimension: (H, W, 3) -> (1, H, W, 3)
            if image_array.ndim == 3:
                image_array = np.expand_dims(image_array, axis=0)

            # Run model inference
            raw = self.model.predict(image_array, verbose=0)
            probabilities = raw[0]   # shape: (num_classes,)

            result = self._format_result(probabilities, mode="LIVE")

            # Attach Grad-CAM heatmap for the top prediction
            if result.get("success"):
                try:
                    predicted_idx = int(np.argmax(probabilities))
                    heatmap_b64 = self._generate_gradcam(
                        image_array, predicted_idx, original_image
                    )
                    result["heatmap_image"] = heatmap_b64
                except Exception as e:
                    print(f"[WARN] Grad-CAM failed (non-fatal): {e}")
                    result["heatmap_image"] = None

            return result

        except Exception as exc:
            logger.exception("Inference error")
            print(f"[ERROR] Inference error: {exc}")
            return {
                "success": False,
                "mode": "ERROR",
                "error": str(exc),
                "prediction": {},
                "all_predictions": [],
                "probabilities": [],
                "heatmap_image": None,
            }

    # ── Grad-CAM ─────────────────────────────────────────────────────────────
    def _generate_gradcam(
        self,
        image_array: np.ndarray,
        predicted_class: int,
        original_image=None,
    ) -> Optional[str]:
        """
        Generate a Grad-CAM heatmap for the given batch tensor.
        Returns a base64-encoded PNG string, or None on failure.
        """
        import io, base64
        import tensorflow as tf
        from PIL import Image as PILImage

        # Build a sub-model that outputs the last conv layer of MobileNetV2
        try:
            mobilenet = self.model.get_layer("mobilenetv2_1.00_224")
            last_conv = mobilenet.get_layer("out_relu")
            conv_model = tf.keras.Model(
                inputs=mobilenet.input,
                outputs=last_conv.output,
            )
        except Exception as e:
            print(f"[WARN] Grad-CAM: could not build conv model: {e}")
            return None

        # Layers after MobileNetV2.
        # Rebuilt model structure: [0]=MobileNetV2, [1]=GAP, [2]=Dense, [3]=Dropout, [4]=Dense_1
        # So remaining_layers starts at index 1 to include the GAP layer.
        remaining_layers = self.model.layers[1:]

        img_tensor = tf.cast(image_array, tf.float32)
        with tf.GradientTape() as tape:
            conv_outputs = conv_model(img_tensor, training=False)
            tape.watch(conv_outputs)
            x = conv_outputs
            for layer in remaining_layers:
                x = layer(x, training=False)
            loss = x[:, predicted_class]

        grads = tape.gradient(loss, conv_outputs)
        if grads is None:
            return None

        pooled_grads = tf.reduce_mean(grads, axis=(0, 1, 2))
        conv_out_np = conv_outputs[0].numpy()
        pooled_np = pooled_grads.numpy()

        heatmap = np.sum(pooled_np * conv_out_np, axis=-1)
        heatmap = np.maximum(heatmap, 0)
        if heatmap.max() > 0:
            heatmap /= heatmap.max()

        # Resize heatmap to 224x224
        heatmap_uint8 = (heatmap * 255).astype(np.uint8)
        heatmap_img = PILImage.fromarray(heatmap_uint8, mode="L").resize(
            (224, 224), PILImage.Resampling.LANCZOS
        )
        heatmap_colored = self._apply_jet_colormap(np.array(heatmap_img))

        # Overlay on original or preprocessed image
        if original_image is not None:
            base_img = original_image.copy().convert("RGB").resize(
                (224, 224), PILImage.Resampling.LANCZOS
            )
        else:
            base_img = PILImage.fromarray(
                (image_array[0] * 255).astype(np.uint8), mode="RGB"
            )

        overlay = PILImage.fromarray(heatmap_colored, mode="RGB")
        blended = PILImage.blend(base_img, overlay, alpha=0.4)

        buf = io.BytesIO()
        blended.save(buf, format="PNG")
        buf.seek(0)
        b64 = base64.b64encode(buf.getvalue()).decode("utf-8")
        print(f"[OK] Grad-CAM heatmap generated ({len(b64)} chars base64)")
        return b64

    @staticmethod
    def _apply_jet_colormap(gray: np.ndarray) -> np.ndarray:
        """Apply a JET-approximation colormap to a uint8 grayscale array."""
        t = gray.astype(np.float32) / 255.0
        r = np.clip(1.5 - np.abs(t - 0.75) * 4, 0, 1)
        g = np.clip(1.5 - np.abs(t - 0.50) * 4, 0, 1)
        b = np.clip(1.5 - np.abs(t - 0.25) * 4, 0, 1)
        return (np.stack([r, g, b], axis=-1) * 255).astype(np.uint8)

    # ── Result formatting ────────────────────────────────────────────────────
    def _format_result(self, probabilities: np.ndarray, mode: str = "LIVE") -> Dict:
        """Convert raw probability vector into the structured API response."""
        top_k = min(TOP_K_PREDICTIONS, len(probabilities))
        top_indices = np.argsort(probabilities)[::-1][:top_k]

        all_predictions = []
        for rank, idx in enumerate(top_indices, start=1):
            class_name = self.class_names[int(idx)]
            confidence = float(probabilities[int(idx)]) * 100
            info = get_treatment(class_name)
            all_predictions.append({
                "disease_class": class_name,
                "disease_name": info.get("name", format_disease_name(class_name)),
                "confidence": round(confidence, 2),
                "rank": rank,
                "is_diseased": confidence > 5 and "healthy" not in class_name.lower(),
            })

        top = all_predictions[0]
        is_uncertain = top["confidence"] < MODEL_CONFIDENCE_THRESHOLD

        print(f"[RESULT] Top-{top_k} predictions (mode={mode}):")
        for p in all_predictions:
            print(f"   {p['rank']}. {p['disease_name']:<45} {p['confidence']:6.2f}%")

        return {
            "success": True,
            "mode": mode,
            "prediction": {
                "disease_name": top["disease_name"],
                "disease_class": top["disease_class"],
                "confidence": top["confidence"],
                "is_diseased": top["is_diseased"],
                "is_uncertain": is_uncertain,
            },
            "disease_info": get_treatment(top["disease_class"]),
            "all_predictions": all_predictions,
            "probabilities": [round(float(p), 6) for p in probabilities],
        }

    # ── Info endpoint helper ─────────────────────────────────────────────────
    def get_model_info(self) -> Dict:
        """Return metadata about the loaded model."""
        if not self.is_loaded or self.model is None:
            return {"status": "Model not loaded", "classes": 0}
        try:
            return {
                "status": "Model loaded (LIVE mode)",
                "input_shape": str(self.model.input_shape),
                "output_shape": str(self.model.output_shape),
                "total_params": int(self.model.count_params()),
                "classes": self.num_classes,
                "class_names": self.class_names,
            }
        except Exception as exc:
            return {"status": f"Error retrieving model info: {exc}"}
