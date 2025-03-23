import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IReview extends Document {
  userId: mongoose.Schema.Types.ObjectId;
  centerId: mongoose.Schema.Types.ObjectId;
  rating: number;
  comment: string;
  helpfulCount: number;
  reportCount: number;
  isVerified: boolean;
  isHidden: boolean;
  reviewedOn: Date;
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    centerId: {
      type: Schema.Types.ObjectId,
      ref: 'RecyclingCenter',
      required: [true, 'Recycling center ID is required']
    },
    rating: {
      type: Number,
      required: [true, 'Rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    comment: {
      type: String,
      required: [true, 'Review comment is required'],
      trim: true,
      maxlength: [1000, 'Comment cannot exceed 1000 characters']
    },
    helpfulCount: {
      type: Number,
      default: 0
    },
    reportCount: {
      type: Number,
      default: 0
    },
    isVerified: {
      type: Boolean,
      default: false
    },
    isHidden: {
      type: Boolean,
      default: false
    },
    reviewedOn: {
      type: Date,
      default: Date.now
    }
  },
  {
    timestamps: true
  }
);

// Indexes for faster querying
ReviewSchema.index({ userId: 1 });
ReviewSchema.index({ centerId: 1 });
ReviewSchema.index({ rating: 1 });
ReviewSchema.index({ createdAt: -1 });
ReviewSchema.index({ helpfulCount: -1 });

// Check if model exists before creating it (for hot-reloading in development)
const Review: Model<IReview> = mongoose.models.Review || mongoose.model<IReview>('Review', ReviewSchema);

export default Review; 