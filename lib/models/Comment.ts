import mongoose, { Schema, Document } from 'mongoose';

// Interface for the comment document
export interface IComment extends Document {
  name: string;
  email: string;
  website?: string;
  text: string;
  blogPostId: mongoose.Types.ObjectId | string;
  parentId?: mongoose.Types.ObjectId | string;
  isApproved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for comments
const CommentSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, 'Name ist erforderlich'],
      trim: true,
      maxlength: [50, 'Name darf nicht länger als 50 Zeichen sein']
    },
    email: {
      type: String,
      required: [true, 'E-Mail ist erforderlich'],
      trim: true,
      maxlength: [100, 'E-Mail darf nicht länger als 100 Zeichen sein'],
      match: [/^\S+@\S+\.\S+$/, 'Bitte geben Sie eine gültige E-Mail-Adresse ein']
    },
    website: {
      type: String,
      trim: true,
      maxlength: [100, 'Website-URL darf nicht länger als 100 Zeichen sein']
    },
    text: {
      type: String,
      required: [true, 'Kommentartext ist erforderlich'],
      trim: true,
      maxlength: [2000, 'Kommentar darf nicht länger als 2000 Zeichen sein']
    },
    blogPostId: {
      type: Schema.Types.ObjectId,
      ref: 'BlogPost',
      required: [true, 'Blog-Post-ID ist erforderlich']
    },
    parentId: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
      default: null
    },
    isApproved: {
      type: Boolean,
      default: true // Auto-approve comments by default, can be changed to false if moderation is needed
    }
  },
  { timestamps: true }
);

// Define model, accounting for model compilation in development mode
export default mongoose.models.Comment || mongoose.model<IComment>('Comment', CommentSchema); 