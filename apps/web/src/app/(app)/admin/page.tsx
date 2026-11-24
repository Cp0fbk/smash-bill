'use client';

import { Badge } from '@/components/ui/badge';
import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { ForbiddenState } from '../../../components/forbidden-state';
import { useClubPermissions, useCurrentUser } from '../../../lib/auth-context';

export default function PlatformAdminPage() {
  const { loading } = useCurrentUser();
  const { isPlatformAdmin } = useClubPermissions();

  if (loading) {
    return (
      <Skeleton aria-label="Đang kiểm tra quyền quản trị" className="h-56 w-full rounded-block" />
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
    <Card aria-labelledby="admin-console-heading">
      <CardHeader className="p-6 sm:p-8">
        <div>
          <Badge variant="soft" className="font-mono">
            Platform ADMIN Console
          </Badge>
        </div>
        <CardTitle id="admin-console-heading" className="mt-2 text-xl sm:text-2xl">
          Quản trị hệ thống SmashBill
        </CardTitle>
        <CardDescription>
          Kiểm duyệt báo cáo bùng kèo (S14) và điều phối dữ liệu kèo giao lưu từ Social Crawler
          (S15).
        </CardDescription>
      </CardHeader>
    </Card>
  );
}
