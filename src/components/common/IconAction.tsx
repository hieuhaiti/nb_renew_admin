import * as React from 'react'
import { Button, type ButtonProps } from '@/components/ui/button'
import { Tooltip, TooltipTrigger, TooltipContent } from '@/components/ui/tooltip'
import { cn } from '@/lib/utils'

export interface IconActionProps extends Omit<ButtonProps, 'children'> {
  label: string
  icon: React.ComponentType<{ className?: string }>
  tooltipSide?: 'top' | 'right' | 'bottom' | 'left'
  showTooltip?: boolean
  children?: React.ReactNode
}

export const IconAction = React.forwardRef<HTMLButtonElement, IconActionProps>(
  (
    {
      label,
      icon: Icon,
      tooltipSide = 'top',
      showTooltip = true,
      className,
      variant = 'ghost',
      size = 'sm',
      disabled,
      children,
      ...props
    },
    ref
  ) => {
    const button = (
      <Button
        ref={ref}
        type="button"
        variant={variant}
        size={size}
        aria-label={label}
        disabled={disabled}
        className={cn('h-8 w-8 p-0', className)}
        {...props}
      >
        <Icon className="size-4" />
        <span className="sr-only">{label}</span>
        {children}
      </Button>
    )

    if (!showTooltip) return button

    return (
      <Tooltip>
        <TooltipTrigger asChild>{button}</TooltipTrigger>
        <TooltipContent side={tooltipSide}>
          <p>{label}</p>
        </TooltipContent>
      </Tooltip>
    )
  }
)

IconAction.displayName = 'IconAction'

export default IconAction
