#!/bin/bash

echo "🚀 Setting up Instamart B2B & B2C MVP..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo -e "${RED}❌ Node.js version 18+ is required. Current version: $(node -v)${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Node.js $(node -v) detected${NC}"

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${YELLOW}⚠️  PostgreSQL is not installed or not in PATH.${NC}"
    echo -e "${YELLOW}   Please install PostgreSQL and ensure it's running.${NC}"
    echo -e "${YELLOW}   You can skip this step and configure the database later.${NC}"
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo -e "${GREEN}✅ PostgreSQL detected${NC}"
fi

# Install root dependencies
echo ""
echo -e "${YELLOW}📦 Installing root dependencies...${NC}"
npm install

# Install backend dependencies
echo ""
echo -e "${YELLOW}📦 Installing backend dependencies...${NC}"
cd backend
npm install
cd ..

# Install frontend dependencies
echo ""
echo -e "${YELLOW}📦 Installing frontend dependencies...${NC}"
cd frontend
npm install
cd ..

# Create uploads directory
echo ""
echo -e "${YELLOW}📁 Creating uploads directory...${NC}"
mkdir -p backend/uploads

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${YELLOW}⚠️  backend/.env not found. Creating from template...${NC}"
    cp backend/.env.example backend/.env 2>/dev/null || echo "Please create backend/.env manually"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}⚠️  frontend/.env.local not found. Creating...${NC}"
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > frontend/.env.local
fi

# Database setup instructions
echo ""
echo -e "${GREEN}✅ Installation complete!${NC}"
echo ""
echo -e "${YELLOW}📋 Next steps:${NC}"
echo ""
echo "1. Set up PostgreSQL database:"
echo "   createdb instamart_db"
echo "   (or create it using pgAdmin or psql)"
echo ""
echo "2. Update backend/.env with your database credentials:"
echo "   DATABASE_URL=\"postgresql://username:password@localhost:5432/instamart_db?schema=public\""
echo ""
echo "3. Run database migrations:"
echo "   cd backend"
echo "   npx prisma migrate dev --name init"
echo "   npx prisma generate"
echo ""
echo "4. Start the development servers:"
echo "   npm run dev"
echo "   (This will start both backend and frontend)"
echo ""
echo "   Or start them separately:"
echo "   Backend:  cd backend && npm run dev"
echo "   Frontend: cd frontend && npm run dev"
echo ""
echo -e "${GREEN}🎉 Setup complete!${NC}"

