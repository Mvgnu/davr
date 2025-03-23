import mongoose, { Schema, Document, Model } from 'mongoose';

export interface ILocation {
  type: 'Point';
  coordinates: number[];
}

export interface IReview {
  userId: string;
  username: string;
  rating: number;
  comment: string;
  createdAt: Date;
}

export interface IRecyclingCenter extends Document {
  name: string;
  slug: string;
  address: string;
  postalCode: string;
  city: string;
  state: string;
  country: string;
  phone: string;
  email: string;
  website: string;
  description: string;
  hours: string;
  services: string[];
  rating: number;
  ratingCount: number;
  reviews: IReview[];
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected';
  location: ILocation;
  images: string[];
  createdAt: Date;
  updatedAt: Date;
}

const locationSchema = new Schema<ILocation>({
  type: {
    type: String,
    enum: ['Point'],
    default: 'Point'
  },
  coordinates: {
    type: [Number],
    default: []
  }
});

const reviewSchema = new Schema<IReview>({
  userId: { type: String, required: true },
  username: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

const recyclingCenterSchema = new Schema<IRecyclingCenter>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  address: { type: String, required: true },
  postalCode: { type: String, required: true },
  city: { type: String, required: true },
  state: { type: String, default: '' },
  country: { type: String, default: 'Germany' },
  phone: { type: String, required: true },
  email: { type: String, default: '' },
  website: { type: String, default: '' },
  description: { type: String, required: true },
  hours: { type: String, required: true },
  services: { type: [String], required: true },
  rating: { type: Number, default: 0 },
  ratingCount: { type: Number, default: 0 },
  reviews: { type: [reviewSchema], default: [] },
  isVerified: { type: Boolean, default: false },
  verificationStatus: { 
    type: String, 
    enum: ['pending', 'verified', 'rejected'],
    default: 'pending'
  },
  location: { 
    type: locationSchema,
    index: '2dsphere'
  },
  images: { type: [String], default: [] },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, {
  timestamps: true
});

// Create indexes
recyclingCenterSchema.index({ name: 'text', city: 'text', address: 'text' });
recyclingCenterSchema.index({ services: 1 });
recyclingCenterSchema.index({ verificationStatus: 1 });
recyclingCenterSchema.index({ city: 1 });
recyclingCenterSchema.index({ rating: -1 });

// Check if model already exists to prevent overwriting during hot reloads
let RecyclingCenterModel: Model<IRecyclingCenter>;

try {
  RecyclingCenterModel = mongoose.model<IRecyclingCenter>('RecyclingCenter');
} catch {
  RecyclingCenterModel = mongoose.model<IRecyclingCenter>('RecyclingCenter', recyclingCenterSchema);
}

export default RecyclingCenterModel; 