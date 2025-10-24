#!/bin/bash

# Expense AI Frontend Development Startup Script
# This script sets up SSH tunnel and starts the dev server

echo "🚀 Starting Expense AI Frontend Development Environment"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Configuration
SSH_USER="api-server-notaku"
SSH_HOST="172.16.1.7"
LOCAL_PORT="8001"
REMOTE_PORT="8001"

# Check if SSH tunnel is already running
if lsof -ti:${LOCAL_PORT} > /dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Port ${LOCAL_PORT} is already in use${NC}"
    echo "Checking if it's an SSH tunnel..."
    
    if ps aux | grep -v grep | grep "ssh -L ${LOCAL_PORT}" > /dev/null; then
        echo -e "${GREEN}✅ SSH tunnel already running${NC}"
    else
        echo -e "${RED}❌ Port ${LOCAL_PORT} is used by another process${NC}"
        echo "Please free up port ${LOCAL_PORT} or kill the process:"
        echo "  lsof -ti:${LOCAL_PORT} | xargs kill -9"
        exit 1
    fi
else
    echo "📡 Starting SSH tunnel to OCR backend..."
    echo "Command: ssh -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} ${SSH_USER}@${SSH_HOST} -N"
    echo ""
    
    # Start SSH tunnel in background
    ssh -L ${LOCAL_PORT}:localhost:${REMOTE_PORT} ${SSH_USER}@${SSH_HOST} -N \
        -o ServerAliveInterval=60 \
        -o ServerAliveCountMax=3 &
    
    SSH_PID=$!
    
    # Wait a bit for tunnel to establish
    sleep 2
    
    # Check if tunnel is running
    if ps -p $SSH_PID > /dev/null; then
        echo -e "${GREEN}✅ SSH tunnel started (PID: $SSH_PID)${NC}"
        echo "   Forwarding localhost:${LOCAL_PORT} → ${SSH_HOST}:${REMOTE_PORT}"
    else
        echo -e "${RED}❌ Failed to start SSH tunnel${NC}"
        echo "Please check:"
        echo "  1. SSH credentials are correct"
        echo "  2. Server is accessible"
        echo "  3. You have SSH key or can enter password"
        exit 1
    fi
fi

echo ""
echo "🧪 Testing OCR backend connection..."
sleep 1

# Test connection
if curl -s http://localhost:${LOCAL_PORT}/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ OCR backend is accessible${NC}"
    
    # Show health status
    HEALTH=$(curl -s http://localhost:${LOCAL_PORT}/health)
    echo "   Status: $(echo $HEALTH | grep -o '"status":"[^"]*"' | cut -d'"' -f4)"
    echo "   Workers: $(echo $HEALTH | grep -o '"workers":[0-9]*' | cut -d':' -f2)"
else
    echo -e "${YELLOW}⚠️  Cannot connect to OCR backend${NC}"
    echo "The tunnel is running, but backend might not be accessible."
    echo "Please check if OCR backend is running on the server."
fi

echo ""
echo "🎨 Starting Next.js development server..."
echo ""

# Start Next.js dev server
npm run dev

# Cleanup function
cleanup() {
    echo ""
    echo "🛑 Shutting down..."
    
    # Kill SSH tunnel if we started it
    if [ ! -z "$SSH_PID" ]; then
        echo "Stopping SSH tunnel (PID: $SSH_PID)..."
        kill $SSH_PID 2>/dev/null
    fi
    
    echo "✅ Cleanup complete"
    exit 0
}

# Trap Ctrl+C and cleanup
trap cleanup INT TERM
