"""
Disease model wrapper for easy loading and inference
"""
import os
import json
from pathlib import Path
import numpy as np

class DiseaseModelLoader:
    """Load and manage disease detection model."""
    
    def __init__(self, model_path="./model/model.h5"):
        self.model_path = model_path
        self.model = None
        self.class_names = None
        self.is_loaded = False
        self.tensorflow_available = False
    
    def load(self):
        """Load model from disk."""
        try:
            import tensorflow as tf
            self.tensorflow_available = True
            
            if os.path.exists(self.model_path):
                self.model = tf.keras.models.load_model(self.model_path)
                print(f"✓ Disease model loaded from {self.model_path}")
                
                # Try to load class names
                class_names_path = Path(self.model_path).parent / "class_names.json"
                if os.path.exists(class_names_path):
                    with open(class_names_path, 'r') as f:
                        self.class_names = json.load(f)
                    print(f"✓ Class names loaded ({len(self.class_names)} classes)")
                
                self.is_loaded = True
                return True
            else:
                print(f"⚠️ Model file not found at {self.model_path}")
                print("ℹ️ Using DEMO MODE - returning mock predictions")
                self._load_demo_mode()
                return False
        
        except ImportError:
            print("⚠️ TensorFlow not available on this Python version")
            print("ℹ️ Using DEMO MODE - returning mock predictions")
            self._load_demo_mode()
            return False
        
        except Exception as e:
            print(f"❌ Error loading model: {str(e)}")
            print("ℹ️ Using DEMO MODE - returning mock predictions")
            self._load_demo_mode()
            return False
    
    def _load_demo_mode(self):
        """Load demo mode for testing without actual model."""
        self.is_loaded = False
        self.class_names = [
            "Apple___Apple_scab", "Apple___Black_rot", "Apple___Cedar_apple_rust",
            "Apple___healthy", "Blueberry___healthy", "Cherry___Powdery_mildew",
            "Corn___Cercospora_leaf_spot", "Corn___Common_rust", "Corn___Northern_Leaf_Blight",
            "Corn___healthy", "Grape___Black_rot", "Grape___Esca",
            "Grape___Leaf_blight", "Grape___healthy", "Orange___Haunglongbing",
            "Peach___Bacterial_spot", "Peach___healthy", "Pepper___Bacterial_spot",
            "Pepper___healthy", "Potato___Early_blight", "Potato___Late_blight",
            "Potato___healthy", "Raspberry___healthy", "Soybean___Septoria_brown_spot",
            "Squash___Powdery_mildew", "Strawberry___Leaf_scorch", "Strawberry___healthy",
            "Tomato___Bacterial_spot", "Tomato___Early_blight", "Tomato___Late_blight",
            "Tomato___Leaf_Mold", "Tomato___Septoria_leaf_spot", "Tomato___Spider_mites",
            "Tomato___Target_Spot", "Tomato___Tomato_Yellow_Leaf_Curl_Virus",
            "Tomato___Tomato_mosaic_virus", "Tomato___healthy"
        ]
        print(f"✓ Demo mode loaded ({len(self.class_names)} disease classes)")
    
    def get_model(self):
        """Get loaded model."""
        return self.model
    
    def get_class_names(self):
        """Get loaded class names."""
        return self.class_names or []
    
    def predict(self, image_array):
        """Make prediction on image."""
        if not self.class_names:
            print("❌ No class names loaded")
            return []
        
        if self.model is None:
            # Demo mode: return mock prediction
            print("📊 Using DEMO MODE prediction")
            predictions = np.random.dirichlet(np.ones(len(self.class_names))) * 0.001
            predictions[0] = np.random.uniform(0.6, 0.99)
            return sorted(
                [(name, float(conf)) for name, conf in zip(self.class_names, predictions)],
                key=lambda x: x[1],
                reverse=True
            )[:5]
        
        try:
            # Add batch dimension if needed
            if len(image_array.shape) == 3:
                image_array = np.expand_dims(image_array, axis=0)
            
            # Run prediction
            predictions = self.model.predict(image_array)
            
            # Get top 5 predictions
            top_indices = np.argsort(predictions[0])[::-1][:5]
            results = [
                (self.class_names[idx], float(predictions[0][idx]))
                for idx in top_indices
            ]
            return results
        except Exception as e:
            print(f"❌ Prediction error: {e}")
            return []
