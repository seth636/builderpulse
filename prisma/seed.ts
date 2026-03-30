import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Starting seed...');

  // Upsert clients — never wipe existing data
  const clientsData = [
    { name: 'Caba Homes', slug: 'caba-homes', website_url: 'https://cabahomes.com', pm_name: 'Ben', package: 'scale' },
    { name: 'Southern Luxury Homes', slug: 'southern-luxury-homes', website_url: 'https://southernluxury.com', pm_name: 'Erich', package: 'growth' },
    { name: 'GreenCraft Homes', slug: 'greencraft-homes', website_url: 'https://greencrafthomes.com', pm_name: 'Keelan', package: 'essentials' },
    { name: 'Elev8 308', slug: 'elev8-308', website_url: 'https://elev8308.com', pm_name: 'Nick', package: 'growth' },
    { name: 'Home Builder Marketers', slug: 'homebuildermarketers', website_url: 'https://homebuildermarketers.com', pm_name: 'Ben', package: 'scale' },
  ];

  let clientCount = 0;
  for (const c of clientsData) {
    await prisma.client.upsert({
      where: { slug: c.slug },
      update: {},
      create: c,
    });
    clientCount++;
  }
  console.log(`Upserted ${clientCount} clients`);

  // Upsert admin user — never overwrite existing password
  const existing = await prisma.user.findUnique({ where: { email: 'hammad@homebuildermarketers.com' } });
  if (!existing) {
    const hashedPassword = await bcrypt.hash('BuilderPulse2026!', 10);
    await prisma.user.create({
      data: {
        email: 'hammad@homebuildermarketers.com',
        name: 'Hammad Khan',
        role: 'admin',
        password_hash: hashedPassword,
      },
    });
    console.log('Created admin user: hammad@homebuildermarketers.com');
  } else {
    console.log('Admin user already exists — skipped');
  }

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
