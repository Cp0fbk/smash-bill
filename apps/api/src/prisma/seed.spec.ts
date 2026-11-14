import type { PrismaClient } from '@prisma/client';
import { describe, expect, it } from 'vitest';
import { EXPECTED_SEED_BALANCES, seedDatabase } from '../../prisma/seed';

interface StoredRecord {
  id: string;
  [key: string]: unknown;
}

function createInMemoryPrismaMock() {
  let seq = 1;
  const nextId = (prefix: string) => `${prefix}_${seq++}`;

  const store = {
    users: [] as StoredRecord[],
    clubs: [] as StoredRecord[],
    clubMembers: [] as StoredRecord[],
    matches: [] as StoredRecord[],
    attendances: [] as StoredRecord[],
    expenses: [] as StoredRecord[],
    ledgerEntries: [] as StoredRecord[],
    paymentRequests: [] as StoredRecord[],
  };

  const makeModel = (bucket: StoredRecord[], prefix: string) => ({
    deleteMany: async () => {
      const count = bucket.length;
      bucket.length = 0;
      return { count };
    },
    create: async ({ data }: { data: Record<string, unknown> }) => {
      const record: StoredRecord = { id: nextId(prefix), ...data };
      bucket.push(record);
      return record;
    },
    createMany: async ({ data }: { data: Array<Record<string, unknown>> }) => {
      for (const item of data) {
        bucket.push({ id: nextId(prefix), ...item });
      }
      return { count: data.length };
    },
  });

  const prisma = {
    user: makeModel(store.users, 'usr'),
    club: makeModel(store.clubs, 'clb'),
    clubMember: makeModel(store.clubMembers, 'mem'),
    match: makeModel(store.matches, 'mat'),
    attendance: makeModel(store.attendances, 'att'),
    expense: makeModel(store.expenses, 'exp'),
    ledgerEntry: makeModel(store.ledgerEntries, 'led'),
    paymentRequest: makeModel(store.paymentRequests, 'pay'),
    userReport: makeModel([], 'rep'),
    classifiedListing: makeModel([], 'lst'),
  } as unknown as PrismaClient;

  return { prisma, store };
}

describe('seedDatabase ("CLB Sao Mai")', () => {
  it('seeds 1 club, 12 members (3 guests, 2 userId=null regulars), 3 matches (1 settled) and matching ledger balances', async () => {
    const { prisma, store } = createInMemoryPrismaMock();
    const result = await seedDatabase(prisma);

    expect(result.club.name).toBe('CLB Sao Mai');
    expect(result.members).toHaveLength(12);
    expect(result.matches).toHaveLength(3);

    const guests = result.members.filter((m) => m.role === 'GUEST');
    const unlinkedRegulars = result.members.filter((m) => m.role === 'MEMBER' && m.userId === null);
    const settledMatches = result.matches.filter((m) => Boolean(m.settledAt));

    expect(guests).toHaveLength(3);
    expect(unlinkedRegulars).toHaveLength(2);
    expect(settledMatches).toHaveLength(1);

    const activeLedgerEntries = store.ledgerEntries.filter((entry) => !entry.voidedAt);
    const totalNonVoidedSum = activeLedgerEntries.reduce(
      (sum, entry) => sum + Number(entry.amount),
      0,
    );
    expect(totalNonVoidedSum).toBe(EXPECTED_SEED_BALANCES.totalNonVoidedLedgerSum);

    const fundSurplusSum = activeLedgerEntries
      .filter((entry) => entry.clubMemberId === null)
      .reduce((sum, entry) => sum + Number(entry.amount), 0);
    expect(fundSurplusSum).toBe(EXPECTED_SEED_BALANCES.clubFundSurplus);

    for (const member of result.members) {
      const memberBalance = activeLedgerEntries
        .filter((entry) => entry.clubMemberId === member.id)
        .reduce((sum, entry) => sum + Number(entry.amount), 0);
      const expected = EXPECTED_SEED_BALANCES.memberBalancesByToken[member.publicToken] ?? 0;
      expect(memberBalance).toBe(expected);
    }
  });
});
