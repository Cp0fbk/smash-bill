import { cn } from '@/lib/utils';
import type * as React from 'react';

function Skeleton({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-tile bg-secondary motion-reduce:animate-none',
        className,
      )}
      {...props}
    />
  );
}

export { Skeleton };
