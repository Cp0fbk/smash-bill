import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import type { ConfigService } from '@nestjs/config';

function readAdminEmailFromDotEnv(): string {
  if (process.env.NODE_ENV === 'production') {
    return '';
  }

  const candidatePaths = [resolve(process.cwd(), '.env'), resolve(process.cwd(), '../../.env')];

  for (const envPath of candidatePaths) {
    if (!existsSync(envPath)) {
      continue;
    }
    try {
      const content = readFileSync(envPath, 'utf8');
      for (const rawLine of content.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line || line.startsWith('#')) {
          continue;
        }
        const match = line.match(/^(?:ADMIN_EMAIL|PLATFORM_ADMIN_EMAIL)\s*=\s*(.*)$/);
        if (match?.[1] !== undefined) {
          return match[1].trim().replace(/^['"]|['"]$/g, '');
        }
      }
    } catch {
      // Ignore file read errors in sandbox/dev
    }
  }

  return '';
}

export function isConfiguredPlatformAdminEmail(
  email: string | null | undefined,
  configService?: ConfigService,
): boolean {
  if (!email) {
    return false;
  }

  const fromConfig = configService?.get<string>('ADMIN_EMAIL') ?? '';
  const fromEnv = process.env.ADMIN_EMAIL ?? '';
  const fromDotEnv = readAdminEmailFromDotEnv();

  const combined = [fromConfig, fromEnv, fromDotEnv].filter(Boolean).join(',');
  if (!combined) {
    return false;
  }

  const normalizedTarget = email.trim().toLowerCase();
  const configuredEmails = combined
    .split(',')
    .map((item) =>
      item
        .trim()
        .replace(/^['"]|['"]$/g, '')
        .toLowerCase(),
    )
    .filter(Boolean);

  return configuredEmails.includes(normalizedTarget);
}
