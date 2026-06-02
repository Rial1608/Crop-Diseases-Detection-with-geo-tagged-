#!/usr/bin/env python
"""
Backend API Testing Script
Tests all endpoints of the Smart Crop Disease Detection API
"""

import requests
import json
import sys
from pathlib import Path
from typing import Dict, Any

# Configuration
API_BASE_URL = "http://localhost:8000"
TIMEOUT = 30

class APITester:
    def __init__(self, base_url: str = API_BASE_URL):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []

    def test_health_check(self) -> bool:
        """Test GET /health endpoint"""
        print("\n" + "="*60)
        print("TEST 1: Health Check Endpoint")
        print("="*60)
        
        try:
            url = f"{self.base_url}/health"
            print(f"📡 GET {url}")
            
            response = self.session.get(url, timeout=TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"📊 Response: {json.dumps(data, indent=2)}")
            
            self.test_results.append(("Health Check", True, response.status_code))
            return True
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.test_results.append(("Health Check", False, str(e)))
            return False

    def test_root_endpoint(self) -> bool:
        """Test GET / endpoint"""
        print("\n" + "="*60)
        print("TEST 2: Root Endpoint (API Info)")
        print("="*60)
        
        try:
            url = f"{self.base_url}/"
            print(f"📡 GET {url}")
            
            response = self.session.get(url, timeout=TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"📊 API Version: {data.get('version')}")
            print(f"📊 Available Endpoints:")
            for endpoint, description in data.get('endpoints', {}).items():
                print(f"   - {endpoint}: {description}")
            
            self.test_results.append(("Root Endpoint", True, response.status_code))
            return True
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.test_results.append(("Root Endpoint", False, str(e)))
            return False

    def test_predict_info(self) -> bool:
        """Test GET /api/predict/info endpoint"""
        print("\n" + "="*60)
        print("TEST 3: Predict Info Endpoint")
        print("="*60)
        
        try:
            url = f"{self.base_url}/api/predict/info"
            print(f"📡 GET {url}")
            
            response = self.session.get(url, timeout=TIMEOUT)
            response.raise_for_status()
            
            data = response.json()
            print(f"✅ Status: {response.status_code}")
            print(f"📊 Model Info:")
            print(f"   - Status: {data['model_info'].get('status')}")
            print(f"   - Total Diseases: {data['total_diseases']}")
            print(f"   - Supported Formats: {', '.join(data.get('supported_formats', []))}")
            print(f"   - Max File Size: {data['max_file_size_mb']}MB")
            print(f"   - Input Size: {data['input_size']}x{data['input_size']} pixels")
            
            if data['model_info'].get('total_params'):
                print(f"   - Total Parameters: {data['model_info']['total_params']:,}")
            
            self.test_results.append(("Predict Info", True, response.status_code))
            return True
            
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.test_results.append(("Predict Info", False, str(e)))
            return False

    def test_predict_with_image(self, image_path: str) -> bool:
        """Test POST /api/predict endpoint with image"""
        print("\n" + "="*60)
        print("TEST 4: Disease Prediction (with Image Upload)")
        print("="*60)
        
        if not Path(image_path).exists():
            print(f"❌ Image file not found: {image_path}")
            print(f"⚠️  Please provide a valid image path")
            print(f"   Usage: python test_backend.py <path_to_image>")
            self.test_results.append(("Disease Prediction", False, "Image not found"))
            return False
        
        try:
            url = f"{self.base_url}/api/predict"
            print(f"📡 POST {url}")
            print(f"📁 Image: {image_path}")
            
            with open(image_path, 'rb') as f:
                files = {'file': f}
                data = {
                    'latitude': 28.6139,
                    'longitude': 77.2090,
                }
                
                response = self.session.post(
                    url,
                    files=files,
                    data=data,
                    timeout=TIMEOUT
                )
                
            response.raise_for_status()
            
            result = response.json()
            print(f"✅ Status: {response.status_code}")
            
            if result.get('success'):
                pred = result['prediction']
                print(f"\n🎯 Primary Prediction:")
                print(f"   - Disease: {pred['disease_name']}")
                print(f"   - Class: {pred['disease_class']}")
                print(f"   - Confidence: {pred['confidence']:.2f}%")
                print(f"   - Is Diseased: {'Yes' if pred['is_diseased'] else 'No'}")
                
                if result['disease_info']:
                    info = result['disease_info']
                    print(f"\n📋 Disease Information:")
                    print(f"   - Causes: {info.get('causes', 'N/A')}")
                    print(f"   - Symptoms: {info.get('symptoms', 'N/A')}")
                    print(f"   - Prevention: {', '.join(info.get('prevention', []))}")
                    print(f"   - Treatment: {', '.join(info.get('treatment', []))}")
                
                if result['all_predictions']:
                    print(f"\n📊 Top Predictions:")
                    for i, pred in enumerate(result['all_predictions'][:5], 1):
                        print(f"   {i}. {pred['disease_name']} ({pred['confidence']:.2f}%)")
                
                if result.get('weather_data'):
                    weather = result['weather_data']
                    print(f"\n🌤️  Weather Data:")
                    print(f"   - Temperature: {weather.get('temperature', 'N/A')}°C")
                    print(f"   - Humidity: {weather.get('humidity', 'N/A')}%")
                    print(f"   - Rainfall: {weather.get('rainfall', 'N/A')}mm")
                
                if result.get('risk_analysis'):
                    risk = result['risk_analysis']
                    print(f"\n⚠️  Risk Analysis:")
                    print(f"   - Overall Score: {risk.get('overall_risk_score', 'N/A')}%")
                    print(f"   - Risk Level: {risk.get('risk_level', 'N/A')}")
                
                print(f"\n✅ Model Status: {'Loaded' if result['model_loaded'] else 'Demo Mode'}")
                
                self.test_results.append(("Disease Prediction", True, response.status_code))
                return True
            else:
                print(f"❌ Prediction failed: {result}")
                self.test_results.append(("Disease Prediction", False, "Prediction failed"))
                return False
                
        except requests.exceptions.RequestException as e:
            print(f"❌ HTTP Error: {str(e)}")
            self.test_results.append(("Disease Prediction", False, str(e)))
            return False
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.test_results.append(("Disease Prediction", False, str(e)))
            return False

    def test_invalid_image(self) -> bool:
        """Test error handling with invalid image"""
        print("\n" + "="*60)
        print("TEST 5: Error Handling (Invalid Image)")
        print("="*60)
        
        try:
            url = f"{self.base_url}/api/predict"
            print(f"📡 POST {url} (with invalid data)")
            
            # Create invalid image data
            invalid_data = b"This is not an image"
            files = {'file': ('invalid.txt', invalid_data)}
            
            response = self.session.post(url, files=files, timeout=TIMEOUT)
            
            print(f"✅ Status: {response.status_code}")
            print(f"📊 Response: {response.json()}")
            
            if response.status_code == 400:
                print("✅ Properly rejected invalid image")
                self.test_results.append(("Error Handling", True, response.status_code))
                return True
            else:
                print("⚠️  Unexpected status code")
                self.test_results.append(("Error Handling", False, f"Unexpected status: {response.status_code}"))
                return False
                
        except Exception as e:
            print(f"❌ Error: {str(e)}")
            self.test_results.append(("Error Handling", False, str(e)))
            return False

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("TEST SUMMARY")
        print("="*60)
        
        passed = sum(1 for _, success, _ in self.test_results if success)
        total = len(self.test_results)
        
        for test_name, success, detail in self.test_results:
            status = "✅ PASS" if success else "❌ FAIL"
            print(f"{status} | {test_name}: {detail}")
        
        print("="*60)
        print(f"Results: {passed}/{total} tests passed")
        print("="*60)
        
        if passed == total:
            print("\n🎉 All tests passed! Backend is working correctly.")
            return 0
        else:
            print(f"\n⚠️  {total - passed} test(s) failed. Check backend logs.")
            return 1

    def run_all_tests(self, image_path: str = None) -> int:
        """Run all tests"""
        print("\n" + "🌾"*30)
        print("Smart Crop Disease Detection - Backend API Tests")
        print("🌾"*30)
        print(f"API Base URL: {self.base_url}")
        
        try:
            # Test connection first
            print("\n⏳ Testing connection...")
            response = self.session.get(f"{self.base_url}/health", timeout=5)
            print("✅ Backend is running!")
        except Exception as e:
            print(f"❌ Cannot reach backend at {self.base_url}")
            print(f"   Error: {str(e)}")
            print(f"\n💡 Make sure backend is running:")
            print(f"   cd c:\\Project CDD\\backend")
            print(f"   python main.py")
            return 1
        
        # Run tests
        self.test_health_check()
        self.test_root_endpoint()
        self.test_predict_info()
        
        if image_path:
            self.test_predict_with_image(image_path)
        else:
            print("\n💡 To test disease prediction, provide an image path:")
            print(f"   python test_backend.py path/to/leaf_image.jpg")
        
        self.test_invalid_image()
        
        # Print summary
        return self.print_summary()


if __name__ == "__main__":
    # Parse command line arguments
    image_path = sys.argv[1] if len(sys.argv) > 1 else None
    
    # Run tests
    tester = APITester()
    exit_code = tester.run_all_tests(image_path)
    sys.exit(exit_code)
