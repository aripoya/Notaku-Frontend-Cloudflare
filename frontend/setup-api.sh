#!/bin/bash

# 🚀 Notaku Frontend - API Setup Script
# Automatically configure frontend to connect to API server

set -e

echo "🚀 Notaku Frontend - API Setup"
echo "================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# API URL
API_URL="https://api.notaku.cloud"

echo -e "${BLUE}📋 Configuration:${NC}"
echo "   API URL: $API_URL"
echo ""

# Step 1: Create .env.development
echo -e "${BLUE}Step 1: Creating .env.development...${NC}"
if [ -f ".env.development" ]; then
    echo -e "${YELLOW}   ⚠️  .env.development already exists${NC}"
    read -p "   Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}   Skipping .env.development creation${NC}"
    else
        cat > .env.development << EOF
# API Configuration
VITE_API_URL=$API_URL

# Debug Mode
VITE_DEBUG=true
EOF
        echo -e "${GREEN}   ✅ .env.development created${NC}"
    fi
else
    cat > .env.development << EOF
# API Configuration
VITE_API_URL=$API_URL

# Debug Mode
VITE_DEBUG=true
EOF
    echo -e "${GREEN}   ✅ .env.development created${NC}"
fi

# Step 2: Create .env.production
echo ""
echo -e "${BLUE}Step 2: Creating .env.production...${NC}"
if [ -f ".env.production" ]; then
    echo -e "${YELLOW}   ⚠️  .env.production already exists${NC}"
    read -p "   Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo -e "${YELLOW}   Skipping .env.production creation${NC}"
    else
        cat > .env.production << EOF
# API Configuration
VITE_API_URL=$API_URL

# Debug Mode
VITE_DEBUG=false
EOF
        echo -e "${GREEN}   ✅ .env.production created${NC}"
    fi
else
    cat > .env.production << EOF
# API Configuration
VITE_API_URL=$API_URL

# Debug Mode
VITE_DEBUG=false
EOF
    echo -e "${GREEN}   ✅ .env.production created${NC}"
fi

# Step 3: Test API Connection
echo ""
echo -e "${BLUE}Step 3: Testing API connection...${NC}"
echo "   Testing: $API_URL/health"

if command -v curl &> /dev/null; then
    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$API_URL/health")
    
    if [ "$HTTP_CODE" = "200" ]; then
        echo -e "${GREEN}   ✅ API is reachable (HTTP $HTTP_CODE)${NC}"
        
        # Get health response
        HEALTH_RESPONSE=$(curl -s "$API_URL/health")
        echo "   Response: $HEALTH_RESPONSE"
    else
        echo -e "${RED}   ❌ API returned HTTP $HTTP_CODE${NC}"
        echo -e "${YELLOW}   ⚠️  API might not be running or accessible${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  curl not found, skipping API test${NC}"
fi

# Step 4: Check CORS
echo ""
echo -e "${BLUE}Step 4: Checking CORS configuration...${NC}"

if command -v curl &> /dev/null; then
    CORS_HEADERS=$(curl -s -I -X OPTIONS \
        -H "Origin: http://localhost:3000" \
        -H "Access-Control-Request-Method: GET" \
        "$API_URL/health" | grep -i "access-control")
    
    if [ ! -z "$CORS_HEADERS" ]; then
        echo -e "${GREEN}   ✅ CORS is configured${NC}"
        echo "$CORS_HEADERS" | while IFS= read -r line; do
            echo "      $line"
        done
    else
        echo -e "${YELLOW}   ⚠️  CORS headers not found${NC}"
    fi
fi

# Step 5: Install dependencies
echo ""
echo -e "${BLUE}Step 5: Installing dependencies...${NC}"
if [ -f "package.json" ]; then
    if command -v npm &> /dev/null; then
        echo "   Running: npm install"
        npm install
        echo -e "${GREEN}   ✅ Dependencies installed${NC}"
    else
        echo -e "${YELLOW}   ⚠️  npm not found, skipping dependency installation${NC}"
    fi
else
    echo -e "${YELLOW}   ⚠️  package.json not found${NC}"
fi

# Summary
echo ""
echo "================================"
echo -e "${GREEN}✅ Setup Complete!${NC}"
echo ""
echo -e "${BLUE}📝 Next Steps:${NC}"
echo "   1. Start dev server:"
echo "      ${YELLOW}npm run dev${NC}"
echo ""
echo "   2. Open browser and check console for API connection"
echo ""
echo "   3. Test API connection:"
echo "      - Add ApiConnectionTest component to your app"
echo "      - Or run: testApiConnection() in browser console"
echo ""
echo "   4. Read documentation:"
echo "      - docs/SETUP_API_CONNECTION.md"
echo "      - docs/API_INTEGRATION.md"
echo ""
echo -e "${BLUE}🔗 API Endpoints:${NC}"
echo "   Health: $API_URL/health"
echo "   Docs:   $API_URL/docs"
echo "   System: $API_URL/"
echo ""
echo "Happy coding! 🚀"
