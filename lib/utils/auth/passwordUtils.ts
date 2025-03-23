/**
 * Password utility functions for secure handling of passwords
 * This includes client-side hashing to prevent plaintext passwords from being transmitted
 */

import CryptoJS from 'crypto-js';

/**
 * Hash a password for secure transmission from client to server
 * This ensures passwords are never sent as plaintext
 * 
 * @param password - The plaintext password to hash
 * @param email - User's email used as salt to make the hash more secure
 * @returns A hashed password string that's safe for transmission
 */
export const hashPasswordForTransmission = (password: string, email: string): string => {
  // Create a unique salt by combining the email with a fixed application salt
  const clientSalt = `${email.toLowerCase()}_davr_client_salt`;
  
  // First hash - PBKDF2 with 1000 iterations
  const firstHash = CryptoJS.PBKDF2(password, clientSalt, {
    keySize: 256 / 32,
    iterations: 1000
  }).toString();
  
  // Second hash - SHA256 for consistent output format
  return CryptoJS.SHA256(firstHash).toString();
};

/**
 * Validate password strength before submission
 * 
 * @param password - The password to validate
 * @returns An object with validation results and overall score
 */
export const validatePassword = (password: string) => {
  const validation = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecialChar: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };
  
  // Calculate strength score (0-5)
  const score = Object.values(validation).filter(Boolean).length;
  
  return {
    validation,
    score,
    isStrong: score >= 3
  };
}; 