export type UserRole = 'USER' | 'ADMIN';
export type ClubRole = 'HOST' | 'MEMBER' | 'GUEST';
export type AccountStatusType = 'ACTIVE' | 'SHADOWBANNED' | 'BANNED';
export type AuthProviderType = 'GOOGLE' | 'ZALO';

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
  provider: AuthProviderType;
  providerId: string;
  role: UserRole;
  email: string | null;
  name: string;
  phone: string | null;
  avatarUrl: string | null;
  skillLevel: string | null;
  preferredCity: string | null;
  status: AccountStatusType;
  shadowbanUntil: string | null;
  flakeCount: number;
  totalMatches: number;
  thumbsUp: number;
  thumbsDown: number;
  createdAt: string;
  updatedAt: string;
}

export interface ClubSummary {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  location: string | null;
  sport: 'BADMINTON';
  inviteCode: string;
  publicToken: string;
  bankBin: string | null;
  bankShortName: string | null;
  bankAccountNo: string | null;
  bankAccountName: string | null;
  defaultCourtFee: number;
  ownerId: string;
  myRole: ClubRole;
  memberCount: number;
  createdAt: string;
  updatedAt: string;
}

export type ClubDetail = ClubSummary;

export interface CreateClubPayload {
  name: string;
  description?: string;
  location?: string;
  defaultCourtFee?: number;
}

export interface UpdateClubPayload {
  name?: string;
  description?: string;
  location?: string;
  defaultCourtFee?: number;
}

export interface UpdateBankAccountPayload {
  bankBin: string;
  bankAccountNo: string;
  bankAccountName: string;
}

export interface RotateClubTokensPayload {
  rotateInviteCode?: boolean;
  rotatePublicToken?: boolean;
}
