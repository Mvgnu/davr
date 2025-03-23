import { MongoClient } from 'mongodb';

async function checkDb() {
  try {
    const client = await MongoClient.connect('mongodb://127.0.0.1:27017/aluminum-recycling');
    const db = client.db();
    
    // Get all collections
    const collections = await db.listCollections().toArray();
    console.log('Collections:', collections.map(c => c.name));
    
    // Check forum posts collection
    const forumPostsCount = await db.collection('forumposts').countDocuments();
    console.log(`Found ${forumPostsCount} forum posts`);
    
    // Get sample post
    if (forumPostsCount > 0) {
      const samplePost = await db.collection('forumposts').findOne({});
      console.log('Sample post title:', samplePost.title);
      console.log('Sample post fields:', Object.keys(samplePost));
      console.log('Is post a response?', samplePost.isResponse);
      console.log('Post userId:', samplePost.userId);
    }
    
    await client.close();
  } catch (err) {
    console.error('Error:', err);
  }
}

checkDb(); 