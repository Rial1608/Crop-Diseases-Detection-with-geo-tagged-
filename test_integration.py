#!/usr/bin/env python3
"""
Comprehensive test script for React + FastAPI Crop Disease Detection
Tests the entire flow: Backend → API → Frontend
"""

import requests
import json
import sys
from pathlib import Path
from datetime import datetime

class ColoredOutput:
    GREEN = '\033[92m'
    RED = '\033[91m'
    YELLOW = '\033[93m'
    BLUE = '\033[94m'
    END = '\033[0m'
    
    @staticmethod
    def success(msg):
        print(f"{ColoredOutput.GREEN}✅ {msg}{ColoredOutput.END}")
    
    @staticmethod
    def error(msg):
        print(f"{ColoredOutput.RED}❌ {msg}{ColoredOutput.END}")
    
    @staticmethod
    def warning(msg):
        print(f"{ColoredOutput.YELLOW}⚠️  {msg}{ColoredOutput.END}")
    
    @staticmethod
    def info(msg):
        print(f"{ColoredOutput.BLUE}ℹ️  {msg}{ColoredOutput.END}")
    
    @staticmethod
    def header(msg):
        print(f"\n{ColoredOutput.BLUE}{'='*60}")
        print(f"{msg}")
        print(f"{'='*60}{ColoredOutput.END}\n")

class TestRunner:
    def __init__(self):
        self.backend_url = "http://localhost:8000"
        self.results = []
        self.passed = 0
        self.failed = 0
        
    def log_test(self, name, passed, message=""):
        status = "PASS" if passed else "FAIL"
        color = ColoredOutput.GREEN if passed else ColoredOutput.RED
        print(f"{color}[{status}]{ColoredOutput.END} {name}")
        if message:
            print(f"      {message}")
        
        if passed:
            self.passed += 1
        else:
            self.failed += 1
        
        self.results.append({
            "test": name,
            "passed": passed,
            "message": message,
            "timestamp": datetime.now().isoformat()
        })
    
    def test_backend_running(self):
        """Test 1: Check if backend is running"""
        ColoredOutput.header("TEST 1: Backend Connection")
        try:
            response = requests.get(f"{self.backend_url}/health", timeout=5)
            if response.status_code == 200:
                ColoredOutput.success("Backend is running")
                self.log_test("Backend Connection", True, "Status: 200")
                return True
            else:
                ColoredOutput.error(f"Backend returned status {response.status_code}")
                self.log_test("Backend Connection", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            ColoredOutput.error(f"Cannot reach backend: {str(e)}")
            print(f"   💡 Make sure backend is running: cd backend && python main.py")
            self.log_test("Backend Connection", False, str(e))
            return False
    
    def test_api_info(self):
        """Test 2: Get API information"""
        ColoredOutput.header("TEST 2: API Information")
        try:
            response = requests.get(f"{self.backend_url}/", timeout=5)
            if response.status_code == 200:
                data = response.json()
                ColoredOutput.success(f"API Version: {data.get('version')}")
                ColoredOutput.success(f"API Status: {data.get('status')}")
                print(f"   Available endpoints: {len(data.get('endpoints', {}))}")
                self.log_test("API Info", True)
                return True
            else:
                self.log_test("API Info", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("API Info", False, str(e))
            return False
    
    def test_model_info(self):
        """Test 3: Get model information"""
        ColoredOutput.header("TEST 3: Model Information")
        try:
            response = requests.get(f"{self.backend_url}/api/predict/info", timeout=5)
            if response.status_code == 200:
                data = response.json()
                model_status = data.get('model_info', {}).get('status', 'Unknown')
                total_diseases = data.get('total_diseases', 0)
                
                ColoredOutput.success(f"Model Status: {model_status}")
                ColoredOutput.success(f"Supported Diseases: {total_diseases}")
                ColoredOutput.success(f"Max File Size: {data.get('max_file_size_mb')}MB")
                
                # Check if model is loaded
                if "loaded" in model_status.lower():
                    print(f"   Model Parameters: {data.get('model_info', {}).get('total_params', 'N/A')}")
                    print(f"   Input Size: {data.get('input_size')}x{data.get('input_size')}")
                
                self.log_test("Model Info", True)
                return True
            else:
                self.log_test("Model Info", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            self.log_test("Model Info", False, str(e))
            return False
    
    def test_predict_with_image(self, image_path):
        """Test 4: Prediction with image"""
        ColoredOutput.header("TEST 4: Disease Prediction")
        
        if not Path(image_path).exists():
            ColoredOutput.error(f"Image not found: {image_path}")
            self.log_test("Prediction", False, "Image file not found")
            return False
        
        try:
            with open(image_path, 'rb') as f:
                files = {'file': f}
                data = {
                    'latitude': 28.6139,
                    'longitude': 77.2090,
                }
                
                ColoredOutput.info(f"Uploading: {Path(image_path).name}")
                response = requests.post(
                    f"{self.backend_url}/api/predict",
                    files=files,
                    data=data,
                    timeout=60
                )
            
            if response.status_code == 200:
                result = response.json()
                
                # Check response structure
                if result.get('success'):
                    pred = result.get('prediction', {})
                    ColoredOutput.success(f"Prediction: {pred.get('disease_name')}")
                    ColoredOutput.success(f"Confidence: {pred.get('confidence'):.2f}%")
                    ColoredOutput.success(f"Is Diseased: {pred.get('is_diseased')}")
                    
                    # Check if model was loaded
                    if result.get('model_loaded'):
                        ColoredOutput.success("Model loaded successfully")
                    else:
                        ColoredOutput.warning("Model in demo mode")
                    
                    self.log_test("Prediction", True, f"Disease: {pred.get('disease_name')}")
                    return True
                else:
                    error_msg = result.get('error', 'Unknown error')
                    self.log_test("Prediction", False, error_msg)
                    return False
            else:
                self.log_test("Prediction", False, f"Status: {response.status_code}")
                print(f"   Response: {response.text}")
                return False
                
        except Exception as e:
            self.log_test("Prediction", False, str(e))
            return False
    
    def test_cors_headers(self):
        """Test 5: CORS configuration"""
        ColoredOutput.header("TEST 5: CORS Headers")
        try:
            response = requests.options(f"{self.backend_url}/api/predict", timeout=5)
            
            cors_headers = {
                'Access-Control-Allow-Origin': response.headers.get('Access-Control-Allow-Origin', 'Not set'),
                'Access-Control-Allow-Methods': response.headers.get('Access-Control-Allow-Methods', 'Not set'),
                'Access-Control-Allow-Headers': response.headers.get('Access-Control-Allow-Headers', 'Not set'),
            }
            
            for header, value in cors_headers.items():
                if value != 'Not set':
                    ColoredOutput.success(f"{header}: {value[:50]}...")
                else:
                    ColoredOutput.warning(f"{header}: {value}")
            
            self.log_test("CORS Headers", True)
            return True
        except Exception as e:
            self.log_test("CORS Headers", False, str(e))
            return False
    
    def test_frontend_access(self):
        """Test 6: Frontend accessibility"""
        ColoredOutput.header("TEST 6: Frontend Access")
        try:
            response = requests.get("http://localhost:5173", timeout=5)
            if response.status_code == 200:
                ColoredOutput.success("Frontend is accessible")
                self.log_test("Frontend Access", True)
                return True
            else:
                self.log_test("Frontend Access", False, f"Status: {response.status_code}")
                return False
        except Exception as e:
            ColoredOutput.warning(f"Frontend may not be running: {str(e)}")
            print("   💡 Start frontend: npm run dev (in frontend folder)")
            self.log_test("Frontend Access", False, str(e))
            return False
    
    def print_summary(self):
        """Print test summary"""
        ColoredOutput.header("TEST SUMMARY")
        
        total = self.passed + self.failed
        percentage = (self.passed / total * 100) if total > 0 else 0
        
        print(f"Total Tests: {total}")
        print(f"Passed: {self.passed} ✅")
        print(f"Failed: {self.failed} ❌")
        print(f"Success Rate: {percentage:.1f}%\n")
        
        if self.failed == 0:
            ColoredOutput.success("🎉 All tests passed! System is working correctly.")
            return True
        else:
            ColoredOutput.error(f"⚠️  {self.failed} test(s) failed. See details above.")
            return False
    
    def run_all_tests(self, image_path=None):
        """Run all tests"""
        ColoredOutput.header("🌾 Crop Disease Detection - Complete System Test")
        
        print("Testing: React Frontend + FastAPI Backend Integration\n")
        
        # Core tests
        backend_ok = self.test_backend_running()
        
        if not backend_ok:
            ColoredOutput.error("Backend is not running. Cannot proceed with other tests.")
            return False
        
        self.test_api_info()
        self.test_model_info()
        self.test_cors_headers()
        
        # Image prediction test (if image provided)
        if image_path:
            self.test_predict_with_image(image_path)
        else:
            ColoredOutput.info("Skipping image prediction test (no image provided)")
            print("   💡 To test predictions: python test_integration.py path/to/image.jpg\n")
        
        # Frontend test
        self.test_frontend_access()
        
        # Print summary
        success = self.print_summary()
        return success

def main():
    import argparse
    
    parser = argparse.ArgumentParser(description='Test Crop Disease Detection System')
    parser.add_argument('--image', help='Path to test image')
    parser.add_argument('--no-image', action='store_true', help='Skip image tests')
    
    args = parser.parse_args()
    
    runner = TestRunner()
    
    image_path = None
    if args.image and not args.no_image:
        image_path = args.image
    elif len(sys.argv) > 1 and not sys.argv[1].startswith('--'):
        image_path = sys.argv[1]
    
    success = runner.run_all_tests(image_path)
    sys.exit(0 if success else 1)

if __name__ == '__main__':
    main()
