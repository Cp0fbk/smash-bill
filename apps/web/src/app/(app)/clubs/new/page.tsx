'use client';

import { formatVnd, slugify, toTransferSyntax } from '@smash-bill/shared';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { type FormEvent, useRef, useState } from 'react';
import { ApiClientError, createClub } from '../../../../lib/api-client';

interface FormErrors {
  name?: string;
  location?: string;
  defaultCourtFee?: string;
  description?: string;
  general?: string;
}

const COURT_FEE_PRESETS = [120_000, 240_000, 360_000, 480_000];

export default function CreateClubPage() {
  const router = useRouter();
  const errorSummaryRef = useRef<HTMLDivElement | null>(null);

  const [name, setName] = useState('');
  const [location, setLocation] = useState('');
  const [defaultCourtFeeInput, setDefaultCourtFeeInput] = useState('240000');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);

  const parsedFee = Number.parseInt(defaultCourtFeeInput.replace(/[^0-9]/g, '') || '0', 10);
  const safeCourtFee = Number.isNaN(parsedFee) ? 0 : Math.max(0, parsedFee);
  const previewSlug = slugify(name.trim()) || 'clb-sao-mai';
  const previewSyntax = toTransferSyntax(`SB ${previewSlug.replace(/-/g, '')} MINH`);

  function validateFields(): FormErrors {
    const next: FormErrors = {};
    const trimmedName = name.trim();

    if (!trimmedName) {
      next.name = 'Vui lòng nhập tên câu lạc bộ (ví dụ: CLB Sao Mai).';
    } else if (trimmedName.length > 100) {
      next.name = 'Tên câu lạc bộ không được vượt quá 100 ký tự.';
    }

    if (location.trim().length > 200) {
      next.location = 'Địa điểm không được vượt quá 200 ký tự.';
    }

    if (description.trim().length > 500) {
      next.description = 'Mô tả không được vượt quá 500 ký tự.';
    }

    if (defaultCourtFeeInput.trim() !== '') {
      const feeNum = Number(defaultCourtFeeInput);
      if (!Number.isInteger(feeNum) || feeNum < 0 || feeNum > 100_000_000) {
        next.defaultCourtFee = 'Tiền sân mặc định phải là số nguyên VND từ 0 đến 100.000.000 ₫.';
      }
    }

    return next;
  }

  function handleBlurField(field: keyof FormErrors) {
    const validated = validateFields();
    setErrors((prev) => ({
      ...prev,
      [field]: validated[field],
    }));
  }

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const validationErrors = validateFields();
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length > 0) {
      requestAnimationFrame(() => {
        errorSummaryRef.current?.focus();
      });
      return;
    }

    setSubmitting(true);
    try {
      await createClub({
        name: name.trim(),
        ...(location.trim() ? { location: location.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        defaultCourtFee: safeCourtFee,
      });

      router.push('/clubs');
      router.refresh();
    } catch (err: unknown) {
      if (err instanceof ApiClientError) {
        setErrors({
          general: err.message || 'Không thể tạo CLB. Vui lòng kiểm tra lại thông tin.',
        });
      } else {
        setErrors({
          general: 'Đã xảy ra lỗi kết nối máy chủ. Vui lòng thử lại.',
        });
      }
      requestAnimationFrame(() => {
        errorSummaryRef.current?.focus();
      });
    } finally {
      setSubmitting(false);
    }
  }

  const hasValidationErrors = Boolean(
    errors.name ||
      errors.location ||
      errors.defaultCourtFee ||
      errors.description ||
      errors.general,
  );

  return (
    <div className="space-y-6">
      {/* Breadcrumb & Header */}
      <div className="flex items-center justify-between">
        <div>
          <Link
            href="/clubs"
            className="inline-flex min-h-[44px] items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
            <span>Quay lại danh sách CLB</span>
          </Link>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
            Tạo CLB cố định mới (Sinh hoạt hàng tuần)
          </h1>
        </div>
      </div>

      {/* Desktop 12-Col Split Form + Live Preview Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Card (7 cols) */}
        <section
          aria-labelledby="create-club-form-heading"
          className="rounded-block border border-border bg-card p-5 shadow-block sm:p-6 lg:col-span-7"
        >
          <h2 id="create-club-form-heading" className="text-base font-bold text-card-foreground">
            Thông tin CLB cầu lông cố định
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            Dành cho hội sinh hoạt định kỳ hàng tuần (từ CLB bạn có thể mở từng buổi đánh hoặc tuyển
            thêm khách giao lưu vãng lai).
          </p>

          {hasValidationErrors && (
            <div
              ref={errorSummaryRef}
              role="alert"
              tabIndex={-1}
              aria-labelledby="form-error-summary-title"
              className="mt-4 rounded-tile border border-destructive/40 bg-destructive-soft p-3.5 text-xs text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p id="form-error-summary-title" className="font-bold">
                Vui lòng kiểm tra lại thông tin:
              </p>
              <ul className="mt-1.5 list-inside list-disc space-y-1">
                {errors.general && <li>{errors.general}</li>}
                {errors.name && (
                  <li>
                    <a href="#club-name" className="underline">
                      {errors.name}
                    </a>
                  </li>
                )}
                {errors.location && (
                  <li>
                    <a href="#club-location" className="underline">
                      {errors.location}
                    </a>
                  </li>
                )}
                {errors.defaultCourtFee && (
                  <li>
                    <a href="#club-court-fee" className="underline">
                      {errors.defaultCourtFee}
                    </a>
                  </li>
                )}
                {errors.description && (
                  <li>
                    <a href="#club-description" className="underline">
                      {errors.description}
                    </a>
                  </li>
                )}
              </ul>
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
            {/* Club Name */}
            <div>
              <label
                htmlFor="club-name"
                className="block text-xs font-semibold text-card-foreground"
              >
                Tên câu lạc bộ <span className="text-destructive">*</span>
              </label>
              <input
                id="club-name"
                name="name"
                type="text"
                required
                maxLength={100}
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={() => handleBlurField('name')}
                placeholder="Ví dụ: CLB Sao Mai"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? 'club-name-error' : 'club-name-hint'}
                className={`mt-1.5 block min-h-[46px] w-full rounded-tile border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  errors.name ? 'border-destructive' : 'border-border'
                }`}
              />
              <p id="club-name-hint" className="mt-1 font-mono text-[11px] text-muted-foreground">
                Slug đường dẫn: /{previewSlug}
              </p>
              {errors.name && (
                <p id="club-name-error" className="mt-1 text-xs font-medium text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            {/* Location */}
            <div>
              <label
                htmlFor="club-location"
                className="block text-xs font-semibold text-card-foreground"
              >
                Sân cầu lông / Địa điểm
              </label>
              <input
                id="club-location"
                name="location"
                type="text"
                maxLength={200}
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                onBlur={() => handleBlurField('location')}
                placeholder="Ví dụ: Sân Cầu Lông Sao Mai, Phú Nhuận, TP.HCM"
                aria-invalid={Boolean(errors.location)}
                aria-describedby={errors.location ? 'club-location-error' : undefined}
                className={`mt-1.5 block min-h-[46px] w-full rounded-tile border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  errors.location ? 'border-destructive' : 'border-border'
                }`}
              />
              {errors.location && (
                <p id="club-location-error" className="mt-1 text-xs font-medium text-destructive">
                  {errors.location}
                </p>
              )}
            </div>

            {/* Default Court Fee (VND with tabular-nums) */}
            <div>
              <label
                htmlFor="club-court-fee"
                className="block text-xs font-semibold text-card-foreground"
              >
                Tiền sân mặc định mỗi buổi (VND)
              </label>
              <div className="relative mt-1.5">
                <input
                  id="club-court-fee"
                  name="defaultCourtFee"
                  type="number"
                  inputMode="numeric"
                  min={0}
                  max={100000000}
                  step={1000}
                  value={defaultCourtFeeInput}
                  onChange={(e) => setDefaultCourtFeeInput(e.target.value)}
                  onBlur={() => handleBlurField('defaultCourtFee')}
                  aria-invalid={Boolean(errors.defaultCourtFee)}
                  aria-describedby={
                    errors.defaultCourtFee ? 'club-court-fee-error' : 'club-court-fee-hint'
                  }
                  className={`block min-h-[46px] w-full rounded-tile border bg-background px-3.5 py-2.5 font-mono text-sm font-semibold text-foreground tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                    errors.defaultCourtFee ? 'border-destructive' : 'border-border'
                  }`}
                />
              </div>

              {/* Quick VND Presets */}
              <div className="mt-2 flex flex-wrap gap-1.5">
                {COURT_FEE_PRESETS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => {
                      setDefaultCourtFeeInput(String(preset));
                      setErrors((prev) => ({ ...prev, defaultCourtFee: undefined }));
                    }}
                    className={`min-h-[36px] cursor-pointer rounded-pill border px-3 py-1 font-mono text-xs font-semibold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation] ${
                      safeCourtFee === preset
                        ? 'border-border-strong bg-primary-soft text-primary'
                        : 'border-border bg-secondary/70 text-secondary-foreground hover:bg-secondary'
                    }`}
                  >
                    {formatVnd(preset)}
                  </button>
                ))}
              </div>
              <p id="club-court-fee-hint" className="mt-1 text-[11px] text-muted-foreground">
                Hiển thị:{' '}
                <span className="font-mono font-semibold tabular-nums">
                  {formatVnd(safeCourtFee)}
                </span>
              </p>
              {errors.defaultCourtFee && (
                <p id="club-court-fee-error" className="mt-1 text-xs font-medium text-destructive">
                  {errors.defaultCourtFee}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="club-description"
                className="block text-xs font-semibold text-card-foreground"
              >
                Lịch sinh hoạt / Ghi chú (tuỳ chọn)
              </label>
              <textarea
                id="club-description"
                name="description"
                rows={3}
                maxLength={500}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                onBlur={() => handleBlurField('description')}
                placeholder="Ví dụ: Tối Thứ 3 - Thứ 5 - Chủ Nhật (19h30 - 21h30)"
                aria-invalid={Boolean(errors.description)}
                aria-describedby={errors.description ? 'club-description-error' : undefined}
                className={`mt-1.5 block w-full rounded-tile border bg-background px-3.5 py-2.5 text-sm text-foreground transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  errors.description ? 'border-destructive' : 'border-border'
                }`}
              />
              {errors.description && (
                <p
                  id="club-description-error"
                  className="mt-1 text-xs font-medium text-destructive"
                >
                  {errors.description}
                </p>
              )}
            </div>

            {/* Submit Actions */}
            <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
              <Link
                href="/clubs"
                className="inline-flex min-h-[46px] cursor-pointer items-center justify-center rounded-tile border border-border bg-secondary/70 px-5 py-2.5 text-xs font-semibold text-secondary-foreground transition-colors hover:bg-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
              >
                Huỷ
              </Link>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex min-h-[46px] cursor-pointer items-center justify-center gap-2 rounded-tile bg-primary px-6 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 [touch-action:manipulation]"
              >
                <span>{submitting ? 'Đang khởi tạo...' : 'Tạo CLB ngay'}</span>
              </button>
            </div>
          </form>
        </section>

        {/* Live Preview Card (5 cols on Desktop) */}
        <aside className="lg:col-span-5">
          <section
            aria-labelledby="club-preview-heading"
            className="rounded-block border border-border bg-card p-5 shadow-block lg:sticky lg:top-6"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                Xem trước thẻ CLB
              </span>
              <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 text-xs font-semibold text-primary">
                Chủ CLB • ADMIN
              </span>
            </div>

            <h2 id="club-preview-heading" className="mt-3 text-lg font-bold text-card-foreground">
              {name.trim() || 'CLB Sao Mai'}
            </h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {location.trim() || 'Sân Cầu Lông Sao Mai, Phú Nhuận, TP.HCM'}
            </p>

            <div className="mt-4 grid grid-cols-2 gap-2.5 rounded-tile bg-secondary/60 p-3.5">
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Giá sân mặc định</p>
                <p className="mt-0.5 font-mono text-base font-bold text-primary tabular-nums">
                  {formatVnd(safeCourtFee)}
                </p>
              </div>
              <div>
                <p className="text-[11px] font-medium text-muted-foreground">Chia thử 6 người</p>
                <p className="mt-0.5 font-mono text-base font-bold text-card-foreground tabular-nums">
                  {formatVnd(safeCourtFee > 0 ? Math.ceil(safeCourtFee / 6 / 1000) * 1000 : 0)}
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-tile border border-border bg-secondary/40 p-3.5">
              <p className="text-xs font-semibold text-card-foreground">
                Cú pháp chuyển khoản VietQR chuẩn NAPAS
              </p>
              <p className="mt-1 font-mono text-xs font-bold text-primary">{previewSyntax}</p>
              <p className="mt-1 text-[11px] text-muted-foreground">
                Sau khi tạo CLB, bạn có thể gắn tài khoản ngân hàng VietQR trong phần Cài đặt CLB.
              </p>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
