import * as React from 'react'

// ---------------------------------------------------------------------------
// Card
// ---------------------------------------------------------------------------

type CardVariant = 'default' | 'ghost' | 'bordered'
type CardPadding = 'none' | 'sm' | 'md' | 'lg'

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: CardVariant
  padding?: CardPadding
}

const variantClasses: Record<CardVariant, string> = {
  default: 'bg-card border border-edge rounded-[var(--radius-lg)] shadow-[var(--shadow-md)]',
  ghost: 'bg-transparent',
  bordered: 'bg-card border border-edge-strong rounded-[var(--radius-lg)]',
}

const paddingClasses: Record<CardPadding, string> = {
  none: '',
  sm: 'p-4',
  md: 'p-5',
  lg: 'p-6',
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ variant = 'default', padding = 'lg', className = '', children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={[
          variantClasses[variant],
          paddingClasses[padding],
          className,
        ]
          .filter(Boolean)
          .join(' ')}
        {...props}
      >
        {children}
      </div>
    )
  },
)

Card.displayName = 'Card'

// ---------------------------------------------------------------------------
// CardHeader
// ---------------------------------------------------------------------------

export const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={['flex justify-between items-start gap-4', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </div>
))

CardHeader.displayName = 'CardHeader'

// ---------------------------------------------------------------------------
// CardTitle
// ---------------------------------------------------------------------------

export const CardTitle = React.forwardRef<
  HTMLHeadingElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className = '', children, ...props }, ref) => (
  <h3
    ref={ref}
    className={[
      'font-display text-base font-semibold text-content tracking-tight',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </h3>
))

CardTitle.displayName = 'CardTitle'

// ---------------------------------------------------------------------------
// CardDescription
// ---------------------------------------------------------------------------

export const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className = '', children, ...props }, ref) => (
  <p
    ref={ref}
    className={['text-sm text-content-muted mt-0.5', className]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </p>
))

CardDescription.displayName = 'CardDescription'

// ---------------------------------------------------------------------------
// CardContent
// ---------------------------------------------------------------------------

export const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div ref={ref} className={className} {...props}>
    {children}
  </div>
))

CardContent.displayName = 'CardContent'

// ---------------------------------------------------------------------------
// CardFooter
// ---------------------------------------------------------------------------

export const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={[
      'mt-4 pt-4 border-t border-edge flex items-center gap-2',
      className,
    ]
      .filter(Boolean)
      .join(' ')}
    {...props}
  >
    {children}
  </div>
))

CardFooter.displayName = 'CardFooter'
