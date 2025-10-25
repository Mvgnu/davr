"use client";

import React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils';

const CATEGORIES: { value: string; label: string }[] = [
  { value: 'all', label: 'Alle' },
  { value: 'metal', label: 'Metalle' },
  { value: 'plastic', label: 'Kunststoffe' },
  { value: 'paper', label: 'Papier' },
  { value: 'glass', label: 'Glas' },
  { value: 'electronics', label: 'Elektronik' },
];

export default function CategoryChips() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const current = searchParams.get('type') || 'all';

  const onSelect = (value: string) => {
    const params = new URLSearchParams(Array.from(searchParams.entries()));
    if (value === 'all') params.delete('type'); else params.set('type', value);
    params.delete('page');
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-2 mb-6">
      {CATEGORIES.map((c) => (
        <button
          key={c.value}
          onClick={() => onSelect(c.value)}
          className={cn(
            'px-3 py-1.5 rounded-full text-sm border transition-colors',
            current === c.value ? 'bg-primary text-primary-foreground border-primary' : 'bg-background text-foreground border-border hover:bg-muted'
          )}
        >
          {c.label}
        </button>
      ))}
    </div>
  );
}


