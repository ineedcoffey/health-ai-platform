import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import 'dotenv/config';

// 1. PostgreSQL için bir bağlantı havuzu (pool) kuruyoruz
const pool = new Pool({ connectionString: process.env.DATABASE_URL as string });

// 2. Prisma 7'nin zorunlu tuttuğu PG adaptörünü oluşturuyoruz
const adapter = new PrismaPg(pool);

// 3. Prisma'yı bu adaptör ile başlatıyoruz
const prisma = new PrismaClient({ adapter });

export default prisma; // authController.ts için default export