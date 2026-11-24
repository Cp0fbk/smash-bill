import { cn } from '@/lib/utils';
import { Slot } from '@radix-ui/react-slot';
import { type VariantProps, cva } from 'class-variance-authority';
import * as React from 'react';

const buttonVariants = cva(
  'inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 whitespace-nowrap rounded-tile text-xs font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none [touch-action:manipulation] [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground shadow-cta hover:bg-primary-hover',
        destructive:
          'border border-destructive/30 bg-destructive-soft text-on-destructive-soft hover:bg-destructive hover:text-destructive-foreground',
        outline:
          'border border-border bg-card text-card-foreground shadow-tile hover:bg-secondary hover:text-secondary-foreground',
        secondary:
          'border border-border bg-secondary text-secondary-foreground hover:bg-secondary/80',
        soft: 'border border-border-strong/30 bg-primary-soft text-primary hover:bg-primary hover:text-primary-foreground',
        ghost: 'text-muted-foreground hover:bg-secondary hover:text-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'min-h-[44px] px-4 py-2',
        sm: 'min-h-[36px] px-3 py-1.5',
        lg: 'min-h-[48px] px-5 py-3 text-sm',
        pill: 'min-h-[36px] rounded-pill px-3.5 py-1.5',
        icon: 'h-11 w-11 min-h-[44px] min-w-[44px]',
        'icon-sm': 'h-9 w-9 min-h-[36px] min-w-[36px]',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type = 'button', ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        type={asChild ? undefined : type}
        className={cn(buttonVariants({ variant, size, className }))}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
