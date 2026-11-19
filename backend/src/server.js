require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

const PORT = process.env.PORT || 8081;

const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 [ClinixPulse API] Server listening on http://localhost:${PORT}`);
  console.log(`📡 [Health Check] Endpoint: http://localhost:${PORT}/api/v1/health`);
  console.log(`🔒 [Environment] ${process.env.NODE_ENV || 'development'}`);
});

// Graceful Shutdown Handler
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  // Stop accepting new connections
  server.close(async () => {
    console.log('✅ HTTP server closed. Disconnecting database...');
    try {
      await prisma.$disconnect();
      console.log('✅ Database connection closed cleanly.');
      process.exit(0);
    } catch (err) {
      console.error('❌ Error during database disconnect:', err);
      process.exit(1);
    }
  });

  // Force close if graceful shutdown hangs
  setTimeout(() => {
    console.error('⚠️ Shutdown timed out (10s). Forcing termination.');
    process.exit(1);
  }, 10000).unref();
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason, promise) => {
  console.error('🔥 [Unhandled Rejection at]:', promise, 'reason:', reason);
});

process.on('uncaughtException', (error) => {
  console.error('🔥 [Uncaught Exception]:', error);
  gracefulShutdown('uncaughtException');
});
