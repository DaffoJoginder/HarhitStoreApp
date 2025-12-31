# Instamart B2B & B2C MVP - Grocery App

A dual-mode quick commerce platform supporting both B2C (Business-to-Consumer) and B2B (Business-to-Business) operations.

## Project Structure

```
Grocery-App/
├── backend/          # Express.js + TypeScript API
├── frontend/         # Next.js + TypeScript Frontend
└── README.md
```

## Features

### B2C Features
- User registration and authentication
- Product browsing with retail pricing
- Shopping cart (1-10 units per product)
- Order placement with single delivery address
- Order history and tracking

### B2B Features
- Business registration with document upload
- Admin approval workflow
- Bulk ordering with tiered pricing
- Multi-location delivery
- Credit terms and account management
- Quick reorder functionality

### Admin Features
- Product and category management
- B2B business approval
- Order management
- Pricing configuration

## Tech Stack

### Backend
- Node.js + Express.js
- TypeScript
- PostgreSQL
- Prisma ORM
- JWT Authentication
- Multer (file uploads)

### Frontend
- Next.js 14
- TypeScript
- Tailwind CSS
- React Query
- Axios

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

1. Clone the repository
2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials

# Frontend
cd frontend
cp .env.example .env
```

4. Set up database:
```bash
cd backend
npx prisma migrate dev
npx prisma generate
```

5. Run the application:
```bash
# From root directory
npm run dev
```

Backend will run on http://localhost:3001
Frontend will run on http://localhost:3000

## API Documentation

API endpoints are documented in the backend README.

## License

MIT

