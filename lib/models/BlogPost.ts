import mongoose, { Schema, Document } from 'mongoose';

// Function to convert title to slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/ä/g, 'ae')
    .replace(/ö/g, 'oe')
    .replace(/ü/g, 'ue')
    .replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .substring(0, 100);
}

// Interface for the blog post document
export interface IBlogPost extends Document {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  image: string;
  author: string;
  authorTitle: string;
  category: string;
  tags: string[];
  isPremium: boolean;
  date: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Schema for the blog post
const BlogPostSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot be more than 100 characters']
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    excerpt: {
      type: String,
      required: [true, 'Excerpt is required'],
      trim: true,
      maxlength: [300, 'Excerpt cannot be more than 300 characters']
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true
    },
    image: {
      type: String,
      default: '/blog-post-placeholder.jpg'
    },
    author: {
      type: String,
      required: [true, 'Author name is required'],
      trim: true
    },
    authorTitle: {
      type: String,
      required: [true, 'Author title is required'],
      trim: true
    },
    category: {
      type: String,
      required: [true, 'Category is required'],
      enum: {
        values: ['Technologie', 'Tipps & Tricks', 'Politik', 'Wirtschaft', 'Bildung', 'Umwelt'],
        message: '{VALUE} is not a valid category'
      }
    },
    tags: {
      type: [String],
      default: []
    },
    isPremium: {
      type: Boolean,
      default: false
    },
    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

// Pre-save hook to automatically generate slug from title if not provided
BlogPostSchema.pre('save', function(next) {
  if (!this.isModified('title')) {
    return next();
  }
  
  if (!this.slug) {
    this.slug = generateSlug(this.title);
  }
  
  next();
});

// Add text index for search functionality
BlogPostSchema.index({ title: 'text', content: 'text', tags: 'text' });

// Export generateSlug function for use elsewhere
export { generateSlug };

// Define model, accounting for model compilation in development mode
export default mongoose.models.BlogPost || mongoose.model<IBlogPost>('BlogPost', BlogPostSchema); 