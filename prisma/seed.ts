import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Clear existing data
  await prisma.user.deleteMany();
  await prisma.client.deleteMany();

  // Create clients
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        name: 'Caba Homes',
        slug: 'caba-homes',
        website_url: 'https://cabahomes.com',
        pm_name: 'Ben',
        package: 'scale',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Southern Luxury Homes',
        slug: 'southern-luxury-homes',
        website_url: 'https://southernluxury.com',
        pm_name: 'Erich',
        package: 'growth',
      },
    }),
    prisma.client.create({
      data: {
        name: 'GreenCraft Homes',
        slug: 'greencraft-homes',
        website_url: 'https://greencrafthomes.com',
        pm_name: 'Keelan',
        package: 'essentials',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Elev8 308',
        slug: 'elev8-308',
        website_url: 'https://elev8308.com',
        pm_name: 'Nick',
        package: 'growth',
      },
    }),
    prisma.client.create({
      data: {
        name: 'Home Builder Marketers',
        slug: 'homebuildermarketers',
        website_url: 'https://homebuildermarketers.com',
        pm_name: 'Ben',
        package: 'scale',
      },
    }),
  ]);

  console.log(`Created ${clients.length} clients`);

  // Create admin user
  const hashedPassword = await bcrypt.hash('BuilderPulse2026!', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'hammad@homebuildermarketers.com',
      name: 'Hammad Khan',
      role: 'admin',
      password_hash: hashedPassword,
    },
  });

  console.log('Created admin user:', admin.email);

  console.log('Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
