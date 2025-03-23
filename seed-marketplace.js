import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';

// Initialize dotenv
config();

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aluminum-recycling-germany';
const DB_NAME = process.env.DB_NAME || 'aluminum-recycling-germany';
const NUM_LISTINGS = 15;

// Sample marketplace listings data
const CATEGORIES = [
  'Rohstoffe',
  'Maschinen',
  'Fahrzeuge',
  'Werkzeuge',
  'Verpackungen',
  'Büroausstattung',
  'Sonstige'
];

const CONDITIONS = [
  'Neu',
  'Wie neu',
  'Sehr gut',
  'Gut',
  'Akzeptabel',
  'Defekt/Ersatzteile'
];

const LOCATIONS = [
  'Berlin', 'Hamburg', 'München', 'Köln', 'Frankfurt am Main',
  'Stuttgart', 'Düsseldorf', 'Leipzig', 'Dortmund', 'Essen'
];

const STATUSES = ['active', 'sold', 'pending', 'draft'];

const TITLES = [
  'Aluminium-Rohstoffe in großer Menge',
  'Industrielle Recyclinganlage für Aluminium',
  'Aluminiumschrott zum Weiterverkauf',
  'Gebrauchte Metallpresse',
  'Hochwertige Alufolien-Reste',
  'Aluminium-Gussformen',
  'Spezial-Werkzeuge für Aluminiumbearbeitung',
  'Aluminium-Barren',
  'Industrielle Schmelzöfen',
  'Aluminium-Verpackungsmaterial',
  'Transport-Container für Metallschrott',
  'Recycling-Maschine für Aluminiumdosen',
  'Büroausstattung aus recyceltem Aluminium',
  'Aluminiumprofile für Bauprojekte',
  'Alte Fensterrahmen aus Aluminium'
];

const IMAGES = [
  'https://images.unsplash.com/photo-1615485290382-441e4d049cb5?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1531761535209-180857e963d9?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1556912998-c57cc6b63cd7?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1574144113084-b6f450cc5e0c?w=800&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1560343776-97e7d202ff0e?w=800&auto=format&fit=crop'
];

// Function to create a random marketplace listing
function createRandomListing(userId) {
  const title = TITLES[Math.floor(Math.random() * TITLES.length)];
  const description = `Dies ist ein Angebot für ${title}. Die Ware befindet sich in gutem Zustand und kann sofort abgeholt werden. Bei Interesse kontaktieren Sie mich gerne für weitere Details oder ein Angebot.`;
  
  // Generate random price between 50 and 5000
  const price = Math.floor(Math.random() * 4950) + 50;
  
  // Generate random dates within the last 60 days
  const daysAgo = Math.floor(Math.random() * 60) + 1;
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);
  
  // Generate 1-3 random images
  const numImages = Math.floor(Math.random() * 3) + 1;
  const images = [];
  for (let i = 0; i < numImages; i++) {
    images.push(IMAGES[Math.floor(Math.random() * IMAGES.length)]);
  }
  
  return {
    title,
    description,
    price,
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    condition: CONDITIONS[Math.floor(Math.random() * CONDITIONS.length)],
    seller: new ObjectId(userId),
    location: LOCATIONS[Math.floor(Math.random() * LOCATIONS.length)],
    status: STATUSES[Math.floor(Math.random() * STATUSES.length)],
    images,
    createdAt,
    updatedAt: createdAt
  };
}

// Main function to seed the database
async function seedDatabase() {
  let client;
  
  try {
    console.log('Connecting to MongoDB...');
    client = await MongoClient.connect(MONGODB_URI);
    const db = client.db(DB_NAME);
    
    // Check for existing users
    const usersCollection = db.collection('users');
    const userCount = await usersCollection.countDocuments();
    
    if (userCount === 0) {
      console.log('No users found. Please run the user seed script first.');
      return;
    }
    
    // Use an existing user for the seller
    const user = await usersCollection.findOne({});
    const userId = user._id;
    console.log(`Using existing user with ID: ${userId} as seller`);
    
    // Check for existing marketplace listings
    const marketplaceCollection = db.collection('marketplacelistings');
    const existingListings = await marketplaceCollection.countDocuments();
    
    if (existingListings > 0) {
      console.log(`Found ${existingListings} existing marketplace listings. Clearing collection...`);
      await marketplaceCollection.deleteMany({});
    }
    
    // Create marketplace listings
    console.log(`Creating ${NUM_LISTINGS} marketplace listings...`);
    const listings = [];
    
    for (let i = 0; i < NUM_LISTINGS; i++) {
      listings.push(createRandomListing(userId));
    }
    
    const result = await marketplaceCollection.insertMany(listings);
    console.log(`${result.insertedCount} marketplace listings created!`);
    
    console.log('Database seeding completed successfully!');
  } catch (error) {
    console.error('Error seeding database:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('Database connection closed.');
    }
  }
}

// Run the seeding function
seedDatabase();
