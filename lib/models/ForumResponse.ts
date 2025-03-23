import mongoose, { Schema, Document } from 'mongoose';

export interface IForumResponse extends Document {
  postId: mongoose.Types.ObjectId;
  content: string;
  author: string;
  authorId: mongoose.Types.ObjectId;
  createdAt: Date;
  upvotes: number;
  downvotes: number;
  parentResponseId?: mongoose.Types.ObjectId;
}

const ForumResponseSchema: Schema = new Schema({
  postId: {
    type: Schema.Types.ObjectId,
    ref: 'ForumPost',
    required: true,
    index: true
  },
  content: {
    type: String,
    required: true,
    trim: true
  },
  author: {
    type: String,
    required: true
  },
  authorId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  upvotes: {
    type: Number,
    default: 0
  },
  downvotes: {
    type: Number,
    default: 0
  },
  parentResponseId: {
    type: Schema.Types.ObjectId,
    ref: 'ForumResponse',
    index: true
  }
});

// Add index for faster querying of responses by post
ForumResponseSchema.index({ postId: 1, createdAt: 1 });

// Ensure model doesn't get registered multiple times
export default mongoose.models.ForumResponse as mongoose.Model<IForumResponse> || 
  mongoose.model<IForumResponse>('ForumResponse', ForumResponseSchema); 