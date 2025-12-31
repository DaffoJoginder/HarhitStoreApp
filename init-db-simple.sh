#!/bin/bash

# Simple Database Setup Script (Non-Interactive)
# Uses default PostgreSQL credentials or environment variables

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

echo -e "${GREEN}🗄️  Database Setup Script (Simple)${NC}"
echo ""

# Default values (can be overridden by environment variables)
DB_USER=${DB_USER:-postgres}
DB_PASS=${DB_PASS:-postgres}
DB_NAME=${DB_NAME:-instamart_db}
DB_HOST=${DB_HOST:-localhost}
DB_PORT=${DB_PORT:-5432}

echo -e "${YELLOW}Using configuration:${NC}"
echo "  User: $DB_USER"
echo "  Database: $DB_NAME"
echo "  Host: $DB_HOST"
echo "  Port: $DB_PORT"
echo ""

# Try to create database (will fail silently if exists)
echo -e "${YELLOW}Creating database...${NC}"
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -tc "SELECT 1 FROM pg_database WHERE datname = '$DB_NAME'" | grep -q 1 || \
PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -c "CREATE DATABASE $DB_NAME;" 2>/dev/null

if [ $? -eq 0 ] || PGPASSWORD=$DB_PASS psql -h $DB_HOST -p $DB_PORT -U $DB_USER -lqt | cut -d \| -f 1 | grep -qw $DB_NAME; then
    echo -e "${GREEN}✅ Database ready${NC}"
else
    echo -e "${YELLOW}⚠️  Could not create database automatically${NC}"
    echo -e "${YELLOW}Please create it manually:${NC}"
    echo "  createdb $DB_NAME"
    echo "  or"
    echo "  psql -U $DB_USER -c \"CREATE DATABASE $DB_NAME;\""
    echo ""
    read -p "Press Enter after creating the database, or Ctrl+C to cancel..."
fi

# Update .env file
echo ""
echo -e "${YELLOW}Updating backend/.env...${NC}"

# Escape special characters in password for URL
ESCAPED_PASS=$(echo $DB_PASS | sed 's/[[\.*^$()+?{|]/\\&/g' | sed 's/:/%3A/g' | sed 's/@/%40/g' | sed 's/#/%23/g')

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

# Generate Prisma Client first
npx prisma generate

if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Failed to generate Prisma Client${NC}"
    exit 1
fi

# Run migrations
npx prisma migrate dev --name init

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✅ Migrations completed${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo -e "${YELLOW}This might be because:${NC}"
    echo "  1. Database doesn't exist - create it first"
    echo "  2. Wrong credentials in backend/.env"
    echo "  3. PostgreSQL is not running"
    echo ""
    echo -e "${YELLOW}To fix:${NC}"
    echo "  1. Create database: createdb $DB_NAME"
    echo "  2. Check backend/.env DATABASE_URL"
    echo "  3. Start PostgreSQL service"
    exit 1
fi

cd ..

echo ""
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo -e "${YELLOW}Next steps:${NC}"
echo "  Run: ./run.sh"
echo "  Or: npm run dev"
echo ""

