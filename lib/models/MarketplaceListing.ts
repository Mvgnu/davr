import mongoose, { Types } from 'mongoose';

// Define interface for a bid on a marketplace listing
export interface IBid {
  _id?: Types.ObjectId;
  recyclingCenterId: Types.ObjectId;
  amount: number;
  message?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  createdAt: Date;
  updatedAt: Date;
}

// Define interface for a message related to a marketplace listing
export interface IMessage {
  _id?: Types.ObjectId;
  senderId: Types.ObjectId;
  senderType: 'user' | 'recyclingCenter';
  senderName: string;
  content: string;
  read: boolean;
  createdAt: Date;
}

// Define the TypeScript interface for MarketplaceListing
export interface IMarketplaceListing {
  _id?: Types.ObjectId;
  sellerId: Types.ObjectId;
  title: string;
  description: string;
  materialType: string[];
  quantity: number;
  unit: string;
  price: number;
  negotiable: boolean;
  condition: 'neu' | 'wie-neu' | 'gut' | 'gebraucht' | 'beschädigt';
  images: string[];
  location: {
    address: string;
    city: string;
    postalCode: string;
    state?: string;
    latitude?: number;
    longitude?: number;
  };
  contactPreference: 'email' | 'phone' | 'both';
  contactDetails: {
    name: string;
    email: string;
    phone?: string;
  };
  pickupOnly: boolean;
  shippingAvailable: boolean;
  shippingCost?: number;
  status: 'aktiv' | 'verkauft' | 'reserviert' | 'abgelaufen' | 'gesperrt';
  expiresAt: Date;
  views: number;
  featured: boolean;
  bids: IBid[];
  messages: IMessage[];
  createdAt: Date;
  updatedAt: Date;
}

// Define the Bid Schema
const BidSchema = new mongoose.Schema<IBid>({
  recyclingCenterId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'RecyclingCenter',
    required: true
  },
  amount: { 
    type: Number, 
    required: true 
  },
  message: { 
    type: String 
  },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'expired'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Define the Message Schema
const MessageSchema = new mongoose.Schema<IMessage>({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true
  },
  senderType: {
    type: String,
    enum: ['user', 'recyclingCenter'],
    required: true
  },
  senderName: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  read: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Define the Location Schema
const LocationSchema = new mongoose.Schema({
  address: { type: String, required: true },
  city: { type: String, required: true },
  postalCode: { type: String, required: true },
  state: { type: String },
  latitude: { type: Number },
  longitude: { type: Number }
});

// Define the Contact Details Schema
const ContactDetailsSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String }
});

// Define the Mongoose Schema for MarketplaceListing
const MarketplaceListingSchema = new mongoose.Schema<IMarketplaceListing>(
  {
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    title: { 
      type: String, 
      required: true, 
      trim: true,
      maxlength: 100
    },
    description: { 
      type: String, 
      required: true,
      maxlength: 2000
    },
    materialType: {
      type: [String],
      required: true,
      validate: [(val: string[]) => val.length > 0, 'At least one material type is required']
    },
    quantity: {
      type: Number,
      required: true,
      min: 0.01
    },
    unit: {
      type: String,
      required: true
    },
    price: {
      type: Number,
      required: true,
      min: 0
    },
    negotiable: {
      type: Boolean,
      default: false
    },
    condition: {
      type: String,
      enum: ['neu', 'wie-neu', 'gut', 'gebraucht', 'beschädigt'],
      required: true
    },
    images: {
      type: [String],
      default: []
    },
    location: {
      type: LocationSchema,
      required: true
    },
    contactPreference: {
      type: String,
      enum: ['email', 'phone', 'both'],
      default: 'email'
    },
    contactDetails: {
      type: ContactDetailsSchema,
      required: true
    },
    pickupOnly: {
      type: Boolean,
      default: false
    },
    shippingAvailable: {
      type: Boolean,
      default: true
    },
    shippingCost: {
      type: Number,
      min: 0
    },
    status: {
      type: String,
      enum: ['aktiv', 'verkauft', 'reserviert', 'abgelaufen', 'gesperrt'],
      default: 'aktiv'
    },
    expiresAt: {
      type: Date,
      required: true
    },
    views: {
      type: Number,
      default: 0
    },
    featured: {
      type: Boolean,
      default: false
    },
    bids: [BidSchema],
    messages: [MessageSchema],
    createdAt: {
      type: Date,
      default: Date.now
    },
    updatedAt: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for better query performance
MarketplaceListingSchema.index({ sellerId: 1 });
MarketplaceListingSchema.index({ materialType: 1 });
MarketplaceListingSchema.index({ status: 1 });
MarketplaceListingSchema.index({ 'location.city': 1 });
MarketplaceListingSchema.index({ 'location.postalCode': 1 });
MarketplaceListingSchema.index({ createdAt: -1 });
MarketplaceListingSchema.index({ expiresAt: 1 });
MarketplaceListingSchema.index({ price: 1 });

// Pre-save hook to set expiration date if not set
MarketplaceListingSchema.pre('save', function(next) {
  if (!this.expiresAt) {
    // Set expiration to 30 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);
    this.expiresAt = expiresAt;
  }
  next();
});

// Create and export the model
// Check if the model already exists before creating a new one (for hot reloading)
export default (mongoose.models && mongoose.models.MarketplaceListing) || 
  mongoose.model<IMarketplaceListing>('MarketplaceListing', MarketplaceListingSchema); 