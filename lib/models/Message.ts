import mongoose, { Types } from 'mongoose';

// Define the TypeScript interface for Message
export interface IMessage {
  senderId: Types.ObjectId;
  recipientId: Types.ObjectId;
  centerId?: Types.ObjectId;
  subject: string;
  content: string;
  isRead: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Define the Mongoose Schema for Message
const MessageSchema = new mongoose.Schema<IMessage>(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Sender ID is required']
    },
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required']
    },
    centerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'RecyclingCenter'
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
      maxlength: [100, 'Subject cannot be more than 100 characters']
    },
    content: {
      type: String,
      required: [true, 'Message content is required'],
      trim: true
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  {
    timestamps: true
  }
);

// Create indexes for faster queries
MessageSchema.index({ recipientId: 1, isRead: 1 });
MessageSchema.index({ senderId: 1, createdAt: -1 });
MessageSchema.index({ centerId: 1 });

// Create and export the model
export default mongoose.models.Message ||
  mongoose.model<IMessage>('Message', MessageSchema); 