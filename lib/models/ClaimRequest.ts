import mongoose, { Types } from 'mongoose';

// Define the TypeScript interface for ClaimRequest
export interface IClaimRequest {
  userId: Types.ObjectId;
  centerId: Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  message: string;
  evidence?: string;
  reviewedBy?: Types.ObjectId;
  reviewNotes?: string;
  reviewedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose Schema for ClaimRequest
const ClaimRequestSchema = new mongoose.Schema<IClaimRequest>(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecyclingCenter',
      required: [true, 'Recycling Center ID is required']
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected'],
      default: 'pending'
    },
    message: {
      type: String,
      required: [true, 'Claim message is required'],
      trim: true,
      maxlength: [500, 'Message cannot be more than 500 characters']
    },
    evidence: {
      type: String,
      trim: true
    },
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewNotes: {
      type: String,
      trim: true
    },
    reviewedAt: {
      type: Date
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for faster queries
ClaimRequestSchema.index({ userId: 1 });
ClaimRequestSchema.index({ centerId: 1 });
ClaimRequestSchema.index({ status: 1 });
ClaimRequestSchema.index({ createdAt: -1 });

// Create and export the model
export default mongoose.models.ClaimRequest ||
  mongoose.model<IClaimRequest>('ClaimRequest', ClaimRequestSchema); 