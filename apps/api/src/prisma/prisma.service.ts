import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor() {
    super(
      process.env.DATABASE_URL
        ? {
            datasources: {
              db: {
                url: process.env.DATABASE_URL,
              },
            },
          }
        : undefined,
    );
  }

  async onModuleInit() {
    if (!process.env.DATABASE_URL) {
      return;
    }

    try {
      await this.$connect();
    } catch (error) {
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
      this.logger.warn(
        'PostgreSQL is not reachable at DATABASE_URL yet. Run "docker compose up -d postgres" to start the local database.',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
