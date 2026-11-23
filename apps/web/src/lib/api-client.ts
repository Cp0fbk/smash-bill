import type {
  AddClubMemberPayload,
  ApiError,
  AuthUserProfile,
  ClubDetail,
  ClubMemberDto,
  ClubSummary,
  CreateClubPayload,
  JoinByInvitePayload,
  JoinByInviteResult,
  ListClubMembersQuery,
  PublicInviteClubInfo,
  RotateClubTokensPayload,
  UpdateBankAccountPayload,
  UpdateClubMemberPayload,
  UpdateClubPayload,
} from '@smash-bill/shared';

export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export class ApiClientError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;
  readonly requestId?: string;

  constructor(status: number, error: ApiError) {
    super(error.message);
    this.name = 'ApiClientError';
    this.status = status;
    this.code = error.code;
    this.details = error.details;
    this.requestId = error.requestId;
  }
}

let activeRefreshPromise: Promise<boolean> | null = null;

async function tryRefreshSession(): Promise<boolean> {
  if (activeRefreshPromise) {
    return activeRefreshPromise;
  }

  activeRefreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/refresh`, {
        method: 'POST',
        credentials: 'include',
      });
      if (!response.ok) {
        await fetch(`${API_BASE_URL}/auth/logout`, {
          method: 'POST',
          credentials: 'include',
        }).catch(() => undefined);
      }
      return response.ok;
    } catch {
      return false;
    } finally {
      activeRefreshPromise = null;
    }
  })();

  return activeRefreshPromise;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  allowRefresh = true,
): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = `${API_BASE_URL}${normalizedPath}`;

  const headers = new Headers(init.headers);
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(url, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (
    response.status === 401 &&
    allowRefresh &&
    normalizedPath !== '/auth/refresh' &&
    normalizedPath !== '/auth/logout'
  ) {
    const refreshed = await tryRefreshSession();
    if (refreshed) {
      return apiFetch<T>(normalizedPath, init, false);
    }
  }

  if (!response.ok) {
    let parsedError: ApiError = {
      code: `HTTP_${response.status}`,
      message: response.statusText || 'Request failed',
    };
    try {
      const body = (await response.json()) as Partial<ApiError>;
      if (body && typeof body.code === 'string' && typeof body.message === 'string') {
        parsedError = {
          code: body.code,
          message: body.message,
          details: body.details,
          requestId: body.requestId,
        };
      }
    } catch {
      // Ignore non-JSON error body
    }
    throw new ApiClientError(response.status, parsedError);
  }

  return (await response.json()) as T;
}

export function getGoogleLoginUrl(): string {
  return `${API_BASE_URL}/auth/google`;
}

export function fetchCurrentUser(): Promise<AuthUserProfile> {
  return apiFetch<AuthUserProfile>('/me');
}

export function logoutUser(): Promise<{ status: string }> {
  return apiFetch<{ status: string }>('/auth/logout', {
    method: 'POST',
  });
}

export function fetchMyClubs(): Promise<ClubSummary[]> {
  return apiFetch<ClubSummary[]>('/clubs');
}

export function fetchClubById(clubId: string): Promise<ClubDetail> {
  return apiFetch<ClubDetail>(`/clubs/${encodeURIComponent(clubId)}`);
}

export function createClub(payload: CreateClubPayload): Promise<ClubSummary> {
  return apiFetch<ClubSummary>('/clubs', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateClub(clubId: string, payload: UpdateClubPayload): Promise<ClubDetail> {
  return apiFetch<ClubDetail>(`/clubs/${encodeURIComponent(clubId)}`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export function updateClubBankAccount(
  clubId: string,
  payload: UpdateBankAccountPayload,
): Promise<ClubDetail> {
  return apiFetch<ClubDetail>(`/clubs/${encodeURIComponent(clubId)}/bank-account`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  });
}

export function rotateClubTokens(
  clubId: string,
  payload: RotateClubTokensPayload = { rotateInviteCode: true, rotatePublicToken: true },
): Promise<ClubDetail> {
  return apiFetch<ClubDetail>(`/clubs/${encodeURIComponent(clubId)}/tokens/rotate`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function fetchClubMembers(
  clubId: string,
  query?: ListClubMembersQuery,
): Promise<ClubMemberDto[]> {
  const params = new URLSearchParams();
  if (query?.role) {
    params.set('role', query.role);
  }
  if (query?.active !== undefined) {
    params.set('active', String(query.active));
  }
  if (query?.q?.trim()) {
    params.set('q', query.q.trim());
  }
  const qs = params.toString();
  const suffix = qs ? `?${qs}` : '';
  return apiFetch<ClubMemberDto[]>(`/clubs/${encodeURIComponent(clubId)}/members${suffix}`);
}

export function addClubMember(
  clubId: string,
  payload: AddClubMemberPayload,
): Promise<ClubMemberDto> {
  return apiFetch<ClubMemberDto>(`/clubs/${encodeURIComponent(clubId)}/members`, {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateClubMember(
  clubId: string,
  memberId: string,
  payload: UpdateClubMemberPayload,
): Promise<ClubMemberDto> {
  return apiFetch<ClubMemberDto>(
    `/clubs/${encodeURIComponent(clubId)}/members/${encodeURIComponent(memberId)}`,
    {
      method: 'PATCH',
      body: JSON.stringify(payload),
    },
  );
}

export function deactivateClubMember(clubId: string, memberId: string): Promise<ClubMemberDto> {
  return apiFetch<ClubMemberDto>(
    `/clubs/${encodeURIComponent(clubId)}/members/${encodeURIComponent(memberId)}`,
    {
      method: 'DELETE',
    },
  );
}

export function fetchPublicInviteInfo(inviteCode: string): Promise<PublicInviteClubInfo> {
  return apiFetch<PublicInviteClubInfo>(
    `/public/invite/${encodeURIComponent(inviteCode)}`,
    {},
    false,
  );
}

export function joinClubByInvite(
  inviteCode: string,
  payload: JoinByInvitePayload,
): Promise<JoinByInviteResult> {
  return apiFetch<JoinByInviteResult>(
    `/public/invite/${encodeURIComponent(inviteCode)}/join`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    false,
  );
}
