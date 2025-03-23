// Seed script to populate the database with initial recycling centers
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

// Read environment variables from .env.local file manually
let MONGODB_URI = 'mongodb://localhost:27017/aluminum-recycling';
try {
  const envPath = path.resolve(process.cwd(), '.env.local');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf8');
    const envLines = envContent.split('\n');
    for (const line of envLines) {
      if (line.trim() && !line.startsWith('#')) {
        const [key, value] = line.split('=');
        if (key === 'MONGODB_URI' && value) {
          MONGODB_URI = value.trim();
        }
      }
    }
  }
} catch (err) {
  console.error('Error reading .env.local file:', err.message);
}

// Connection options
const options = {
  serverSelectionTimeoutMS: 30000,
  socketTimeoutMS: 45000,
  connectTimeoutMS: 30000,
};

// Define schema that matches our TypeScript model
const locationSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    default: []
  }
});

const reviewSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const recyclingCenterSchema = new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  postalCode: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: '' },
  country: { type: String, default: 'Germany' },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  description: { type: String, required: true },
  hours: { type: String, required: true },
  services: { type: [String], required: true },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  reviews: { type: [reviewSchema], default: [] },
  isVerified: { type: Boolean, default: false },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  location: { 
    type: locationSchema
  },
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

// Sample data
const sampleCenters = [
  {
    name: 'Berlin Recycling Center',
    slug: 'berlin-recycling-center',
    address: 'Berliner Straße 123',
    postalCode: '10115',
    city: 'Berlin',
    state: 'Berlin',
    country: 'Germany',
    phone: '+49 30 1234567',
    email: 'info@berlin-recycling.de',
    website: 'https://berlin-recycling.de',
    description: 'Das zentrale Recyclingcenter in Berlin bietet umfassende Entsorgungsmöglichkeiten für Aluminium und andere Wertstoffe.',
    hours: 'Mo-Fr 8:00-18:00, Sa 9:00-14:00',
    services: ['aluminium', 'paper', 'plastic', 'glass', 'electronics'],
    rating: 4.5,
    ratingCount: 120,
    isVerified: true,
    verificationStatus: 'verified',
    location: {
      type: 'Point',
      coordinates: [13.405, 52.52]
    }
  },
  {
    name: 'München Wertstoffhof',
    slug: 'muenchen-wertstoffhof',
    address: 'Münchener Straße 45',
    postalCode: '80331',
    city: 'München',
    state: 'Bayern',
    country: 'Germany',
    phone: '+49 89 9876543',
    email: 'kontakt@muenchen-wertstoff.de',
    website: 'https://muenchen-wertstoff.de',
    description: 'Unser Wertstoffhof in München nimmt alle Arten von Wertstoffen an, besonders Aluminium, Elektronik und Glas.',
    hours: 'Mo-Fr 9:00-19:00, Sa 10:00-16:00',
    services: ['aluminium', 'glass', 'electronics', 'hazardous', 'batteries'],
    rating: 4.2,
    ratingCount: 85,
    isVerified: true,
    verificationStatus: 'verified',
    location: {
      type: 'Point',
      coordinates: [11.575, 48.137]
    }
  },
  {
    name: 'Hamburg Aluminiumrecycling',
    slug: 'hamburg-aluminiumrecycling',
    address: 'Hamburger Allee 78',
    postalCode: '20095',
    city: 'Hamburg',
    state: 'Hamburg',
    country: 'Germany',
    phone: '+49 40 7654321',
    email: 'info@hamburg-recycling.de',
    website: 'https://hamburg-recycling.de',
    description: 'Spezialisiert auf die Wiederverwertung von Aluminium und anderen Metallen. Wir bieten faire Preise für Ihre Wertstoffe.',
    hours: 'Mo-Do 8:00-17:00, Fr 8:00-16:00',
    services: ['aluminium', 'metal', 'batteries'],
    rating: 4.8,
    ratingCount: 65,
    isVerified: true,
    verificationStatus: 'verified',
    location: {
      type: 'Point',
      coordinates: [9.993, 53.551]
    }
  }
];

async function seedDatabase() {
  console.log('Connecting to MongoDB...');
  
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('Connected to MongoDB successfully');
    
    // Get the model
    const RecyclingCenter = mongoose.model('RecyclingCenter', recyclingCenterSchema);
    
    // Count existing centers
    const existingCount = await RecyclingCenter.countDocuments();
    console.log(`Found ${existingCount} existing recycling centers`);
    
    if (existingCount > 0) {
      const continueSeeding = process.argv.includes('--force');
      if (!continueSeeding) {
        console.log('Database already has data. Use --force to override existing data.');
        await mongoose.disconnect();
        return;
      }
      
      // Clear existing data
      console.log('Clearing existing data...');
      await RecyclingCenter.deleteMany({});
    }
    
    // Insert sample data
    console.log('Inserting sample data...');
    const result = await RecyclingCenter.insertMany(sampleCenters);
    
    console.log(`✅ Successfully seeded ${result.length} recycling centers`);
    
    // Close connection
    await mongoose.disconnect();
    console.log('Database connection closed');
    
  } catch (error) {
    console.error('❌ Database seeding failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the seeding
seedDatabase(); 