import * as React from 'react';
import { cn } from '@/lib/utils';

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center gap-3 py-16 text-center', className)}>
      {icon && <div className="text-[hsl(var(--pb-gold))]">{icon}</div>}
      <h3 className="font-display text-xl text-[hsl(var(--pb-ink))]">{title}</h3>
      {description && (
        <p className="max-w-sm text-sm text-[hsl(var(--pb-ink-muted))]">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}
