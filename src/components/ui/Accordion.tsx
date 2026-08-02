'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AccordionItemData {
  id: string;
  title: React.ReactNode;
  content: React.ReactNode;
}

export interface AccordionProps {
  items: AccordionItemData[];
  defaultOpenId?: string;
  allowMultiple?: boolean;
  className?: string;
}

export function Accordion({ items, defaultOpenId, allowMultiple = false, className }: AccordionProps) {
  const [openIds, setOpenIds] = React.useState<Set<string>>(
    new Set(defaultOpenId ? [defaultOpenId] : [])
  );

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = allowMultiple ? new Set(prev) : new Set<string>();
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={cn('divide-y divide-[hsl(var(--pb-linen))] border-y border-[hsl(var(--pb-linen))]', className)}>
      {items.map((item) => {
        const isOpen = openIds.has(item.id);
        return (
          <div key={item.id}>
            <button
              type="button"
              aria-expanded={isOpen}
              onClick={() => toggle(item.id)}
              className="flex w-full items-center justify-between py-4 text-left text-sm font-medium text-[hsl(var(--pb-ink))]"
            >
              {item.title}
              <Plus
                className={cn(
                  'h-4 w-4 shrink-0 text-[hsl(var(--pb-ink-muted))] transition-transform duration-200 ease-pb',
                  isOpen && 'rotate-45'
                )}
              />
            </button>
            <div
              className={cn(
                'grid overflow-hidden transition-all duration-300 ease-pb',
                isOpen ? 'grid-rows-[1fr] pb-4' : 'grid-rows-[0fr]'
              )}
            >
              <div className="min-h-0 overflow-hidden text-sm leading-relaxed text-[hsl(var(--pb-ink-muted))]">
                {item.content}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
