require('dotenv').config();

const app = require('./app');
const prisma = require('./config/prisma');
const { PORT, NODE_ENV } = require('./config/constants');

process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

async function main() {
  // Verify database connection
  await prisma.$connect();
  console.log('PostgreSQL connected via Prisma');

  const server = app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║   FleetFlow API Server                    ║
    ║   Environment : ${NODE_ENV.padEnd(24)}║
    ║   Port        : ${String(PORT).padEnd(24)}║
    ║   Database    : PostgreSQL + Prisma       ║
    ║   Status      : Running                   ║
    ╚═══════════════════════════════════════════╝
    `);
  });

  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
  });

  process.on('SIGTERM', async () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    await prisma.$disconnect();
    server.close(() => console.log('Process terminated.'));
  });
}

main().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
