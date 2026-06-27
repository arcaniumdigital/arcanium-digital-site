import type { ComponentProps } from 'react'

import { cn } from '@/lib/utils'

const variants = {
  default: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
}

const sizes = {
  default: 'h-9 px-4 py-2 has-[>svg]:px-3',
  sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
  lg: 'h-10 px-6 has-[>svg]:px-4',
}

function Button({
  className,
  variant = 'default',
  size = 'default',
  ...props
}: ComponentProps<'button'> & {
  variant?: keyof typeof variants
  size?: keyof typeof sizes
}) {
  return (
    <button
      data-slot="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all outline-none disabled:pointer-events-none disabled:opacity-50 focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px] [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  )
}

export { Button }
