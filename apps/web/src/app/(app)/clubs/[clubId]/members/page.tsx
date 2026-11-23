'use client';

import {
  type ClubDetail,
  type ClubMemberDto,
  type ClubRole,
  matchesVietnameseSearch,
  normalizePhone,
} from '@smash-bill/shared';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { type FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { QrCodeSvg } from '../../../../../components/qr-code-svg';
import {
  ApiClientError,
  addClubMember,
  deactivateClubMember,
  fetchClubById,
  fetchClubMembers,
  updateClubMember,
} from '../../../../../lib/api-client';
import { useClubPermissions } from '../../../../../lib/auth-context';

type RoleFilter = 'ALL' | ClubRole;
type StatusFilter = 'ACTIVE' | 'INACTIVE';

function getRoleBadge(role: ClubRole): { label: string; className: string } {
  switch (role) {
    case 'HOST':
      return {
        label: 'Chủ sân (HOST)',
        className: 'bg-primary-soft text-primary border-border-strong/30',
      };
    case 'MEMBER':
      return {
        label: 'Cố định (MEMBER)',
        className: 'bg-secondary text-foreground border-border',
      };
    case 'GUEST':
      return {
        label: 'Vãng lai (GUEST)',
        className: 'bg-warning-soft text-on-warning-soft border-warning/30',
      };
  }
}

export default function ClubMembersPage() {
  const params = useParams<{ clubId: string }>();
  const clubId = params?.clubId ?? '';

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [members, setMembers] = useState<ClubMemberDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<RoleFilter>('ALL');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('ACTIVE');

  // Quick-add / Sheet form state
  const [memberModalOpen, setMemberModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<ClubMemberDto | null>(null);
  const [formDisplayName, setFormDisplayName] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState<ClubRole>('MEMBER');
  const [formError, setFormError] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Desktop Quick-Add inline state
  const [quickName, setQuickName] = useState('');
  const [quickPhone, setQuickPhone] = useState('');
  const [quickRole, setQuickRole] = useState<ClubRole>('MEMBER');
  const [quickError, setQuickError] = useState<string | null>(null);
  const [quickSuccess, setQuickSuccess] = useState<string | null>(null);
  const [quickSubmitting, setQuickSubmitting] = useState(false);

  // Mobile full-screen Invite QR sheet
  const [qrSheetOpen, setQrSheetOpen] = useState(false);
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [copiedMemberToken, setCopiedMemberToken] = useState<string | null>(null);
  const [actionBusyId, setActionBusyId] = useState<string | null>(null);
  const [origin, setOrigin] = useState('https://smashbill.vn');

  const { canManageClub } = useClubPermissions(club?.myRole);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.origin) {
      setOrigin(window.location.origin);
    }
  }, []);

  const loadClubAndMembers = useCallback(async () => {
    if (!clubId) {
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [clubDetail, roster] = await Promise.all([
        fetchClubById(clubId),
        fetchClubMembers(clubId),
      ]);
      setClub(clubDetail);
      setMembers(roster);
      setNotFound(false);
    } catch (err: unknown) {
      if (err instanceof ApiClientError && err.status === 404) {
        setNotFound(true);
      } else {
        setError(err instanceof Error ? err.message : 'Không thể tải danh sách thành viên.');
      }
    } finally {
      setLoading(false);
    }
  }, [clubId]);

  useEffect(() => {
    loadClubAndMembers();
  }, [loadClubAndMembers]);

  const activeHostCount = useMemo(
    () => members.filter((m) => m.isActive && m.role === 'HOST').length,
    [members],
  );

  const filteredMembers = useMemo(() => {
    const q = searchQuery.trim();
    const normalizedQueryPhone = normalizePhone(q);

    return members.filter((member) => {
      const matchesStatus = statusFilter === 'ACTIVE' ? member.isActive : !member.isActive;
      if (!matchesStatus) {
        return false;
      }
      if (roleFilter !== 'ALL' && member.role !== roleFilter) {
        return false;
      }
      if (!q) {
        return true;
      }
      if (matchesVietnameseSearch(member.displayName, q)) {
        return true;
      }
      if (member.phone) {
        if (member.phone.includes(q)) {
          return true;
        }
        if (normalizedQueryPhone && member.phone.includes(normalizedQueryPhone)) {
          return true;
        }
      }
      return false;
    });
  }, [members, searchQuery, roleFilter, statusFilter]);

  const counts = useMemo(() => {
    const activeList = members.filter((m) => m.isActive);
    const inactiveList = members.filter((m) => !m.isActive);
    return {
      activeTotal: activeList.length,
      inactiveTotal: inactiveList.length,
      hosts: activeList.filter((m) => m.role === 'HOST').length,
      regulars: activeList.filter((m) => m.role === 'MEMBER').length,
      guests: activeList.filter((m) => m.role === 'GUEST').length,
    };
  }, [members]);

  const inviteJoinUrl = club ? `${origin}/join/${club.inviteCode}` : '';

  async function handleCopyInviteLink() {
    if (!inviteJoinUrl) return;
    try {
      await navigator.clipboard.writeText(inviteJoinUrl);
      setCopiedInvite(true);
      setTimeout(() => setCopiedInvite(false), 1800);
    } catch {
      // Ignore clipboard error
    }
  }

  async function handleShareInviteLink() {
    if (!club || !inviteJoinUrl) return;
    if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
      try {
        await navigator.share({
          title: `Tham gia ${club.name} trên SmashBill`,
          text: `Quét QR hoặc mở link để ghi danh vào ${club.name} (không cần tạo tài khoản):`,
          url: inviteJoinUrl,
        });
        return;
      } catch {
        // Fallback to copy
      }
    }
    await handleCopyInviteLink();
  }

  async function handleCopyMemberPersonalLink(member: ClubMemberDto) {
    const personalUrl = `${origin}/p/${member.publicToken}`;
    try {
      await navigator.clipboard.writeText(personalUrl);
      setCopiedMemberToken(member.id);
      setTimeout(() => setCopiedMemberToken(null), 1800);
    } catch {
      // Ignore clipboard error
    }
  }

  function openAddSheet() {
    setEditingMember(null);
    setFormDisplayName('');
    setFormPhone('');
    setFormRole('MEMBER');
    setFormError(null);
    setMemberModalOpen(true);
  }

  function openEditSheet(member: ClubMemberDto) {
    setEditingMember(member);
    setFormDisplayName(member.displayName);
    setFormPhone(member.phone ?? '');
    setFormRole(member.role);
    setFormError(null);
    setMemberModalOpen(true);
  }

  async function handleModalSubmit(event: FormEvent) {
    event.preventDefault();
    if (!clubId) return;

    const trimmedName = formDisplayName.trim();
    if (!trimmedName) {
      setFormError('Vui lòng nhập họ tên hoặc biệt danh trên sân.');
      return;
    }

    setFormSubmitting(true);
    setFormError(null);
    try {
      if (editingMember) {
        const updated = await updateClubMember(clubId, editingMember.id, {
          displayName: trimmedName,
          phone: formPhone.trim() ? formPhone.trim() : null,
          role: formRole,
        });
        setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
      } else {
        const created = await addClubMember(clubId, {
          displayName: trimmedName,
          phone: formPhone.trim() || undefined,
          role: formRole,
        });
        setMembers((prev) => {
          const exists = prev.some((m) => m.id === created.id);
          return exists ? prev.map((m) => (m.id === created.id ? created : m)) : [...prev, created];
        });
      }
      setMemberModalOpen(false);
    } catch (err: unknown) {
      setFormError(err instanceof Error ? err.message : 'Không thể lưu thông tin thành viên.');
    } finally {
      setFormSubmitting(false);
    }
  }

  async function handleDesktopQuickAdd(event: FormEvent) {
    event.preventDefault();
    if (!clubId) return;

    const trimmedName = quickName.trim();
    if (!trimmedName) {
      setQuickError('Vui lòng nhập tên thành viên.');
      return;
    }

    setQuickSubmitting(true);
    setQuickError(null);
    setQuickSuccess(null);
    try {
      const created = await addClubMember(clubId, {
        displayName: trimmedName,
        phone: quickPhone.trim() || undefined,
        role: quickRole,
      });
      setMembers((prev) => {
        const exists = prev.some((m) => m.id === created.id);
        return exists ? prev.map((m) => (m.id === created.id ? created : m)) : [...prev, created];
      });
      setQuickName('');
      setQuickPhone('');
      setQuickRole('MEMBER');
      setQuickSuccess(`Đã thêm ${created.displayName} vào danh sách CLB.`);
    } catch (err: unknown) {
      setQuickError(err instanceof Error ? err.message : 'Không thể thêm thành viên.');
    } finally {
      setQuickSubmitting(false);
    }
  }

  async function handleToggleActive(member: ClubMemberDto) {
    if (!clubId) return;
    setActionBusyId(member.id);
    setError(null);
    try {
      const updated = member.isActive
        ? await deactivateClubMember(clubId, member.id)
        : await updateClubMember(clubId, member.id, { isActive: true });
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật trạng thái thành viên.');
    } finally {
      setActionBusyId(null);
    }
  }

  if (loading) {
    return (
      <div
        aria-label="Đang tải danh sách thành viên"
        className="h-72 animate-pulse rounded-block border border-border bg-card p-6 shadow-block motion-reduce:animate-none"
      />
    );
  }

  if (notFound || !club) {
    return (
      <section
        role="alert"
        className="mx-auto my-8 max-w-lg rounded-block border border-border bg-card p-6 text-center shadow-block sm:p-8"
      >
        <h1 className="text-lg font-bold text-card-foreground">404 • Không tìm thấy câu lạc bộ</h1>
        <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
          CLB không tồn tại hoặc bạn không có quyền xem danh sách thành viên.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/clubs"
            className="inline-flex min-h-[44px] cursor-pointer items-center rounded-tile bg-primary px-5 py-2.5 text-xs font-semibold text-on-primary shadow-cta"
          >
            Quay lại danh sách CLB
          </Link>
        </div>
      </section>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <section className="flex flex-col justify-between gap-4 rounded-block border border-border bg-card p-5 shadow-block sm:flex-row sm:items-center sm:p-6">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/clubs/${club.id}`}
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              ← {club.name}
            </Link>
            <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-primary tabular-nums">
              {counts.activeTotal} thành viên hoạt động
            </span>
          </div>
          <h1 className="mt-2 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
            Danh sách thành viên &amp; Mã mời QR
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
            Người chơi quét QR tự ghi danh không cần tạo tài khoản (Single-Player First).
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Mobile QR Sheet Trigger */}
          <button
            type="button"
            onClick={() => setQrSheetOpen(true)}
            className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-tile border border-border-strong bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground shadow-tile transition-colors hover:bg-primary-soft hover:text-primary lg:hidden [touch-action:manipulation]"
          >
            <svg
              viewBox="0 0 24 24"
              className="h-4 w-4 text-primary"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <rect x="3" y="3" width="7" height="7" rx="1" />
              <rect x="14" y="3" width="7" height="7" rx="1" />
              <rect x="3" y="14" width="7" height="7" rx="1" />
              <path d="M14 14h3v3h-3zM18 18h3v3h-3zM14 19h3" />
            </svg>
            <span>Mã mời QR</span>
          </button>

          {canManageClub && (
            <button
              type="button"
              onClick={openAddSheet}
              className="inline-flex min-h-[44px] cursor-pointer items-center justify-center gap-2 rounded-tile bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
            >
              <span>+ Thêm thành viên</span>
            </button>
          )}
        </div>
      </section>

      {error && (
        <div
          role="alert"
          className="rounded-tile border border-destructive/40 bg-destructive-soft px-4 py-3 text-xs font-semibold text-on-destructive-soft"
        >
          {error}
        </div>
      )}

      {/* Desktop 12-Col Master-Detail Workspace (8-col Roster + 4-col Sticky QR & Quick-Add) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 8 Columns: Search, Filters & Roster List */}
        <div className="space-y-4 lg:col-span-8">
          {/* Search & Filter Toolbar */}
          <section
            aria-label="Bộ lọc thành viên"
            className="space-y-3 rounded-block border border-border bg-card p-4 shadow-block sm:p-5"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <input
                  type="search"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Tìm theo tên có dấu / không dấu (vd: minh → Minh, Mình) hoặc SĐT..."
                  aria-label="Tìm kiếm thành viên"
                  className="min-h-[44px] w-full rounded-tile border border-input bg-background px-3.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:text-sm"
                />
              </div>

              {/* Active / Deactivated Status Switch */}
              <div className="inline-flex rounded-tile border border-border bg-secondary p-1">
                <button
                  type="button"
                  onClick={() => setStatusFilter('ACTIVE')}
                  className={`min-h-[36px] cursor-pointer rounded-tile px-3 py-1 text-xs font-semibold transition-colors ${
                    statusFilter === 'ACTIVE'
                      ? 'bg-card text-foreground shadow-tile'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Hoạt động ({counts.activeTotal})
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('INACTIVE')}
                  className={`min-h-[36px] cursor-pointer rounded-tile px-3 py-1 text-xs font-semibold transition-colors ${
                    statusFilter === 'INACTIVE'
                      ? 'bg-card text-foreground shadow-tile'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Đã ngưng ({counts.inactiveTotal})
                </button>
              </div>
            </div>

            {/* Role Filter Chips */}
            <div className="flex flex-wrap items-center gap-2">
              {(
                [
                  { id: 'ALL', label: `Tất cả (${counts.activeTotal})` },
                  { id: 'HOST', label: `Chủ sân (${counts.hosts})` },
                  { id: 'MEMBER', label: `Cố định (${counts.regulars})` },
                  { id: 'GUEST', label: `Vãng lai (${counts.guests})` },
                ] as const
              ).map((chip) => {
                const active = roleFilter === chip.id;
                return (
                  <button
                    key={chip.id}
                    type="button"
                    onClick={() => setRoleFilter(chip.id)}
                    className={`min-h-[36px] cursor-pointer rounded-pill border px-3.5 py-1 text-xs font-semibold transition-colors [touch-action:manipulation] ${
                      active
                        ? 'border-primary bg-primary text-on-primary shadow-tile'
                        : 'border-border bg-secondary/70 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {chip.label}
                  </button>
                );
              })}
            </div>
          </section>

          {/* Roster List */}
          {filteredMembers.length === 0 ? (
            <section className="rounded-block border border-dashed border-border bg-card p-8 text-center shadow-block">
              <p className="text-sm font-bold text-card-foreground">
                Không tìm thấy thành viên phù hợp
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Thử đổi từ khóa tìm kiếm hoặc chia sẻ mã QR để thành viên tự tham gia.
              </p>
            </section>
          ) : (
            <section
              aria-label="Danh sách thành viên"
              className="divide-y divide-border overflow-hidden rounded-block border border-border bg-card shadow-block"
            >
              {filteredMembers.map((member) => {
                const badge = getRoleBadge(member.role);
                const isLastActiveHost =
                  member.isActive && member.role === 'HOST' && activeHostCount <= 1;
                const isCopied = copiedMemberToken === member.id;
                const isBusy = actionBusyId === member.id;

                return (
                  <div
                    key={member.id}
                    className="flex flex-col justify-between gap-3 p-4 transition-colors hover:bg-secondary/40 sm:flex-row sm:items-center sm:px-5"
                  >
                    <div className="flex items-start gap-3.5">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary-soft font-mono text-sm font-bold text-primary">
                        {member.displayName.trim().charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-card-foreground">
                            {member.displayName}
                          </span>
                          <span
                            className={`rounded-pill border px-2.5 py-0.5 text-[11px] font-semibold ${badge.className}`}
                          >
                            {badge.label}
                          </span>
                          {!member.isActive && (
                            <span className="rounded-pill bg-destructive-soft px-2 py-0.5 text-[11px] font-semibold text-on-destructive-soft">
                              Đã ngưng
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                          <span className="font-mono tabular-nums">
                            {member.phone ? `SĐT: ${member.phone}` : 'Chưa có SĐT'}
                          </span>
                          <span>•</span>
                          <span className="font-mono text-[11px]">
                            Link công nợ: /p/{member.publicToken.slice(0, 8)}…
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleCopyMemberPersonalLink(member)}
                        className="inline-flex min-h-[38px] cursor-pointer items-center rounded-tile border border-border bg-secondary px-3 py-1.5 text-xs font-semibold text-foreground transition-colors hover:bg-primary-soft hover:text-primary [touch-action:manipulation]"
                      >
                        {isCopied ? 'Đã chép link /p/' : 'Chép link /p/'}
                      </button>

                      {canManageClub && (
                        <>
                          <button
                            type="button"
                            onClick={() => openEditSheet(member)}
                            className="inline-flex min-h-[38px] cursor-pointer items-center rounded-tile border border-border bg-card px-3 py-1.5 text-xs font-semibold text-card-foreground transition-colors hover:bg-secondary [touch-action:manipulation]"
                          >
                            Sửa
                          </button>

                          <button
                            type="button"
                            disabled={isBusy || isLastActiveHost}
                            title={
                              isLastActiveHost
                                ? 'Không thể vô hiệu hóa Chủ sân (HOST) cuối cùng của CLB'
                                : undefined
                            }
                            onClick={() => handleToggleActive(member)}
                            className={`inline-flex min-h-[38px] items-center rounded-tile px-3 py-1.5 text-xs font-semibold transition-colors [touch-action:manipulation] ${
                              isLastActiveHost
                                ? 'cursor-not-allowed border border-border bg-secondary/40 text-muted-foreground opacity-60'
                                : member.isActive
                                  ? 'cursor-pointer border border-destructive/30 bg-destructive-soft text-on-destructive-soft hover:opacity-90'
                                  : 'cursor-pointer border border-success/30 bg-success-soft text-on-success-soft hover:opacity-90'
                            }`}
                          >
                            {isBusy
                              ? 'Đang xử lý...'
                              : member.isActive
                                ? 'Ngưng HĐ'
                                : 'Kích hoạt lại'}
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </section>
          )}
        </div>

        {/* Right 4 Columns (Desktop Sticky): Invite QR Card + Quick-Add Member Panel */}
        <aside className="space-y-6 lg:col-span-4">
          <div className="sticky top-6 space-y-6">
            {/* Invite QR Card */}
            <section className="rounded-block border border-border bg-card p-5 shadow-block">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-bold text-card-foreground">Mã QR Tự Tham Gia CLB</h2>
                <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
                  {club.inviteCode}
                </span>
              </div>
              <p className="mt-1 text-xs text-muted-foreground">
                Đưa mã QR này tại sân hoặc gửi vào nhóm Zalo để thành viên tự điền tên trong 5 giây.
              </p>

              <div className="mt-4 flex flex-col items-center rounded-tile bg-secondary/60 p-4">
                <QrCodeSvg value={inviteJoinUrl} size={184} label={`Mã QR tham gia ${club.name}`} />
                <p className="mt-3 break-all text-center font-mono text-[11px] text-muted-foreground">
                  {inviteJoinUrl}
                </p>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={handleCopyInviteLink}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile border border-border-strong bg-secondary px-3 py-2 text-xs font-semibold text-foreground transition-colors hover:bg-primary-soft hover:text-primary [touch-action:manipulation]"
                >
                  {copiedInvite ? 'Đã chép link!' : 'Sao chép link'}
                </button>
                <button
                  type="button"
                  onClick={handleShareInviteLink}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile bg-primary px-3 py-2 text-xs font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover [touch-action:manipulation]"
                >
                  Chia sẻ ngay
                </button>
              </div>

              <div className="mt-3 text-center">
                <Link
                  href={`/join/${club.inviteCode}`}
                  target="_blank"
                  className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                >
                  Xem thử trang tự ghi danh (/join/{club.inviteCode}) ↗
                </Link>
              </div>
            </section>

            {/* Quick-Add Member Panel (Desktop HOST only) */}
            {canManageClub && (
              <section className="hidden rounded-block border border-border bg-card p-5 shadow-block lg:block">
                <h2 className="text-sm font-bold text-card-foreground">
                  Thêm nhanh thành viên tại sân
                </h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Trùng số điện thoại sẽ tự động nhận diện thành viên cũ (không tạo trùng).
                </p>

                <form onSubmit={handleDesktopQuickAdd} className="mt-4 space-y-3">
                  <div>
                    <label
                      htmlFor="quick-member-name"
                      className="block text-xs font-semibold text-card-foreground"
                    >
                      Họ tên / Biệt danh *
                    </label>
                    <input
                      id="quick-member-name"
                      type="text"
                      required
                      value={quickName}
                      onChange={(e) => setQuickName(e.target.value)}
                      placeholder="VD: Hoàng Bảo Long"
                      className="mt-1 min-h-[44px] w-full rounded-tile border border-input bg-background px-3 py-2 text-xs text-foreground"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quick-member-phone"
                      className="block text-xs font-semibold text-card-foreground"
                    >
                      Số điện thoại / Zalo (tuỳ chọn)
                    </label>
                    <input
                      id="quick-member-phone"
                      type="tel"
                      value={quickPhone}
                      onChange={(e) => setQuickPhone(e.target.value)}
                      placeholder="VD: 0912 345 678"
                      className="mt-1 min-h-[44px] w-full rounded-tile border border-input bg-background px-3 py-2 font-mono text-xs text-foreground tabular-nums"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="quick-member-role"
                      className="block text-xs font-semibold text-card-foreground"
                    >
                      Phân loại
                    </label>
                    <select
                      id="quick-member-role"
                      value={quickRole}
                      onChange={(e) => setQuickRole(e.target.value as ClubRole)}
                      className="mt-1 min-h-[44px] w-full rounded-tile border border-input bg-background px-3 py-2 text-xs text-foreground"
                    >
                      <option value="MEMBER">Thành viên cố định (MEMBER)</option>
                      <option value="GUEST">Khách vãng lai (GUEST)</option>
                      <option value="HOST">Đồng chủ sân (HOST)</option>
                    </select>
                  </div>

                  {quickError && (
                    <p className="text-xs font-semibold text-destructive">{quickError}</p>
                  )}
                  {quickSuccess && (
                    <p className="text-xs font-semibold text-success">{quickSuccess}</p>
                  )}

                  <button
                    type="submit"
                    disabled={quickSubmitting}
                    className="inline-flex min-h-[44px] w-full cursor-pointer items-center justify-center rounded-tile bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover disabled:opacity-60"
                  >
                    {quickSubmitting ? 'Đang thêm...' : '+ Thêm vào danh sách CLB'}
                  </button>
                </form>
              </section>
            )}
          </div>
        </aside>
      </div>

      {/* Add / Edit Member Bottom Sheet (Mobile) & Modal (Desktop) */}
      {memberModalOpen && (
        <dialog
          open
          aria-modal="true"
          aria-labelledby="member-sheet-title"
          className="fixed inset-0 z-50 m-0 flex h-full w-full max-w-none items-end justify-center bg-black/50 p-0 sm:items-center sm:p-4"
        >
          <div className="w-full max-w-md rounded-t-block border border-border bg-card p-5 shadow-block sm:rounded-block sm:p-6">
            <div className="flex items-center justify-between">
              <h2 id="member-sheet-title" className="text-base font-bold text-card-foreground">
                {editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
              </h2>
              <button
                type="button"
                onClick={() => setMemberModalOpen(false)}
                className="inline-flex min-h-[36px] cursor-pointer items-center rounded-tile px-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                Đóng ✕
              </button>
            </div>

            <form onSubmit={handleModalSubmit} className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="sheet-member-name"
                  className="block text-xs font-semibold text-card-foreground"
                >
                  Họ tên / Biệt danh trên sân *
                </label>
                <input
                  id="sheet-member-name"
                  type="text"
                  required
                  value={formDisplayName}
                  onChange={(e) => setFormDisplayName(e.target.value)}
                  placeholder="VD: Nguyễn Minh Quân"
                  className="mt-1 min-h-[44px] w-full rounded-tile border border-input bg-background px-3.5 py-2 text-sm text-foreground"
                />
              </div>

              <div>
                <label
                  htmlFor="sheet-member-phone"
                  className="block text-xs font-semibold text-card-foreground"
                >
                  Số điện thoại / Zalo (tuỳ chọn)
                </label>
                <input
                  id="sheet-member-phone"
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="VD: 0912 345 678"
                  className="mt-1 min-h-[44px] w-full rounded-tile border border-input bg-background px-3.5 py-2 font-mono text-sm text-foreground tabular-nums"
                />
              </div>

              <div>
                <label
                  htmlFor="sheet-member-role"
                  className="block text-xs font-semibold text-card-foreground"
                >
                  Vai trò trong CLB
                </label>
                <select
                  id="sheet-member-role"
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as ClubRole)}
                  className="mt-1 min-h-[44px] w-full rounded-tile border border-input bg-background px-3.5 py-2 text-sm text-foreground"
                >
                  <option value="MEMBER">Thành viên cố định (MEMBER)</option>
                  <option value="GUEST">Khách vãng lai (GUEST)</option>
                  <option value="HOST">Chủ sân / Quản trị (HOST)</option>
                </select>
              </div>

              {formError && (
                <p
                  role="alert"
                  className="rounded-tile bg-destructive-soft px-3 py-2 text-xs font-semibold text-on-destructive-soft"
                >
                  {formError}
                </p>
              )}

              <div className="flex items-center justify-end gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setMemberModalOpen(false)}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile border border-border bg-secondary px-4 py-2 text-xs font-semibold text-foreground"
                >
                  Huỷ
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile bg-primary px-5 py-2 text-xs font-semibold text-on-primary shadow-cta disabled:opacity-60"
                >
                  {formSubmitting ? 'Đang lưu...' : editingMember ? 'Lưu thay đổi' : 'Thêm ngay'}
                </button>
              </div>
            </form>
          </div>
        </dialog>
      )}

      {/* Mobile Full-Screen Invite QR Bottom Sheet */}
      {qrSheetOpen && (
        <dialog
          open
          aria-modal="true"
          aria-labelledby="invite-qr-sheet-title"
          className="fixed inset-0 z-50 m-0 flex h-full w-full max-w-none items-end justify-center bg-black/60 p-0 lg:hidden"
        >
          <div className="w-full max-w-lg rounded-t-block border border-border bg-card p-6 shadow-block">
            <div className="flex items-center justify-between">
              <div>
                <h2 id="invite-qr-sheet-title" className="text-base font-bold text-card-foreground">
                  Quét QR Tham Gia {club.name}
                </h2>
                <p className="text-xs text-muted-foreground">
                  Mã mời:{' '}
                  <span className="font-mono font-bold text-primary">{club.inviteCode}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setQrSheetOpen(false)}
                className="inline-flex min-h-[40px] cursor-pointer items-center rounded-tile px-3 text-xs font-semibold text-muted-foreground"
              >
                Đóng ✕
              </button>
            </div>

            <div className="mt-5 flex flex-col items-center rounded-tile bg-secondary/60 p-5">
              <QrCodeSvg value={inviteJoinUrl} size={220} label={`Mã QR tham gia ${club.name}`} />
              <p className="mt-3 break-all text-center font-mono text-xs text-muted-foreground">
                {inviteJoinUrl}
              </p>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={handleCopyInviteLink}
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile border border-border-strong bg-secondary px-4 py-2.5 text-xs font-semibold text-foreground"
              >
                {copiedInvite ? 'Đã chép link!' : 'Sao chép link'}
              </button>
              <button
                type="button"
                onClick={handleShareInviteLink}
                className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile bg-primary px-4 py-2.5 text-xs font-semibold text-on-primary shadow-cta"
              >
                Chia sẻ Zalo
              </button>
            </div>
          </div>
        </dialog>
      )}
    </div>
  );
}
