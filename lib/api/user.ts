/**
 * Client-side API functions for user profile operations
 */

/**
 * Updates a user's profile
 * @param userId - The ID of the user to update (NO LONGER USED - obtained from session)
 * @param profileData - The profile data to update
 * @returns Response with success/error status
 */
export async function updateUserProfile(/*userId: string,*/ profileData: any) {
  try {
    const response = await fetch(`/api/profile`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profileData),
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Ein Fehler ist aufgetreten',
      };
    }

    return {
      success: true,
      data,
    };
  } catch (error) {
    console.error('Error updating user profile:', error);
    return {
      success: false,
      message: 'Ein Fehler ist aufgetreten',
    };
  }
}

/**
 * Deletes a user's account
 * @param userId - The ID of the user to delete (NO LONGER USED - obtained from session)
 * @returns Response with success/error status
 */
export async function deleteUserProfile(/*userId: string*/) {
  try {
    const response = await fetch(`/api/profile`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const data = await response.json();

    if (!response.ok) {
      return {
        success: false,
        message: data.error || 'Ein Fehler ist aufgetreten',
      };
    }

    return {
      success: true,
      message: data.message || 'Konto erfolgreich gelöscht',
    };
  } catch (error) {
    console.error('Error deleting user profile:', error);
    return {
      success: false,
      message: 'Ein Fehler ist aufgetreten',
    };
  }
} 