"""
migrate_model.py
----------------
Rebuilds the exact same model architecture from scratch (bypassing the
Keras 3.10 → 3.12 serialization bug), loads the saved weights from the
existing model.keras file, then re-saves everything into a new
model_v2.keras that loads cleanly on Keras 3.12+.

Run once:
    cd backend
    venv\\Scripts\\python.exe model/migrate_model.py
"""

import os, sys, zipfile, json, tempfile, shutil
from pathlib import Path

# ── Environment tweaks ───────────────────────────────────────────────────────
os.environ["TF_ENABLE_ONEDNN_OPTS"] = "0"   # suppress oneDNN spam
os.environ["TF_CPP_MIN_LOG_LEVEL"] = "2"     # suppress C++ TF logs

import numpy as np
import tensorflow as tf

print(f"TensorFlow : {tf.__version__}")
print(f"Keras      : {tf.keras.__version__}")

BACKEND_DIR = Path(__file__).resolve().parent.parent   # …/backend/
SRC  = BACKEND_DIR / "model" / "model.keras"
DST  = BACKEND_DIR / "model" / "model_v2.keras"
NUM_CLASSES = 16

# ── Step 1: Rebuild the architecture ────────────────────────────────────────
print("\n[1/4] Building model architecture...")

base = tf.keras.applications.MobileNetV2(
    input_shape=(224, 224, 3),
    include_top=False,
    weights=None,          # weights come from the saved file
)
base.trainable = False

model = tf.keras.Sequential([
    tf.keras.Input(shape=(224, 224, 3), name="input_layer_1"),
    base,
    tf.keras.layers.GlobalAveragePooling2D(name="global_average_pooling2d"),
    tf.keras.layers.Dense(256, activation="relu", name="dense"),
    tf.keras.layers.Dropout(0.5, name="dropout"),
    tf.keras.layers.Dense(NUM_CLASSES, activation="softmax", name="dense_1"),
], name="sequential")

model.build((None, 224, 224, 3))
print(f"   Input  : {model.input_shape}")
print(f"   Output : {model.output_shape}")
print(f"   Params : {model.count_params():,}")

# ── Step 2: Extract weights from the old model.keras ────────────────────────
print(f"\n[2/4] Extracting weights from {SRC} ...")

tmp_dir = Path(tempfile.mkdtemp())
try:
    with zipfile.ZipFile(SRC, "r") as z:
        z.extractall(tmp_dir)

    weights_h5 = tmp_dir / "model.weights.h5"
    if not weights_h5.exists():
        raise FileNotFoundError(f"model.weights.h5 not found inside {SRC}")

    model.load_weights(str(weights_h5))
    print("   Weights loaded successfully.")

finally:
    shutil.rmtree(tmp_dir, ignore_errors=True)

# -- Step 3: Sanity-check prediction -----------------------------------------
print("\n[3/4] Running sanity-check prediction...")
dummy = np.random.rand(1, 224, 224, 3).astype(np.float32)
preds = model.predict(dummy, verbose=0)
top_idx  = int(np.argmax(preds[0]))
top_conf = float(preds[0][top_idx]) * 100
print(f"   Dummy prediction -> class {top_idx}  ({top_conf:.2f}%)")
print(f"   Output sums to  : {preds[0].sum():.6f}  (should be ~1.0)")

# -- Step 4: Save the migrated model -----------------------------------------
print(f"\n[4/4] Saving migrated model to {DST} ...")
model.save(str(DST))
print(f"   Saved ({DST.stat().st_size / 1_048_576:.1f} MB)")

# Quick reload test
print("\n[CHECK] Reload test...")
m2 = tf.keras.models.load_model(str(DST), compile=False)
print(f"   Reloaded: {m2.input_shape} -> {m2.output_shape}  OK")

print("\n(OK)  Migration complete!")
print(f"   New model: {DST}")
print("   Update MODEL_PATH in .env to point to model_v2.keras, OR")
print("   rename model_v2.keras -> model.keras after backing up the original.")
