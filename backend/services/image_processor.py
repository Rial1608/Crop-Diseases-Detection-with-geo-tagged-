"""
Image processing service for disease detection
"""
import io
import numpy as np
from PIL import Image
from typing import Tuple, Optional
from utils.constants import IMAGE_SIZE, IMAGE_MAX_SIZE_MB, ALLOWED_EXTENSIONS
from utils.helpers import crop_to_square, allowed_file

class ImageProcessor:
    """Process and prepare images for disease detection."""
    
    def __init__(self):
        self.target_size = IMAGE_SIZE
        self.max_size_mb = IMAGE_MAX_SIZE_MB
    
    def validate_image(self, file_content: bytes, filename: str) -> Tuple[bool, str]:
        """Validate image file."""
        # Check file size
        size_mb = len(file_content) / (1024 * 1024)
        if size_mb > self.max_size_mb:
            return False, f"File size exceeds {self.max_size_mb}MB limit"
        
        # Check file extension
        if not allowed_file(filename):
            return False, "Invalid file type. Allowed: jpg, jpeg, png, gif, bmp"
        
        # Try to open as image
        try:
            image = Image.open(io.BytesIO(file_content))
            _ = image.verify()
            return True, "Valid image"
        except Exception as e:
            return False, f"Invalid image file: {str(e)}"
    
    def load_image(self, file_content: bytes) -> Optional[Image.Image]:
        """Load image from bytes."""
        try:
            image = Image.open(io.BytesIO(file_content))
            if image.mode == 'RGBA':
                # Convert RGBA to RGB
                background = Image.new('RGB', image.size, (255, 255, 255))
                background.paste(image, mask=image.split()[3])
                image = background
            elif image.mode != 'RGB':
                image = image.convert('RGB')
            return image
        except Exception as e:
            print(f"Error loading image: {str(e)}")
            return None
    
    def preprocess_image(self, image: Image.Image) -> np.ndarray:
        """Preprocess image for model prediction."""
        # Crop to square
        image = crop_to_square(image)
        
        # Resize to target size
        image = image.resize((self.target_size, self.target_size), Image.Resampling.LANCZOS)
        
        # Convert to numpy array
        image_array = np.array(image, dtype=np.float32)
        
        # Normalize to 0-1 range
        image_array = image_array / 255.0
        
        return image_array
    
    def preprocess_batch(self, images: list) -> np.ndarray:
        """Preprocess a batch of images."""
        preprocessed = []
        for image in images:
            preprocessed.append(self.preprocess_image(image))
        return np.array(preprocessed)
    
    def augment_image(self, image: Image.Image) -> Image.Image:
        """Apply light data augmentation."""
        # Rotation
        angle = np.random.uniform(-15, 15)
        image = image.rotate(angle, expand=False)
        
        # Brightness
        brightness_factor = np.random.uniform(0.8, 1.2)
        image = Image.new('RGB', image.size)
        enhancer = Image.Image()  # This would need proper implementation
        
        return image
    
    def get_image_info(self, image: Image.Image) -> dict:
        """Get image information."""
        return {
            "size": image.size,
            "mode": image.mode,
            "format": image.format,
        }
    
    def save_image_preview(self, image: Image.Image, output_path: str) -> bool:
        """Save image preview as thumbnail."""
        try:
            thumbnail = image.copy()
            thumbnail.thumbnail((200, 200), Image.Resampling.LANCZOS)
            thumbnail.save(output_path, "JPEG", quality=85)
            return True
        except Exception as e:
            print(f"Error saving preview: {str(e)}")
            return False
