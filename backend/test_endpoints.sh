#!/bin/bash
# Quick API Testing Examples using cURL
# These commands can be used directly in terminal to test the FastAPI backend

# ====================================================================
# 1. HEALTH CHECK - Verify backend is running
# ====================================================================
# curl http://localhost:8000/health
# Expected: {"status": "healthy", "version": "1.0.0"}

# ====================================================================
# 2. ROOT ENDPOINT - Get API information
# ====================================================================
# curl http://localhost:8000/
# Expected: API version, available endpoints, status

# ====================================================================
# 3. PREDICT INFO - Get model details
# ====================================================================
# curl http://localhost:8000/api/predict/info
# Expected: Model info, supported formats, max file size

# ====================================================================
# 4. DISEASE PREDICTION - Upload image and get prediction
# ====================================================================
# curl -X POST "http://localhost:8000/api/predict" \
#   -F "file=@C:\path\to\leaf_image.jpg" \
#   -F "latitude=28.6139" \
#   -F "longitude=77.2090"
#
# Expected: Disease prediction with confidence, disease info, risk analysis

# ====================================================================
# 5. PREDICTION WITHOUT LOCATION
# ====================================================================
# curl -X POST "http://localhost:8000/api/predict" \
#   -F "file=@C:\path\to\leaf_image.jpg"
#
# Expected: Prediction without weather/risk data

# ====================================================================
# EXAMPLE CURL COMMANDS FOR DIFFERENT SCENARIOS
# ====================================================================

# Test 1: Simple health check
echo "Test 1: Health Check"
curl http://localhost:8000/health

echo -e "\n\n"

# Test 2: Get API info
echo "Test 2: API Information"
curl http://localhost:8000/ | python -m json.tool

echo -e "\n\n"

# Test 3: Get model info
echo "Test 3: Model Information"
curl http://localhost:8000/api/predict/info | python -m json.tool

echo -e "\n\n"

# Test 4: Predict with image (MODIFY PATH to your image)
echo "Test 4: Disease Prediction"
# REPLACE C:\path\to\leaf_image.jpg with actual image path
# curl -X POST "http://localhost:8000/api/predict" \
#   -F "file=@C:\path\to\leaf_image.jpg" \
#   -F "latitude=28.6139" \
#   -F "longitude=77.2090" | python -m json.tool

# ====================================================================
# USEFUL OPTIONS
# ====================================================================
# -X POST              : Use POST method
# -F "key=value"       : Form data
# -F "file=@path"      : File upload
# -H "Content-Type: application/json"  : JSON header
# -v                   : Verbose (shows request/response headers)
# -s                   : Silent mode
# -i                   : Include response headers
# | python -m json.tool : Pretty print JSON response
# --output file.txt    : Save response to file
# --request GET|POST   : Specify HTTP method

# ====================================================================
# ERROR RESPONSES
# ====================================================================
# 400 Bad Request      : Invalid image or missing required fields
# 404 Not Found        : Endpoint doesn't exist
# 500 Server Error     : Backend error (check logs)
# {CORS error}         : Check ALLOWED_ORIGINS in .env

# ====================================================================
# TESTING WITH PYTHON
# ====================================================================
# See test_backend.py for comprehensive Python testing script
# Run: python test_backend.py C:\path\to\leaf_image.jpg
