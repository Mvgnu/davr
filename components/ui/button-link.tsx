import React from 'react'
import Link from 'next/link'
import { Button, buttonVariants } from './button'
import { cn } from '@/lib/utils'
import { VariantProps } from 'class-variance-authority'

interface ButtonLinkProps 
  extends React.AnchorHTMLAttributes<HTMLAnchorElement>,
    VariantProps<typeof buttonVariants> {
  href: string
  isExternal?: boolean
}

export const ButtonLink = React.forwardRef<HTMLAnchorElement, ButtonLinkProps>(
  ({ className, href, variant, size, children, isExternal, ...props }, ref) => {
    if (isExternal) {
      return (
        <a
          href={href}
          className={cn(buttonVariants({ variant, size, className }))}
          ref={ref}
          target="_blank"
          rel="noopener noreferrer"
          {...props}
        >
          {children}
        </a>
      )
    }

    return (
      <Link 
        href={href}
        className={cn(buttonVariants({ variant, size, className }))} 
        ref={ref}
        {...props}
      >
        {children}
      </Link>
    )
  }
)

ButtonLink.displayName = 'ButtonLink' 