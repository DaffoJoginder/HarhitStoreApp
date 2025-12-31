#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔍 Verifying Instamart Setup...${NC}"
echo ""

ERRORS=0

# Check Node.js
if command -v node &> /dev/null; then
    NODE_VERSION=$(node -v)
    echo -e "${GREEN}✅ Node.js: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js: Not installed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check npm
if command -v npm &> /dev/null; then
    NPM_VERSION=$(npm -v)
    echo -e "${GREEN}✅ npm: $NPM_VERSION${NC}"
else
    echo -e "${RED}❌ npm: Not installed${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check PostgreSQL
if command -v psql &> /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL: Installed${NC}"
else
    echo -e "${YELLOW}⚠️  PostgreSQL: Not found in PATH${NC}"
fi

# Check dependencies
echo ""
echo -e "${BLUE}Checking dependencies...${NC}"

if [ -d "node_modules" ]; then
    echo -e "${GREEN}✅ Root dependencies installed${NC}"
else
    echo -e "${RED}❌ Root dependencies not installed${NC}"
    echo -e "${YELLOW}   Run: npm install${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "backend/node_modules" ]; then
    echo -e "${GREEN}✅ Backend dependencies installed${NC}"
else
    echo -e "${RED}❌ Backend dependencies not installed${NC}"
    echo -e "${YELLOW}   Run: cd backend && npm install${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -d "frontend/node_modules" ]; then
    echo -e "${GREEN}✅ Frontend dependencies installed${NC}"
else
    echo -e "${RED}❌ Frontend dependencies not installed${NC}"
    echo -e "${YELLOW}   Run: cd frontend && npm install${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Check environment files
echo ""
echo -e "${BLUE}Checking configuration files...${NC}"

if [ -f "backend/.env" ]; then
    echo -e "${GREEN}✅ backend/.env exists${NC}"
    
    # Check if DATABASE_URL is set
    if grep -q "DATABASE_URL" backend/.env; then
        echo -e "${GREEN}✅ DATABASE_URL configured${NC}"
    else
        echo -e "${YELLOW}⚠️  DATABASE_URL not found in backend/.env${NC}"
    fi
else
    echo -e "${RED}❌ backend/.env not found${NC}"
    echo -e "${YELLOW}   Run: ./init-db.sh or create manually${NC}"
    ERRORS=$((ERRORS + 1))
fi

if [ -f "frontend/.env.local" ]; then
    echo -e "${GREEN}✅ frontend/.env.local exists${NC}"
else
    echo -e "${YELLOW}⚠️  frontend/.env.local not found${NC}"
    echo -e "${YELLOW}   Creating...${NC}"
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > frontend/.env.local
    echo -e "${GREEN}✅ Created frontend/.env.local${NC}"
fi

# Check directories
echo ""
echo -e "${BLUE}Checking directories...${NC}"

if [ -d "backend/uploads" ]; then
    echo -e "${GREEN}✅ backend/uploads directory exists${NC}"
else
    echo -e "${YELLOW}⚠️  backend/uploads not found, creating...${NC}"
    mkdir -p backend/uploads
    echo -e "${GREEN}✅ Created backend/uploads${NC}"
fi

# Check Prisma
echo ""
echo -e "${BLUE}Checking Prisma setup...${NC}"

if [ -f "backend/prisma/schema.prisma" ]; then
    echo -e "${GREEN}✅ Prisma schema exists${NC}"
    
    if [ -d "backend/node_modules/.prisma" ]; then
        echo -e "${GREEN}✅ Prisma Client generated${NC}"
    else
        echo -e "${YELLOW}⚠️  Prisma Client not generated${NC}"
        echo -e "${YELLOW}   Run: cd backend && npx prisma generate${NC}"
    fi
else
    echo -e "${RED}❌ Prisma schema not found${NC}"
    ERRORS=$((ERRORS + 1))
fi

# Summary
echo ""
if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}🎉 Setup looks good!${NC}"
    echo ""
    echo -e "${BLUE}Next steps:${NC}"
    echo "  1. Set up database: ./init-db.sh"
    echo "  2. Run application: ./run.sh"
else
    echo -e "${RED}❌ Found $ERRORS issue(s)${NC}"
    echo -e "${YELLOW}Please fix the issues above before running the application${NC}"
fi

