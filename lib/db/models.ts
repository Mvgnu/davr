// This file ensures all models are properly registered before they're used
// Import all models here to prevent "Schema hasn't been registered" errors

// Import mongoose models
import User from '../models/User';
import ForumPost from '../models/ForumPost';
import RecyclingCenter from '../models/RecyclingCenter';

// Export models to ensure they're loaded
export {
  User,
  ForumPost,
  RecyclingCenter
};

// Helper function to preload all models
export function preloadModels() {
  // This function doesn't need to do anything - just importing the models
  // registers their schemas with mongoose
  return {
    User,
    ForumPost,
    RecyclingCenter
  };
} 