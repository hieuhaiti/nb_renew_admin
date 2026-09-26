import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100 aria-disabled:pointer-events-none aria-disabled:cursor-not-allowed aria-disabled:opacity-50 aria-disabled:active:scale-100 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary-hover active:bg-primary-active',
        success: 'bg-success text-success-foreground hover:bg-success-hover active:bg-success-active',
        warning: 'bg-warning text-warning-foreground hover:bg-warning-hover active:bg-warning-active',
        info: 'bg-info text-info-foreground hover:bg-info-hover active:bg-info-active',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive-hover active:bg-destructive-active',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground active:bg-muted',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary-hover active:bg-secondary-active',
        ghost: 'hover:bg-accent hover:text-accent-foreground active:bg-muted',
        link: 'text-primary underline-offset-4 hover:underline active:opacity-80',
        gradientPrimary: 'bg-[image:var(--gradient-primary)] text-primary-foreground shadow-sm hover:opacity-95 active:opacity-90',
        gradientAccent: 'bg-[image:var(--gradient-accent)] text-primary-foreground shadow-sm hover:opacity-95 active:opacity-90',
      },
      size: {
        default: 'h-10 px-4 py-2',
        xs: 'h-8 rounded px-2.5 text-xs',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
        icon: 'h-10 w-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, loading = false, disabled, children, onClick, ...props }, ref) => {
    const isDisabled = Boolean(disabled || loading)

    if (asChild) {
      return (
        <Slot
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          aria-busy={loading ? true : undefined}
          aria-disabled={isDisabled ? true : undefined}
          onClick={(e: React.MouseEvent<HTMLButtonElement>) => {
            if (isDisabled) {
              e.preventDefault()
              e.stopPropagation()
              return
            }
            onClick?.(e)
          }}
          {...props}
        >
          {children}
        </Slot>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={isDisabled}
        aria-busy={loading ? true : undefined}
        aria-disabled={isDisabled ? true : undefined}
        onClick={onClick}
        {...props}
      >
        {loading && <Loader2 className="animate-spin size-4" />}
        {children}
      </button>
    )
  }
)
Button.displayName = 'Button'

export { Button, buttonVariants }
