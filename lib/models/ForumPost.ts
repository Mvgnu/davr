import mongoose, { Types } from 'mongoose';

// Define the TypeScript interface for ForumPost
export interface IForumPost {
  title: string;
  content: string;
  userId: Types.ObjectId;
  tags?: string[];
  category: string;
  upvotes?: Types.ObjectId[];
  downvotes?: Types.ObjectId[];
  responseCount?: number;
  parentId?: Types.ObjectId;
  isResponse?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose Schema for ForumPost
const ForumPostSchema = new mongoose.Schema<IForumPost>(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot be more than 200 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required']
    },
    tags: {
      type: [String],
      default: []
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Allgemein', 'Tipps & Tricks', 'News', 'Hilfe', 'Marktplatz', 'Diskussion'],
        message: '{VALUE} is not a valid category'
      }
    },
    upvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    downvotes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    }],
    responseCount: {
      type: Number,
      default: 0
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ForumPost'
    },
    isResponse: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for faster queries
ForumPostSchema.index({ userId: 1 });
ForumPostSchema.index({ category: 1 });
ForumPostSchema.index({ parentId: 1 });
ForumPostSchema.index({ tags: 1 });
ForumPostSchema.index({ createdAt: -1 });
ForumPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Create and export the model
export default mongoose.models.ForumPost ||
  mongoose.model<IForumPost>('ForumPost', ForumPostSchema); 