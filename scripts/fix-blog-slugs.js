/**
 * Fix blog slugs script
 * Ensures all blog posts have valid slugs for routing
 */

import { MongoClient } from 'mongodb';

// MongoDB connection string 
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/aluminum-recycling';

// Function to generate a slug from a title
function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// Main function to fix blog slugs
async function fixBlogSlugs() {
  console.log('🔍 Checking and fixing blog post slugs...');
  
  try {
    // Connect to MongoDB
    console.log('📡 Connecting to MongoDB...');
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('✅ Connected to MongoDB');
    
    const db = client.db();
    
    // Get all blog posts
    console.log('📚 Fetching blog posts...');
    const blogPosts = await db.collection('blogposts').find({}).toArray();
    console.log(`📊 Found ${blogPosts.length} blog posts`);
    
    let updatedCount = 0;
    let noChangesCount = 0;
    
    // Check each blog post for a valid slug
    for (const post of blogPosts) {
      const title = post.title || 'untitled-post';
      const currentSlug = post.slug || '';
      const generatedSlug = generateSlug(title);
      
      // Add timestamp to ensure uniqueness if needed
      let newSlug = generatedSlug;
      let slugCount = await db.collection('blogposts').countDocuments({ 
        slug: newSlug, 
        _id: { $ne: post._id } 
      });
      
      // If slug exists, make it unique with a timestamp
      if (slugCount > 0 || !newSlug) {
        const timestamp = Date.now() % 10000; // Last 4 digits of timestamp
        newSlug = `${generatedSlug || 'post'}-${timestamp}`;
      }
      
      // Check if slug needs updating
      if (currentSlug !== newSlug) {
        console.log(`🔄 Updating slug for post "${post.title}"`);
        console.log(`   Old: ${currentSlug || '(none)'}`);
        console.log(`   New: ${newSlug}`);
        
        // Update the post with the new slug
        await db.collection('blogposts').updateOne(
          { _id: post._id },
          { $set: { slug: newSlug } }
        );
        
        updatedCount++;
      } else {
        noChangesCount++;
      }
    }
    
    console.log('\n✅ Blog slug check completed:');
    console.log(`   - Updated: ${updatedCount} posts`);
    console.log(`   - No changes needed: ${noChangesCount} posts`);
    
    // Check for blog posts without IDs
    const postsWithoutIds = await db.collection('blogposts').find({ _id: { $exists: false } }).toArray();
    if (postsWithoutIds.length > 0) {
      console.log(`⚠️ Found ${postsWithoutIds.length} posts without IDs!`);
    }
    
    // Print routing information
    console.log('\n🔗 Blog post routing information:');
    console.log('   - Blog posts should be accessible at /blog/[slug] or /blog/[id]');
    console.log('   - Make sure the API route /api/blog/[id] returns the correct post data');
    console.log('   - Check that the BlogPost model has slug field defined');
    
    await client.close();
    
  } catch (error) {
    console.error('❌ Error fixing blog slugs:', error);
    process.exit(1);
  }
}

// Print sample blog post for diagnostic purposes
async function printSampleBlogPost() {
  try {
    // Connect to MongoDB
    const client = new MongoClient(MONGODB_URI);
    await client.connect();
    
    const db = client.db();
    
    // Get a sample blog post
    const samplePost = await db.collection('blogposts').findOne({});
    
    if (samplePost) {
      console.log('\n📝 Sample blog post structure:');
      console.log(JSON.stringify(samplePost, null, 2));
      
      // Check if the database uses a different collection name
      if (!samplePost) {
        // Try to find collections that might contain blog posts
        const collections = await db.listCollections().toArray();
        const potentialBlogCollections = collections
          .filter(c => c.name.toLowerCase().includes('blog') || c.name.toLowerCase().includes('post'))
          .map(c => c.name);
          
        if (potentialBlogCollections.length > 0) {
          console.log('\n⚠️ No posts found in "blogposts" collection. Check these collections:');
          potentialBlogCollections.forEach(name => console.log(`   - ${name}`));
        }
      }
    } else {
      console.log('\n⚠️ No blog posts found in the database!');
    }
    
    await client.close();
  } catch (error) {
    console.error('❌ Error printing sample blog post:', error);
  }
}

// Run the script
(async () => {
  await fixBlogSlugs();
  await printSampleBlogPost();
})(); 