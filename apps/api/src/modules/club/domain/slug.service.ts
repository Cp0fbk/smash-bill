import { Inject, Injectable } from '@nestjs/common';
import { slugify } from '@smash-bill/shared';
import { TOKEN_GENERATOR } from '../../../common/constants/injection-tokens';
import type { TokenGenerator } from '../../../common/tokens/token-generator';
import { CLUB_REPOSITORY, type ClubRepository } from '../club.repository';

@Injectable()
export class SlugService {
  constructor(
    @Inject(CLUB_REPOSITORY) private readonly clubRepository: ClubRepository,
    @Inject(TOKEN_GENERATOR) private readonly tokenGenerator: TokenGenerator,
  ) {}

  async generateUniqueSlug(name: string, excludeClubId?: string): Promise<string> {
    const baseSlug = slugify(name) || 'club';
    const baseTaken = await this.clubRepository.existsBySlug(baseSlug, excludeClubId);
    if (!baseTaken) {
      return baseSlug;
    }

    let suffix = 2;
    while (suffix < 10_000) {
      const candidate = `${baseSlug}-${suffix}`;
      const taken = await this.clubRepository.existsBySlug(candidate, excludeClubId);
      if (!taken) {
        return candidate;
      }
      suffix += 1;
    }

    const fallbackSuffix = this.tokenGenerator
      .generate()
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase()
      .slice(0, 6);
    return `${baseSlug}-${fallbackSuffix || Date.now()}`;
  }

  async generateUniqueInviteCode(): Promise<string> {
    for (let attempt = 0; attempt < 20; attempt++) {
      const raw = this.tokenGenerator
        .generate()
        .replace(/[^a-zA-Z0-9]/g, '')
        .toUpperCase();
      const candidate = raw.length >= 8 ? raw.slice(0, 8) : `${raw}SMASH268`.slice(0, 8);
      const exists = await this.clubRepository.existsByInviteCode(candidate);
      if (!exists) {
        return candidate;
      }
    }
    return `SB${Date.now().toString(36).toUpperCase().slice(-6)}`;
  }
}
