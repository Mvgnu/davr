import mongoose, { Types } from 'mongoose';

// Define the TypeScript interface for RecyclingEntry
export interface IRecyclingEntry {
  id?: string;
  userId: Types.ObjectId;
  date: Date;
  type: string;
  weight: number;
  centerName?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose Schema for RecyclingEntry
const RecyclingEntrySchema = new mongoose.Schema<IRecyclingEntry>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now
    },
    type: {
      type: String,
      required: [true, 'Recycling type is required'],
      enum: [
        'Aluminum Cans',
        'Aluminum Foil',
        'Aluminum Packaging',
        'Electronic Waste',
        'Industrial Aluminum',
        'Other Aluminum'
      ]
    },
    weight: {
      type: Number,
      required: [true, 'Weight is required'],
      min: [0.01, 'Weight must be greater than 0']
    },
    centerName: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot be more than 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for faster queries
RecyclingEntrySchema.index({ userId: 1, date: -1 });
RecyclingEntrySchema.index({ type: 1 });

// Create and export the model
export default mongoose.models.RecyclingEntry ||
  mongoose.model<IRecyclingEntry>('RecyclingEntry', RecyclingEntrySchema); 