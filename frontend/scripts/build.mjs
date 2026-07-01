import { execSync } from 'child_process';
import path from 'path';

// On Vercel, the backend dependencies and Prisma client aren't installed/generated 
// if the Root Directory is set to 'frontend'. This script ensures they are before building.
if (process.env.VERCEL) {
  console.log('Detected Vercel environment. Installing root dependencies and generating Prisma client...');
  try {
    execSync('npm install', { cwd: path.join(process.cwd(), '..'), stdio: 'inherit' });
    execSync('npx prisma generate --schema=backend/prisma/schema.prisma', { cwd: path.join(process.cwd(), '..'), stdio: 'inherit' });
    console.log('Root dependencies installed and Prisma client generated successfully.');
  } catch (error) {
    console.error('Failed to install root dependencies or generate Prisma client:', error);
    process.exit(1);
  }
}

console.log('Running Next.js build...');
try {
  execSync('next build', { stdio: 'inherit' });
} catch (error) {
  console.error('Next.js build failed.');
  process.exit(1);
}
