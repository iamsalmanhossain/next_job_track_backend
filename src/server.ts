// mdsalmanhossain838@gmail.com
import app from './app.js';
import { env } from './config/env.js';
import { createServer } from 'http';
import prisma from './config/prisma.js';
import { connectRedis, disconnectRedis } from './shared/redis.service.js';
import { initCronJobs } from './cronJob/index.js';

let server: ReturnType<typeof createServer>;

process.on('uncaughtException', (error) => {
  console.error('Uncaught exception:', error);
  process.exit(1);
});

async function bootstrap() {
  try {
    await connectRedis();
    initCronJobs();
    server = createServer(app);

    server.listen(env.PORT, () => {
      console.log(`Server is running on port ${env.PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

;(async () => {
  await bootstrap();
})();

process.on('unhandledRejection', (error) => {
  console.error('Unhandled rejection:', error);

  if (server) {
    server.close(async () => {
      await disconnectRedis();
      await prisma.$disconnect();
      process.exit(1);
    });
  } else {
    process.exit(1);
  }
});

process.on('SIGTERM', () => {
  if (server) {
    server.close(async () => {
      await disconnectRedis();
      await prisma.$disconnect();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});

process.on('SIGINT', () => {
  if (server) {
    server.close(async () => {
      await disconnectRedis();
      await prisma.$disconnect();
      process.exit(0);
    });
  } else {
    process.exit(0);
  }
});
