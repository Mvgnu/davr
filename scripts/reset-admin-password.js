import { MongoClient } from 'mongodb';
import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

// Database connection URL
const MONGODB_URI = 'mongodb://127.0.0.1:27017/aluminum-recycling';

// Admin credentials
const ADMIN_EMAIL = 'admin@aluminum-recycling.de';
const ADMIN_PASSWORD = 'admin123';

// Client-side hashing (same as in frontend)
function hashPasswordForTransmission(password, email) {
  // Create a unique salt based on email
  const clientSalt = `${email.toLowerCase()}_davr_client_salt`;
  
  // First hash - PBKDF2 with 1000 iterations
  const firstHash = CryptoJS.PBKDF2(password, clientSalt, {
    keySize: 256 / 32,
    iterations: 1000
  }).toString();
  
  // Second hash - SHA256 for consistent output format
  return CryptoJS.SHA256(firstHash).toString();
}

// Server-side bcrypt hashing (same as done after receiving the client-hashed password)
async function hashPasswordForStorage(clientHashedPassword) {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(clientHashedPassword, salt);
}

async function resetAdminPassword() {
  let client;
  
  try {
    // Connect to MongoDB
    client = new MongoClient(MONGODB_URI);
    await client.connect();
    console.log('Connected to MongoDB');

    const db = client.db();
    const usersCollection = db.collection('users');
    
    // Step 1: Hash the password as if it came from the client
    const clientHashedPassword = hashPasswordForTransmission(ADMIN_PASSWORD, ADMIN_EMAIL);
    console.log('Client-hashed password:', clientHashedPassword);
    
    // Step 2: Hash the client-hashed password for storage (bcrypt)
    const finalHashedPassword = await hashPasswordForStorage(clientHashedPassword);
    console.log('Final bcrypt-hashed password generated for storage');
    
    // Step 3: Update the admin user with the new password
    const result = await usersCollection.updateOne(
      { email: ADMIN_EMAIL },
      { 
        $set: { 
          password: finalHashedPassword,
          updatedAt: new Date()
        }
      }
    );
    
    if (result.matchedCount > 0) {
      console.log('Admin password reset successfully');
      console.log('You can now log in with:');
      console.log(`Email: ${ADMIN_EMAIL}`);
      console.log(`Password: ${ADMIN_PASSWORD}`);
    } else {
      console.log('Admin user not found. Creating one...');
      
      // Create an admin user if it doesn't exist
      await usersCollection.insertOne({
        username: 'admin',
        name: 'Administrator',
        email: ADMIN_EMAIL,
        password: finalHashedPassword,
        role: 'admin',
        isPremium: true,
        accountType: 'user',
        profile: {
          bio: 'System Administrator',
        },
        createdAt: new Date(),
        updatedAt: new Date()
      });
      
      console.log('Admin user created successfully');
    }
    
    // Verify we can retrieve the user
    const adminUser = await usersCollection.findOne({ email: ADMIN_EMAIL });
    if (adminUser) {
      console.log('Admin user verification:');
      console.log('- Username:', adminUser.username);
      console.log('- Role:', adminUser.role);
      console.log('- Password hash available:', !!adminUser.password);
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    if (client) {
      await client.close();
      console.log('MongoDB connection closed');
    }
  }
}

// Run the password reset function
resetAdminPassword().catch(console.error); 