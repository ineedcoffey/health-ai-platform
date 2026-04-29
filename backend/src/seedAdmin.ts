import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import bcrypt from 'bcrypt';

const pool = new Pool({ connectionString: process.env.DATABASE_URL as string });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function seedAdmin() {
  const email = 'admin@university.edu';
  const password = 'admin123';

  // Check if admin already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log('Admin user already exists:', email);
    process.exit(0);
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  const admin = await prisma.user.create({
    data: {
      email,
      password_hash: hashedPassword,
      role: 'ADMIN',
      full_name: 'Platform Admin',
      is_active: true,
      is_email_verified: true,
      profile_completed: true,
    }
  });

  console.log('✅ Admin user created successfully!');
  console.log('   Email:', email);
  console.log('   Password:', password);
  console.log('   ID:', admin.id);
  process.exit(0);
}

seedAdmin().catch((err) => {
  console.error('❌ Failed to seed admin:', err);
  process.exit(1);
});
