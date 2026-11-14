import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { EXPECTED_SEED_BALANCES, seedDatabase } from '../prisma/seed';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { PrismaService } from '../src/prisma/prisma.service';
import { type TestDatabaseContext, startTestDatabase } from './utils/test-db';

describe('SmashBill API Smoke & Schema v2 Ledger E2E', () => {
  let db: TestDatabaseContext;
  let app: INestApplication;

  beforeAll(async () => {
    db = await startTestDatabase();

    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication();
    app.setGlobalPrefix('api/v1');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());
    await app.init();
  });

  beforeEach(async () => {
    await db.truncate();
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
    if (db) {
      await db.stop();
    }
  });

  it('GET /api/v1/health returns 200 ok and Prisma executes a live database query', async () => {
    const response = await request(app.getHttpServer()).get('/api/v1/health').expect(200);

    expect(response.body).toMatchObject({
      status: 'ok',
      service: 'smash-bill-api',
      niche: 'badminton',
    });
    expect(typeof response.body.timestamp).toBe('string');

    const prismaService = app.get(PrismaService);
    const clubCount = await prismaService.club.count();
    expect(clubCount).toBe(0);
  });

  it('seeds CLB Sao Mai and computes member & fund balances via SQL SUM over non-voided ledger entries', async () => {
    const seeded = await seedDatabase(db.prisma);

    expect(seeded.club.name).toBe('CLB Sao Mai');
    expect(seeded.members).toHaveLength(12);
    expect(seeded.matches).toHaveLength(3);

    const guests = seeded.members.filter((m) => m.role === 'GUEST');
    const unlinkedRegulars = seeded.members.filter((m) => m.role === 'MEMBER' && m.userId === null);
    expect(guests).toHaveLength(3);
    expect(unlinkedRegulars).toHaveLength(2);

    // SQL SUM(amount) WHERE voidedAt IS NULL across all ledger entries
    const totalNonVoided = await db.prisma.ledgerEntry.aggregate({
      where: {
        clubId: seeded.club.id,
        voidedAt: null,
      },
      _sum: {
        amount: true,
      },
    });
    expect(totalNonVoided._sum.amount).toBe(EXPECTED_SEED_BALANCES.totalNonVoidedLedgerSum);

    // SQL SUM(amount) for club fund surplus (clubMemberId IS NULL)
    const fundSurplus = await db.prisma.ledgerEntry.aggregate({
      where: {
        clubId: seeded.club.id,
        clubMemberId: null,
        voidedAt: null,
      },
      _sum: {
        amount: true,
      },
    });
    expect(fundSurplus._sum.amount).toBe(EXPECTED_SEED_BALANCES.clubFundSurplus);

    // Verify per-member SQL SUM balances match EXPECTED_SEED_BALANCES
    const groupedBalances = await db.prisma.ledgerEntry.groupBy({
      by: ['clubMemberId'],
      where: {
        clubId: seeded.club.id,
        clubMemberId: { not: null },
        voidedAt: null,
      },
      _sum: {
        amount: true,
      },
    });

    const balanceByMemberId = new Map(
      groupedBalances.map((row) => [row.clubMemberId, row._sum.amount ?? 0]),
    );

    for (const member of seeded.members) {
      const expected = EXPECTED_SEED_BALANCES.memberBalancesByToken[member.publicToken] ?? 0;
      const actual = balanceByMemberId.get(member.id) ?? 0;
      expect(actual).toBe(expected);
    }

    // Edge case: deleting a member with ledger history is forbidden by foreign key RESTRICT
    const memberWithLedger = seeded.members.find((m) => m.publicToken === 'mem_saomai_null_000008');
    if (!memberWithLedger) {
      throw new Error('Expected seeded member mem_saomai_null_000008 to exist');
    }
    await expect(
      db.prisma.clubMember.delete({
        where: { id: memberWithLedger.id },
      }),
    ).rejects.toThrow();
  });
});
