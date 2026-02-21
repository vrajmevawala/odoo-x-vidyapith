const { PrismaClient } = require('@prisma/client');

/**
 * Prisma Client singleton.
 * Prevents multiple instances during hot-reload in development.
 */
let prisma;

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient({
    log: ['error'],
  });
} else {
  if (!global.__prisma) {
    global.__prisma = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
  }
  prisma = global.__prisma;
}

module.exports = prisma;
