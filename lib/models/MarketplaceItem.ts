import mongoose, { Document, Schema } from 'mongoose';

export interface ILocation {
  city: string;
  state?: string;
  postalCode: string;
  coordinates?: {
    type: string;
    coordinates: number[];
  };
}

export interface IMarketplaceItem extends Document {
  title: string;
  description: string;
  price: number;
  quantity: number;
  quantityUnit: string;
  images: string[];
  category: string;
  condition: 'new' | 'like-new' | 'good' | 'fair' | 'salvage';
  location: ILocation;
  seller: mongoose.Types.ObjectId | any;
  availableForPickup: boolean;
  availableForShipping: boolean;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const LocationSchema = new Schema<ILocation>({
  city: { type: String, required: true },
  state: { type: String },
  postalCode: { type: String, required: true },
  coordinates: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }
  }
});

const MarketplaceItemSchema = new Schema<IMarketplaceItem>(
  {
    title: { type: String, required: true, trim: true, maxlength: 100 },
    description: { type: String, required: true, trim: true, maxlength: 5000 },
    price: { type: Number, required: true, min: 0 },
    quantity: { type: Number, required: true, min: 1 },
    quantityUnit: { type: String, required: true, trim: true },
    images: { type: [String], default: [] },
    category: { 
      type: String, 
      required: true,
      enum: [
        'Raw Materials',
        'Scrap Metal',
        'Manufacturing Supplies',
        'Equipment & Tools',
        'Recycled Products',
        'Bulk Materials',
        'Other'
      ]
    },
    condition: { 
      type: String, 
      required: true,
      enum: ['new', 'like-new', 'good', 'fair', 'salvage']
    },
    location: { type: LocationSchema, required: true },
    seller: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    availableForPickup: { type: Boolean, default: true },
    availableForShipping: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Create a geospatial index for location-based queries
MarketplaceItemSchema.index({ 'location.coordinates': '2dsphere' });

// Text index for full-text search
MarketplaceItemSchema.index({ 
  title: 'text', 
  description: 'text',
  'location.city': 'text'
});

// Get model or create a new one
const MarketplaceItem = mongoose.models.MarketplaceItem || 
  mongoose.model<IMarketplaceItem>('MarketplaceItem', MarketplaceItemSchema);

export default MarketplaceItem; 