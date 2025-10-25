import { signIn } from 'next-auth/react';
import { prisma } from '../lib/db/prisma';
import bcrypt from 'bcryptjs';

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

// Mock Prisma
jest.mock('../lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('Login Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('should successfully authenticate admin user', async () => {
    // Setup mock user data
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      password: await bcrypt.hash('admin123', 10),
      isAdmin: true,
      emailVerified: null,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    // Mock successful NextAuth sign in
    signIn.mockResolvedValue({
      ok: true,
      status: 200,
      url: '/dashboard',
    });

    // Test the authentication flow
    const result = await signIn('credentials', {
      email: 'admin@example.com',
      password: 'admin123',
      redirect: false,
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
    });
    expect(signIn).toHaveBeenCalledWith('credentials', {
      email: 'admin@example.com',
      password: 'admin123',
      redirect: false,
    });
  });

  test('should reject invalid credentials', async () => {
    // Setup mock user data with wrong password
    const mockUser = {
      id: '1',
      email: 'admin@example.com',
      name: 'Admin User',
      password: await bcrypt.hash('wrongpassword', 10),
      isAdmin: true,
      emailVerified: null,
    };

    prisma.user.findUnique.mockResolvedValue(mockUser);

    // Mock failed NextAuth sign in
    signIn.mockResolvedValue({
      ok: false,
      status: 401,
      error: 'CredentialsSignin',
    });

    // Test the authentication flow
    const result = await signIn('credentials', {
      email: 'admin@example.com',
      password: 'admin123',
      redirect: false,
    });

    expect(result.ok).toBe(false);
    expect(result.error).toBe('CredentialsSignin');
  });

  test('should handle user not found', async () => {
    prisma.user.findUnique.mockResolvedValue(null);

    // Mock failed NextAuth sign in
    signIn.mockResolvedValue({
      ok: false,
      status: 401,
      error: 'CredentialsSignin',
    });

    const result = await signIn('credentials', {
      email: 'nonexistent@example.com',
      password: 'password123',
      redirect: false,
    });

    expect(result.ok).toBe(false);
  });
});

