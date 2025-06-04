#!/bin/bash

echo "🔍 Verifying Wallet Monitor Setup..."

# Check if Node.js is installed
if command -v node &> /dev/null; then
    echo "✅ Node.js $(node --version) is installed"
else
    echo "❌ Node.js is not installed. Please install Node.js 14+ from https://nodejs.org"
    exit 1
fi

# Check if npm is installed
if command -v npm &> /dev/null; then
    echo "✅ npm $(npm --version) is installed"
else
    echo "❌ npm is not installed"
    exit 1
fi

# Check backend directory
if [ -d "backend" ]; then
    echo "✅ Backend directory exists"
    if [ -f "backend/package.json" ]; then
        echo "✅ Backend package.json exists"
    else
        echo "❌ Backend package.json missing"
    fi
    
    if [ -f "backend/.env" ]; then
        echo "✅ Backend .env file exists"
        if grep -q "your_nodit_api_key_here" backend/.env; then
            echo "⚠️  Remember to update your Nodit API key in backend/.env"
        else
            echo "✅ Nodit API key appears to be set"
        fi
    else
        echo "❌ Backend .env file missing"
    fi
else
    echo "❌ Backend directory missing"
fi

# Check frontend directory
if [ -d "frontend" ]; then
    echo "✅ Frontend directory exists"
    if [ -f "frontend/package.json" ]; then
        echo "✅ Frontend package.json exists"
    else
        echo "❌ Frontend package.json missing"
    fi
else
    echo "❌ Frontend directory missing"
fi

echo ""
echo "📋 Next Steps:"
echo "1. Add your Nodit API key to backend/.env"
echo "2. Copy server.js code to backend/server.js"
echo "3. Copy React component code to frontend/src/App.js"
echo "4. Run './start.sh' to start both services"
