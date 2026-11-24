import { cn } from '@/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

const alertVariants = cva(
  'relative w-full rounded-tile border px-4 py-3 text-xs [&>svg]:absolute [&>svg]:top-3.5 [&>svg]:left-4 [&>svg]:h-4 [&>svg]:w-4 [&>svg~*]:pl-7',
  {
    variants: {
      variant: {
        default: 'border-border bg-card text-card-foreground [&>svg]:text-foreground',
        info: 'border-border-strong/30 bg-primary-soft text-primary [&>svg]:text-primary',
        success: 'border-success/30 bg-success-soft text-on-success-soft [&>svg]:text-success',
        warning: 'border-warning/30 bg-warning-soft text-on-warning-soft [&>svg]:text-warning',
        destructive:
          'border-destructive/30 bg-destructive-soft text-on-destructive-soft [&>svg]:text-destructive',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

const Alert = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>
>(({ className, variant, role, ...props }, ref) => (
  <div
    ref={ref}
    role={role ?? (variant === 'destructive' ? 'alert' : undefined)}
    aria-live={variant === 'destructive' ? 'assertive' : 'polite'}
    className={cn(alertVariants({ variant }), className)}
    {...props}
  />
));
Alert.displayName = 'Alert';

const AlertTitle = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h5
      ref={ref}
      className={cn('mb-1 font-bold leading-snug tracking-tight', className)}
      {...props}
    />
  ),
);
AlertTitle.displayName = 'AlertTitle';

const AlertDescription = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div ref={ref} className={cn('leading-relaxed [&_p]:leading-relaxed', className)} {...props} />
  ),
);
AlertDescription.displayName = 'AlertDescription';

export { Alert, AlertDescription, AlertTitle };
