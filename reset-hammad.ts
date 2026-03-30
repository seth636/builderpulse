import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash('BuilderPulse2026!', 10);
  const user = await prisma.user.upsert({
    where: { email: 'hammad@homebuildermarketers.com' },
    update: { password_hash: hash, name: 'Hammad Khan', role: 'admin' },
    create: { email: 'hammad@homebuildermarketers.com', name: 'Hammad Khan', role: 'admin', password_hash: hash },
  });
  console.log('Reset done:', user.email, '| role:', user.role);
  await prisma.$disconnect();
}

main().catch(console.error);
