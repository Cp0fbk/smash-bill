export interface ApiError {
  code: string;
  message: string;
  details?: unknown;
  requestId?: string;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export interface AuthUserProfile {
  id: string;
  provider: 'GOOGLE' | 'ZALO';
  providerId: string;
  email: string | null;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  skillLevel: string | null;
  status: 'ACTIVE' | 'SHADOWBANNED' | 'BANNED';
  shadowbanUntil: string | null;
  flakeCount: number;
  totalMatches: number;
  thumbsUp: number;
  thumbsDown: number;
  createdAt: string;
  updatedAt: string;
}
