import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const email = 'client@fitmetrics.com';
  const password = 'client123';

  console.log(`🔍 Checking user: ${email}...`);
  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error('❌ User NOT FOUND in database!');
    console.log('Run "npx prisma db seed" to create users.');
    return;
  }

  console.log(`✅ User found. Role: ${user.role}`);
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  console.log(isMatch ? '✅ Password is correct' : '❌ Password mismatch (Hash differs)');
}

main().finally(() => prisma.$disconnect());