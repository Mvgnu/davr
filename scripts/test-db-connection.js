// Simple script to test MongoDB connection directly
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

async function testConnection() {
  console.log('Testing MongoDB connection...');
  console.log(`URI: ${MONGODB_URI.replace(/\/\/([^:]+):([^@]+)@/, '//***:***@')}`);
  
  try {
    await mongoose.connect(MONGODB_URI, options);
    console.log('✅ Connection successful!');
    console.log('Connection details:');
    console.log(`- MongoDB version: ${mongoose.version}`);
    console.log(`- Connection state: ${mongoose.connection.readyState}`);
    
    // Test creating a simple model and document
    const TestModel = mongoose.model('TestConnection', new mongoose.Schema({
      name: String,
      testDate: { type: Date, default: Date.now }
    }));
    
    // Create a test document
    const testDoc = new TestModel({ name: 'Connection Test' });
    await testDoc.save();
    console.log('✅ Test document created successfully');
    
    // Clean up - remove the test document
    await TestModel.deleteMany({ name: 'Connection Test' });
    console.log('✅ Test cleanup successful');
    
    // Close connection
    await mongoose.disconnect();
    console.log('Connection closed');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.error('Error details:', error);
  }
}

// Run the test
testConnection(); 