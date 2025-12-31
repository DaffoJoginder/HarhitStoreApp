#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🗄️  Database Setup Script${NC}"
echo ""

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo -e "${RED}❌ PostgreSQL is not installed or not in PATH${NC}"
    echo -e "${YELLOW}Please install PostgreSQL first:${NC}"
    echo "  macOS: brew install postgresql"
    echo "  Linux: sudo apt-get install postgresql"
    echo "  Windows: Download from https://www.postgresql.org/download/"
    exit 1
fi

echo -e "${GREEN}✅ PostgreSQL detected${NC}"
echo ""

# Get database credentials
read -p "PostgreSQL username [postgres]: " DB_USER
DB_USER=${DB_USER:-postgres}

read -sp "PostgreSQL password: " DB_PASS
echo ""

read -p "Database name [instamart_db]: " DB_NAME
DB_NAME=${DB_NAME:-instamart_db}

read -p "Host [localhost]: " DB_HOST
DB_HOST=${DB_HOST:-localhost}

read -p "Port [5432]: " DB_PORT
DB_PORT=${DB_PORT:-5432}

# Create database
echo ""
echo -e "${YELLOW}Creating database...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Database created${NC}"
elif [ $? -eq 2 ]; then
    echo -e "${YELLOW}⚠️  Database might already exist, continuing...${NC}"
else
    echo -e "${RED}❌ Failed to create database${NC}"
    echo -e "${YELLOW}Please create it manually:${NC}"
    echo "  createdb $DB_NAME"
    echo "  or"
    echo "  psql -U $DB_USER -c \"CREATE DATABASE $DB_NAME;\""
    exit 1
fi

# Update .env file
echo ""
echo -e "${YELLOW}Updating backend/.env...${NC}"

# Escape special characters in password
ESCAPED_PASS=$(echo $DB_PASS | sed 's/[[\.*^$()+?{|]/\\&/g')

cat > backend/.env << EOF
# Database
DATABASE_URL="postgresql://${DB_USER}:${ESCAPED_PASS}@${DB_HOST}:${DB_PORT}/${DB_NAME}?schema=public"

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

echo -e "${GREEN}✅ backend/.env updated${NC}"

# Run migrations
echo ""
echo -e "${YELLOW}Running database migrations...${NC}"
cd backend

npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo -e "${YELLOW}Please check your database connection and try again${NC}"
    exit 1
fi

npx prisma generate

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Prisma Client generated${NC}"
else
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  1. Run: ./run.sh"
echo "  2. Or manually: npm run dev"
echo ""

