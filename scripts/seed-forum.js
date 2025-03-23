/**
 * Simple forum seeding script
 * Seeds the database with German forum posts about recycling
 */

import { MongoClient } from 'mongodb';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// MongoDB connection string
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aluminum-recycling';

// Get directory name in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import forum data from a JSON file (created from the TypeScript data)
const forumDataPath = path.join(__dirname, '..', 'lib', 'seed-data', 'forum-data.json');

// Main function to seed forum data
async function seedForum() {
  console.log('🌱 Seeding forum data...');
  
  // First, create a JSON file from the forum-posts.ts data if it doesn't exist
  if (!fs.existsSync(forumDataPath)) {
    console.log('📝 Creating forum-data.json from TypeScript data...');
    
    // Get the TypeScript file content
    const tsFilePath = path.join(__dirname, '..', 'lib', 'seed-data', 'forum-posts.ts');
    const tsContent = fs.readFileSync(tsFilePath, 'utf8');
    
    // Extract the array content using regex
    const postsMatch = tsContent.match(/export const seedForumPosts = \[([\s\S]*?)\];/);
    const responsesMatch = tsContent.match(/export const seedForumResponses = \[([\s\S]*?)\];/);
    
    if (!postsMatch || !responsesMatch) {
      console.error('❌ Could not extract forum data from TypeScript file.');
      process.exit(1);
    }
    
    // Extract the user IDs
    const userIdsMatch = tsContent.match(/const userIds = \{([\s\S]*?)\};/);
    
    // Create JSON structure
    const forumData = {
      forumPosts: eval(`[${postsMatch[1]}]`),
      forumResponses: eval(`[${responsesMatch[1]}]`),
      userIds: userIdsMatch ? eval(`({${userIdsMatch[1]}})`) : {}
    };
    
    // Write to JSON file
    fs.writeFileSync(forumDataPath, JSON.stringify(forumData, null, 2));
    console.log('✅ Created forum-data.json');
  }
  
  // Load the forum data
  const forumData = JSON.parse(fs.readFileSync(forumDataPath, 'utf8'));
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Clear existing forum posts and responses
    console.log('🧹 Clearing existing forum data...');
    await db.collection('forumPosts').deleteMany({});
    
    // Create a few simple user accounts if they don't exist
    console.log('👤 Checking for users...');
    const usersCount = await db.collection('users').countDocuments();
    
    if (usersCount === 0) {
      console.log('👤 Creating sample users...');
      const users = [
        {
          username: 'MariaM',
          email: 'maria@example.com',
          password: '$2a$10$kIqR5rWqEAIBJJNTT6CdZ.T9GloeaCP6l.MK2X3D4kA4aJXFuhbpe', // 'password123'
          name: 'Maria Müller',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          username: 'ThomasS',
          email: 'thomas@example.com',
          password: '$2a$10$kIqR5rWqEAIBJJNTT6CdZ.T9GloeaCP6l.MK2X3D4kA4aJXFuhbpe', // 'password123'
          name: 'Thomas Schmidt',
          role: 'user',
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          username: 'AnnaW',
          email: 'anna@example.com',
          password: '$2a$10$kIqR5rWqEAIBJJNTT6CdZ.T9GloeaCP6l.MK2X3D4kA4aJXFuhbpe', // 'password123'
          name: 'Anna Weber',
          role: 'admin',
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      
      const result = await db.collection('users').insertMany(users);
      console.log(`✅ Created ${result.insertedCount} sample users`);
    } else {
      console.log(`✅ Found ${usersCount} existing users`);
    }
    
    // Get user IDs to associate with forum posts
    const users = await db.collection('users').find({}).toArray();
    
    // Prepare forum posts by associating with real user IDs
    console.log('📝 Preparing forum posts...');
    const posts = forumData.forumPosts.map((post, index) => {
      // Assign a user to this post (cycling through available users)
      const user = users[index % users.length];
      
      return {
        ...post,
        userId: user._id,
        username: user.username || post.username,
        createdAt: new Date(post.createdAt),
        updatedAt: new Date(post.updatedAt)
      };
    });
    
    // Insert forum posts
    console.log('📝 Inserting forum posts...');
    const postsResult = await db.collection('forumPosts').insertMany(posts);
    console.log(`✅ Inserted ${postsResult.insertedCount} forum posts`);
    
    // Map old post IDs to new MongoDB IDs
    const postIdMap = posts.reduce((map, post, index) => {
      const oldId = forumData.forumPosts[index]._id;
      map[oldId] = postsResult.insertedIds[index];
      return map;
    }, {});
    
    // Prepare forum responses by updating post references
    console.log('📝 Preparing forum responses...');
    const responses = forumData.forumResponses.map((response, index) => {
      // Assign a user to this response (cycling through available users)
      const user = users[(index + 1) % users.length];
      
      return {
        ...response,
        postId: postIdMap[response.postId] || response.postId, // Map to new post ID
        userId: user._id,
        username: user.username || response.username,
        createdAt: new Date(response.createdAt),
        updatedAt: new Date(response.updatedAt)
      };
    });
    
    // Insert forum responses
    if (responses.length > 0) {
      console.log('📝 Inserting forum responses...');
      const responsesResult = await db.collection('forumPosts').insertMany(responses);
      console.log(`✅ Inserted ${responsesResult.insertedCount} forum responses`);
    }
    
    // Update response counts on posts
    console.log('📝 Updating post response counts...');
    for (const [oldPostId, newPostId] of Object.entries(postIdMap)) {
      const responseCount = responses.filter(r => r.postId.toString() === newPostId.toString()).length;
      
      if (responseCount > 0) {
        await db.collection('forumPosts').updateOne(
          { _id: newPostId },
          { $set: { responseCount } }
        );
      }
    }
    
    console.log('✅ Forum data seeding completed successfully!');
    await client.close();
    
  } catch (error) {
    console.error('❌ Error seeding forum data:', error);
    process.exit(1);
  }
}

// Run the function
seedForum().catch(console.error); 