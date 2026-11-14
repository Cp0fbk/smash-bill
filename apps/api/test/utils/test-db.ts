import { execSync } from 'node:child_process';
import { resolve } from 'node:path';
import { PrismaClient } from '@prisma/client';
import { PostgreSqlContainer, type StartedPostgreSqlContainer } from '@testcontainers/postgresql';

export interface TestDatabaseContext {
  container?: StartedPostgreSqlContainer;
  databaseUrl: string;
  prisma: PrismaClient;
  truncate: () => Promise<void>;
  stop: () => Promise<void>;
}

/**
 * Starts an isolated PostgreSQL 16 container via Testcontainers, applies all
 * Prisma migrations (`prisma migrate deploy`), and provides a fast table truncation
 * helper between e2e tests.
 */
export async function startTestDatabase(): Promise<TestDatabaseContext> {
  let container: StartedPostgreSqlContainer | undefined;
  let databaseUrl = process.env.TEST_DATABASE_URL;

  if (!databaseUrl) {
    container = await new PostgreSqlContainer('postgres:16-alpine')
      .withDatabase('smashbill_test')
      .withUsername('smashbill')
      .withPassword('smashbill_test_secret')
      .start();
    databaseUrl = container.getConnectionUri();
  }

  process.env.DATABASE_URL = databaseUrl;

  const apiRoot = resolve(__dirname, '../..');
  const prismaBin = resolve(
    apiRoot,
    process.platform === 'win32' ? 'node_modules/.bin/prisma.CMD' : 'node_modules/.bin/prisma',
  );

  execSync(`"${prismaBin}" migrate deploy`, {
    cwd: apiRoot,
    env: {
      ...process.env,
      DATABASE_URL: databaseUrl,
    },
    stdio: 'pipe',
  });

  const prisma = new PrismaClient({
    datasources: {
      db: {
        url: databaseUrl,
      },
    },
  });
  await prisma.$connect();

  const truncate = async () => {
    await truncateAllTables(prisma);
  };

  const stop = async () => {
    await prisma.$disconnect();
    if (container) {
      await container.stop();
    }
  };

  return {
    container,
    databaseUrl,
    prisma,
    truncate,
    stop,
  };
}

export async function truncateAllTables(prisma: PrismaClient): Promise<void> {
  const tables = await prisma.$queryRaw<Array<{ tablename: string }>>`
    SELECT tablename
    FROM pg_tables
    WHERE schemaname = 'public'
      AND tablename <> '_prisma_migrations'
  `;

  if (tables.length === 0) {
    return;
  }

  const quotedTableNames = tables
    .map(({ tablename }) => `"public"."${tablename.replace(/"/g, '""')}"`)
    .join(', ');

  await prisma.$executeRawUnsafe(`TRUNCATE TABLE ${quotedTableNames} RESTART IDENTITY CASCADE;`);
}
