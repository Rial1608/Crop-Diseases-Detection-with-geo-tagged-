#!/bin/bash

# Smart Crop Disease Detection - Complete Startup Script
# This script starts both backend and frontend servers

echo ""
echo "========================================"
echo "   Smart Crop Disease Detection System"
echo "   Complete Startup Script"
echo "========================================"
echo ""

# Get script directory
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"

# Check if directories exist
if [ ! -d "$BACKEND_DIR" ]; then
    echo "❌ Backend directory not found!"
    exit 1
fi

if [ ! -d "$FRONTEND_DIR" ]; then
    echo "❌ Frontend directory not found!"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check Python
if ! command_exists python3; then
    if ! command_exists python; then
        echo "❌ Python is not installed!"
        exit 1
    fi
    PYTHON="python"
else
    PYTHON="python3"
fi

# Check Node.js
if ! command_exists node; then
    echo "❌ Node.js is not installed!"
    exit 1
fi

echo "✓ Python: $(${PYTHON} --version)"
echo "✓ Node.js: $(node --version)"
echo ""

# Backend setup
echo "Setting up Backend..."

# Create venv if it doesn't exist
if [ ! -d "$BACKEND_DIR/venv" ]; then
    echo "📦 Creating Python virtual environment..."
    ${PYTHON} -m venv "$BACKEND_DIR/venv"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to create virtual environment"
        exit 1
    fi
    echo "✓ Virtual environment created"
fi

# Activate venv
source "$BACKEND_DIR/venv/bin/activate"

# Install backend dependencies
echo "📥 Installing backend dependencies..."
cd "$BACKEND_DIR"

# Check if requirements installed
if ! pip show fastapi >/dev/null 2>&1; then
    echo "Installing dependencies from requirements.txt..."
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install backend dependencies"
        exit 1
    fi
    echo "✓ Backend dependencies installed"
else
    echo "✓ Backend dependencies already installed"
fi

# Check for .env file
if [ ! -f "$BACKEND_DIR/.env" ]; then
    echo ""
    echo "⚠️  .env file not found in backend directory"
    echo "    Creating from .env.example..."
    cp "$BACKEND_DIR/.env.example" "$BACKEND_DIR/.env"
    echo "⚠️  Please edit backend/.env and add your OPENWEATHER_API_KEY"
fi

# Frontend setup
echo ""
echo "Setting up Frontend..."

cd "$FRONTEND_DIR"

# Check if node_modules exists
if [ ! -d "$FRONTEND_DIR/node_modules" ]; then
    echo "📥 Installing npm dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install frontend dependencies"
        exit 1
    fi
    echo "✓ Frontend dependencies installed"
else
    echo "✓ Frontend dependencies already installed"
fi

# Check for frontend .env file
if [ ! -f "$FRONTEND_DIR/.env" ]; then
    echo "📝 Creating frontend .env..."
    echo "REACT_APP_API_URL=http://localhost:8000" > "$FRONTEND_DIR/.env"
fi

# Ready to start
echo ""
echo "========================================"
echo "   ✓ Setup Complete!"
echo "========================================"
echo ""
echo "📍 Starting servers..."
echo "   Backend:  http://localhost:8000"
echo "   Frontend: http://localhost:5173"
echo ""
echo "📚 API Docs:  http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop"
echo ""
sleep 2

# Start backend in background
echo "🚀 Starting Backend Server..."
cd "$BACKEND_DIR"
source venv/bin/activate
python main.py &
BACKEND_PID=$!

sleep 3

# Start frontend in background
echo "🚀 Starting Frontend Server..."
cd "$FRONTEND_DIR"
npm run dev &
FRONTEND_PID=$!

echo ""
echo "✅ Both servers started!"
echo ""
echo "🌾 Smart Crop Disease Detection System is ready"
echo "📱 Open browser to: http://localhost:5173"
echo ""

# Wait for both processes
wait $BACKEND_PID $FRONTEND_PID
