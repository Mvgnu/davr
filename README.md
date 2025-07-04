# Recycling Center Management System

A web application for managing recycling centers, material offers, and facilitating recycling activities.

## Features

- Recycling center management with detailed profiles
- Material offer management for recycling centers
- Database integration with PostgreSQL
- User authentication and role-based access control
- Responsive UI using Next.js and Tailwind CSS
- Edit and delete functionality for recycling centers with proper validation and authorization

## Prerequisites

- Node.js 16.x or higher
- PostgreSQL 14.x or higher
- npm or yarn

## Environment Setup

Create a `.env.local` file in the project root with the following variables:

```
# Database connection
DATABASE_URL=postgresql://username:password@localhost:5432/recycling_db

# NextAuth configuration
NEXTAUTH_SECRET=your-secret-key
NEXTAUTH_URL=http://localhost:3000
```

Replace the credentials in the `DATABASE_URL` with your own PostgreSQL connection details.

## Installation

1. Clone the repository
   ```
   git clone https://github.com/yourusername/recycling-center-app.git
   cd recycling-center-app
   ```

2. Install dependencies
   ```
   npm install
   ```

3. Set up the database
   - Create a PostgreSQL database named `recycling_db`
   - The application will automatically create the necessary tables on startup

4. Initialize the database schema and seed data:
   ```
   # First, start the development server
   npm run dev

   # In a new terminal, run the initialization script
   # This will create all the tables and schema
   node scripts/init-db.js

   # To add sample data, use the --seed flag
   node scripts/init-db.js --seed
   
   # If you experience database schema issues, run the schema fix
   npm run db:fix-schema
   
   # To fix issues with the materials table and seed it with proper data
   npm run db:fix-and-seed-materials
   ```

## Development

Start the development server:

```
npm run dev
```

The application will be available at http://localhost:3000.

## API Documentation

### Recycling Centers

- `GET /api/recycling-centers` - Get all recycling centers with pagination and filtering
- `GET /api/recycling-centers/:id` - Get a specific recycling center by ID
- `POST /api/recycling-centers` - Create a new recycling center
- `PUT /api/recycling-centers/:id` - Update a recycling center
- `DELETE /api/recycling-centers/:id` - Delete a recycling center

### Material Offers

- `GET /api/recycling-centers/:id/offers` - Get all material offers for a recycling center
- `GET /api/recycling-centers/:id/offers/:offerId` - Get a specific material offer
- `POST /api/recycling-centers/:id/offers` - Create a new material offer
- `PUT /api/recycling-centers/:id/offers/:offerId` - Update a material offer
- `DELETE /api/recycling-centers/:id/offers/:offerId` - Delete a material offer

### Materials

- `GET /api/materials` - Get all materials, optionally filtered by category

### Database Management

- `POST /api/db/init` - Initialize database schema (dev/admin only)
- `POST /api/db/init?seed=true` - Initialize and seed database (dev/admin only)
- `npm run db:fix-schema` - Fix schema inconsistencies (particularly for `recycling_center_offers` table)
- `npm run db:fix-materials` - Fix materials table structure to match schema
- `npm run db:fix-and-seed-materials` - Fix materials table and populate with comprehensive recycling materials data

## Authentication

The application uses NextAuth.js for authentication. Default credentials for the seed data:

- Admin: `admin@example.com` / `admin123`
- User: `user1@example.com` / `user123`
