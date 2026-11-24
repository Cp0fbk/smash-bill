'use client';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge, type BadgeProps } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  type ClubDetail,
  type ClubMemberDto,
  type ClubRole,
  matchesVietnameseSearch,
  normalizePhone,
} from '@smash-bill/shared';
import { Plus, QrCode } from 'lucide-react';
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

function getRoleBadge(role: ClubRole): {
  label: string;
  variant: NonNullable<BadgeProps['variant']>;
} {
  switch (role) {
    case 'HOST':
      return { label: 'Chủ sân (HOST)', variant: 'soft' };
    case 'MEMBER':
      return { label: 'Cố định (MEMBER)', variant: 'secondary' };
    case 'GUEST':
      return { label: 'Vãng lai (GUEST)', variant: 'warning' };
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

  // Add / Edit Member Dialog state
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

  // Mobile Invite QR sheet
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
      <Skeleton
        aria-label="Đang tải danh sách thành viên"
        className="h-72 w-full rounded-block border border-border"
      />
    );
  }

  if (notFound || !club) {
    return (
      <Card role="alert" className="mx-auto my-8 max-w-lg text-center">
        <CardContent className="p-6 sm:p-8">
          <h1 className="text-lg font-bold text-card-foreground">
            404 • Không tìm thấy câu lạc bộ
          </h1>
          <p className="mt-2 text-xs text-muted-foreground sm:text-sm">
            CLB không tồn tại hoặc bạn không có quyền xem danh sách thành viên.
          </p>
          <div className="mt-6 flex justify-center">
            <Button asChild>
              <Link href="/clubs">Quay lại danh sách CLB</Link>
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <Card>
        <CardContent className="flex flex-col justify-between gap-4 p-5 sm:flex-row sm:items-center sm:p-6">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Link
                href={`/clubs/${club.id}`}
                className="text-xs font-semibold text-muted-foreground hover:text-foreground"
              >
                ← {club.name}
              </Link>
              <Badge variant="soft" className="font-mono tabular-nums">
                {counts.activeTotal} thành viên hoạt động
              </Badge>
            </div>
            <h1 className="mt-2 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
              Danh sách thành viên &amp; Mã mời QR
            </h1>
            <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
              Người chơi quét QR tự ghi danh không cần tạo tài khoản (Single-Player First).
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="outline"
              onClick={() => setQrSheetOpen(true)}
              className="border-border-strong bg-secondary lg:hidden"
            >
              <QrCode className="text-primary" aria-hidden="true" />
              <span>Mã mời QR</span>
            </Button>

            {canManageClub && (
              <Button onClick={openAddSheet}>
                <Plus aria-hidden="true" />
                <span>Thêm thành viên</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {error && (
        <Alert variant="destructive">
          <AlertDescription className="font-semibold">{error}</AlertDescription>
        </Alert>
      )}

      {/* Desktop 12-Col Master-Detail Workspace (8-col Roster + 4-col Sticky QR & Quick-Add) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left 8 Columns: Search, Filters & Roster List */}
        <div className="space-y-4 lg:col-span-8">
          {/* Search & Filter Toolbar */}
          <Card aria-label="Bộ lọc thành viên">
            <CardContent className="space-y-3 p-4 sm:p-5">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <div className="relative flex-1">
                  <Input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Tìm theo tên có dấu / không dấu (vd: minh → Minh, Mình) hoặc SĐT..."
                    aria-label="Tìm kiếm thành viên"
                    className="text-xs sm:text-sm"
                  />
                </div>

                {/* Active / Deactivated Status Tabs */}
                <Tabs
                  value={statusFilter}
                  onValueChange={(v) => setStatusFilter(v as StatusFilter)}
                >
                  <TabsList>
                    <TabsTrigger value="ACTIVE">Hoạt động ({counts.activeTotal})</TabsTrigger>
                    <TabsTrigger value="INACTIVE">Đã ngưng ({counts.inactiveTotal})</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* Role Filter Pills */}
              <div className="flex flex-wrap items-center gap-2">
                {(
                  [
                    { id: 'ALL', label: `Tất cả (${counts.activeTotal})` },
                    { id: 'HOST', label: `Chủ sân (${counts.hosts})` },
                    { id: 'MEMBER', label: `Cố định (${counts.regulars})` },
                    { id: 'GUEST', label: `Vãng lai (${counts.guests})` },
                  ] as const
                ).map((chip) => (
                  <Button
                    key={chip.id}
                    variant={roleFilter === chip.id ? 'default' : 'secondary'}
                    size="pill"
                    aria-pressed={roleFilter === chip.id}
                    onClick={() => setRoleFilter(chip.id)}
                  >
                    {chip.label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Roster List */}
          {filteredMembers.length === 0 ? (
            <Card className="border-dashed text-center">
              <CardContent className="p-8">
                <p className="text-sm font-bold text-card-foreground">
                  Không tìm thấy thành viên phù hợp
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Thử đổi từ khóa tìm kiếm hoặc chia sẻ mã QR để thành viên tự tham gia.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card
              aria-label="Danh sách thành viên"
              className="divide-y divide-border overflow-hidden"
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
                      <Avatar>
                        <AvatarFallback className="text-sm">
                          {member.displayName.trim().charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-card-foreground">
                            {member.displayName}
                          </span>
                          <Badge variant={badge.variant} className="text-[11px]">
                            {badge.label}
                          </Badge>
                          {!member.isActive && (
                            <Badge variant="destructive" className="px-2 text-[11px]">
                              Đã ngưng
                            </Badge>
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
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => handleCopyMemberPersonalLink(member)}
                      >
                        {isCopied ? 'Đã chép link /p/' : 'Chép link /p/'}
                      </Button>

                      {canManageClub && (
                        <>
                          <Button variant="outline" size="sm" onClick={() => openEditSheet(member)}>
                            Sửa
                          </Button>

                          <Button
                            variant={
                              isLastActiveHost
                                ? 'secondary'
                                : member.isActive
                                  ? 'destructive'
                                  : 'soft'
                            }
                            size="sm"
                            disabled={isBusy || isLastActiveHost}
                            title={
                              isLastActiveHost
                                ? 'Không thể vô hiệu hóa Chủ sân (HOST) cuối cùng của CLB'
                                : undefined
                            }
                            onClick={() => handleToggleActive(member)}
                          >
                            {isBusy
                              ? 'Đang xử lý...'
                              : member.isActive
                                ? 'Ngưng HĐ'
                                : 'Kích hoạt lại'}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </Card>
          )}
        </div>

        {/* Right 4 Columns (Desktop Sticky): Invite QR Card + Quick-Add Member Panel */}
        <aside className="space-y-6 lg:col-span-4">
          <div className="sticky top-6 space-y-6">
            {/* Invite QR Card */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm">Mã QR Tự Tham Gia CLB</CardTitle>
                  <Badge variant="soft" className="font-mono font-bold">
                    {club.inviteCode}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Đưa mã QR này tại sân hoặc gửi vào nhóm Zalo để thành viên tự điền tên trong 5
                  giây.
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex flex-col items-center rounded-tile bg-secondary/60 p-4">
                  <QrCodeSvg
                    value={inviteJoinUrl}
                    size={184}
                    label={`Mã QR tham gia ${club.name}`}
                  />
                  <p className="mt-3 break-all text-center font-mono text-[11px] text-muted-foreground">
                    {inviteJoinUrl}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <Button
                    variant="outline"
                    onClick={handleCopyInviteLink}
                    className="border-border-strong bg-secondary"
                  >
                    {copiedInvite ? 'Đã chép link!' : 'Sao chép link'}
                  </Button>
                  <Button onClick={handleShareInviteLink}>Chia sẻ ngay</Button>
                </div>

                <div className="text-center">
                  <Button asChild variant="link" size="sm">
                    <Link href={`/join/${club.inviteCode}`} target="_blank">
                      Xem thử trang tự ghi danh (/join/{club.inviteCode}) ↗
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Quick-Add Member Panel (Desktop HOST only) */}
            {canManageClub && (
              <Card className="hidden lg:block">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Thêm nhanh thành viên tại sân</CardTitle>
                  <CardDescription className="text-xs">
                    Trùng số điện thoại sẽ tự động nhận diện thành viên cũ (không tạo trùng).
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <form onSubmit={handleDesktopQuickAdd} className="space-y-3">
                    <div className="space-y-1">
                      <Label htmlFor="quick-member-name">Họ tên / Biệt danh *</Label>
                      <Input
                        id="quick-member-name"
                        type="text"
                        required
                        value={quickName}
                        onChange={(e) => setQuickName(e.target.value)}
                        placeholder="VD: Hoàng Bảo Long"
                        className="text-xs"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="quick-member-phone">Số điện thoại / Zalo (tuỳ chọn)</Label>
                      <Input
                        id="quick-member-phone"
                        type="tel"
                        value={quickPhone}
                        onChange={(e) => setQuickPhone(e.target.value)}
                        placeholder="VD: 0912 345 678"
                        className="font-mono text-xs tabular-nums"
                      />
                    </div>

                    <div className="space-y-1">
                      <Label htmlFor="quick-member-role">Phân loại</Label>
                      <Select value={quickRole} onValueChange={(v) => setQuickRole(v as ClubRole)}>
                        <SelectTrigger id="quick-member-role" className="text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="MEMBER">Thành viên cố định (MEMBER)</SelectItem>
                          <SelectItem value="GUEST">Khách vãng lai (GUEST)</SelectItem>
                          <SelectItem value="HOST">Đồng chủ sân (HOST)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {quickError && (
                      <Alert variant="destructive">
                        <AlertDescription className="font-semibold">{quickError}</AlertDescription>
                      </Alert>
                    )}
                    {quickSuccess && (
                      <Alert variant="success">
                        <AlertDescription className="font-semibold">
                          {quickSuccess}
                        </AlertDescription>
                      </Alert>
                    )}

                    <Button type="submit" disabled={quickSubmitting} className="w-full">
                      {quickSubmitting ? 'Đang thêm...' : '+ Thêm vào danh sách CLB'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            )}
          </div>
        </aside>
      </div>

      {/* Add / Edit Member Dialog */}
      <Dialog open={memberModalOpen} onOpenChange={setMemberModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingMember ? 'Chỉnh sửa thành viên' : 'Thêm thành viên mới'}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleModalSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="sheet-member-name">Họ tên / Biệt danh trên sân *</Label>
              <Input
                id="sheet-member-name"
                type="text"
                required
                value={formDisplayName}
                onChange={(e) => setFormDisplayName(e.target.value)}
                placeholder="VD: Nguyễn Minh Quân"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sheet-member-phone">Số điện thoại / Zalo (tuỳ chọn)</Label>
              <Input
                id="sheet-member-phone"
                type="tel"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
                placeholder="VD: 0912 345 678"
                className="font-mono tabular-nums"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="sheet-member-role">Vai trò trong CLB</Label>
              <Select value={formRole} onValueChange={(v) => setFormRole(v as ClubRole)}>
                <SelectTrigger id="sheet-member-role">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MEMBER">Thành viên cố định (MEMBER)</SelectItem>
                  <SelectItem value="GUEST">Khách vãng lai (GUEST)</SelectItem>
                  <SelectItem value="HOST">Chủ sân / Quản trị (HOST)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formError && (
              <Alert variant="destructive">
                <AlertDescription className="font-semibold">{formError}</AlertDescription>
              </Alert>
            )}

            <DialogFooter>
              <Button variant="secondary" onClick={() => setMemberModalOpen(false)}>
                Huỷ
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting ? 'Đang lưu...' : editingMember ? 'Lưu thay đổi' : 'Thêm ngay'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Mobile Full-Screen Invite QR Bottom Sheet */}
      <Sheet open={qrSheetOpen} onOpenChange={setQrSheetOpen}>
        <SheetContent side="bottom" className="lg:hidden">
          <SheetHeader>
            <SheetTitle>Quét QR Tham Gia {club.name}</SheetTitle>
            <SheetDescription>
              Mã mời: <span className="font-mono font-bold text-primary">{club.inviteCode}</span>
            </SheetDescription>
          </SheetHeader>

          <div className="mt-5 flex flex-col items-center rounded-tile bg-secondary/60 p-5">
            <QrCodeSvg value={inviteJoinUrl} size={220} label={`Mã QR tham gia ${club.name}`} />
            <p className="mt-3 break-all text-center font-mono text-xs text-muted-foreground">
              {inviteJoinUrl}
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={handleCopyInviteLink}
              className="border-border-strong bg-secondary"
            >
              {copiedInvite ? 'Đã chép link!' : 'Sao chép link'}
            </Button>
            <Button onClick={handleShareInviteLink}>Chia sẻ Zalo</Button>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
