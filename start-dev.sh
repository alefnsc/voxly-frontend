#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}==================================${NC}"
echo -e "${BLUE}  Voxly AI Mock Interview Setup  ${NC}"
echo -e "${BLUE}==================================${NC}"
echo ""

# Check if .env files exist
if [ ! -f "ai-mock-interview-front/.env" ]; then
    echo -e "${YELLOW}⚠️  Frontend .env file not found${NC}"
    echo "Please create ai-mock-interview-front/.env with your Clerk keys"
    exit 1
fi

if [ ! -f "ai-mock-interview-back/.env" ]; then
    echo -e "${YELLOW}⚠️  Backend .env file not found${NC}"
    echo "Please create ai-mock-interview-back/.env with your Clerk keys"
    exit 1
fi

echo -e "${GREEN}✓ Environment files found${NC}"
echo ""

# Start backend server
echo -e "${BLUE}Starting backend server...${NC}"
cd ai-mock-interview-back
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a bit for backend to start
sleep 3

# Start frontend server
echo -e "${BLUE}Starting frontend server...${NC}"
cd ai-mock-interview-front
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo -e "${GREEN}==================================${NC}"
echo -e "${GREEN}  Servers Started Successfully!   ${NC}"
echo -e "${GREEN}==================================${NC}"
echo ""
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}Backend:${NC}  http://localhost:3001"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop all servers${NC}"
echo ""

# Wait for Ctrl+C
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT

wait
