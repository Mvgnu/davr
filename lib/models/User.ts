import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';
import { verifyClientHashedPassword } from '@/lib/utils/auth/serverPasswordUtils';

// Define the TypeScript interface for User
export interface IUser extends Document {
  username: string;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin';
  isPremium: boolean;
  accountType: 'user' | 'center';
  profile: {
    bio?: string;
    location?: string;
    website?: string;
    avatar?: string;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// Define the Mongoose Schema for User
const UserSchema = new Schema<IUser>(
  {
    username: { 
      type: String, 
      required: [true, 'Please provide a username'], 
      unique: true,
      trim: true,
      minlength: [3, 'Username must be at least 3 characters'],
      maxlength: [20, 'Username cannot be more than 20 characters']
    },
    name: {
      type: String,
      required: [true, 'Please provide a name'],
      trim: true
    },
    email: { 
      type: String, 
      required: [true, 'Please provide an email'],
      unique: true,
      match: [
        /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
        'Please provide a valid email'
      ]
    },
    password: { 
      type: String, 
      required: [true, 'Please provide a password'],
      minlength: [6, 'Password must be at least 6 characters']
    },
    role: { 
      type: String, 
      enum: ['user', 'admin'],
      default: 'user' 
    },
    isPremium: { 
      type: Boolean, 
      default: false 
    },
    accountType: {
      type: String,
      enum: ['user', 'center'],
      default: 'user',
    },
    profile: {
      bio: String,
      location: String,
      website: String,
      avatar: String,
    },
  },
  {
    timestamps: true
  }
);

// Updated comparePassword method to work with client-side hashed passwords
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  // We now use our utility function that can handle client-side hashed passwords
  return verifyClientHashedPassword(candidatePassword, this.password, this.email);
};

// Safe check that handles if mongoose.models is undefined
let User;
try {
  // Check if the model already exists to prevent model overwrite error
  User = mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
} catch (error) {
  // If there's an error, create the model
  User = mongoose.model<IUser>('User', UserSchema);
}

export default User as mongoose.Model<IUser>; 