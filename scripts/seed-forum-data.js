import { MongoClient, ObjectId } from 'mongodb';
import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// Initialize dotenv
config();

// Get current file's directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuration
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aluminum-recycling-germany';
const DB_NAME = process.env.DB_NAME || 'aluminum-recycling-germany';
const NUM_POSTS = 15;

// Sample categories
const CATEGORIES = [
  'Recycling Tips',
  'Community Projects',
  'Product Discussion',
  'News & Updates',
  'General Discussion',
  'Help & Support'
];

// Sample tags
const TAGS = [
  'Aluminium', 'Recycling', 'Nachhaltigkeit', 'Umwelt', 'Deutschland', 
  'Tipps', 'Frage', 'Innovation', 'Technologie', 'Verpackung',
  'Sammlung', 'Kreislaufwirtschaft', 'Energieeffizienz'
];

// Sample content for forum posts
const SAMPLE_TITLES = [
  'Wie recycelt ihr Aluminium-Verpackungen?',
  'Neue Recycling-Station in München eröffnet',
  'Unterschiede zwischen Aluminiumsorten beim Recycling',
  'Energieeffizienz von Aluminium-Recycling',
  'Welche Aluminiumprodukte lassen sich am besten recyceln?',
  'Tipps zum Sammeln von Aluminium für Anfänger',
  'Frage: Wo kann ich spezielle Aluminiumteile abgeben?',
  'Innovative Recyclingtechniken für 2024',
  'Umweltauswirkungen von nicht recyceltem Aluminium',
  'Wie unterstützt die deutsche Gesetzgebung Aluminium-Recycling?',
  'Sammelaktionen in meiner Stadt organisieren',
  'Kreislaufwirtschaft: Von der Dose zum neuen Produkt',
  'Wirtschaftliche Vorteile des Aluminium-Recyclings',
  'Kann man zu Hause Aluminium schmelzen?',
  'Die häufigsten Fehler beim Recyceln von Aluminium'
];

// Sample content blocks
const CONTENT_BLOCKS = [
  'Ich interessiere mich schon seit langem für nachhaltige Recycling-Methoden und wollte mit euch meine Erfahrungen teilen. In meinem Haushalt sammeln wir alle Aluminiumverpackungen separat und bringen sie zum lokalen Recyclinghof. Wie handhabt ihr das?',
  
  'In unserer Gegend wurde ein neues Recyclingsystem eingeführt, bei dem Aluminium vom restlichen Metall getrennt gesammelt wird. Das scheint mir ein Schritt in die richtige Richtung zu sein, da verschiedene Metalle unterschiedliche Recyclingprozesse benötigen.',
  
  'Ich habe gehört, dass Aluminium nahezu unbegrenzt recycelt werden kann, ohne an Qualität zu verlieren. Stimmt das? Und wenn ja, warum werden dann noch immer neue Aluminiumvorkommen abgebaut, anstatt stärker auf das Recycling zu setzen?',
  
  'Meine Familie und ich versuchen, unseren ökologischen Fußabdruck zu reduzieren. Ein Bereich, auf den wir uns konzentrieren, ist die Reduzierung von Einwegverpackungen, einschließlich Aluminiumdosen. Habt ihr Tipps, wie man Aluminium im Alltag einsparen kann?',
  
  'Als Ingenieur finde ich die technischen Aspekte des Aluminium-Recyclings faszinierend. Der Energieverbrauch für das Recycling beträgt nur etwa 5% der Energie, die für die Primärproduktion benötigt wird. Das ist ein enormer Unterschied!',
  
  'Ich arbeite in einer Recyclinganlage und möchte euch einen Einblick in unsere tägliche Arbeit geben. Die Sortierung von Aluminium erfolgt bei uns mittels Wirbelstromabscheider, die das nicht-magnetische Aluminium von anderen Materialien trennen können.',
  
  'In meiner Stadt gibt es eine Initiative, bei der Schulen Aluminium sammeln und dafür Geld für Schulprojekte bekommen. Ich finde das eine tolle Idee, um schon früh das Bewusstsein für Recycling zu fördern. Gibt es ähnliche Projekte in euren Städten?'
];

// Function to create a random post
function createRandomPost(userId) {
  const title = SAMPLE_TITLES[Math.floor(Math.random() * SAMPLE_TITLES.length)];
  const contentBlocks = [];
  
  // Add 1-3 random content blocks
  const numBlocks = Math.floor(Math.random() * 3) + 1;
  for (let i = 0; i < numBlocks; i++) {
    contentBlocks.push(CONTENT_BLOCKS[Math.floor(Math.random() * CONTENT_BLOCKS.length)]);
  }
  
  // Add 1-4 random tags
  const postTags = [];
  const numTags = Math.floor(Math.random() * 4) + 1;
  for (let i = 0; i < numTags; i++) {
    const tag = TAGS[Math.floor(Math.random() * TAGS.length)];
    if (!postTags.includes(tag)) {
      postTags.push(tag);
    }
  }
  
  // Generate random stats
  const upvotes = Math.floor(Math.random() * 50);
  const downvotes = Math.floor(Math.random() * 10);
  const responseCount = Math.floor(Math.random() * 20);
  
  // Create date in the past (1-30 days ago)
  const daysAgo = Math.floor(Math.random() * 30) + 1;
  const createdAt = new Date();
  createdAt.setDate(createdAt.getDate() - daysAgo);
  
  return {
    title,
    content: contentBlocks.join('\n\n'),
    userId: new ObjectId(userId),
    category: CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)],
    tags: postTags,
    upvotes,
    downvotes,
    responseCount,
    createdAt,
    updatedAt: createdAt,
    isResponse: false,
    views: Math.floor(Math.random() * 200) + 20
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
      console.log('Creating a sample user...');
      // Create a sample user if none exist
      const sampleUser = {
        name: 'Max Mustermann',
        email: 'max@example.com',
        username: 'max.mustermann',
        password: '$2a$10$0RIelGmhr0TYTNvOI1T1UOZM7WXEcVyinbYLQtvzp8QMzwUv.rg9K', // hashed "password123"
        role: 'user',
        isPremium: false,
        accountType: 'user',
        profile: {
          bio: 'Ein Recycling-Enthusiast aus München',
          location: 'München, Deutschland',
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      const userResult = await usersCollection.insertOne(sampleUser);
      console.log(`Created sample user with ID: ${userResult.insertedId}`);
      var userId = userResult.insertedId;
    } else {
      // Use an existing user
      const user = await usersCollection.findOne({});
      userId = user._id;
      console.log(`Using existing user with ID: ${userId}`);
    }
    
    // Check for existing forum posts
    const forumCollection = db.collection('forumPosts');
    const existingPosts = await forumCollection.countDocuments();
    
    if (existingPosts > 0) {
      console.log(`Found ${existingPosts} existing forum posts. Clearing collection...`);
      await forumCollection.deleteMany({});
    }
    
    // Create forum posts
    console.log(`Creating ${NUM_POSTS} forum posts...`);
    const posts = [];
    
    for (let i = 0; i < NUM_POSTS; i++) {
      posts.push(createRandomPost(userId));
    }
    
    const result = await forumCollection.insertMany(posts);
    console.log(`${result.insertedCount} forum posts created!`);
    
    // Create some responses for a few posts
    const postsWithResponses = await forumCollection.find().limit(5).toArray();
    
    console.log('Creating responses for some posts...');
    const responsesCollection = db.collection('forumResponses');
    
    // Clear existing responses
    await responsesCollection.deleteMany({});
    
    const responses = [];
    
    for (const post of postsWithResponses) {
      const numResponses = Math.floor(Math.random() * 5) + 1;
      
      for (let i = 0; i < numResponses; i++) {
        const responseDate = new Date(post.createdAt);
        responseDate.setHours(responseDate.getHours() + Math.floor(Math.random() * 48) + 1);
        
        responses.push({
          content: CONTENT_BLOCKS[Math.floor(Math.random() * CONTENT_BLOCKS.length)],
          userId: new ObjectId(userId),
          postId: new ObjectId(post._id),
          upvotes: Math.floor(Math.random() * 10),
          downvotes: Math.floor(Math.random() * 3),
          createdAt: responseDate,
          updatedAt: responseDate,
          isResponse: true
        });
      }
    }
    
    if (responses.length > 0) {
      const responseResult = await responsesCollection.insertMany(responses);
      console.log(`${responseResult.insertedCount} responses created!`);
    }
    
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