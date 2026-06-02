"""
Constants and configuration for the disease detection system
"""
import json
import os
from pathlib import Path

# ── Load class indices from class_indices.json ──────────────────────────────────
# This file maps class names to indices, created during model training.
# We reverse it to get index -> class_name for predictions.
_CLASS_INDICES_PATH = Path(__file__).resolve().parent.parent / "model" / "class_indices.json"

def _load_class_names() -> list:
    """
    Load class names from class_indices.json and reverse the mapping.
    Returns a list where index i contains the class name for prediction index i.
    """
    if _CLASS_INDICES_PATH.exists():
        try:
            with open(_CLASS_INDICES_PATH, "r") as f:
                class_indices = json.load(f)
            
            # class_indices is: {class_name: index}
            # We need: [class_name for index 0, class_name for index 1, ...]
            max_index = max(int(v) for v in class_indices.values())
            class_names = [""] * (max_index + 1)
            
            for class_name, idx in class_indices.items():
                class_names[int(idx)] = class_name
            
            print(f"[OK] Loaded {len(class_names)} class names from {_CLASS_INDICES_PATH}")
            print(f"[OK] Classes: {class_names}")
            return class_names
        except Exception as e:
            print(f"[ERROR] Failed to load class_indices.json: {e}")
            print(f"[WARN] Using fallback classes")
            return _get_fallback_classes()
    
    print(f"[WARN] class_indices.json not found at {_CLASS_INDICES_PATH}")
    print(f"[WARN] Using fallback classes")
    return _get_fallback_classes()

def _get_fallback_classes() -> list:
    """Fallback class list (16 classes from the trained model)."""
    return [
        "Rice_Bacterial_leaf_blight",
        "Rice_Brown_spot",
        "Rice_Leaf_smut",
        "Tomato_Tomato__Bacterial_spot",
        "Tomato_Tomato__Early_blight",
        "Tomato_Tomato__Late_blight",
        "Tomato_Tomato__Leaf_Mold",
        "Tomato_Tomato__Septoria_leaf_spot",
        "Tomato_Tomato__Spider_mites_Two-spotted_spider_mite",
        "Tomato_Tomato__Target_Spot",
        "Tomato_Tomato__Tomato_Yellow_Leaf_Curl_Virus",
        "Tomato_Tomato__Tomato_mosaic_virus",
        "Tomato_Tomato__healthy",
        "Wheat_Healthy",
        "Wheat_septoria",
        "Wheat_stripe_rust",
    ]

# Load once at import time
CLASS_NAMES: list = _load_class_names()
NUM_CLASSES = len(CLASS_NAMES)

def get_treatment(class_name: str) -> dict:
    """Look up treatment info for a class name."""
    # Direct match first
    if class_name in DISEASE_TREATMENTS:
        return DISEASE_TREATMENTS[class_name]
    
    # Fuzzy match – try substring matching
    class_lower = class_name.lower().replace(" ", "_")
    for key in DISEASE_TREATMENTS.keys():
        key_lower = key.lower().replace(" ", "_")
        if class_lower in key_lower or key_lower in class_lower:
            return DISEASE_TREATMENTS[key]
    
    return DEFAULT_TREATMENT

# ── Disease Treatment Information (16 classes from trained model) ───────────────
DISEASE_TREATMENTS = {
    "Rice_Bacterial_leaf_blight": {
        "name": "Rice Bacterial Leaf Blight",
        "causes": "Bacterial infection caused by Xanthomonas oryzae pv. oryzae",
        "symptoms": "Watery, light green lesions on leaves that turn tan/brown with yellow halo",
        "prevention": ["Use resistant varieties", "Avoid excessive nitrogen", "Control insect vectors"],
        "treatment": ["Apply copper-based bactericide", "Remove infected tillers", "Improve field drainage"],
        "risk_factors": ["High humidity", "Warm temperatures", "Wet conditions"],
    },
    "Rice_Brown_spot": {
        "name": "Rice Brown Spot",
        "causes": "Fungal infection caused by Bipolaris oryzae",
        "symptoms": "Small brown or circular lesions with purple/brown border on leaves",
        "prevention": ["Proper nutrient balance", "Crop rotation", "Use resistant varieties"],
        "treatment": ["Apply mancozeb fungicide", "Improve drainage", "Remove infected debris"],
        "risk_factors": ["High humidity", "Poor drainage", "Nutrient deficiency"],
    },
    "Rice_Leaf_smut": {
        "name": "Rice Leaf Smut",
        "causes": "Fungal infection caused by Entyloma oryzae",
        "symptoms": "Small grayish-white pustules on leaves that turn brownish",
        "prevention": ["Use resistant varieties", "Seed treatment", "Field sanitation"],
        "treatment": ["Apply sulfur fungicide", "Remove infected leaves", "Improve air circulation"],
        "risk_factors": ["High humidity", "Cool weather", "Seed borne pathogen"],
    },
    "Tomato_Tomato__Bacterial_spot": {
        "name": "Tomato Bacterial Spot",
        "causes": "Bacterial infection caused by Xanthomonas species",
        "symptoms": "Small, dark, water-soaked spots on leaves, raised scabby spots on fruit",
        "prevention": ["Use disease-free seed", "Avoid overhead watering", "Crop rotation 2-3 years"],
        "treatment": ["Apply copper-based bactericide", "Remove infected plants", "Improve air circulation"],
        "risk_factors": ["Warm, wet weather", "Overhead irrigation", "Wind-driven rain"],
    },
    "Tomato_Tomato__Early_blight": {
        "name": "Tomato Early Blight",
        "causes": "Fungal infection caused by Alternaria solani",
        "symptoms": "Circular brown lesions with target-like concentric rings on lower leaves",
        "prevention": ["Space plants properly", "Remove lower leaves", "Apply mulch"],
        "treatment": ["Spray with mancozeb or chlorothalonil", "Remove infected leaves", "Improve drainage"],
        "risk_factors": ["Overhead irrigation", "High humidity", "Poor ventilation"],
    },
    "Tomato_Tomato__Late_blight": {
        "name": "Tomato Late Blight",
        "causes": "Oomycete pathogen Phytophthora infestans",
        "symptoms": "Large, irregular water-soaked gray-green spots on leaves and stems",
        "prevention": ["Use resistant varieties", "Ensure good drainage", "Apply copper fungicide"],
        "treatment": ["Remove affected leaves immediately", "Apply chlorothalonil", "Improve air circulation"],
        "risk_factors": ["Cool, wet weather", "Dense foliage", "Poor air flow"],
    },
    "Tomato_Tomato__Leaf_Mold": {
        "name": "Tomato Leaf Mold",
        "causes": "Fungal infection caused by Passalora fulva (Cladosporium fulvum)",
        "symptoms": "Pale green/yellow spots on upper leaves, olive-green velvety mold underneath",
        "prevention": ["Improve ventilation", "Reduce humidity", "Use resistant varieties"],
        "treatment": ["Apply chlorothalonil or mancozeb", "Remove infected leaves", "Increase air flow"],
        "risk_factors": ["High humidity >85%", "Poor ventilation", "Greenhouse conditions"],
    },
    "Tomato_Tomato__Septoria_leaf_spot": {
        "name": "Tomato Septoria Leaf Spot",
        "causes": "Fungal infection caused by Septoria lycopersici",
        "symptoms": "Small circular spots with dark borders and gray centers, dark pycnidia visible",
        "prevention": ["Crop rotation", "Remove old plant debris", "Mulch around plants"],
        "treatment": ["Apply copper or mancozeb fungicide", "Remove lower infected leaves", "Avoid overhead watering"],
        "risk_factors": ["Wet weather", "Warm temperatures", "Splashing water"],
    },
    "Tomato_Tomato__Spider_mites_Two-spotted_spider_mite": {
        "name": "Tomato Spider Mites",
        "causes": "Infestation by Tetranychus urticae (Two-spotted spider mite)",
        "symptoms": "Stippled/speckled yellowing leaves, fine webbing, bronzing of leaves",
        "prevention": ["Maintain adequate humidity", "Avoid dusty conditions", "Encourage predatory mites"],
        "treatment": ["Apply insecticidal soap or neem oil", "Use miticide if severe", "Release predatory mites"],
        "risk_factors": ["Hot, dry weather", "Dusty conditions", "Overuse of broad-spectrum insecticides"],
    },
    "Tomato_Tomato__Target_Spot": {
        "name": "Tomato Target Spot",
        "causes": "Fungal infection caused by Corynespora cassiicola",
        "symptoms": "Circular brown spots with concentric rings and yellow halos on leaves",
        "prevention": ["Improve air circulation", "Crop rotation", "Avoid excessive nitrogen"],
        "treatment": ["Apply chlorothalonil or mancozeb", "Remove infected tissue", "Reduce leaf wetness"],
        "risk_factors": ["Warm, humid weather", "Dense canopy", "Extended leaf wetness"],
    },
    "Tomato_Tomato__Tomato_Yellow_Leaf_Curl_Virus": {
        "name": "Tomato Yellow Leaf Curl Virus",
        "causes": "Viral infection transmitted by whitefly (Bemisia tabaci)",
        "symptoms": "Severe leaf curling, yellowing, stunted growth, reduced fruit set",
        "prevention": ["Control whitefly populations", "Use resistant varieties", "Use reflective mulches"],
        "treatment": ["No cure – remove infected plants", "Control whiteflies with insecticides", "Use netting barriers"],
        "risk_factors": ["Whitefly presence", "Warm climate", "Nearby infected plants"],
    },
    "Tomato_Tomato__Tomato_mosaic_virus": {
        "name": "Tomato Mosaic Virus",
        "causes": "Viral infection (ToMV) spread by contact, tools, and seed",
        "symptoms": "Light/dark green mottled mosaic pattern on leaves, leaf curling, stunted growth",
        "prevention": ["Use resistant varieties", "Disinfect tools with 10% bleach", "Wash hands before handling plants"],
        "treatment": ["No cure – remove infected plants", "Disinfect all tools", "Do not save seed from infected plants"],
        "risk_factors": ["Mechanical transmission", "Contaminated seed", "Tobacco users handling plants"],
    },
    "Tomato_Tomato__healthy": {
        "name": "Healthy Tomato",
        "causes": "N/A – Plant is healthy",
        "symptoms": "No disease symptoms detected",
        "prevention": ["Regular monitoring", "Proper spacing and staking", "Balanced watering"],
        "treatment": ["No treatment needed", "Continue regular care"],
        "risk_factors": ["Seasonal weather changes"],
    },
    "Wheat_Healthy": {
        "name": "Healthy Wheat",
        "causes": "N/A – Plant is healthy",
        "symptoms": "No disease symptoms detected",
        "prevention": ["Proper irrigation", "Balanced fertilization", "Weed management"],
        "treatment": ["No treatment needed", "Continue regular care"],
        "risk_factors": ["Seasonal weather changes"],
    },
    "Wheat_septoria": {
        "name": "Wheat Septoria Leaf Blotch",
        "causes": "Fungal infection caused by Septoria tritici",
        "symptoms": "Dark brown to gray lesions on leaves with pycnidia visible",
        "prevention": ["Crop rotation", "Use resistant varieties", "Remove infected debris"],
        "treatment": ["Apply propiconazole or tebuconazole", "Remove infected leaves", "Improve drainage"],
        "risk_factors": ["Wet weather", "Dense crop", "Poor air circulation"],
    },
    "Wheat_stripe_rust": {
        "name": "Wheat Stripe Rust",
        "causes": "Fungal infection caused by Puccinia striiformis",
        "symptoms": "Yellow/orange pustules in stripes on leaves, severely stunted plants",
        "prevention": ["Plant resistant varieties", "Early monitoring", "Avoid crowding"],
        "treatment": ["Apply triazole fungicide early", "Remove infected plants", "Improve air flow"],
        "risk_factors": ["Cool weather with moisture", "Susceptible varieties", "High altitude areas"],
    },
}

# Universal fallback for any class not explicitly listed
DEFAULT_TREATMENT = {
    "name": "Unknown Disease",
    "causes": "Unknown – requires expert analysis",
    "symptoms": "Varies – consult a plant pathologist",
    "prevention": ["Monitor crops regularly", "Maintain field hygiene", "Use disease-free planting material"],
    "treatment": ["Consult an agricultural expert", "Send sample to local lab for diagnosis"],
    "risk_factors": ["Various environmental conditions"],
}

# ── Risk Thresholds ────────────────────────────────────────────────────────────
HUMIDITY_THRESHOLD_HIGH = 85
TEMPERATURE_MIN_RANGE = 18   # Celsius
TEMPERATURE_MAX_RANGE = 27   # Celsius
RAINFALL_THRESHOLD = 2.5     # mm

# ── Risk Levels ────────────────────────────────────────────────────────────────
RISK_LEVELS = {
    "LOW":    {"range": (0, 33),  "color": "#22c55e"},
    "MEDIUM": {"range": (33, 67), "color": "#eab308"},
    "HIGH":   {"range": (67, 100),"color": "#ef4444"},
}

# ── Geographic Risk Zones ──────────────────────────────────────────────────────
GEOGRAPHIC_ZONES = [
    {"name": "Zone Alpha", "lat": 28.6139, "lng": 77.2090, "risk": "HIGH",   "radius": 5},
    {"name": "Zone Beta",  "lat": 28.5244, "lng": 77.1855, "risk": "MEDIUM", "radius": 3},
    {"name": "Zone Gamma", "lat": 28.6900, "lng": 77.2500, "risk": "LOW",    "radius": 4},
]

# ── Image Configuration ───────────────────────────────────────────────────────
IMAGE_SIZE = 224
IMAGE_MAX_SIZE_MB = 10
ALLOWED_EXTENSIONS = {".jpg", ".jpeg", ".png", ".gif", ".bmp"}

# ── Model Configuration ───────────────────────────────────────────────────────
MODEL_CONFIDENCE_THRESHOLD = 60.0   # percent – below this show "uncertain" warning
TOP_K_PREDICTIONS = 5

# ── Weather Risk Multipliers ──────────────────────────────────────────────────
WEATHER_RISK_MULTIPLIER = {
    "high_humidity": 1.3,
    "optimal_temperature": 1.25,
    "rainfall": 1.2,
}
# ── Treatment lookup helper ───────────────────────────────────────────────────
# Function is already defined at the top of the file.
