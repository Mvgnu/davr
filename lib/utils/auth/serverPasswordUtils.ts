/**
 * Server-side password utilities for handling authentication with client-side hashed passwords
 */

import bcrypt from 'bcryptjs';
import CryptoJS from 'crypto-js';

/**
 * Generate the expected client-side hash for a given password and email
 * This is used to verify passwords when the client has already hashed them
 * 
 * @param password - The plaintext password (from database)
 * @param email - User's email used as salt
 * @returns The expected client-side hash
 */
export const generateClientSideHash = (password: string, email: string): string => {
  // Recreate the same hashing process used on the client side
  const clientSalt = `${email.toLowerCase()}_davr_client_salt`;
  
  const firstHash = CryptoJS.PBKDF2(password, clientSalt, {
    keySize: 256 / 32,
    iterations: 1000
  }).toString();
  
  return CryptoJS.SHA256(firstHash).toString();
};

/**
 * Verify a password during login when using client-side hashing
 * 
 * @param clientHashedPassword - The password already hashed by client
 * @param storedHashedPassword - The hashed password stored in the database
 * @param email - User's email for salt creation
 * @returns Whether the password is valid
 */
export const verifyClientHashedPassword = async (
  clientHashedPassword: string,
  storedHashedPassword: string,
  email: string
): Promise<boolean> => {
  try {
    console.log('Verifying password:');
    console.log('- Client-hashed password available:', !!clientHashedPassword);
    console.log('- Stored bcrypt hash available:', !!storedHashedPassword);
    
    // Direct comparison - the password from client was hashed client-side,
    // then the server hashed it with bcrypt for storage
    const isMatch = await bcrypt.compare(clientHashedPassword, storedHashedPassword);
    console.log('- Password match result:', isMatch);
    
    return isMatch;
  } catch (error) {
    console.error('Error verifying password:', error);
    return false;
  }
};

/**
 * Hash a password for storage in the database from a client-hashed password
 * 
 * @param clientHashedPassword - Password already hashed on the client side
 * @returns Securely hashed password for database storage
 */
export const hashPasswordForStorage = async (clientHashedPassword: string): Promise<string> => {
  const salt = await bcrypt.genSalt(10);
  return await bcrypt.hash(clientHashedPassword, salt);
}; 