# Instamart B2B & B2C MVP - Setup Guide

## Prerequisites

- Node.js 18+ installed
- PostgreSQL 14+ installed and running
- npm or yarn package manager

## Installation Steps

### 1. Install Dependencies

From the root directory:
```bash
npm install
```

This will install dependencies for both backend and frontend workspaces.

### 2. Database Setup

1. Create a PostgreSQL database:
```bash
createdb instamart_db
```

Or using psql:
```sql
CREATE DATABASE instamart_db;
```

2. Configure database connection in `backend/.env`:
```env
DATABASE_URL="postgresql://username:password@localhost:5432/instamart_db?schema=public"
```

3. Run Prisma migrations:
```bash
cd backend
npx prisma migrate dev --name init
npx prisma generate
```

### 3. Backend Setup

1. Create `backend/.env` file (copy from `.env.example`):
```bash
cd backend
cp .env.example .env
```

2. Update `.env` with your configuration:
```env
DATABASE_URL="postgresql://user:password@localhost:5432/instamart_db?schema=public"
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
JWT_EXPIRES_IN="7d"
PORT=3001
NODE_ENV=development
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE=5242880
FRONTEND_URL="http://localhost:3000"
```

3. Create uploads directory:
```bash
mkdir -p backend/uploads
```

### 4. Frontend Setup

1. Create `frontend/.env.local` file:
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### 5. Create Admin User (Optional)

You can create an admin user directly in the database:

```sql
-- First, create a user (you'll need to hash the password)
-- Use bcrypt to hash your password, or use this Node.js script:

-- Run in backend directory:
node -e "const bcrypt = require('bcryptjs'); bcrypt.hash('admin123', 10).then(hash => console.log(hash));"

-- Then insert into database:
INSERT INTO users (id, full_name, email, mobile, password_hash, account_type, status, email_verified, mobile_verified)
VALUES (
  gen_random_uuid(),
  'Admin User',
  'admin@instamart.com',
  '9999999999',
  '<hashed_password>',
  'admin',
  'active',
  true,
  true
);
```

## Running the Application

### Development Mode

From the root directory:
```bash
npm run dev
```

This will start both backend (port 3001) and frontend (port 3000) concurrently.

Or run separately:

**Backend:**
```bash
cd backend
npm run dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### Production Build

```bash
npm run build
```

## API Endpoints

### Authentication
- `POST /api/v1/auth/register/b2c` - B2C user registration
- `POST /api/v1/auth/register/b2b` - B2B business registration
- `POST /api/v1/auth/login` - User login

### Products
- `GET /api/v1/products?account_type=b2c|b2b` - List products
- `GET /api/v1/products/:id?account_type=b2c|b2b` - Get product details

### Cart
- `GET /api/v1/cart` - Get cart
- `POST /api/v1/cart/add` - Add item (B2C)
- `POST /api/v1/cart/b2b/add` - Add item (B2B)
- `PUT /api/v1/cart/items/:id` - Update cart item
- `DELETE /api/v1/cart/items/:id` - Remove cart item

### Orders
- `POST /api/v1/orders/b2c/place` - Place B2C order
- `POST /api/v1/orders/b2b/place` - Place B2B order
- `GET /api/v1/orders` - Get order history
- `GET /api/v1/orders/:id` - Get order details

### B2B Features
- `GET /api/v1/b2b/profile` - Get B2B profile
- `GET /api/v1/b2b/credit/dashboard` - Credit dashboard
- `GET /api/v1/b2b/addresses` - Get delivery addresses
- `POST /api/v1/b2b/addresses` - Add delivery address

### Admin
- `GET /api/v1/admin/b2b/pending` - Get pending B2B registrations
- `POST /api/v1/admin/b2b/approve/:id` - Approve/reject B2B business
- `GET /api/v1/admin/orders` - Get all orders
- `PUT /api/v1/admin/orders/:id/status` - Update order status

## Testing the Application

### 1. Test B2C Flow

1. Register a B2C user at `/b2c/register`
2. Login at `/b2c/login`
3. Browse products
4. Add items to cart
5. Place order

### 2. Test B2B Flow

1. Register a B2B business at `/b2b/register`
2. Admin approves the business (via admin panel)
3. Login as B2B user
4. Browse products (wholesale pricing)
5. Add bulk items to cart
6. Add delivery addresses
7. Place bulk order

### 3. Test Admin Flow

1. Login as admin
2. View pending B2B registrations
3. Approve/reject businesses
4. Manage orders
5. Update order status

## Database Schema

The database schema is defined in `backend/prisma/schema.prisma`. Key tables:

- `users` - User accounts (B2C, B2B, Admin)
- `b2b_businesses` - B2B business information
- `b2b_delivery_addresses` - B2B delivery addresses
- `categories` - Product categories
- `subcategories` - Product subcategories
- `products` - Products with tiered pricing
- `cart` - Shopping carts
- `cart_items` - Cart items
- `orders` - Orders
- `order_items` - Order items

## Troubleshooting

### Database Connection Issues
- Ensure PostgreSQL is running
- Check DATABASE_URL in `.env`
- Verify database exists

### Port Already in Use
- Change PORT in backend `.env`
- Change port in frontend `package.json` scripts

### Prisma Issues
- Run `npx prisma generate` after schema changes
- Run `npx prisma migrate dev` to apply migrations

### File Upload Issues
- Ensure `backend/uploads` directory exists
- Check file size limits in `.env`

## Next Steps

1. Add payment gateway integration
2. Implement real-time order tracking
3. Add push notifications
4. Build mobile app
5. Add analytics dashboard

## Support

For issues or questions, please refer to the PRD document or contact the development team.

