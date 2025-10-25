const { authOptions } = require('../lib/auth/options');
const bcrypt = require('bcryptjs');

// Mock Prisma client
jest.mock('../lib/db/prisma', () => ({
  prisma: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const { prisma } = require('../lib/db/prisma');

describe('NextAuth Configuration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Credentials Provider', () => {
    const mockCredentials = {
      email: 'test@example.com',
      password: 'testpassword',
    };

    test('should reject when credentials are missing', async () => {
      const result = await authOptions.providers[0].authorize({});

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    test('should reject when email is missing', async () => {
      const result = await authOptions.providers[0].authorize({
        password: 'testpassword',
      });

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    test('should reject when password is missing', async () => {
      const result = await authOptions.providers[0].authorize({
        email: 'test@example.com',
      });

      expect(result).toBeNull();
      expect(prisma.user.findUnique).not.toHaveBeenCalled();
    });

    test('should find user when credentials are provided', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('testpassword', 10),
        isAdmin: false,
        emailVerified: null,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authOptions.providers[0].authorize(mockCredentials);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
      expect(result).toBeTruthy();
      expect(result.email).toBe('test@example.com');
      expect(result.id).toBe('1');
    });

    test('should reject when user is not found', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      const result = await authOptions.providers[0].authorize(mockCredentials);

      expect(result).toBeNull();
    });

    test('should reject when user has no password', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: null,
        isAdmin: false,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authOptions.providers[0].authorize(mockCredentials);

      expect(result).toBeNull();
    });

    test('should reject when password is incorrect', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('wrongpassword', 10),
        isAdmin: false,
        emailVerified: null,
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authOptions.providers[0].authorize(mockCredentials);

      expect(result).toBeNull();
    });

    test('should accept correct password and return user data', async () => {
      const mockUser = {
        id: '1',
        email: 'test@example.com',
        name: 'Test User',
        password: await bcrypt.hash('testpassword', 10),
        isAdmin: true,
        emailVerified: new Date(),
      };

      prisma.user.findUnique.mockResolvedValue(mockUser);

      const result = await authOptions.providers[0].authorize(mockCredentials);

      expect(result).toBeTruthy();
      expect(result.id).toBe('1');
      expect(result.email).toBe('test@example.com');
      expect(result.name).toBe('Test User');
      expect(result.isAdmin).toBe(true);
      expect(result.password).toBeUndefined(); // Should be excluded
    });
  });

  describe('JWT Callback', () => {
    test('should add user id and isAdmin to JWT token', async () => {
      const mockToken = {};
      const mockUser = {
        id: '1',
        isAdmin: true,
      };

      const result = await authOptions.callbacks.jwt({ token: mockToken, user: mockUser });

      expect(result.id).toBe('1');
      expect(result.isAdmin).toBe(true);
    });

    test('should return token unchanged when no user is provided', async () => {
      const mockToken = { existing: 'data' };

      const result = await authOptions.callbacks.jwt({ token: mockToken });

      expect(result).toEqual(mockToken);
    });
  });

  describe('Session Callback', () => {
    test('should add user id and isAdmin to session', async () => {
      const mockSession = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };
      const mockToken = {
        id: '1',
        isAdmin: true,
      };

      const result = await authOptions.callbacks.session({ session: mockSession, token: mockToken });

      expect(result.user.id).toBe('1');
      expect(result.user.isAdmin).toBe(true);
    });

    test('should handle missing token gracefully', async () => {
      const mockSession = {
        user: {
          name: 'Test User',
          email: 'test@example.com',
        },
      };

      const result = await authOptions.callbacks.session({ session: mockSession });

      expect(result.user.id).toBeUndefined();
      expect(result.user.isAdmin).toBeUndefined();
    });
  });
});

