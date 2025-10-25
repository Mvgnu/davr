'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: {
    label: string;
    href?: string;
    onClick?: () => void;
  };
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className = '',
}: EmptyStateProps) {
  return (
    <div
      className={`py-12 text-center bg-card rounded-xl shadow-sm border border-border ${className}`}
    >
      <div className="inline-flex items-center justify-center p-4 bg-muted rounded-full mb-4">
        <Icon className="h-8 w-8 text-muted-foreground" />
      </div>

      <h3 className="text-xl font-semibold mb-2 text-foreground">{title}</h3>

      <p className="text-muted-foreground mb-6 max-w-md mx-auto">
        {description}
      </p>

      {action && (
        <>
          {action.href ? (
            <Link href={action.href}>
              <Button variant="default">{action.label}</Button>
            </Link>
          ) : (
            <Button onClick={action.onClick} variant="default">
              {action.label}
            </Button>
          )}
        </>
      )}
    </div>
  );
}
