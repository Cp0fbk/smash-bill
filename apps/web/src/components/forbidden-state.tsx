'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Lock } from 'lucide-react';
import Link from 'next/link';

interface ForbiddenStateProps {
  title?: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
}

export function ForbiddenState({
  title = '403 • Không đủ quyền truy cập',
  description = 'Tính năng này chỉ dành cho Chủ CLB (Club HOST) hoặc Quản trị viên hệ thống.',
  backHref = '/clubs',
  backLabel = 'Quay lại danh sách CLB',
}: ForbiddenStateProps) {
  return (
    <Card
      role="alert"
      aria-labelledby="forbidden-heading"
      className="mx-auto my-8 max-w-lg text-center"
    >
      <CardContent className="p-6 sm:p-8">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-warning-soft text-warning">
          <Lock className="h-6 w-6" aria-hidden="true" />
        </div>

        <h1
          id="forbidden-heading"
          className="mt-4 text-lg font-bold text-card-foreground sm:text-xl"
        >
          {title}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>

        <div className="mt-6 flex justify-center">
          <Button asChild>
            <Link href={backHref}>{backLabel}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
