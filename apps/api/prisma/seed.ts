import {
  AttendanceStatus,
  AuthProvider,
  ClubRole,
  ExpenseCategory,
  LedgerEntryType,
  MatchStatus,
  PaymentRequestStatus,
  PrismaClient,
  SplitStrategyType,
  Sport,
} from '@prisma/client';

/**
 * SmashBill Local Development Seed — "CLB Sao Mai"
 *
 * Expected Active Ledger Balances (`SELECT "clubMemberId", SUM(amount) FROM "LedgerEntry" WHERE "voidedAt" IS NULL GROUP BY "clubMemberId"`):
 * - Minh Quân (ADMIN, linked user)           : +67,000 (CHARGE) - 67,000 (PAYMENT) =      0 VND
 * - Hoàng Nam (MEMBER, linked user)          : +67,000 (CHARGE) - 67,000 (PAYMENT) =      0 VND
 * - Thu Hà (MEMBER, linked user)             : +67,000 (CHARGE) [+10,000 VOIDED]   = 67,000 VND
 * - Bảo Long (MEMBER, userId = null)         : +67,000 (CHARGE)                    = 67,000 VND
 * - Quốc Tuấn (MEMBER, userId = null)        : +67,000 (CHARGE)                    = 67,000 VND
 * - Đức Anh (GUEST, userId = null)           : +67,000 (CHARGE)                    = 67,000 VND
 * - Remaining 6 members (no settled charges) :                                        0 VND
 * - Club Fund Surplus (clubMemberId IS NULL) : +2,000 (FUND_SURPLUS)               =  2,000 VND
 * - Total Active Member Receivables          : 4 * 67,000                          = 268,000 VND
 * - Total Non-Voided Ledger Sum (all rows)   : 268,000 + 2,000                     = 270,000 VND
 */
export const EXPECTED_SEED_BALANCES = {
  totalActiveMemberReceivables: 268_000,
  clubFundSurplus: 2_000,
  totalNonVoidedLedgerSum: 270_000,
  memberBalancesByToken: {
    mem_saomai_admin_00001: 0,
    mem_saomai_reg_0000002: 0,
    mem_saomai_reg_0000003: 67_000,
    mem_saomai_null_000008: 67_000,
    mem_saomai_null_000009: 67_000,
    mem_saomai_guest_00010: 67_000,
  } as Record<string, number>,
};

export async function seedDatabase(prisma: PrismaClient) {
  // Clean existing seed data in reverse dependency order so seed is idempotent
  await prisma.paymentRequest.deleteMany();
  await prisma.ledgerEntry.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.attendance.deleteMany();
  await prisma.match.deleteMany();
  await prisma.clubMember.deleteMany();
  await prisma.club.deleteMany();
  await prisma.userReport.deleteMany();
  await prisma.classifiedListing.deleteMany();
  await prisma.user.deleteMany();

  // 1. Create Admin user + 6 registered regular users
  const adminUser = await prisma.user.create({
    data: {
      provider: AuthProvider.GOOGLE,
      providerId: 'google-saomai-admin-001',
      email: 'minhquan.saomai@smashbill.vn',
      name: 'Nguyễn Minh Quân',
      phone: '0901234567',
      skillLevel: 'Kha',
    },
  });

  const registeredMemberSpecs = [
    {
      providerId: 'google-saomai-member-002',
      email: 'hoangnam@smashbill.vn',
      name: 'Trần Hoàng Nam',
      phone: '0902234567',
      token: 'mem_saomai_reg_0000002',
    },
    {
      providerId: 'google-saomai-member-003',
      email: 'thuha@smashbill.vn',
      name: 'Lê Thu Hà',
      phone: '0903234567',
      token: 'mem_saomai_reg_0000003',
    },
    {
      providerId: 'google-saomai-member-004',
      email: 'anhkhoa@smashbill.vn',
      name: 'Phạm Anh Khoa',
      phone: '0904234567',
      token: 'mem_saomai_reg_0000004',
    },
    {
      providerId: 'google-saomai-member-005',
      email: 'myduyen@smashbill.vn',
      name: 'Võ Mỹ Duyên',
      phone: '0905234567',
      token: 'mem_saomai_reg_0000005',
    },
    {
      providerId: 'google-saomai-member-006',
      email: 'thanhdat@smashbill.vn',
      name: 'Đặng Thành Đạt',
      phone: '0906234567',
      token: 'mem_saomai_reg_0000006',
    },
    {
      providerId: 'google-saomai-member-007',
      email: 'khanhlinh@smashbill.vn',
      name: 'Bùi Khánh Linh',
      phone: '0907234567',
      token: 'mem_saomai_reg_0000007',
    },
  ];

  const registeredUsers = await Promise.all(
    registeredMemberSpecs.map((spec) =>
      prisma.user.create({
        data: {
          provider: AuthProvider.GOOGLE,
          providerId: spec.providerId,
          email: spec.email,
          name: spec.name,
          phone: spec.phone,
          skillLevel: 'TB+',
        },
      }),
    ),
  );

  // 2. Create Club "CLB Sao Mai"
  const club = await prisma.club.create({
    data: {
      name: 'CLB Sao Mai',
      slug: 'clb-sao-mai',
      description: 'CLB cầu lông phong trào tối Thứ 3 - Thứ 5 - Chủ Nhật tại Quận Phú Nhuận',
      location: 'Sân Cầu Lông Sao Mai, Phú Nhuận, TP.HCM',
      sport: Sport.BADMINTON,
      inviteCode: 'SAOMAI26',
      publicToken: 'clb_saomai_pub_000001',
      bankBin: '970436',
      bankAccountNo: '0071001234567',
      bankAccountName: 'NGUYEN MINH QUAN',
      defaultCourtFee: 240_000,
      ownerId: adminUser.id,
    },
  });

  // 3. Create 12 ClubMembers:
  // - 1 ADMIN (linked to adminUser)
  // - 6 MEMBER regulars (linked to registeredUsers)
  // - 2 MEMBER regulars with userId = null (Single-Player First ADR-001)
  // - 3 GUEST players with userId = null
  const adminMember = await prisma.clubMember.create({
    data: {
      clubId: club.id,
      userId: adminUser.id,
      displayName: adminUser.name,
      phone: adminUser.phone,
      role: ClubRole.ADMIN,
      publicToken: 'mem_saomai_admin_00001',
    },
  });

  const linkedRegularMembers = await Promise.all(
    registeredUsers.map((user, idx) =>
      prisma.clubMember.create({
        data: {
          clubId: club.id,
          userId: user.id,
          displayName: user.name,
          phone: user.phone,
          role: ClubRole.MEMBER,
          publicToken: registeredMemberSpecs[idx].token,
        },
      }),
    ),
  );

  const unlinkedRegularMembers = await Promise.all([
    prisma.clubMember.create({
      data: {
        clubId: club.id,
        userId: null,
        displayName: 'Hoàng Bảo Long',
        phone: '0908234567',
        role: ClubRole.MEMBER,
        publicToken: 'mem_saomai_null_000008',
      },
    }),
    prisma.clubMember.create({
      data: {
        clubId: club.id,
        userId: null,
        displayName: 'Trương Quốc Tuấn',
        phone: '0909234567',
        role: ClubRole.MEMBER,
        publicToken: 'mem_saomai_null_000009',
      },
    }),
  ]);

  const guestMembers = await Promise.all([
    prisma.clubMember.create({
      data: {
        clubId: club.id,
        userId: null,
        displayName: 'Đức Anh (Khách)',
        phone: '0911234567',
        role: ClubRole.GUEST,
        publicToken: 'mem_saomai_guest_00010',
      },
    }),
    prisma.clubMember.create({
      data: {
        clubId: club.id,
        userId: null,
        displayName: 'Minh Tâm (Khách)',
        phone: '0912234567',
        role: ClubRole.GUEST,
        publicToken: 'mem_saomai_guest_00011',
      },
    }),
    prisma.clubMember.create({
      data: {
        clubId: club.id,
        userId: null,
        displayName: 'Gia Huy (Khách)',
        phone: '0913234567',
        role: ClubRole.GUEST,
        publicToken: 'mem_saomai_guest_00012',
      },
    }),
  ]);

  // 4. Create 3 Matches with Expenses (Match 1 settled, Match 2 in-progress, Match 3 scheduled)
  const settledAt = new Date('2026-11-10T22:15:00.000Z');
  const match1 = await prisma.match.create({
    data: {
      clubId: club.id,
      title: 'Buổi tối Thứ 3 - Sân Sao Mai',
      scheduledAt: new Date('2026-11-10T19:30:00.000Z'),
      location: club.location,
      courtCount: 2,
      guestDeposit: 50_000,
      splitStrategy: SplitStrategyType.EQUAL,
      status: MatchStatus.COMPLETED,
      settledAt,
      version: 1,
    },
  });

  const match2 = await prisma.match.create({
    data: {
      clubId: club.id,
      title: 'Buổi tối Thứ 5 - Giao lưu CLB Sao Mai',
      scheduledAt: new Date('2026-11-12T19:30:00.000Z'),
      location: club.location,
      courtCount: 2,
      guestDeposit: 50_000,
      splitStrategy: SplitStrategyType.EQUAL,
      status: MatchStatus.IN_PROGRESS,
    },
  });

  const match3 = await prisma.match.create({
    data: {
      clubId: club.id,
      title: 'Cuối tuần Chủ Nhật - Kèo cố định',
      scheduledAt: new Date('2026-11-15T09:00:00.000Z'),
      location: club.location,
      courtCount: 3,
      guestDeposit: 50_000,
      splitStrategy: SplitStrategyType.EQUAL,
      status: MatchStatus.SCHEDULED,
    },
  });

  // Expenses for Match 1 (Total = 240,000 + 130,000 + 30,000 = 400,000 VND)
  await prisma.expense.createMany({
    data: [
      {
        matchId: match1.id,
        clubId: club.id,
        category: ExpenseCategory.COURT,
        amount: 240_000,
        note: 'Tiền 2 sân x 2 tiếng',
        createdById: adminUser.id,
      },
      {
        matchId: match1.id,
        clubId: club.id,
        category: ExpenseCategory.SHUTTLECOCK,
        amount: 130_000,
        note: '1 ống cầu Hải Yến xanh',
        createdById: adminUser.id,
      },
      {
        matchId: match1.id,
        clubId: club.id,
        category: ExpenseCategory.WATER,
        amount: 30_000,
        note: 'Trà đá + nước suối',
        createdById: adminUser.id,
      },
    ],
  });

  // Expenses for Match 2 (Total = 390,000 VND, unsettled)
  await prisma.expense.createMany({
    data: [
      {
        matchId: match2.id,
        clubId: club.id,
        category: ExpenseCategory.COURT,
        amount: 240_000,
        note: 'Tiền sân Thứ 5',
        createdById: adminUser.id,
      },
      {
        matchId: match2.id,
        clubId: club.id,
        category: ExpenseCategory.SHUTTLECOCK,
        amount: 150_000,
        note: 'Cầu thi đấu 12 quả',
        createdById: adminUser.id,
      },
    ],
  });

  // Expenses for Match 3 (Total = 460,000 VND, scheduled)
  await prisma.expense.createMany({
    data: [
      {
        matchId: match3.id,
        clubId: club.id,
        category: ExpenseCategory.COURT,
        amount: 360_000,
        note: 'Đặt trước 3 sân Chủ Nhật',
        createdById: adminUser.id,
      },
      {
        matchId: match3.id,
        clubId: club.id,
        category: ExpenseCategory.REFEREE,
        amount: 100_000,
        note: 'Trọng tài giao lưu nội bộ',
        createdById: adminUser.id,
      },
    ],
  });

  // 5. Attendances & Settlement for Match 1:
  // 6 present players -> 400,000 / 6 = 66,666.67 -> ceil to 67,000 VND each, surplus = 2,000 VND
  const match1Participants = [
    adminMember,
    linkedRegularMembers[0], // Trần Hoàng Nam
    linkedRegularMembers[1], // Lê Thu Hà
    unlinkedRegularMembers[0], // Hoàng Bảo Long (userId = null)
    unlinkedRegularMembers[1], // Trương Quốc Tuấn (userId = null)
    guestMembers[0], // Đức Anh (Khách, userId = null)
  ];

  await prisma.attendance.createMany({
    data: match1Participants.map((member) => ({
      matchId: match1.id,
      clubMemberId: member.id,
      status: AttendanceStatus.PRESENT,
      isGuest: member.role === ClubRole.GUEST,
      depositPaid: member.role === ClubRole.GUEST,
      amountOwed: 67_000,
      isSettled: true,
    })),
  });

  // Attendances for Match 2 (8 players checked in, not settled yet)
  const match2Participants = [
    adminMember,
    ...linkedRegularMembers.slice(0, 5),
    unlinkedRegularMembers[0],
    guestMembers[1],
  ];

  await prisma.attendance.createMany({
    data: match2Participants.map((member) => ({
      matchId: match2.id,
      clubMemberId: member.id,
      status: AttendanceStatus.PRESENT,
      isGuest: member.role === ClubRole.GUEST,
      depositPaid: false,
      amountOwed: 0,
      isSettled: false,
    })),
  });

  // 6. Ledger Entries for Match 1 Settlement:
  // - 6 CHARGE entries (+67,000 VND each)
  // - 1 FUND_SURPLUS entry (+2,000 VND, clubMemberId = null)
  // - 2 PAYMENT entries (-67,000 VND for adminMember & linkedRegularMembers[0])
  // - 1 voided ADJUSTMENT entry (+10,000 VND on linkedRegularMembers[1], voidedAt set)
  await prisma.ledgerEntry.createMany({
    data: [
      ...match1Participants.map((member) => ({
        clubId: club.id,
        clubMemberId: member.id,
        matchId: match1.id,
        type: LedgerEntryType.CHARGE,
        amount: 67_000,
        note: 'Phí buổi tối Thứ 3 (400k / 6 người làm tròn 67k)',
        createdById: adminUser.id,
      })),
      {
        clubId: club.id,
        clubMemberId: null,
        matchId: match1.id,
        type: LedgerEntryType.FUND_SURPLUS,
        amount: 2_000,
        note: 'Tiền lẻ làm tròn vào quỹ CLB (67k * 6 - 400k)',
        createdById: adminUser.id,
      },
      {
        clubId: club.id,
        clubMemberId: adminMember.id,
        matchId: match1.id,
        type: LedgerEntryType.PAYMENT,
        amount: -67_000,
        note: 'Admin thanh toán phí buổi Thứ 3',
        createdById: adminUser.id,
      },
      {
        clubId: club.id,
        clubMemberId: linkedRegularMembers[0].id,
        matchId: match1.id,
        type: LedgerEntryType.PAYMENT,
        amount: -67_000,
        note: 'Chuyển khoản VietQR VCB',
        createdById: adminUser.id,
      },
      {
        clubId: club.id,
        clubMemberId: linkedRegularMembers[1].id,
        matchId: match1.id,
        type: LedgerEntryType.ADJUSTMENT,
        amount: 10_000,
        note: 'Nhập nhầm phụ phí nước (đã hủy)',
        voidedAt: new Date('2026-11-10T22:20:00.000Z'),
        createdById: adminUser.id,
      },
    ],
  });

  // 7. PaymentRequest for Hoàng Bảo Long (unlinked regular member owing 67,000 VND)
  await prisma.paymentRequest.create({
    data: {
      clubId: club.id,
      clubMemberId: unlinkedRegularMembers[0].id,
      amount: 67_000,
      transferNote: 'SB SAOMAI BAOLONG 1126',
      qrPayload:
        'https://img.vietqr.io/image/970436-0071001234567-compact2.png?amount=67000&addInfo=SB+SAOMAI+BAOLONG+1126',
      status: PaymentRequestStatus.PENDING,
    },
  });

  return {
    adminUser,
    club,
    members: [adminMember, ...linkedRegularMembers, ...unlinkedRegularMembers, ...guestMembers],
    matches: [match1, match2, match3],
  };
}

async function main() {
  const prisma = new PrismaClient();
  try {
    const result = await seedDatabase(prisma);
    console.log(
      `Seeded club "${result.club.name}" (${result.members.length} members, ${result.matches.length} matches).`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

if (require.main === module) {
  main().catch((error) => {
    console.error('Failed to seed database:', error);
    process.exit(1);
  });
}
