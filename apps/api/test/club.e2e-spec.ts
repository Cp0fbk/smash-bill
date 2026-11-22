import { type INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AccountStatus, AuthProvider, ClubRole, UserRole } from '@prisma/client';
import request from 'supertest';
import { afterAll, beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { AppModule } from '../src/app.module';
import { HttpExceptionFilter } from '../src/common/filters/http-exception.filter';
import { TokenService } from '../src/modules/auth/token.service';
import { type TestDatabaseContext, startTestDatabase } from './utils/test-db';

describe('Club Management, Bank Account & Role Guard Matrix E2E', () => {
  let db: TestDatabaseContext;
  let app: INestApplication;
  let tokenService: TokenService;

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

    tokenService = moduleRef.get(TokenService);
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

  async function createTestUser(spec: {
    providerId: string;
    name: string;
    email: string;
    role?: UserRole;
  }) {
    const user = await db.prisma.user.create({
      data: {
        provider: AuthProvider.GOOGLE,
        providerId: spec.providerId,
        name: spec.name,
        email: spec.email,
        role: spec.role ?? UserRole.USER,
        status: AccountStatus.ACTIVE,
      },
    });
    const accessToken = tokenService.signAccessToken(user);
    return {
      user,
      authCookie: `sb_access=${encodeURIComponent(accessToken)}`,
    };
  }

  it('creates clubs with unique slugs on collision, assigns creator as ADMIN, and lists my clubs with myRole', async () => {
    const admin = await createTestUser({
      providerId: 'google-admin-1',
      name: 'Nguyễn Minh Quân',
      email: 'minh@saomai.club',
    });

    // 1. Create first club "CLB Sao Mai"
    const createRes1 = await request(app.getHttpServer())
      .post('/api/v1/clubs')
      .set('Cookie', [admin.authCookie])
      .send({
        name: 'CLB Sao Mai',
        description: 'CLB cầu lông tối 3-5-7',
        location: 'Sân Sao Mai, Phú Nhuận, TP.HCM',
        defaultCourtFee: 240000,
      })
      .expect(201);

    expect(createRes1.body).toMatchObject({
      name: 'CLB Sao Mai',
      slug: 'clb-sao-mai',
      location: 'Sân Sao Mai, Phú Nhuận, TP.HCM',
      defaultCourtFee: 240000,
      myRole: 'ADMIN',
      memberCount: 1,
    });
    expect(createRes1.body.inviteCode).toMatch(/^[A-Z0-9]{8}$/);
    expect(createRes1.body.publicToken).toHaveLength(21);

    // 2. Duplicate club name creates "clb-sao-mai-2"
    const createRes2 = await request(app.getHttpServer())
      .post('/api/v1/clubs')
      .set('Cookie', [admin.authCookie])
      .send({
        name: 'CLB Sao Mai',
        location: 'Quận Bình Thạnh',
      })
      .expect(201);

    expect(createRes2.body.slug).toBe('clb-sao-mai-2');

    // 3. GET /api/v1/clubs lists both clubs with myRole = ADMIN
    const listRes = await request(app.getHttpServer())
      .get('/api/v1/clubs')
      .set('Cookie', [admin.authCookie])
      .expect(200);

    expect(listRes.body).toHaveLength(2);
    expect(listRes.body.map((c: { slug: string }) => c.slug)).toEqual(
      expect.arrayContaining(['clb-sao-mai', 'clb-sao-mai-2']),
    );
  });

  it('enforces 404 for non-members and 403 for MEMBER on admin endpoints, while allowing ADMIN updates, bank config, and token rotation', async () => {
    const admin = await createTestUser({
      providerId: 'google-admin-2',
      name: 'Minh Admin',
      email: 'admin2@saomai.club',
    });
    const member = await createTestUser({
      providerId: 'google-member-2',
      name: 'Hoàng Member',
      email: 'member2@saomai.club',
    });
    const outsider = await createTestUser({
      providerId: 'google-outsider-2',
      name: 'Khách Ngoài',
      email: 'outsider@saomai.club',
    });

    const clubRes = await request(app.getHttpServer())
      .post('/api/v1/clubs')
      .set('Cookie', [admin.authCookie])
      .send({
        name: 'Sao Mai Pro',
        defaultCourtFee: 200000,
      })
      .expect(201);

    const clubId: string = clubRes.body.id;

    // Add `member` as ClubRole.MEMBER
    await db.prisma.clubMember.create({
      data: {
        clubId,
        userId: member.user.id,
        displayName: member.user.name,
        role: ClubRole.MEMBER,
        publicToken: 'mem_token_regular_0001',
      },
    });

    // Non-member accessing GET /clubs/:clubId -> 404 (do not leak existence)
    await request(app.getHttpServer())
      .get(`/api/v1/clubs/${clubId}`)
      .set('Cookie', [outsider.authCookie])
      .expect(404);

    // Non-member accessing PATCH /clubs/:clubId -> 404
    await request(app.getHttpServer())
      .patch(`/api/v1/clubs/${clubId}`)
      .set('Cookie', [outsider.authCookie])
      .send({ name: 'Hacked Name' })
      .expect(404);

    // MEMBER accessing GET /clubs/:clubId -> 200 with myRole = MEMBER
    const memberGetRes = await request(app.getHttpServer())
      .get(`/api/v1/clubs/${clubId}`)
      .set('Cookie', [member.authCookie])
      .expect(200);

    expect(memberGetRes.body).toMatchObject({
      id: clubId,
      myRole: 'MEMBER',
      memberCount: 2,
    });

    // MEMBER calling PATCH /clubs/:clubId -> 403
    await request(app.getHttpServer())
      .patch(`/api/v1/clubs/${clubId}`)
      .set('Cookie', [member.authCookie])
      .send({ name: 'Member Edit Attempt' })
      .expect(403);

    // MEMBER calling PUT /clubs/:clubId/bank-account -> 403
    await request(app.getHttpServer())
      .put(`/api/v1/clubs/${clubId}/bank-account`)
      .set('Cookie', [member.authCookie])
      .send({
        bankBin: '970436',
        bankAccountNo: '0071001234567',
        bankAccountName: 'HOANG MEMBER',
      })
      .expect(403);

    // MEMBER calling POST /clubs/:clubId/tokens/rotate -> 403
    await request(app.getHttpServer())
      .post(`/api/v1/clubs/${clubId}/tokens/rotate`)
      .set('Cookie', [member.authCookie])
      .expect(403);

    // ADMIN updates club info -> 200
    const patchRes = await request(app.getHttpServer())
      .patch(`/api/v1/clubs/${clubId}`)
      .set('Cookie', [admin.authCookie])
      .send({
        name: 'CLB Sao Mai Premier',
        location: 'Sân Phú Nhuận',
        defaultCourtFee: 280000,
      })
      .expect(200);

    expect(patchRes.body).toMatchObject({
      name: 'CLB Sao Mai Premier',
      slug: 'clb-sao-mai-premier',
      location: 'Sân Phú Nhuận',
      defaultCourtFee: 280000,
    });

    // ADMIN rejects invalid bank BIN -> 400
    await request(app.getHttpServer())
      .put(`/api/v1/clubs/${clubId}/bank-account`)
      .set('Cookie', [admin.authCookie])
      .send({
        bankBin: '999999',
        bankAccountNo: '0071001234567',
        bankAccountName: 'Nguyễn Minh Quân',
      })
      .expect(400);

    // ADMIN saves valid bank info -> normalizes bankAccountName to uppercase ASCII
    const bankRes = await request(app.getHttpServer())
      .put(`/api/v1/clubs/${clubId}/bank-account`)
      .set('Cookie', [admin.authCookie])
      .send({
        bankBin: '970436',
        bankAccountNo: '0071001234567',
        bankAccountName: 'Nguyễn Minh Quân',
      })
      .expect(200);

    expect(bankRes.body).toMatchObject({
      bankBin: '970436',
      bankShortName: 'Vietcombank',
      bankAccountNo: '0071001234567',
      bankAccountName: 'NGUYEN MINH QUAN',
    });

    // ADMIN rotates tokens -> 200 with new inviteCode and publicToken
    const rotateRes = await request(app.getHttpServer())
      .post(`/api/v1/clubs/${clubId}/tokens/rotate`)
      .set('Cookie', [admin.authCookie])
      .send({ rotateInviteCode: true, rotatePublicToken: true })
      .expect(200);

    expect(rotateRes.body.inviteCode).not.toBe(clubRes.body.inviteCode);
    expect(rotateRes.body.publicToken).not.toBe(clubRes.body.publicToken);
  });
});
