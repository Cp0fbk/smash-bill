'use client';

import {
  BANKS,
  type ClubDetail,
  findBankByBin,
  formatVnd,
  toTransferSyntax,
} from '@smash-bill/shared';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { ForbiddenState } from '../../../../../components/forbidden-state';
import {
  ApiClientError,
  fetchClubById,
  rotateClubTokens,
  updateClub,
  updateClubBankAccount,
} from '../../../../../lib/api-client';
import { useClubPermissions } from '../../../../../lib/auth-context';

export default function ClubSettingsPage() {
  const params = useParams<{ clubId: string }>();
  const clubId = params?.clubId ?? '';

  const [club, setClub] = useState<ClubDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  // Club info form state
  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [defaultCourtFeeInput, setDefaultCourtFeeInput] = useState('0');
  const [description, setDescription] = useState('');
  const [clubInfoError, setClubInfoError] = useState<string | null>(null);
  const [clubInfoSaved, setClubInfoSaved] = useState(false);
  const [savingClubInfo, setSavingClubInfo] = useState(false);

  // Bank account form state
  const [bankSearch, setBankSearch] = useState('');
  const [bankBin, setBankBin] = useState('970436');
  const [bankAccountNo, setBankAccountNo] = useState('');
  const [bankAccountName, setBankAccountName] = useState('');
  const [bankErrors, setBankErrors] = useState<{
    bankBin?: string;
    bankAccountNo?: string;
    bankAccountName?: string;
    general?: string;
  }>({});
  const [bankSaved, setBankSaved] = useState(false);
  const [savingBank, setSavingBank] = useState(false);

  // Token rotation state
  const [rotatingTokens, setRotatingTokens] = useState(false);
  const [tokenRotatedMsg, setTokenRotatedMsg] = useState<string | null>(null);

  const { canManageClub } = useClubPermissions(club?.myRole);

  useEffect(() => {
    if (!clubId) {
      return;
    }
    let active = true;

    fetchClubById(clubId)
      .then((detail) => {
        if (!active) {
          return;
        }
        setClub(detail);
        setName(detail.name);
        setLocation(detail.location ?? '');
        setDefaultCourtFeeInput(String(detail.defaultCourtFee));
        setDescription(detail.description ?? '');
        setBankBin(detail.bankBin ?? '970436');
        setBankAccountNo(detail.bankAccountNo ?? '');
        setBankAccountName(detail.bankAccountName ?? '');
      })
      .catch((err: unknown) => {
        if (!active) {
          return;
        }
        if (err instanceof ApiClientError && err.status === 404) {
          setNotFound(true);
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [clubId]);

  const filteredBanks = useMemo(() => {
    const q = bankSearch.trim().toLowerCase();
    if (!q) {
      return BANKS;
    }
    return BANKS.filter(
      (b) =>
        b.shortName.toLowerCase().includes(q) ||
        b.code.toLowerCase().includes(q) ||
        b.name.toLowerCase().includes(q) ||
        b.bin.includes(q),
    );
  }, [bankSearch]);

  if (loading) {
    return (
      <div
        aria-label="Đang tải cài đặt CLB"
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
          CLB không tồn tại hoặc bạn không thuộc danh sách thành viên.
        </p>
        <div className="mt-6 flex justify-center">
          <Link
            href="/clubs"
            className="inline-flex min-h-[44px] items-center rounded-tile bg-primary px-5 py-2.5 text-xs font-semibold text-on-primary shadow-cta"
          >
            Quay lại danh sách CLB
          </Link>
        </div>
      </section>
    );
  }

  // UI RBAC Gate: Only ClubRole.HOST can access /clubs/[clubId]/settings
  if (!canManageClub) {
    return (
      <ForbiddenState
        title="403 • Chỉ Chủ CLB mới có quyền cài đặt"
        description={`Bạn đang là ${club.myRole} tại "${club.name}". Chỉ Chủ CLB (HOST) mới có thể chỉnh sửa thông tin sân, tài khoản VietQR và mã mời.`}
        backHref={`/clubs/${club.id}`}
        backLabel="Quay lại trang CLB"
      />
    );
  }

  const parsedFee = Number.parseInt(defaultCourtFeeInput.replace(/[^0-9]/g, '') || '0', 10);
  const safeCourtFee = Number.isNaN(parsedFee) ? 0 : Math.max(0, parsedFee);
  const selectedBank = findBankByBin(bankBin);
  const normalizedHolderName = toTransferSyntax(bankAccountName, 50);
  const previewTransferSyntax = toTransferSyntax(`SB ${club.slug.replace(/-/g, '')} MINH`);
  const validAccountNo = /^[0-9]{6,19}$/.test(bankAccountNo.trim());
  const previewQrUrl =
    selectedBank && validAccountNo
      ? `https://img.vietqr.io/image/${selectedBank.bin}-${bankAccountNo.trim()}-compact2.png?amount=${safeCourtFee || 67000}&addInfo=${encodeURIComponent(previewTransferSyntax)}&accountName=${encodeURIComponent(normalizedHolderName)}`
      : null;

  async function handleSaveClubInfo(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setClubInfoError(null);
    setClubInfoSaved(false);

    if (!name.trim()) {
      setClubInfoError('Tên câu lạc bộ không được để trống.');
      return;
    }

    setSavingClubInfo(true);
    try {
      const updated = await updateClub(clubId, {
        name: name.trim(),
        location: location.trim(),
        description: description.trim(),
        defaultCourtFee: safeCourtFee,
      });
      setClub(updated);
      setClubInfoSaved(true);
    } catch (err: unknown) {
      setClubInfoError(
        err instanceof Error ? err.message : 'Không thể lưu thông tin CLB. Vui lòng thử lại.',
      );
    } finally {
      setSavingClubInfo(false);
    }
  }

  async function handleSaveBankAccount(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setBankSaved(false);

    const nextErrors: typeof bankErrors = {};
    if (!findBankByBin(bankBin)) {
      nextErrors.bankBin = 'Mã ngân hàng (BIN) không hợp lệ. Vui lòng chọn ngân hàng từ danh sách.';
    }
    if (!/^[0-9]{6,19}$/.test(bankAccountNo.trim())) {
      nextErrors.bankAccountNo = 'Số tài khoản ngân hàng phải gồm từ 6 đến 19 chữ số.';
    }
    if (!normalizedHolderName) {
      nextErrors.bankAccountName = 'Tên chủ tài khoản không được để trống.';
    }

    setBankErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    setSavingBank(true);
    try {
      const updated = await updateClubBankAccount(clubId, {
        bankBin,
        bankAccountNo: bankAccountNo.trim(),
        bankAccountName: normalizedHolderName,
      });
      setClub(updated);
      setBankAccountName(updated.bankAccountName ?? normalizedHolderName);
      setBankSaved(true);
    } catch (err: unknown) {
      setBankErrors({
        general:
          err instanceof Error
            ? err.message
            : 'Không thể lưu tài khoản ngân hàng. Vui lòng kiểm tra lại.',
      });
    } finally {
      setSavingBank(false);
    }
  }

  async function handleRotateTokens() {
    if (rotatingTokens) {
      return;
    }
    setRotatingTokens(true);
    setTokenRotatedMsg(null);
    try {
      const updated = await rotateClubTokens(clubId, {
        rotateInviteCode: true,
        rotatePublicToken: true,
      });
      setClub(updated);
      setTokenRotatedMsg('Đã cấp mới mã mời và public token thành công.');
    } catch (err: unknown) {
      setTokenRotatedMsg(err instanceof Error ? err.message : 'Không thể đổi mã mời.');
    } finally {
      setRotatingTokens(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <div>
          <Link
            href={`/clubs/${club.id}`}
            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground"
          >
            <svg
              aria-hidden="true"
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
            <span>Quay lại {club.name}</span>
          </Link>
          <h1 className="text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
            Cài đặt CLB &amp; Tài khoản VietQR
          </h1>
        </div>
        <span className="self-start rounded-pill bg-primary-soft px-3 py-1 text-xs font-semibold text-primary sm:self-auto">
          Chủ CLB • HOST
        </span>
      </div>

      {/* Desktop 12-Col Split: Left Forms (7 cols) + Right Sticky Live VietQR Preview (5 cols) */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="space-y-6 lg:col-span-7">
          {/* 1. Club Info Form */}
          <section
            aria-labelledby="settings-club-info-heading"
            className="rounded-block border border-border bg-card p-5 shadow-block sm:p-6"
          >
            <h2
              id="settings-club-info-heading"
              className="text-base font-bold text-card-foreground"
            >
              1. Thông tin chung
            </h2>

            {clubInfoError && (
              <p
                role="alert"
                className="mt-3 rounded-tile border border-destructive/30 bg-destructive-soft px-3.5 py-2.5 text-xs font-medium text-destructive"
              >
                {clubInfoError}
              </p>
            )}
            {clubInfoSaved && (
              <output className="mt-3 block rounded-tile border border-success/30 bg-success-soft px-3.5 py-2.5 text-xs font-semibold text-on-success-soft">
                Đã cập nhật thông tin CLB thành công.
              </output>
            )}

            <form onSubmit={handleSaveClubInfo} noValidate className="mt-4 space-y-4">
              <div>
                <label
                  htmlFor="settings-name"
                  className="block text-xs font-semibold text-card-foreground"
                >
                  Tên CLB <span className="text-destructive">*</span>
                </label>
                <input
                  id="settings-name"
                  type="text"
                  required
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="mt-1.5 block min-h-[46px] w-full rounded-tile border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label
                    htmlFor="settings-location"
                    className="block text-xs font-semibold text-card-foreground"
                  >
                    Địa điểm sân
                  </label>
                  <input
                    id="settings-location"
                    type="text"
                    maxLength={200}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    className="mt-1.5 block min-h-[46px] w-full rounded-tile border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>

                <div>
                  <label
                    htmlFor="settings-fee"
                    className="block text-xs font-semibold text-card-foreground"
                  >
                    Tiền sân mặc định (VND)
                  </label>
                  <input
                    id="settings-fee"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={100000000}
                    step={1000}
                    value={defaultCourtFeeInput}
                    onChange={(e) => setDefaultCourtFeeInput(e.target.value)}
                    className="mt-1.5 block min-h-[46px] w-full rounded-tile border border-border bg-background px-3.5 py-2.5 font-mono text-sm font-semibold text-foreground tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="settings-description"
                  className="block text-xs font-semibold text-card-foreground"
                >
                  Mô tả / Lịch sinh hoạt
                </label>
                <textarea
                  id="settings-description"
                  rows={2}
                  maxLength={500}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="mt-1.5 block w-full rounded-tile border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingClubInfo}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile bg-primary px-5 py-2.5 text-xs font-semibold text-on-primary shadow-tile transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 [touch-action:manipulation]"
                >
                  {savingClubInfo ? 'Đang lưu...' : 'Lưu thông tin CLB'}
                </button>
              </div>
            </form>
          </section>

          {/* 2. VietQR Bank Account Configuration */}
          <section
            aria-labelledby="settings-bank-heading"
            className="rounded-block border border-border bg-card p-5 shadow-block sm:p-6"
          >
            <div className="flex items-center justify-between">
              <div>
                <h2 id="settings-bank-heading" className="text-base font-bold text-card-foreground">
                  2. Tài khoản nhận tiền VietQR
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Hỗ trợ danh sách ngân hàng NAPAS chính thức để tạo mã QR thanh toán tự động.
                </p>
              </div>
              <span className="rounded-pill bg-accent-qr-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-on-accent-qr">
                VietQR
              </span>
            </div>

            {bankErrors.general && (
              <p
                role="alert"
                className="mt-3 rounded-tile border border-destructive/30 bg-destructive-soft px-3.5 py-2.5 text-xs font-medium text-destructive"
              >
                {bankErrors.general}
              </p>
            )}
            {bankSaved && (
              <output className="mt-3 block rounded-tile border border-success/30 bg-success-soft px-3.5 py-2.5 text-xs font-semibold text-on-success-soft">
                Đã lưu cấu hình ngân hàng VietQR thành công.
              </output>
            )}

            <form onSubmit={handleSaveBankAccount} noValidate className="mt-4 space-y-4">
              {/* Searchable Bank Select */}
              <div>
                <label
                  htmlFor="bank-search"
                  className="block text-xs font-semibold text-card-foreground"
                >
                  Tìm &amp; chọn ngân hàng thụ hưởng <span className="text-destructive">*</span>
                </label>
                <input
                  id="bank-search"
                  type="search"
                  value={bankSearch}
                  onChange={(e) => setBankSearch(e.target.value)}
                  placeholder="Tìm nhanh: Vietcombank, TCB, MB, ACB, 970436..."
                  className="mt-1.5 block min-h-[44px] w-full rounded-tile border border-border bg-background px-3.5 py-2 text-xs text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />

                <div
                  aria-label="Danh sách ngân hàng NAPAS"
                  className="mt-2 grid max-h-48 grid-cols-2 gap-2 overflow-y-auto rounded-tile border border-border bg-secondary/40 p-2 sm:grid-cols-3"
                >
                  {filteredBanks.map((bank) => {
                    const selected = bank.bin === bankBin;
                    return (
                      <button
                        key={bank.bin}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => {
                          setBankBin(bank.bin);
                          setBankErrors((prev) => ({ ...prev, bankBin: undefined }));
                        }}
                        className={`flex min-h-[48px] cursor-pointer items-center gap-2 rounded-tile border px-2.5 py-2 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation] ${
                          selected
                            ? 'border-border-strong bg-primary-soft text-primary'
                            : 'border-border bg-card text-card-foreground hover:bg-secondary/70'
                        }`}
                      >
                        <span
                          aria-hidden="true"
                          className={`flex h-7 w-9 shrink-0 items-center justify-center rounded-md font-mono text-[10px] font-extrabold ${
                            selected
                              ? 'bg-primary text-on-primary'
                              : 'bg-secondary text-secondary-foreground'
                          }`}
                        >
                          {bank.code}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-xs font-bold">{bank.shortName}</span>
                          <span className="block font-mono text-[10px] text-muted-foreground">
                            BIN {bank.bin}
                          </span>
                        </span>
                      </button>
                    );
                  })}
                </div>
                {bankErrors.bankBin && (
                  <p className="mt-1 text-xs font-medium text-destructive">{bankErrors.bankBin}</p>
                )}
              </div>

              {/* Bank Account Number */}
              <div>
                <label
                  htmlFor="bank-account-no"
                  className="block text-xs font-semibold text-card-foreground"
                >
                  Số tài khoản ngân hàng (6–19 chữ số) <span className="text-destructive">*</span>
                </label>
                <input
                  id="bank-account-no"
                  type="text"
                  inputMode="numeric"
                  required
                  value={bankAccountNo}
                  onChange={(e) => {
                    setBankAccountNo(e.target.value);
                    setBankErrors((prev) => ({ ...prev, bankAccountNo: undefined }));
                  }}
                  placeholder="Ví dụ: 0071001234567"
                  aria-invalid={Boolean(bankErrors.bankAccountNo)}
                  aria-describedby={bankErrors.bankAccountNo ? 'bank-account-no-error' : undefined}
                  className={`mt-1.5 block min-h-[46px] w-full rounded-tile border bg-background px-3.5 py-2.5 font-mono text-sm font-semibold text-foreground tabular-nums focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    bankErrors.bankAccountNo ? 'border-destructive' : 'border-border'
                  }`}
                />
                {bankErrors.bankAccountNo && (
                  <p
                    id="bank-account-no-error"
                    className="mt-1 text-xs font-medium text-destructive"
                  >
                    {bankErrors.bankAccountNo}
                  </p>
                )}
              </div>

              {/* Bank Account Holder Name */}
              <div>
                <label
                  htmlFor="bank-account-name"
                  className="block text-xs font-semibold text-card-foreground"
                >
                  Tên chủ tài khoản (tự động chuẩn hoá không dấu){' '}
                  <span className="text-destructive">*</span>
                </label>
                <input
                  id="bank-account-name"
                  type="text"
                  required
                  maxLength={50}
                  value={bankAccountName}
                  onChange={(e) => {
                    setBankAccountName(e.target.value);
                    setBankErrors((prev) => ({ ...prev, bankAccountName: undefined }));
                  }}
                  placeholder="Ví dụ: NGUYEN MINH QUAN"
                  aria-invalid={Boolean(bankErrors.bankAccountName)}
                  aria-describedby={
                    bankErrors.bankAccountName
                      ? 'bank-account-name-error'
                      : 'bank-account-name-hint'
                  }
                  className={`mt-1.5 block min-h-[46px] w-full rounded-tile border bg-background px-3.5 py-2.5 font-mono text-sm uppercase text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    bankErrors.bankAccountName ? 'border-destructive' : 'border-border'
                  }`}
                />
                <p
                  id="bank-account-name-hint"
                  className="mt-1 font-mono text-[11px] text-muted-foreground"
                >
                  Chuẩn NAPAS: {normalizedHolderName || 'CHUA NHAP'}
                </p>
                {bankErrors.bankAccountName && (
                  <p
                    id="bank-account-name-error"
                    className="mt-1 text-xs font-medium text-destructive"
                  >
                    {bankErrors.bankAccountName}
                  </p>
                )}
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={savingBank}
                  className="inline-flex min-h-[44px] cursor-pointer items-center justify-center rounded-tile bg-primary px-5 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 [touch-action:manipulation]"
                >
                  {savingBank ? 'Đang lưu VietQR...' : 'Lưu tài khoản VietQR'}
                </button>
              </div>
            </form>
          </section>

          {/* 3. Invite Code & Public Token Rotation */}
          <section
            aria-labelledby="settings-tokens-heading"
            className="rounded-block border border-border bg-card p-5 shadow-block sm:p-6"
          >
            <h2 id="settings-tokens-heading" className="text-base font-bold text-card-foreground">
              3. Mã mời tham gia &amp; Bảo mật đường dẫn
            </h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Nếu mã mời bị lộ hoặc có người lạ spam, bạn có thể cấp lại mã mới bất cứ lúc nào.
            </p>

            {tokenRotatedMsg && (
              <output className="mt-3 block rounded-tile border border-primary/30 bg-primary-soft px-3.5 py-2.5 text-xs font-semibold text-primary">
                {tokenRotatedMsg}
              </output>
            )}

            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="rounded-tile bg-secondary/70 p-3.5">
                <p className="text-[11px] font-medium text-muted-foreground">
                  Mã mời (Invite Code)
                </p>
                <p className="mt-1 font-mono text-base font-bold text-card-foreground">
                  {club.inviteCode}
                </p>
              </div>
              <div className="rounded-tile bg-secondary/70 p-3.5">
                <p className="text-[11px] font-medium text-muted-foreground">Public Token</p>
                <p className="mt-1 truncate font-mono text-xs font-bold text-card-foreground">
                  {club.publicToken}
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                type="button"
                onClick={handleRotateTokens}
                disabled={rotatingTokens}
                className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-tile border border-border bg-secondary/80 px-4 py-2 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 [touch-action:manipulation]"
              >
                <span>{rotatingTokens ? 'Đang tạo mã mới...' : 'Đổi mã mời & Public Token'}</span>
              </button>
            </div>
          </section>
        </div>

        {/* Right Sticky Live VietQR Preview Card (5 cols) */}
        <aside className="lg:col-span-5">
          <section
            aria-labelledby="live-vietqr-preview-heading"
            className="rounded-block border border-border bg-card p-5 shadow-block lg:sticky lg:top-6"
          >
            <div className="flex items-center justify-between">
              <h2
                id="live-vietqr-preview-heading"
                className="text-base font-bold text-card-foreground"
              >
                Xem trước VietQR trực tiếp
              </h2>
              <span className="rounded-pill bg-accent-qr-soft px-2.5 py-0.5 font-mono text-xs font-semibold text-on-accent-qr">
                {selectedBank?.shortName ?? 'VietQR'}
              </span>
            </div>

            <div className="mt-4 flex flex-col items-center rounded-tile bg-secondary/60 p-5">
              {previewQrUrl ? (
                <div className="flex h-52 w-52 items-center justify-center rounded-tile border border-border bg-white p-3 shadow-tile">
                  <img
                    src={previewQrUrl}
                    alt={`VietQR ${selectedBank?.shortName ?? ''}`}
                    width={192}
                    height={192}
                    className="h-full w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-52 w-52 flex-col items-center justify-center rounded-tile border border-dashed border-border bg-card p-4 text-center">
                  <p className="text-xs font-semibold text-card-foreground">
                    Nhập số tài khoản (6–19 số)
                  </p>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Mã VietQR sẽ hiển thị tự động ngay khi thông tin hợp lệ.
                  </p>
                </div>
              )}

              <p className="mt-4 font-mono text-2xl font-bold text-primary tabular-nums">
                {formatVnd(safeCourtFee || 67_000)}
              </p>
              <p className="mt-1 font-mono text-xs font-bold text-card-foreground">
                {selectedBank ? `${selectedBank.shortName} (${selectedBank.bin})` : bankBin} •{' '}
                {bankAccountNo.trim() || 'Chưa có STK'}
              </p>
              <p className="mt-0.5 font-mono text-xs text-muted-foreground">
                {normalizedHolderName || 'TEN CHU TAI KHOAN'}
              </p>
            </div>

            <div className="mt-4 rounded-tile border border-border bg-secondary/40 px-3.5 py-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Nội dung CK mẫu:</span>
                <span className="font-mono font-bold text-card-foreground">
                  {previewTransferSyntax}
                </span>
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
