#!/bin/bash

# StatStocks Startup Script
# This script starts both the backend and frontend servers

echo "🏀 StatStocks - Starting Up..."
echo "================================"
echo ""

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if a port is in use
check_port() {
    lsof -ti:$1 > /dev/null 2>&1
    return $?
}

# Function to kill process on port
kill_port() {
    echo "Killing process on port $1..."
    lsof -ti:$1 | xargs kill -9 2>/dev/null
    sleep 1
}

# Check and kill processes on our ports if needed
if check_port 3001; then
    echo "${YELLOW}⚠️  Port 3001 is in use${NC}"
    kill_port 3001
fi

if check_port 5173; then
    echo "${YELLOW}⚠️  Port 5173 is in use${NC}"
    kill_port 5173
fi

# Install dependencies if needed
echo "${BLUE}📦 Checking dependencies...${NC}"

if [ ! -d "node_modules" ]; then
    echo "Installing frontend dependencies..."
    npm install || { echo "${RED}Failed to install frontend dependencies${NC}"; exit 1; }
fi

if [ ! -d "server/node_modules" ]; then
    echo "Installing backend dependencies..."
    cd server && npm install && cd .. || { echo "${RED}Failed to install backend dependencies${NC}"; exit 1; }
fi

echo "${GREEN}✅ Dependencies ready${NC}"
echo ""

# Start backend
echo "${BLUE}🚀 Starting backend server...${NC}"
cd server
npm run dev > ../logs/backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait for backend to start
echo "Waiting for backend to initialize..."
sleep 3

# Check if backend is running
if ! ps -p $BACKEND_PID > /dev/null; then
    echo "${RED}❌ Backend failed to start!${NC}"
    echo "Check logs/backend.log for details"
    exit 1
fi

# Check if backend is responding
BACKEND_READY=0
for i in {1..10}; do
    if curl -s http://localhost:3001/api/players > /dev/null 2>&1; then
        BACKEND_READY=1
        break
    fi
    sleep 1
done

if [ $BACKEND_READY -eq 0 ]; then
    echo "${YELLOW}⚠️  Backend may not be fully ready yet${NC}"
fi

echo "${GREEN}✅ Backend running on http://localhost:3001${NC}"
echo ""

# Start frontend
echo "${BLUE}🚀 Starting frontend...${NC}"
npm run dev > logs/frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait for frontend to start
sleep 3

# Check if frontend is running
if ! ps -p $FRONTEND_PID > /dev/null; then
    echo "${RED}❌ Frontend failed to start!${NC}"
    echo "Check logs/frontend.log for details"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

echo "${GREEN}✅ Frontend running on http://localhost:5173${NC}"
echo ""
echo "================================"
echo "${GREEN}✅ StatStocks is ready!${NC}"
echo "================================"
echo ""
echo "📱 Open your browser to: ${BLUE}http://localhost:5173${NC}"
echo ""
echo "💡 Tips:"
echo "   - Create an account to start trading"
echo "   - You'll get \$10,000 starting balance"
echo "   - Check the Market tab to see players"
echo "   - Create leagues to play with friends"
echo ""
echo "📝 Logs:"
echo "   - Backend: logs/backend.log"
echo "   - Frontend: logs/frontend.log"
echo ""
echo "🛑 To stop: Press Ctrl+C or run: ./stop-servers.sh"
echo ""

# Save PIDs for stopping later
mkdir -p logs
echo $BACKEND_PID > logs/backend.pid
echo $FRONTEND_PID > logs/frontend.pid

# Function to cleanup on exit
cleanup() {
    echo ""
    echo "${YELLOW}Stopping servers...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    rm -f logs/backend.pid logs/frontend.pid
    echo "${GREEN}Servers stopped${NC}"
    exit 0
}

# Setup trap for cleanup
trap cleanup INT TERM EXIT

# Wait for both processes
wait
