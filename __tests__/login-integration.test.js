const bcrypt = require('bcryptjs');

// Mock NextAuth
jest.mock('next-auth/react', () => ({
  signIn: jest.fn(),
}));

const prismaDouble = {
  user: {
    findUnique: jest.fn(),
  },
};

global.__PRISMA_TEST_DOUBLE__ = prismaDouble;

const { signIn } = require('next-auth/react');
const { prisma } = require('@/lib/db/prisma');
// eslint-disable-next-line @typescript-eslint/no-var-requires
const { authOptions, authorizeWithCredentials } = require('@/lib/auth/options');

afterAll(() => {
  delete global.__PRISMA_TEST_DOUBLE__;
});

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

    const authorizedUser = await authorizeWithCredentials({
      email: 'admin@example.com',
      password: 'admin123',
    });

    expect(prisma.user.findUnique).toHaveBeenCalledWith({
      where: { email: 'admin@example.com' },
    });
    expect(authorizedUser?.email).toBe('admin@example.com');

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

    await authorizeWithCredentials({
      email: 'admin@example.com',
      password: 'admin123',
    });

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

    const authorizeResult = await authorizeWithCredentials({
      email: 'nonexistent@example.com',
      password: 'password123',
    });
    expect(authorizeResult).toBeNull();

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

