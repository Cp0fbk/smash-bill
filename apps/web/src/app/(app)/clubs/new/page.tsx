'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { formatVnd, slugify, toTransferSyntax } from '@smash-bill/shared';
import { ChevronLeft } from 'lucide-react';
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
          <Button asChild variant="ghost" size="sm" className="-ml-3 text-muted-foreground">
            <Link href="/clubs">
              <ChevronLeft aria-hidden="true" />
              <span>Quay lại danh sách CLB</span>
            </Link>
          </Button>
          <h1 className="mt-1 text-xl font-bold tracking-tight text-card-foreground sm:text-2xl">
            Tạo CLB cố định mới (Sinh hoạt hàng tuần)
          </h1>
        </div>
      </div>

      {/* Desktop 12-Col Split Form + Live Preview Card */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Form Card (7 cols) */}
        <Card aria-labelledby="create-club-form-heading" className="lg:col-span-7">
          <CardHeader>
            <CardTitle id="create-club-form-heading">Thông tin CLB cầu lông cố định</CardTitle>
            <CardDescription className="text-xs">
              Dành cho hội sinh hoạt định kỳ hàng tuần (từ CLB bạn có thể mở từng buổi đánh hoặc
              tuyển thêm khách giao lưu vãng lai).
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-4">
            {hasValidationErrors && (
              <Alert
                ref={errorSummaryRef}
                variant="destructive"
                tabIndex={-1}
                aria-labelledby="form-error-summary-title"
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <AlertTitle id="form-error-summary-title">
                  Vui lòng kiểm tra lại thông tin:
                </AlertTitle>
                <AlertDescription>
                  <ul className="list-inside list-disc space-y-1">
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
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Club Name */}
              <div className="space-y-1.5">
                <Label htmlFor="club-name">
                  Tên câu lạc bộ <span className="text-destructive">*</span>
                </Label>
                <Input
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
                />
                <p id="club-name-hint" className="font-mono text-[11px] text-muted-foreground">
                  Slug đường dẫn: /{previewSlug}
                </p>
                {errors.name && (
                  <p id="club-name-error" className="text-xs font-medium text-destructive">
                    {errors.name}
                  </p>
                )}
              </div>

              {/* Location */}
              <div className="space-y-1.5">
                <Label htmlFor="club-location">Sân cầu lông / Địa điểm</Label>
                <Input
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
                />
                {errors.location && (
                  <p id="club-location-error" className="text-xs font-medium text-destructive">
                    {errors.location}
                  </p>
                )}
              </div>

              {/* Default Court Fee */}
              <div className="space-y-1.5">
                <Label htmlFor="club-court-fee">Tiền sân mặc định mỗi buổi (VND)</Label>
                <Input
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
                  className="font-mono font-semibold tabular-nums"
                />

                {/* Quick VND Presets */}
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  {COURT_FEE_PRESETS.map((preset) => (
                    <Button
                      key={preset}
                      variant={safeCourtFee === preset ? 'soft' : 'secondary'}
                      size="pill"
                      onClick={() => {
                        setDefaultCourtFeeInput(String(preset));
                        setErrors((prev) => ({ ...prev, defaultCourtFee: undefined }));
                      }}
                      className="font-mono tabular-nums"
                    >
                      {formatVnd(preset)}
                    </Button>
                  ))}
                </div>
                <p id="club-court-fee-hint" className="text-[11px] text-muted-foreground">
                  Hiển thị:{' '}
                  <span className="font-mono font-semibold tabular-nums">
                    {formatVnd(safeCourtFee)}
                  </span>
                </p>
                {errors.defaultCourtFee && (
                  <p id="club-court-fee-error" className="text-xs font-medium text-destructive">
                    {errors.defaultCourtFee}
                  </p>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <Label htmlFor="club-description">Lịch sinh hoạt / Ghi chú (tuỳ chọn)</Label>
                <Textarea
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
                />
                {errors.description && (
                  <p id="club-description-error" className="text-xs font-medium text-destructive">
                    {errors.description}
                  </p>
                )}
              </div>

              {/* Submit Actions */}
              <div className="flex flex-col-reverse gap-2.5 pt-2 sm:flex-row sm:justify-end">
                <Button asChild variant="secondary">
                  <Link href="/clubs">Huỷ</Link>
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? 'Đang khởi tạo...' : 'Tạo CLB ngay'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Live Preview Card (5 cols on Desktop) */}
        <aside className="lg:col-span-5">
          <Card aria-labelledby="club-preview-heading" className="lg:sticky lg:top-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                  Xem trước thẻ CLB
                </span>
                <Badge variant="soft">Chủ CLB • HOST</Badge>
              </div>
              <CardTitle id="club-preview-heading" className="pt-2 text-lg">
                {name.trim() || 'CLB Sao Mai'}
              </CardTitle>
              <CardDescription className="text-xs">
                {location.trim() || 'Sân Cầu Lông Sao Mai, Phú Nhuận, TP.HCM'}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-2.5 rounded-tile bg-secondary/60 p-3.5">
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

              <div className="rounded-tile border border-border bg-secondary/40 p-3.5">
                <p className="text-xs font-semibold text-card-foreground">
                  Cú pháp chuyển khoản VietQR chuẩn NAPAS
                </p>
                <p className="mt-1 font-mono text-xs font-bold text-primary">{previewSyntax}</p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  Sau khi tạo CLB, bạn có thể gắn tài khoản ngân hàng VietQR trong phần Cài đặt CLB.
                </p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </div>
  );
}
