#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🚀 Starting Instamart Application...${NC}"
echo ""

# Check if .env files exist
if [ ! -f "backend/.env" ]; then
    echo -e "${RED}❌ backend/.env not found!${NC}"
    echo -e "${YELLOW}Creating backend/.env from template...${NC}"
    cat > backend/.env << EOF
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/instamart_db?schema=public"

# JWT
JWT_SECRET="instamart-super-secret-jwt-key-change-in-production-2025"
JWT_EXPIRES_IN="7d"

# Server
PORT=3001
NODE_ENV=development

# File Upload
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880

# Frontend URL
FRONTEND_URL="http://localhost:3000"
EOF
    echo -e "${YELLOW}⚠️  Please update backend/.env with your database credentials!${NC}"
fi

if [ ! -f "frontend/.env.local" ]; then
    echo -e "${YELLOW}Creating frontend/.env.local...${NC}"
    echo "NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1" > frontend/.env.local
fi

# Create uploads directory
mkdir -p backend/uploads

# Check if database is set up
echo -e "${YELLOW}Checking database setup...${NC}"
cd backend

# Check if Prisma client is generated
if [ ! -d "node_modules/.prisma" ]; then
    echo -e "${YELLOW}Generating Prisma Client...${NC}"
    npx prisma generate
fi

cd ..

echo ""
echo -e "${GREEN}✅ Starting servers...${NC}"
echo -e "${GREEN}Backend:  http://localhost:3001${NC}"
echo -e "${GREEN}Frontend: http://localhost:3000${NC}"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop${NC}"
echo ""

# Start both servers
npm run dev

