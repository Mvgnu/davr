import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixAdminUserRole() {
  try {
    // Find users who are admins but might have been changed to CENTER_OWNER
    const usersToFix = await prisma.user.findMany({
      where: {
        AND: [
          { isAdmin: true },
          { role: 'CENTER_OWNER' }
        ]
      }
    });

    console.log(`Found ${usersToFix.length} users to fix`);

    for (const user of usersToFix) {
      console.log(`Fixing user: ${user.email} (${user.id})`);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'ADMIN'
        }
      });
      console.log(`Fixed user: ${user.email}`);
    }

    // Also check for users who are admins but have role USER
    const adminUsersWithWrongRole = await prisma.user.findMany({
      where: {
        AND: [
          { isAdmin: true },
          { role: 'USER' }
        ]
      }
    });

    console.log(`Found ${adminUsersWithWrongRole.length} admin users with wrong role`);

    for (const user of adminUsersWithWrongRole) {
      console.log(`Fixing admin user role: ${user.email} (${user.id})`);
      await prisma.user.update({
        where: { id: user.id },
        data: {
          role: 'ADMIN'
        }
      });
      console.log(`Fixed admin user role: ${user.email}`);
    }

    console.log('Finished fixing user roles');
  } catch (error) {
    console.error('Error fixing user roles:', error);
  } finally {
    await prisma.$disconnect();
  }
}

fixAdminUserRole();