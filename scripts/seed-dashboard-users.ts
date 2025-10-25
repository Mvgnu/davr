import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding dashboard users...');

  const password = await bcrypt.hash('password123', 10);

  // Create test users for each role
  const users = [
    {
      email: 'user@test.com',
      name: 'Test User',
      password,
      role: 'USER' as const,
      isAdmin: false,
    },
    {
      email: 'owner@test.com',
      name: 'Test Owner',
      password,
      role: 'CENTER_OWNER' as const,
      isAdmin: false,
    },
    {
      email: 'admin@test.com',
      name: 'Test Admin',
      password,
      role: 'ADMIN' as const,
      isAdmin: true,
    },
  ];

  for (const userData of users) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log(`✓ User ${userData.email} already exists, updating role...`);
      await prisma.user.update({
        where: { email: userData.email },
        data: {
          role: userData.role,
          isAdmin: userData.isAdmin,
          name: userData.name,
        },
      });
    } else {
      console.log(`✓ Creating user ${userData.email}...`);
      await prisma.user.create({
        data: userData,
      });
    }
  }

  // Create a test recycling center for the owner
  const owner = await prisma.user.findUnique({
    where: { email: 'owner@test.com' },
  });

  if (owner) {
    const existingCenter = await prisma.recyclingCenter.findFirst({
      where: { managedById: owner.id },
    });

    if (!existingCenter) {
      console.log('✓ Creating test recycling center for owner...');
      const center = await prisma.recyclingCenter.create({
        data: {
          name: 'Green Recycling Center',
          slug: 'green-recycling-center',
          description: 'A test recycling center for dashboard testing',
          address_street: '123 Green Street',
          city: 'Berlin',
          postal_code: '10115',
          country: 'Germany',
          phone_number: '+49 30 12345678',
          email: 'contact@greenrecycling.de',
          website: 'https://greenrecycling.de',
          latitude: 52.5200,
          longitude: 13.4050,
          verification_status: 'PENDING',
          managedById: owner.id,
        },
      });

      // Add some material offers
      const materials = await prisma.material.findMany({
        take: 5,
      });

      for (const material of materials) {
        await prisma.recyclingCenterOffer.create({
          data: {
            recycling_center_id: center.id,
            material_id: material.id,
            price_per_unit: Math.random() * 2,
            unit: 'kg',
            notes: 'Test offer',
          },
        });
      }

      // Add working hours
      const days = [
        'MONDAY',
        'TUESDAY',
        'WEDNESDAY',
        'THURSDAY',
        'FRIDAY',
        'SATURDAY',
        'SUNDAY',
      ] as const;

      for (const day of days) {
        await prisma.workingHours.create({
          data: {
            recycling_center_id: center.id,
            day_of_week: day,
            open_time: day === 'SUNDAY' ? '00:00' : '08:00',
            close_time: day === 'SUNDAY' ? '00:00' : '18:00',
            is_closed: day === 'SUNDAY',
          },
        });
      }

      console.log('✓ Test center created with offers and working hours');
    }
  }

  // Create some test marketplace listings for the user
  const user = await prisma.user.findUnique({
    where: { email: 'user@test.com' },
  });

  if (user) {
    const existingListings = await prisma.marketplaceListing.findFirst({
      where: { seller_id: user.id },
    });

    if (!existingListings) {
      console.log('✓ Creating test marketplace listings...');
      const materials = await prisma.material.findMany({ take: 3 });

      for (const material of materials) {
        await prisma.marketplaceListing.create({
          data: {
            title: `Selling ${material.name}`,
            description: `Test listing for ${material.name}`,
            material_id: material.id,
            quantity: Math.floor(Math.random() * 1000),
            unit: 'kg',
            location: 'Berlin, Germany',
            seller_id: user.id,
            type: 'SELL',
            status: 'ACTIVE',
          },
        });
      }
    }
  }

  console.log('\n✨ Dashboard users seeded successfully!\n');
  console.log('Test credentials:');
  console.log('─'.repeat(50));
  console.log('User Dashboard:');
  console.log('  Email: user@test.com');
  console.log('  Password: password123');
  console.log('');
  console.log('Center Owner Dashboard:');
  console.log('  Email: owner@test.com');
  console.log('  Password: password123');
  console.log('');
  console.log('Admin Dashboard:');
  console.log('  Email: admin@test.com');
  console.log('  Password: password123');
  console.log('─'.repeat(50));
}

main()
  .catch((e) => {
    console.error('Error seeding dashboard users:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
