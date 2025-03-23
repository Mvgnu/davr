import mongoose from 'mongoose';

// Use a direct connection string with the IP instead of localhost
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/aluminum-recycling';

/**
 * Connect to MongoDB for seed scripts
 */
async function dbConnect(): Promise<typeof mongoose> {
  try {
    // Ensure URI exists
    if (!MONGODB_URI) {
      throw new Error('MongoDB connection string is missing');
    }

    // Create connection with appropriate options
    const conn = await mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
    
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
}

export default dbConnect; 