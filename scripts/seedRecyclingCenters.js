/**
 * Script to seed the database with sample recycling centers
 * Run with: node scripts/seedRecyclingCenters.js
 */

const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');
const fs = require('fs');

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config();

// Database connection string
const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error('MONGODB_URI environment variable is not set.');
  process.exit(1);
}

// Load the RecyclingCenter model
// Note: We need to define it here because the models in lib/models are using ES modules
const RecyclingCenterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true,
      maxlength: [200, 'Address cannot exceed 200 characters'],
    },
    postalCode: {
      type: String,
      required: [true, 'Postal code is required'],
      trim: true,
      maxlength: [10, 'Postal code cannot exceed 10 characters'],
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      maxlength: [100, 'City cannot exceed 100 characters'],
    },
    state: {
      type: String,
      trim: true,
      maxlength: [100, 'State cannot exceed 100 characters'],
    },
    country: {
      type: String,
      default: 'Germany',
      trim: true,
    },
    phone: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
    },
    website: {
      type: String,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    services: {
      type: [String],
      required: [true, 'At least one service is required'],
    },
    openingHours: {
      type: Object,
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point',
      },
      coordinates: {
        type: [Number],
        default: [0, 0],
      },
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    submittedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    verificationStatus: {
      type: String,
      enum: ['unclaimed', 'pending', 'verified', 'rejected'],
      default: 'unclaimed',
    },
    reviewNotes: {
      type: String,
    },
    averageRating: {
      type: Number,
      default: 0,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    marketplaceListings: [
      {
        title: {
          type: String,
          required: [true, 'Title is required'],
          trim: true,
          maxlength: [100, 'Title cannot exceed 100 characters'],
        },
        description: {
          type: String,
          required: [true, 'Description is required'],
          trim: true,
          maxlength: [500, 'Description cannot exceed 500 characters'],
        },
        acceptedMaterials: {
          type: [String],
          required: [true, 'At least one material is required'],
        },
        pricePerKg: {
          type: Number,
          required: [true, 'Price per kg is required'],
          min: [0, 'Price cannot be negative'],
        },
        minWeight: {
          type: Number,
          default: 0,
          min: [0, 'Minimum weight cannot be negative'],
        },
        maxWeight: {
          type: Number,
          default: 0,
        },
        active: {
          type: Boolean,
          default: true,
        },
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
  },
  {
    timestamps: true,
  }
);

RecyclingCenterSchema.index({ location: '2dsphere' });
RecyclingCenterSchema.index({ city: 1 });
RecyclingCenterSchema.index({ postalCode: 1 });
RecyclingCenterSchema.index({ services: 1 });
RecyclingCenterSchema.index({ ownerId: 1 });
RecyclingCenterSchema.index({ 'marketplaceListings.acceptedMaterials': 1 });

const RecyclingCenter = mongoose.models.RecyclingCenter || mongoose.model('RecyclingCenter', RecyclingCenterSchema);

// Sample data for recycling centers
const recyclingCenters = [
  {
    name: 'Berlin Recycle Hub',
    address: 'Recyclingstraße 12',
    postalCode: '10115',
    city: 'Berlin',
    state: 'Berlin',
    country: 'Germany',
    phone: '+49 30 1234567',
    email: 'info@berlinrecyclehub.de',
    website: 'https://www.berlinrecyclehub.de',
    description: 'A central recycling hub in Berlin accepting various materials including aluminum.',
    services: ['Aluminum Cans', 'Aluminum Scrap', 'Aluminum Foil', 'Other Metals', 'Plastic Recycling'],
    openingHours: {
      monday: '08:00-18:00',
      tuesday: '08:00-18:00',
      wednesday: '08:00-18:00',
      thursday: '08:00-18:00',
      friday: '08:00-18:00',
      saturday: '09:00-14:00',
      sunday: 'Closed'
    },
    location: {
      type: 'Point',
      coordinates: [13.3903, 52.5200]
    },
    verificationStatus: 'unclaimed',
    isActive: true
  },
  {
    name: 'Munich Metal Recycling',
    address: 'Metallweg 45',
    postalCode: '80331',
    city: 'München',
    state: 'Bayern',
    country: 'Germany',
    phone: '+49 89 9876543',
    email: 'kontakt@munich-metal.de',
    website: 'https://www.munich-metal.de',
    description: 'Specialized in metal recycling with premium prices for aluminum.',
    services: ['Aluminum Cans', 'Aluminum Scrap', 'Aluminum Profiles', 'Aluminum Siding', 'Other Metals'],
    openingHours: {
      monday: '07:30-17:00',
      tuesday: '07:30-17:00',
      wednesday: '07:30-17:00',
      thursday: '07:30-17:00',
      friday: '07:30-16:00',
      saturday: '09:00-13:00',
      sunday: 'Closed'
    },
    location: {
      type: 'Point',
      coordinates: [11.5820, 48.1351]
    },
    verificationStatus: 'unclaimed',
    isActive: true,
    marketplaceListings: [
      {
        title: 'Buying Aluminum Cans - Best Prices',
        description: 'We offer top rates for clean aluminum cans. Must be free of plastic and other contaminants.',
        acceptedMaterials: ['Aluminum Cans'],
        pricePerKg: 0.85,
        minWeight: 5,
        active: true
      },
      {
        title: 'Industrial Aluminum Scrap Wanted',
        description: 'Looking for industrial aluminum scrap. Higher prices for larger quantities.',
        acceptedMaterials: ['Aluminum Scrap', 'Aluminum Profiles'],
        pricePerKg: 1.2,
        minWeight: 50,
        active: true
      }
    ]
  },
  {
    name: 'Hamburg Hafen Recycling',
    address: 'Hafenstraße 78',
    postalCode: '20457',
    city: 'Hamburg',
    state: 'Hamburg',
    country: 'Germany',
    phone: '+49 40 3456789',
    email: 'info@hafenrecycling.de',
    website: 'https://www.hafenrecycling.de',
    description: 'Located in Hamburg\'s harbor area, we specialize in all types of metal recycling.',
    services: ['Aluminum Cans', 'Aluminum Scrap', 'Aluminum Wire', 'Other Metals', 'Electronic Waste'],
    openingHours: {
      monday: '08:00-17:00',
      tuesday: '08:00-17:00',
      wednesday: '08:00-17:00',
      thursday: '08:00-17:00',
      friday: '08:00-17:00',
      saturday: '10:00-14:00',
      sunday: 'Closed'
    },
    location: {
      type: 'Point',
      coordinates: [9.9937, 53.5511]
    },
    verificationStatus: 'unclaimed',
    isActive: true
  },
  {
    name: 'Köln Eco Recycling',
    address: 'Umweltstraße 23',
    postalCode: '50667',
    city: 'Köln',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    phone: '+49 221 5678901',
    email: 'service@koeln-eco.de',
    website: 'https://www.koeln-eco.de',
    description: 'Eco-friendly recycling center with special focus on sustainable processing methods.',
    services: ['Aluminum Cans', 'Aluminum Foil', 'Plastic Recycling', 'Glass Recycling', 'Paper Recycling'],
    openingHours: {
      monday: '09:00-18:00',
      tuesday: '09:00-18:00',
      wednesday: '09:00-18:00',
      thursday: '09:00-18:00',
      friday: '09:00-18:00',
      saturday: '10:00-15:00',
      sunday: 'Closed'
    },
    location: {
      type: 'Point',
      coordinates: [6.9603, 50.9375]
    },
    verificationStatus: 'unclaimed',
    isActive: true
  },
  {
    name: 'Frankfurt Metal Trade',
    address: 'Industrieweg 67',
    postalCode: '60311',
    city: 'Frankfurt',
    state: 'Hessen',
    country: 'Germany',
    phone: '+49 69 6789012',
    email: 'info@frankfurt-metal.de',
    website: 'https://www.frankfurt-metal.de',
    description: 'Industrial metal recycling with competitive rates for bulk materials.',
    services: ['Aluminum Scrap', 'Aluminum Profiles', 'Aluminum Siding', 'Aluminum Wire', 'Other Metals'],
    openingHours: {
      monday: '07:00-17:00',
      tuesday: '07:00-17:00',
      wednesday: '07:00-17:00',
      thursday: '07:00-17:00',
      friday: '07:00-16:00',
      saturday: 'Closed',
      sunday: 'Closed'
    },
    location: {
      type: 'Point',
      coordinates: [8.6821, 50.1109]
    },
    verificationStatus: 'unclaimed',
    isActive: true,
    marketplaceListings: [
      {
        title: 'Aluminum Profiles - Premium Rates',
        description: 'We buy clean aluminum profiles at premium rates. Commercial quantities preferred.',
        acceptedMaterials: ['Aluminum Profiles'],
        pricePerKg: 1.3,
        minWeight: 20,
        active: true
      }
    ]
  },
  {
    name: 'Stuttgart Green Recycling',
    address: 'Grüner Weg 34',
    postalCode: '70173',
    city: 'Stuttgart',
    state: 'Baden-Württemberg',
    country: 'Germany',
    phone: '+49 711 7890123',
    email: 'kontakt@stuttgart-green.de',
    website: 'https://www.stuttgart-green.de',
    description: 'Comprehensive recycling services with a focus on environmental sustainability.',
    services: ['Aluminum Cans', 'Plastic Recycling', 'Glass Recycling', 'Paper Recycling', 'Electronic Waste'],
    openingHours: {
      monday: '08:30-18:00',
      tuesday: '08:30-18:00',
      wednesday: '08:30-18:00',
      thursday: '08:30-18:00',
      friday: '08:30-18:00',
      saturday: '09:00-14:00',
      sunday: 'Closed'
    },
    location: {
      type: 'Point',
      coordinates: [9.1800, 48.7758]
    },
    verificationStatus: 'unclaimed',
    isActive: true
  },
  {
    name: 'Düsseldorf Metal Experts',
    address: 'Metallgasse 12',
    postalCode: '40213',
    city: 'Düsseldorf',
    state: 'Nordrhein-Westfalen',
    country: 'Germany',
    phone: '+49 211 8901234',
    email: 'info@duesseldorf-metal.de',
    website: 'https://www.duesseldorf-metal.de',
    description: 'Expert metal processing and recycling with state-of-the-art facilities.',
    services: ['Aluminum Scrap', 'Aluminum Profiles', 'Aluminum Wire', 'Other Metals'],
    openingHours: {
      monday: '08:00-17:30',
      tuesday: '08:00-17:30',
      wednesday: '08:00-17:30',
      thursday: '08:00-17:30',
      friday: '08:00-16:30',
      saturday: '09:00-13:00',
      sunday: 'Closed'
    },
    location: {
      type: 'Point',
      coordinates: [6.7735, 51.2277]
    },
    verificationStatus: 'unclaimed',
    isActive: true,
    marketplaceListings: [
      {
        title: 'Industrial Aluminum Buyback Program',
        description: 'Ongoing buyback program for industrial aluminum waste. Long-term partnerships preferred.',
        acceptedMaterials: ['Aluminum Scrap', 'Aluminum Profiles', 'Aluminum Wire'],
        pricePerKg: 1.15,
        minWeight: 100,
        active: true
      }
    ]
  },
  {
    name: 'Leipzig Recycling Center',
    address: 'Recyclingallee 56',
    postalCode: '04109',
    city: 'Leipzig',
    state: 'Sachsen',
    country: 'Germany',
    phone: '+49 341 9012345',
    email: 'info@leipzig-recycling.de',
    website: 'https://www.leipzig-recycling.de',
    description: 'Full-service recycling center serving Leipzig and surrounding areas.',
    services: ['Aluminum Cans', 'Aluminum Scrap', 'Plastic Recycling', 'Glass Recycling', 'Paper Recycling'],
    openingHours: {
      monday: '08:00-18:00',
      tuesday: '08:00-18:00',
      wednesday: '08:00-18:00',
      thursday: '08:00-18:00',
      friday: '08:00-18:00',
      saturday: '09:00-14:00',
      sunday: 'Closed'
    },
    location: {
      type: 'Point',
      coordinates: [12.3731, 51.3397]
    },
    verificationStatus: 'unclaimed',
    isActive: true
  },
  {
    name: 'Dresden Alu Recycling',
    address: 'Aluminiumstraße 78',
    postalCode: '01067',
    city: 'Dresden',
    state: 'Sachsen',
    country: 'Germany',
    phone: '+49 351 0123456',
    email: 'kontakt@dresden-alu.de',
    website: 'https://www.dresden-alu.de',
    description: 'Specialized in aluminum recycling with modern processing equipment.',
    services: ['Aluminum Cans', 'Aluminum Scrap', 'Aluminum Foil', 'Aluminum Profiles', 'Aluminum Siding'],
    openingHours: {
      monday: '07:30-16:30',
      tuesday: '07:30-16:30',
      wednesday: '07:30-16:30',
      thursday: '07:30-16:30',
      friday: '07:30-15:30',
      saturday: '08:00-12:00',
      sunday: 'Closed'
    },
    location: {
      type: 'Point',
      coordinates: [13.7372, 51.0505]
    },
    verificationStatus: 'unclaimed',
    isActive: true,
    marketplaceListings: [
      {
        title: 'Aluminum Can Collection Drive',
        description: 'Special rates for clean aluminum cans. Community collection drives welcome.',
        acceptedMaterials: ['Aluminum Cans'],
        pricePerKg: 0.9,
        minWeight: 2,
        active: true
      }
    ]
  },
  {
    name: 'Hannover Eco-Metal',
    address: 'Ökoweg 23',
    postalCode: '30159',
    city: 'Hannover',
    state: 'Niedersachsen',
    country: 'Germany',
    phone: '+49 511 1234567',
    email: 'info@hannover-ecometal.de',
    website: 'https://www.hannover-ecometal.de',
    description: 'Ecological metal recycling with a focus on minimal environmental impact.',
    services: ['Aluminum Cans', 'Aluminum Scrap', 'Other Metals', 'Electronic Waste'],
    openingHours: {
      monday: '08:00-17:00',
      tuesday: '08:00-17:00',
      wednesday: '08:00-17:00',
      thursday: '08:00-17:00',
      friday: '08:00-17:00',
      saturday: '09:00-13:00',
      sunday: 'Closed'
    },
    location: {
      type: 'Point',
      coordinates: [9.7320, 52.3759]
    },
    verificationStatus: 'unclaimed',
    isActive: true
  }
];

// Connect to the database
mongoose
  .connect(MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    try {
      // Count existing centers
      const existingCount = await RecyclingCenter.countDocuments();
      console.log(`Database currently has ${existingCount} recycling centers.`);

      // Check if we should proceed with seeding
      if (existingCount >= recyclingCenters.length) {
        console.log('Database already has sufficient recycling centers. No seeding needed.');
        process.exit(0);
      }

      // Insert recycling centers
      const result = await RecyclingCenter.insertMany(recyclingCenters);
      console.log(`Successfully added ${result.length} recycling centers to the database.`);
    } catch (error) {
      console.error('Error seeding the database:', error);
    } finally {
      // Disconnect from the database
      mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
  })
  .catch((error) => {
    console.error('Could not connect to MongoDB:', error);
    process.exit(1);
  }); 