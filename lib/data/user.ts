import { query } from '@/lib/db';

/**
 * Fetches a user's profile data by user ID
 * @param userId - The ID of the user to fetch
 * @returns User profile data or null if not found
 */
export async function getUserProfile(userId: string) {
  try {
    console.log('Fetching user profile from PostgreSQL for ID:', userId);
    
    // Query only columns that actually exist in the database based on schema inspection
    const userResult = await query(
      `SELECT 
        id, name, email, role, 
        created_at, updated_at, profile_image
      FROM users 
      WHERE id = $1`,
      [userId]
    );
    
    if (userResult.rows.length === 0) {
      console.log('User not found in PostgreSQL with ID:', userId);
      return null;
    }
    
    const user = userResult.rows[0];
    console.log('User found in PostgreSQL:', { id: user.id, name: user.name });
    
    // Return a clean user object with properly typed properties
    // Using defaults for missing fields to maintain compatibility
    return {
      id: user.id.toString(),
      name: user.name || '',
      email: user.email || '',
      username: user.name || '', // Use name as username
      role: user.role || '',
      isPremium: false, // Default since column doesn't exist
      accountType: 'USER', // Default since column doesn't exist
      profile: {
        bio: '',
        location: '',
        website: '',
        avatar: user.profile_image || '',
      },
      createdAt: user.created_at,
      updatedAt: user.updated_at,
      
      // Map fields for UI convenience
      bio: '',
      location: '',
      website: '',
      avatar: user.profile_image || '',
      
      // Placeholders for UI
      listings: [],
      savedListings: [],
      isVerified: false, // Default since is_premium doesn't exist
    };
  } catch (error) {
    console.error('Error fetching user profile from PostgreSQL:', error);
    return null;
  }
} 