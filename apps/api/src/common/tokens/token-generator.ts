import { Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';

export const DEFAULT_PUBLIC_TOKEN_LENGTH = 21;

export interface TokenGenerator {
  generate(): string;
}

@Injectable()
export class NanoidTokenGenerator implements TokenGenerator {
  generate(): string {
    return nanoid(DEFAULT_PUBLIC_TOKEN_LENGTH);
  }
}
