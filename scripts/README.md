# Seed Scripts

This directory contains scripts for seeding the database with initial data.

## Database Seed Data

The main seed script `seed-data.ts` populates the database with realistic German content for the aluminum recycling application.

### What Data is Created

The seed script creates the following data:

1. **Users**:
   - An admin user
   - Regular users with various backgrounds related to recycling and sustainability
   - Recycling center representatives

2. **Recycling Centers**:
   - Centers in different German cities (Berlin, Hamburg, München, Stuttgart, Köln)
   - Each with realistic German descriptions, services, and contact information
   - Some with marketplace listings for aluminum purchasing

3. **Blog Posts**:
   - High-quality German articles about aluminum recycling
   - Topics include technology, tips & tricks, economics, environment, and education
   - A mix of free and premium content

4. **Forum Posts and Responses**:
   - Realistic discussions about aluminum recycling topics
   - Questions, advice, and professional exchanges
   - Market information and news about recycling initiatives

5. **Reviews**:
   - User reviews for recycling centers
   - Various ratings and detailed German comments

6. **Marketplace Items**:
   - Listings for buying, selling, and exchanging aluminum materials
   - Variety of conditions, prices, and locations across Germany

### Running the Seed Script

To seed your database with this data:

1. Make sure MongoDB is running (either locally or remotely)
2. Set up your MongoDB connection in your `.env` file:
   ```
   MONGODB_URI=mongodb://localhost:27017/aluminum-recycling
   ```
3. Run one of the following commands from the project root:

#### Full Seed Script (with all data)
```bash
npm run seed
```

or

```bash
yarn seed
```

#### Simplified Seed Script (with minimal data for testing)
```bash
npm run seed:simple
```

or

```bash
yarn seed:simple
```

The simplified script creates a smaller set of data and is useful for quickly testing database connectivity.

**Warning**: The seed script will delete all existing data in the database before creating new seed data. Do not run this in a production environment with real user data.

### Database Connection

The seed scripts connect directly to MongoDB using the following:

1. The script will use the `MONGODB_URI` environment variable from your `.env` file
2. If not provided, it defaults to `mongodb://localhost:27017/aluminum-recycling`
3. Make sure your MongoDB server is running and accessible before running the scripts

### Customizing the Seed Data

If you need to modify the seed data:

1. Edit the relevant section in `seed-data.ts` or `seed-data-simple.ts`
2. Adjust the objects in the appropriate arrays (users, centers, blog posts, etc.)
3. Run the seed script again to apply your changes

### Troubleshooting

If you encounter errors when running the seed script:

1. Check your MongoDB connection (make sure your database is running)
2. Verify that the MongoDB URI is correct in your `.env` file
3. Make sure you have installed all dependencies with `npm install` or `yarn`
4. If you see TypeScript errors, try running `npm install ts-node mongodb bcryptjs @types/bcryptjs --save-dev`

# Admin Management Scripts

This directory contains scripts for database management and administration tasks.

## Creating Admin Users

There are two ways to create an admin user:

### 1. Interactive Script (Development)

The interactive script prompts you for admin details:

```bash
node scripts/create-admin.js
```

This script will:
- Ask for name, email, and password
- Validate the inputs (email format, password length)
- Check if the user already exists
- Create a new admin user with the given details

### 2. Production Script (Non-interactive)

For production environments or automated deployments, use the non-interactive script:

```bash
# Set environment variables first
export ADMIN_NAME="Admin User"
export ADMIN_EMAIL="admin@yourdomain.com"
export ADMIN_PASSWORD="your-secure-password"

# Run the script
node scripts/create-admin-production.js
```

**Important security notes:**
- Use a strong password (minimum 12 characters)
- Don't store production passwords in your repository
- For production deployments, consider using a secrets manager

## Database Migrations

The database migrations script creates all necessary tables:

```bash
node scripts/run-migrations.js
``` 