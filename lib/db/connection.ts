import mongoose from 'mongoose';

// Mark this file as server-only to prevent client imports
import 'server-only';

// Use a direct connection string with the IP instead of localhost
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aluminum-recycling';

// Global variable to maintain connection across requests
let globalWithMongo = global as typeof globalThis & {
  mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
};

// Initialize the global connection state
if (!globalWithMongo.mongoose) {
  globalWithMongo.mongoose = {
    conn: null,
    promise: null,
  };
}

/**
 * Connect to MongoDB (server-side only)
 */
async function dbConnect(): Promise<typeof mongoose> {
  try {
    // Use existing connection if available
    if (globalWithMongo.mongoose.conn) {
      console.log('Using existing MongoDB connection');
      return globalWithMongo.mongoose.conn;
    }

    // Use existing promise if one is in flight
    if (!globalWithMongo.mongoose.promise) {
      console.log('Connecting to MongoDB...');
      
      // Ensure URI exists
      if (!MONGODB_URI) {
        throw new Error('MongoDB connection string is missing');
      }

      console.log(`Attempting to connect to MongoDB at ${MONGODB_URI.substring(0, MONGODB_URI.indexOf('?') > 0 ? MONGODB_URI.indexOf('?') : 10)}...`);

      // Create connection with appropriate options
      globalWithMongo.mongoose.promise = mongoose.connect(MONGODB_URI, {
        bufferCommands: false,
        // Add these additional connection options for reliability
        serverSelectionTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000, // 45 seconds
      });
    }

    // Await the connection
    globalWithMongo.mongoose.conn = await globalWithMongo.mongoose.promise;
    console.log('MongoDB connected successfully');
    
    // Setup an error handler on the connection
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      globalWithMongo.mongoose.conn = null;
      globalWithMongo.mongoose.promise = null;
    });
    
    // Return the connection
    return globalWithMongo.mongoose.conn;
  } catch (error) {
    // Reset the connection promise on error
    globalWithMongo.mongoose.promise = null;
    console.error('MongoDB connection error:', error);
    
    // Provide more detailed error information
    if (error instanceof Error) {
      console.error('Error details:', {
        name: error.name,
        message: error.message,
        stack: error.stack
      });
    }
    
    throw error;
  }
}

export default dbConnect; 