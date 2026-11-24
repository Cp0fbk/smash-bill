'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';

export default function MarketPage() {
  return (
    <Card aria-labelledby="market-heading">
      <CardHeader className="p-6 sm:p-8">
        <div>
          <Badge variant="soft">Chợ thiết bị cầu lông</Badge>
        </div>
        <CardTitle id="market-heading" className="mt-2 text-xl sm:text-2xl">
          Trao đổi Vợt, Giày &amp; Phụ kiện Cầu Lông
        </CardTitle>
        <CardDescription>
          Kết nối cộng đồng người chơi xác thực qua SSO, gắn liền hồ sơ uy tín chống scam.
        </CardDescription>
      </CardHeader>
      <CardContent className="px-6 pb-6 sm:px-8 sm:pb-8">
        <Button asChild>
          <Link href="/clubs">Xem CLB &amp; Hồ sơ uy tín</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
