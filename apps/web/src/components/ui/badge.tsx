import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import type * as React from 'react';

const badgeVariants = cva(
  'inline-flex items-center gap-1 rounded-pill border px-2.5 py-0.5 text-xs font-semibold transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-primary-foreground',
        secondary: 'border-border bg-secondary text-secondary-foreground',
        outline: 'border-border bg-card text-foreground',
        soft: 'border-border-strong/30 bg-primary-soft text-primary',
        success: 'border-success/30 bg-success-soft text-on-success-soft',
        warning: 'border-warning/30 bg-warning-soft text-on-warning-soft',
        destructive: 'border-destructive/30 bg-destructive-soft text-on-destructive-soft',
        info: 'border-accent-qr/30 bg-accent-qr-soft text-on-accent-qr',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
