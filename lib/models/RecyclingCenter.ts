import mongoose, { Types, Document } from 'mongoose';

// Define interface for marketplace listing
export interface IMarketplaceListing {
  _id?: Types.ObjectId;
  centerId: Types.ObjectId;
  title: string;
  description: string;
  acceptedMaterials: string[];
  pricePerKg: number;
  minWeight?: number;
  maxWeight?: number;
  active: boolean;
  createdAt: Date;
}

// Define the TypeScript interface for RecyclingCenter
export interface IRecyclingCenter extends Document {
  name: string;
  slug: string;
  address: string;
  city: string;
  state?: string;
  postalCode: string;
  phone?: string;
  email?: string;
  website?: string;
  openingHours?: string;
  hours?: string;
  latitude?: number;
  longitude?: number;
  description: string;
  services?: string[];
  acceptedMaterials?: string[];
  buyMaterials?: {
    materialId: string;
    pricePerKg: number;
    minWeight?: number;
    maxWeight?: number;
    active: boolean;
  }[];
  rating?: number;
  ratingCount?: number;
  owner?: Types.ObjectId;
  ownerId?: Types.ObjectId;
  location?: {
    type: string;
    coordinates: number[];
  };
  images?: string[];
  claimed: boolean;
  claimedBy?: Types.ObjectId;
  claimedAt?: Date;
  isVerified: boolean;
  verificationStatus: 'pending' | 'verified' | 'rejected' | 'unclaimed';
  claimRequests?: Types.ObjectId[];
  claimData?: {
    name: string;
    email: string;
    phone: string;
    message: string;
    date: Date;
  };
  marketplaceListings?: IMarketplaceListing[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the Marketplace Listing Schema
const MarketplaceListingSchema = new mongoose.Schema<IMarketplaceListing>({
  centerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'RecyclingCenter',
    required: true
  },
  title: { 
    type: String, 
    required: true,
    maxlength: 100
  },
  description: { 
    type: String, 
    required: true,
    maxlength: 1000
  },
  acceptedMaterials: { 
    type: [String], 
    required: true 
  },
  pricePerKg: { 
    type: Number, 
    required: true,
    min: 0
  },
  minWeight: { 
    type: Number,
    min: 0,
    default: 0
  },
  maxWeight: { 
    type: Number,
    min: 0
  },
  active: { 
    type: Boolean,
    default: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define the Mongoose Schema for RecyclingCenter
const RecyclingCenterSchema = new mongoose.Schema<IRecyclingCenter>(
  {
    name: { type: String, required: true },
    slug: { 
      type: String, 
      unique: true,
      sparse: true, // Allow null values to not trigger uniqueness constraint
      index: true 
    },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    postalCode: { type: String, required: true },
    phone: { type: String },
    email: { type: String },
    website: { type: String },
    openingHours: { type: String },
    hours: { type: String },
    latitude: { type: Number },
    longitude: { type: Number },
    description: { type: String },
    services: { 
      type: [String],
      default: []
    },
    acceptedMaterials: { 
      type: [String],
      default: []
    },
    buyMaterials: [{
      materialId: { type: String, required: true },
      pricePerKg: { type: Number, required: true, min: 0 },
      minWeight: { type: Number, min: 0 },
      maxWeight: { type: Number, min: 0 },
      active: { type: Boolean, default: true }
    }],
    rating: { 
      type: Number, 
      min: 0, 
      max: 5, 
      default: 0 
    },
    ratingCount: {
      type: Number,
      default: 0
    },
    owner: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    ownerId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    location: {
      type: {
        type: String,
        enum: ['Point'],
        default: 'Point'
      },
      coordinates: {
        type: [Number],
        default: [0, 0] // [longitude, latitude]
      }
    },
    images: [String],
    claimed: { 
      type: Boolean, 
      default: false 
    },
    claimedBy: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    claimedAt: { 
      type: Date 
    },
    isVerified: { 
      type: Boolean, 
      default: false 
    },
    verificationStatus: { 
      type: String, 
      enum: ['pending', 'verified', 'rejected', 'unclaimed'],
      default: 'unclaimed'
    },
    claimRequests: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    claimData: {
      name: String,
      email: String,
      phone: String,
      message: String,
      date: Date
    },
    marketplaceListings: [MarketplaceListingSchema]
  },
  {
    timestamps: true, // Automatically creates createdAt and updatedAt fields
  }
);

// Create geospatial index for location-based queries
RecyclingCenterSchema.index({ location: '2dsphere' });

// Create index for city and services for faster lookups
RecyclingCenterSchema.index({ city: 1 });
RecyclingCenterSchema.index({ services: 1 });
RecyclingCenterSchema.index({ acceptedMaterials: 1 });
RecyclingCenterSchema.index({ ownerId: 1 });
RecyclingCenterSchema.index({ owner: 1 });
RecyclingCenterSchema.index({ claimed: 1 });
RecyclingCenterSchema.index({ claimedBy: 1 });
RecyclingCenterSchema.index({ city: 1, slug: 1 });

// Create a slug before saving if it doesn't exist
RecyclingCenterSchema.pre('save', function(this: IRecyclingCenter, next) {
  if (!this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '') + 
      '-' + (this._id as { toString(): string }).toString().slice(-6);
  }
  next();
});

// Create and export the model
// Check if the model already exists before creating a new one (for hot reloading)
// Safely check if mongoose.models exists before accessing it
export default (mongoose.models && mongoose.models.RecyclingCenter) || 
  mongoose.model<IRecyclingCenter>('RecyclingCenter', RecyclingCenterSchema); 