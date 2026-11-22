import { beforeEach, describe, expect, it } from 'vitest';
import type { TokenGenerator } from '../../../common/tokens/token-generator';
import type { ClubRepository } from '../club.repository';
import { SlugService } from './slug.service';

describe('SlugService', () => {
  let existingSlugs: Map<string, string>;
  let existingInviteCodes: Set<string>;
  let slugService: SlugService;

  beforeEach(() => {
    existingSlugs = new Map<string, string>();
    existingInviteCodes = new Set<string>();

    const fakeRepo = {
      existsBySlug: async (slug: string, excludeClubId?: string) => {
        const ownerId = existingSlugs.get(slug);
        if (!ownerId) {
          return false;
        }
        return ownerId !== excludeClubId;
      },
      existsByInviteCode: async (code: string) => existingInviteCodes.has(code),
    } as unknown as ClubRepository;

    let tokenSeq = 1;
    const fakeTokenGen: TokenGenerator = {
      generate: () => `tok_saomai_000000000${tokenSeq++}`,
    };

    slugService = new SlugService(fakeRepo, fakeTokenGen);
  });

  it('slugifies Vietnamese club name without collision', async () => {
    const slug = await slugService.generateUniqueSlug('CLB Cầu Lông Sao Mai');
    expect(slug).toBe('clb-cau-long-sao-mai');
  });

  it('appends incrementing numeric suffix (-2, -3) when duplicate club names collide', async () => {
    existingSlugs.set('sao-mai', 'club_1');
    const secondSlug = await slugService.generateUniqueSlug('Sao Mai');
    expect(secondSlug).toBe('sao-mai-2');

    existingSlugs.set('sao-mai-2', 'club_2');
    const thirdSlug = await slugService.generateUniqueSlug('Sao Mai');
    expect(thirdSlug).toBe('sao-mai-3');
  });

  it('allows keeping existing slug when updating the same club (excludeClubId)', async () => {
    existingSlugs.set('sao-mai', 'club_1');
    const sameClubSlug = await slugService.generateUniqueSlug('Sao Mai', 'club_1');
    expect(sameClubSlug).toBe('sao-mai');
  });

  it('falls back to "club" when name contains no alphanumeric characters', async () => {
    const slug = await slugService.generateUniqueSlug('***');
    expect(slug).toBe('club');
  });

  it('generates an 8-character uppercase alphanumeric invite code and retries on collision', async () => {
    existingInviteCodes.add('TOKSAOMA');
    const code = await slugService.generateUniqueInviteCode();
    expect(code).toMatch(/^[A-Z0-9]{8}$/);
  });
});
