'use client';

import { ForbiddenState } from '../../../components/forbidden-state';
import { useClubPermissions, useCurrentUser } from '../../../lib/auth-context';

export default function PlatformAdminPage() {
  const { loading } = useCurrentUser();
  const { isPlatformAdmin } = useClubPermissions();

  if (loading) {
    return (
      <div
        aria-label="Đang kiểm tra quyền quản trị"
        className="h-56 animate-pulse rounded-block border border-border bg-card p-6 shadow-block motion-reduce:animate-none"
      />
    );
  }

  if (!isPlatformAdmin) {
    return (
      <ForbiddenState
        title="403 • Khu vực Quản trị viên hệ thống (Platform ADMIN)"
        description="Tài khoản của bạn có vai trò USER. Chỉ Quản trị viên hệ thống (UserRole.ADMIN) mới có quyền truy cập trang điều hành này."
        backHref="/clubs"
        backLabel="Quay lại CLB của tôi"
      />
    );
  }

  return (
    <section
      aria-labelledby="admin-console-heading"
      className="rounded-block border border-border bg-card p-6 shadow-block sm:p-8"
    >
      <span className="rounded-pill bg-primary-soft px-2.5 py-0.5 font-mono text-xs font-bold text-primary">
        Platform ADMIN Console
      </span>
      <h1
        id="admin-console-heading"
        className="mt-2 text-xl font-bold text-card-foreground sm:text-2xl"
      >
        Quản trị hệ thống SmashBill
      </h1>
      <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
        Kiểm duyệt báo cáo bùng kèo (S14) và điều phối dữ liệu kèo giao lưu từ Social Crawler (S15).
      </p>
    </section>
  );
}
