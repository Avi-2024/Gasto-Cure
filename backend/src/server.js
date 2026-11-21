require('dotenv').config();
const app = require('./app');
const prisma = require('./config/prisma');

// ClinixPulse frontend connects to Port 8081.
// If PORT is 8080 (common Apache/XAMPP conflict on Windows), auto-switch to 8081.
let requestedPort = parseInt(process.env.PORT, 10) || 8081;
if (requestedPort === 8080) {
  requestedPort = 8081;
}

let activeServer = null;

function startServer(portToTry) {
  const srv = app.listen(portToTry, '0.0.0.0', () => {
    console.log(`🚀 [ClinixPulse API] Server listening on http://localhost:${portToTry}`);
    console.log(`📡 [Health Check] Endpoint: http://localhost:${portToTry}/api/v1/health`);
    console.log(`🔒 [Environment] ${process.env.NODE_ENV || 'development'}`);
  });

  srv.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      if (portToTry !== 8081) {
        console.warn(`⚠️ Port ${portToTry} is in use (e.g. Apache/system). Auto-switching to Port 8081...`);
        activeServer = startServer(8081);
      } else {
        console.error(`🔥 [Port Conflict]: Port 8081 is already in use.`);
        process.exit(1);
      }
    } else {
      console.error('🔥 [Server Error]:', err);
    }
  });

  return srv;
}

activeServer = startServer(requestedPort);

// Graceful Shutdown Handler
async function gracefulShutdown(signal) {
  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  if (activeServer) {
    activeServer.close(async () => {
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
  } else {
    process.exit(0);
  }

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
  if (error.code === 'EADDRINUSE') {
    return;
  }
  console.error('🔥 [Uncaught Exception]:', error);
  gracefulShutdown('uncaughtException');
});
