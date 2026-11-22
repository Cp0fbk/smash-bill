'use client';

import Link from 'next/link';

interface ForbiddenStateProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function ForbiddenState({
  title = '403 • Không đủ quyền truy cập',
  description = 'Tính năng này chỉ dành cho Chủ CLB (Club ADMIN) hoặc Quản trị viên hệ thống.',
  backHref = '/clubs',
  backLabel = 'Quay lại danh sách CLB',
}: ForbiddenStateProps) {
  return (
    <section
      role="alert"
      aria-labelledby="forbidden-heading"
      className="mx-auto my-8 max-w-lg rounded-block border border-border bg-card p-6 text-center shadow-block sm:p-8"
    >
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-soft text-warning">
        <svg
          aria-hidden="true"
          className="h-6 w-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
          <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
      </div>

      <h1 id="forbidden-heading" className="mt-4 text-lg font-bold text-card-foreground sm:text-xl">
        {title}
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">{description}</p>

      <div className="mt-6 flex justify-center">
        <Link
          href={backHref}
          className="inline-flex min-h-[44px] cursor-pointer items-center gap-2 rounded-tile bg-primary px-5 py-2.5 text-xs font-semibold text-on-primary shadow-cta transition-colors duration-200 hover:bg-primary-hover focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring [touch-action:manipulation]"
        >
          <span>{backLabel}</span>
        </Link>
      </div>
    </section>
  );
}
