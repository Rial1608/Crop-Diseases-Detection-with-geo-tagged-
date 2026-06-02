"""
CNN Model Architecture and Training Script
This script trains a CNN model for crop disease detection using PlantVillage dataset

To use this script:
1. Download PlantVillage dataset from kaggle
2. Set DATA_DIR to your dataset path
3. Run: python training_script.py

Dataset: https://www.kaggle.com/datasets/arjunashok33/plant-village
Structure:
    data/
        Apple___Apple_scab/
        Apple___Black_rot/
        ... (all disease classes)
"""

import os
import numpy as np
import tensorflow as tf
from tensorflow import keras
from tensorflow.keras import layers, models
from tensorflow.keras.preprocessing.image import ImageDataGenerator
from sklearn.model_selection import train_test_split
from pathlib import Path
import json

# Configuration
DATA_DIR = "./data/PlantVillage"  # Update with your dataset path
MODEL_OUTPUT_PATH = "./models/disease_model.h5"
MODEL_JSON_PATH = "./models/model_config.json"
IMAGE_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 50
VALIDATION_SPLIT = 0.2
TEST_SPLIT = 0.1

class PlantDiseaseDetectionModel:
    """Build and train CNN model for plant disease detection."""
    
    def __init__(self, image_size=224, num_classes=38):
        self.image_size = image_size
        self.num_classes = num_classes
        self.model = None
    
    def build_model(self):
        """Build CNN model architecture."""
        model = models.Sequential([
            # Block 1
            layers.Conv2D(32, (3, 3), activation='relu', padding='same',
                         input_shape=(self.image_size, self.image_size, 3)),
            layers.BatchNormalization(),
            layers.Conv2D(32, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Block 2
            layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.Conv2D(64, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Block 3
            layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.Conv2D(128, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Block 4
            layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.Conv2D(256, (3, 3), activation='relu', padding='same'),
            layers.BatchNormalization(),
            layers.MaxPooling2D((2, 2)),
            layers.Dropout(0.25),
            
            # Global Average Pooling
            layers.GlobalAveragePooling2D(),
            
            # Dense layers
            layers.Dense(512, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.5),
            
            layers.Dense(256, activation='relu'),
            layers.BatchNormalization(),
            layers.Dropout(0.5),
            
            # Output layer
            layers.Dense(self.num_classes, activation='softmax'),
        ])
        
        self.model = model
        return model
    
    def compile_model(self, learning_rate=0.001):
        """Compile model."""
        optimizer = keras.optimizers.Adam(learning_rate=learning_rate)
        
        self.model.compile(
            optimizer=optimizer,
            loss='categorical_crossentropy',
            metrics=['accuracy', keras.metrics.TopKCategoricalAccuracy(k=5, name='top_5_accuracy')],
        )
    
    def summary(self):
        """Print model summary."""
        if self.model:
            self.model.summary()
    
    def train(self, X_train, y_train, X_val, y_val, epochs=50):
        """Train the model."""
        # Data augmentation
        train_datagen = ImageDataGenerator(
            rotation_range=20,
            width_shift_range=0.2,
            height_shift_range=0.2,
            horizontal_flip=True,
            zoom_range=0.2,
            shear_range=0.15,
            fill_mode='nearest',
        )
        
        # Callbacks
        callbacks = [
            keras.callbacks.EarlyStopping(
                monitor='val_loss',
                patience=5,
                restore_best_weights=True,
                verbose=1,
            ),
            keras.callbacks.ReduceLROnPlateau(
                monitor='val_loss',
                factor=0.5,
                patience=3,
                min_lr=1e-7,
                verbose=1,
            ),
            keras.callbacks.ModelCheckpoint(
                MODEL_OUTPUT_PATH,
                monitor='val_accuracy',
                save_best_only=True,
                verbose=1,
            ),
        ]
        
        # Train
        history = self.model.fit(
            train_datagen.flow(X_train, y_train, batch_size=BATCH_SIZE),
            validation_data=(X_val, y_val),
            epochs=epochs,
            callbacks=callbacks,
            verbose=1,
        )
        
        return history
    
    def save_model(self, filepath):
        """Save model to file."""
        if self.model:
            self.model.save(filepath)
            print(f"✓ Model saved to {filepath}")
    
    def load_model(self, filepath):
        """Load model from file."""
        self.model = keras.models.load_model(filepath)
        print(f"✓ Model loaded from {filepath}")


def load_and_preprocess_data(data_dir, image_size=224):
    """Load and preprocess image data from directory."""
    print(f"📂 Loading data from {data_dir}...")
    
    images = []
    labels = []
    class_names = sorted(os.listdir(data_dir))
    class_to_idx = {cls: idx for idx, cls in enumerate(class_names)}
    
    total_images = 0
    for class_name in class_names:
        class_dir = os.path.join(data_dir, class_name)
        if not os.path.isdir(class_dir):
            continue
        
        print(f"  Loading {class_name}...", end=" ")
        
        for image_file in os.listdir(class_dir):
            if image_file.lower().endswith(('.jpg', '.jpeg', '.png')):
                try:
                    img_path = os.path.join(class_dir, image_file)
                    img = keras.preprocessing.image.load_img(img_path, target_size=(image_size, image_size))
                    img_array = keras.preprocessing.image.img_to_array(img) / 255.0
                    
                    images.append(img_array)
                    labels.append(class_to_idx[class_name])
                    total_images += 1
                except Exception as e:
                    print(f"Error loading {img_path}: {str(e)}")
        
        print(f"✓ ({len([l for l in labels if l == class_to_idx[class_name]]))} images)")
    
    print(f"\n✓ Loaded {total_images} images from {len(class_names)} classes\n")
    
    X = np.array(images)
    y = keras.utils.to_categorical(labels, num_classes=len(class_names))
    
    return X, y, class_names


def main():
    """Main training script."""
    print("🌾 Smart Crop Disease Detection - Model Training")
    print("=" * 50)
    
    # Check if data exists
    if not os.path.exists(DATA_DIR):
        print(f"❌ Data directory not found: {DATA_DIR}")
        print("\nPlease download PlantVillage dataset from:")
        print("https://www.kaggle.com/datasets/arjunashok33/plant-village")
        print(f"\nThen place it in: {DATA_DIR}")
        print("\nDataset structure should be:")
        print("  data/PlantVillage/")
        print("    Apple___Apple_scab/")
        print("    Apple___Black_rot/")
        print("    ... (all disease classes)")
        return
    
    # Create output directory
    os.makedirs("./models", exist_ok=True)
    
    # Load data
    X, y, class_names = load_and_preprocess_data(DATA_DIR, IMAGE_SIZE)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=TEST_SPLIT, random_state=42, stratify=np.argmax(y, axis=1)
    )
    X_train, X_val, y_train, y_val = train_test_split(
        X_train, y_train, test_size=VALIDATION_SPLIT, random_state=42, stratify=np.argmax(y_train, axis=1)
    )
    
    print(f"✓ Data split: Train={X_train.shape[0]}, Val={X_val.shape[0]}, Test={X_test.shape[0]}")
    
    # Build model
    print("\n🏗️  Building model...")
    model_builder = PlantDiseaseDetectionModel(image_size=IMAGE_SIZE, num_classes=len(class_names))
    model_builder.build_model()
    model_builder.compile_model()
    model_builder.summary()
    
    # Train model
    print("\n🚀 Training model...")
    history = model_builder.train(X_train, y_train, X_val, y_val, epochs=EPOCHS)
    
    # Evaluate on test set
    print("\n📊 Evaluating on test set...")
    test_loss, test_accuracy, test_top5 = model_builder.model.evaluate(X_test, y_test, verbose=0)
    print(f"Test Accuracy: {test_accuracy:.4f}")
    print(f"Test Top-5 Accuracy: {test_top5:.4f}")
    
    # Save model
    model_builder.save_model(MODEL_OUTPUT_PATH)
    
    # Save class names
    with open("./models/class_names.json", "w") as f:
        json.dump(class_names, f)
    
    print("\n✅ Training completed successfully!")
    print(f"📁 Model saved to: {MODEL_OUTPUT_PATH}")
    print(f"📁 Class names saved to: ./models/class_names.json")


if __name__ == "__main__":
    main()
