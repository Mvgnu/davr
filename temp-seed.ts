import { PrismaClient, VerificationStatus, ListingStatus, ListingType, DayOfWeek } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prismaClient = new PrismaClient();

async function main() {
  console.log(`Start seeding ...`);

  // --- Seed Users ---
  const adminPassword = await bcrypt.hash('password123', 10);
  const adminUser = await prismaClient.user.upsert({
    where: { email: 'admin@example.com' },
    update: {},
    create: {
      email: 'admin@example.com',
      name: 'Admin User',
      password: adminPassword,
      isAdmin: true,
    },
  });
  console.log(`Created/Found admin user with id: ${adminUser.id}`);

  // Create a normal user for seeding listings/reviews
  const userPassword = await bcrypt.hash('password123', 10);
  const normalUser = await prismaClient.user.upsert({
    where: { email: 'user@example.com' },
    update: {},
    create: {
      email: 'user@example.com',
      name: 'Normal User',
      password: userPassword,
      isAdmin: false,
    },
  });
  console.log(`Created/Found normal user with id: ${normalUser.id}`);

  // --- Create basic marketplace listings ---
  await prismaClient.marketplaceListing.createMany({
    data: [
      {
        title: 'Gebrauchte Aluminiumbleche',
        description: 'Ca. 100kg Aluminiumbleche, gemischte Größen, von Industriedemontage.',
        quantity: 100,
        unit: 'kg',
        location: 'Berlin',
        seller_id: adminUser.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/alu1.jpg',
      },
      {
        title: 'Sammelposten Altpapier',
        description: 'Gemischtes Büropapier, ca. 50kg, trocken gelagert.',
        quantity: 50,
        unit: 'kg',
        location: 'Hamburg',
        seller_id: normalUser.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/paper1.jpg',
      },
      {
        title: 'Kupferkabel-Abschnitte',
        description: 'Verschiedene Längen Kupferkabel-Abschnitte, ca. 15kg.',
        quantity: 15,
        unit: 'kg',
        location: 'München',
        seller_id: adminUser.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/copper1.jpg',
      },
      {
        title: 'PET Flaschen (klar)',
        description: 'Ballen mit klaren PET-Flaschen, ca. 250kg.',
        quantity: 250,
        unit: 'kg',
        location: 'Frankfurt',
        seller_id: normalUser.id,
        type: 'SELL',
        status: 'ACTIVE',
        image_url: '/images/placeholder/pet1.jpg',
      },
    ],
    skipDuplicates: true,
  });

  console.log(`Created marketplace listings.`);
  console.log(`Seeding finished.`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prismaClient.$disconnect();
  }); 