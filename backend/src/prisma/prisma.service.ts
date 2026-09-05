import { PrismaClient } from '@prisma/client';

export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  

  constructor() {
    super({
      log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    });
  }

  async onModuleInit() {
    try {
      await this.$connect();
      console.log('Successfully connected to PostgreSQL via Prisma');
    } catch (error) {
      console.error('Failed to connect to database', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
