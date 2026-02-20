import { execSync } from 'child_process';

const url = process.env.DATABASE_URL || '';
if (url.startsWith('postgresql://') || url.startsWith('postgres://')) {
  try {
    execSync('npx prisma migrate deploy', { stdio: 'inherit' });
  } catch (e) {
    console.warn('Prisma migrate deploy skipped or failed:', e.message);
  }
} else {
  console.warn('DATABASE_URL not set or not Postgres - skipping migrations. Set DATABASE_URL in Vercel to run migrations.');
}

execSync('npx next build', { stdio: 'inherit' });
