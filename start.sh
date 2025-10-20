#!/bin/bash

echo "🏀 Starting NBA Stock Market..."
echo ""

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "📦 Installing frontend dependencies..."
    npm install
fi

if [ ! -d "server/node_modules" ]; then
    echo "📦 Installing server dependencies..."
    cd server && npm install && cd ..
fi

echo ""
echo "🚀 Starting servers..."
echo ""
echo "Backend will run on: http://localhost:3001"
echo "Frontend will run on: http://localhost:5173"
echo ""
echo "Press Ctrl+C to stop both servers"
echo ""

# Start both servers in parallel
npm run dev & cd server && npm run dev
