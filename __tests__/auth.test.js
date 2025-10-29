const bcrypt = require('bcryptjs');

function createInMemoryPrisma() {
  const store = new Map();

  return {
    user: {
      async deleteMany({ where: { email } }) {
        const targets = Array.isArray(email?.in) ? email.in : [];
        let count = 0;
        for (const target of targets) {
          if (store.delete(target)) {
            count += 1;
          }
        }
        return { count };
      },
      async create({ data }) {
        const record = {
          id: data.id ?? `user-${store.size + 1}`,
          email: data.email,
          name: data.name ?? null,
          password: data.password ?? null,
          isAdmin: Boolean(data.isAdmin),
        };
        store.set(record.email, record);
        return { ...record };
      },
      async findUnique({ where: { email } }) {
        const user = store.get(email);
        return user ? { ...user } : null;
      },
    },
    async $disconnect() {
      store.clear();
    },
    __store: store,
  };
}

describe('Authentication System (in-memory)', () => {
  const prisma = createInMemoryPrisma();

  beforeAll(async () => {
    await prisma.user.deleteMany({
      where: {
        email: {
          in: ['admin@example.com', 'user1@example.com', 'test@example.com'],
        },
      },
    });
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  describe('User Creation and Password Hashing', () => {
    test('should create admin user with hashed password', async () => {
      const hashedPassword = await bcrypt.hash('admin123', 10);

      const user = await prisma.user.create({
        data: {
          email: 'admin@example.com',
          name: 'Admin User',
          password: hashedPassword,
          isAdmin: true,
        },
      });

      expect(user.email).toBe('admin@example.com');
      expect(user.isAdmin).toBe(true);
      expect(user.password).toBe(hashedPassword);
    });

    test('should create regular user with hashed password', async () => {
      const hashedPassword = await bcrypt.hash('user123', 10);

      const user = await prisma.user.create({
        data: {
          email: 'user1@example.com',
          name: 'Regular User',
          password: hashedPassword,
          isAdmin: false,
        },
      });

      expect(user.email).toBe('user1@example.com');
      expect(user.isAdmin).toBe(false);
      expect(user.password).toBe(hashedPassword);
    });
  });

  describe('Password Verification', () => {
    test('should verify correct admin password', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
      });

      const isValid = await bcrypt.compare('admin123', user.password);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect admin password', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
      });

      const isValid = await bcrypt.compare('wrongpassword', user.password);
      expect(isValid).toBe(false);
    });

    test('should verify correct user password', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'user1@example.com' },
      });

      const isValid = await bcrypt.compare('user123', user.password);
      expect(isValid).toBe(true);
    });

    test('should reject incorrect user password', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'user1@example.com' },
      });

      const isValid = await bcrypt.compare('wrongpassword', user.password);
      expect(isValid).toBe(false);
    });
  });

  describe('User Retrieval', () => {
    test('should find admin user by email', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'admin@example.com' },
      });

      expect(user).toBeTruthy();
      expect(user.email).toBe('admin@example.com');
      expect(user.isAdmin).toBe(true);
    });

    test('should find regular user by email', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'user1@example.com' },
      });

      expect(user).toBeTruthy();
      expect(user.email).toBe('user1@example.com');
      expect(user.isAdmin).toBe(false);
    });

    test('should return null for non-existent email', async () => {
      const user = await prisma.user.findUnique({
        where: { email: 'nonexistent@example.com' },
      });

      expect(user).toBeNull();
    });
  });
});
