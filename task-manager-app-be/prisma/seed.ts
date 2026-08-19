import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import * as bcrypt from 'bcrypt';
import 'dotenv/config';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL is not set in environment');
}

const url = new URL(databaseUrl);
const adapter = new PrismaMariaDb({
  host: url.hostname,
  port: parseInt(url.port || '3306', 10),
  user: url.username,
  password: url.password,
  database: url.pathname.substring(1),
  connectionLimit: 2,
});
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Initializing application database...');

  const adminUser = await prisma.user.findUnique({
    where: { username: 'admin' },
  });

  if (!adminUser) {
    console.log('Seeding initial admin user...');

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash('admin123', salt);

    await prisma.user.create({
      data: {
        username: 'admin',
        password: hashedPassword,
        fullName: 'System Administrator',
        email: 'admin@example.com',
      },
    });

    console.warn(
      'admin user has been created with default password: admin123, please change it',
    );
  }

  console.log('Application initialization completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
