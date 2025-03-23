import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { MongoClient } from 'mongodb';
import { createRecyclingCenterSlug } from '@/lib/utils/slugify';

// MongoDB connection string from environment variable
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aluminum-recycling';

/**
 * Seed the database with German test data
 */
async function seedDatabase() {
  console.log('🌱 Starting database seed process...');
  
  try {
    // Connect to MongoDB directly
    console.log('📡 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing collections
    console.log('🧹 Clearing existing data...');
    await db.collection('users').deleteMany({});
    await db.collection('recyclingcenters').deleteMany({});
    await db.collection('blogposts').deleteMany({});
    await db.collection('forumposts').deleteMany({});
    await db.collection('reviews').deleteMany({});
    await db.collection('marketplaceitems').deleteMany({});
    console.log('✅ All collections cleared');
    
    // Create users
    console.log('👤 Creating users...');
    
    // Create admin user
    const adminPassword = await bcrypt.hash('admin123', 10);
    await db.collection('users').insertOne({
      username: 'admin',
      name: 'Admin',
      email: 'admin@recyclium.de',
      password: adminPassword,
      role: 'admin',
      isPremium: true,
      accountType: 'user',
      profile: {
        bio: 'Administrator der Recyclium-Plattform',
        location: 'Berlin',
        website: 'recyclium.de',
        avatar: '/avatars/admin.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create a test user
    const userPassword = await bcrypt.hash('password123', 10);
    await db.collection('users').insertOne({
      username: 'thomas_mueller',
      name: 'Thomas Müller',
      email: 'thomas.mueller@example.de',
      password: userPassword,
      role: 'user',
      isPremium: false,
      accountType: 'user',
      profile: {
        bio: 'Umweltingenieur aus München. Leidenschaftlich engagiert für nachhaltige Kreislaufwirtschaft.',
        location: 'München',
        website: '',
        avatar: '/avatars/user1.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create a recycling center representative
    await db.collection('users').insertOne({
      username: 'maria_krueger',
      name: 'Maria Krüger',
      email: 'maria.krueger@recycling-zentrum.de',
      password: userPassword,
      role: 'user',
      isPremium: false,
      accountType: 'center',
      profile: {
        bio: 'Leiterin des städtischen Recyclinghofs Berlin-Mitte. 15 Jahre Erfahrung im Abfallmanagement.',
        location: 'Berlin',
        website: 'berlin-recycling.de',
        avatar: '/avatars/center1.jpg',
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    console.log('✅ Created users');
    
    // Create a recycling center
    console.log('🏢 Creating recycling centers...');
    const adminUser = await db.collection('users').findOne({ username: 'admin' });
    
    if (!adminUser) {
      console.error('Admin user not found. Make sure users are created first.');
      process.exit(1);
    }
    
    await db.collection('recyclingcenters').insertOne({
      name: 'Berliner Recycling Zentrum',
      slug: createRecyclingCenterSlug('Berliner Recycling Zentrum', 'Berlin'),
      address: 'Recyclingstraße 45',
      city: 'Berlin',
      postalCode: '10115',
      phone: '030 87654321',
      hours: 'Mo-Fr: 8:00-18:00, Sa: 9:00-14:00',
      latitude: 52.5200,
      longitude: 13.4050,
      services: ['Aluminium', 'Metalle', 'Papier', 'Kunststoffe', 'Elektronik'],
      description: 'Das Berliner Recycling Zentrum ist eine moderne Anlage zur Wiederverwertung verschiedener Materialien. Wir sind spezialisiert auf die Sammlung und Verarbeitung von Aluminium und anderen Metallen. Unser Team von Experten sorgt für eine umweltgerechte und effiziente Verwertung aller Materialien.',
      rating: 4.7,
      ownerId: adminUser._id,
      isVerified: true,
      verificationStatus: 'verified',
      isActive: true,
      marketplaceListings: [
        {
          title: 'Aluminiumspäne aus Dreherei - 200kg',
          description: 'Aluminiumspäne aus unserer Dreherei, ca. 200kg, sehr rein und sortenrein. Abholung nach Vereinbarung möglich oder Anlieferung zu unserem Recyclingzentrum.',
          acceptedMaterials: ['Aluminiumspäne', 'Industrieabfälle'],
          pricePerKg: 1.20,
          minWeight: 10,
          maxWeight: 200,
          active: true,
        }
      ],
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Created recycling centers');
    
    // Create a blog post
    console.log('📝 Creating blog posts...');
    await db.collection('blogposts').insertOne({
      title: 'Die Zukunft des Aluminiumrecyclings in Deutschland',
      excerpt: 'Wie neue Technologien und Verfahren die Recyclingquoten von Aluminium in Deutschland steigern können und welche Herausforderungen noch zu bewältigen sind.',
      content: 'Ausführlicher Artikel über Aluminiumrecycling in Deutschland...',
      image: '/blog/aluminium-recycling-future.jpg',
      author: 'Dr. Michael Schneider',
      authorTitle: 'Umweltingenieur und Berater für Kreislaufwirtschaft',
      category: 'Technologie',
      tags: ['Technologie', 'Innovation', 'Nachhaltigkeit', 'Kreislaufwirtschaft'],
      isPremium: false,
      date: new Date('2023-07-15'),
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Created blog posts');
    
    // Create a forum post
    console.log('💬 Creating forum posts...');
    await db.collection('forumposts').insertOne({
      title: 'Wo kann ich in Berlin größere Mengen Aluminiumprofile abgeben?',
      content: 'Ich renoviere gerade meine Altbauwohnung in Berlin-Kreuzberg und habe dabei eine Menge alter Aluminiumfensterrahmen ausgebaut. Es handelt sich um etwa 12 Rahmen in gutem Zustand, die insgesamt vielleicht 50-60 kg wiegen. Weiß jemand, wo ich diese in Berlin am besten abgeben kann?',
      category: 'Hilfe',
      tags: ['Berlin', 'Aluminiumprofile', 'Vergütung', 'Recyclinghof'],
      userId: adminUser._id,
      isResponse: false,
      responseCount: 0,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Created forum posts');
    
    // Create marketplace listings
    console.log('🛒 Creating marketplace items...');
    await db.collection('marketplaceitems').insertOne({
      title: 'Aluminiumspäne aus Dreherei - 200kg',
      description: 'Biete ca. 200kg saubere Aluminiumspäne aus unserer Dreherei an. Sortenrein und ohne Verunreinigungen.',
      price: 220,
      category: 'Verkauf',
      condition: 'Neu',
      location: 'München',
      images: ['/marketplace/aluminium-spaene.jpg'],
      tags: ['Aluminiumspäne', 'Dreherei', 'Großmenge'],
      userId: adminUser._id,
      contactPhone: '0151 12345678',
      contactEmail: 'admin@recyclium.de',
      createdAt: new Date(),
      updatedAt: new Date()
    });
    console.log('✅ Created marketplace items');
    
    console.log('✅ Database seeding completed successfully!');
    await client.close();
    process.exit(0);
    
  } catch (error: any) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run the seed function
seedDatabase(); 