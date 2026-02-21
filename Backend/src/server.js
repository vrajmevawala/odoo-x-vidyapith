require('dotenv').config();

const app = require('./app');
const connectDB = require('./config/db');
const { PORT, NODE_ENV } = require('./config/constants');

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Connect to database, then start server
connectDB().then(() => {
  const server = app.listen(PORT, () => {
    console.log(`
    ╔═══════════════════════════════════════════╗
    ║   FleetFlow API Server                    ║
    ║   Environment : ${NODE_ENV.padEnd(24)}║
    ║   Port        : ${String(PORT).padEnd(24)}║
    ║   Status      : Running                   ║
    ╚═══════════════════════════════════════════╝
    `);
  });

  // Handle unhandled promise rejections
  process.on('unhandledRejection', (err) => {
    console.error('UNHANDLED REJECTION! Shutting down...');
    console.error(err.name, err.message);
    server.close(() => process.exit(1));
  });

  // Graceful shutdown
  process.on('SIGTERM', () => {
    console.log('SIGTERM received. Shutting down gracefully...');
    server.close(() => {
      console.log('Process terminated.');
    });
  });
});
