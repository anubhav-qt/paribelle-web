'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import type { PickMode } from './api';
import { GuidedExperience } from './GuidedExperience';
import { PhotoExperience } from './PhotoExperience';
import { StylistExperience } from './StylistExperience';
import { usePickJourney } from './usePickJourney';

const EXPERIENCES: { id: PickMode; label: string }[] = [
  { id: 'guided', label: 'Guided' },
  { id: 'photo', label: 'Photo' },
  { id: 'stylist', label: 'Stylist' },
];

/** The experience shoppers get. The others stay reachable with ?experience= (and the dev toggle). */
const DEFAULT_EXPERIENCE: PickMode = 'stylist';

/** The dev toggle's choice, remembered across reloads on this machine. */
const STORAGE_KEY = 'pb-pick-experience';

const SHOW_TOGGLE = process.env.NODE_ENV !== 'production';

const isMode = (v: unknown): v is PickMode => EXPERIENCES.some((e) => e.id === v);

/**
 * Find Your Pick. Three experiences on one engine (Seelie, in the OMS): Guided,
 * Photo-led and a Stylist session. On a dev server a small toggle switches
 * between them; `?experience=` picks one anywhere, for trying them on a phone.
 */
export function PickStudio() {
  const [mode, setMode] = React.useState<PickMode>(DEFAULT_EXPERIENCE);

  React.useEffect(() => {
    const fromUrl = new URLSearchParams(window.location.search).get('experience');
    if (isMode(fromUrl)) return setMode(fromUrl);
    if (!SHOW_TOGGLE) return;
    try {
      const saved = window.localStorage.getItem(STORAGE_KEY);
      if (isMode(saved)) setMode(saved);
    } catch {
      // Storage blocked: the default it is.
    }
  }, []);

  const choose = (next: PickMode) => {
    setMode(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Not remembered; still switched.
    }
  };

  const journey = usePickJourney(mode);

  return (
    <div className="pb-hero-paper min-h-[calc(100svh-57px)] md:min-h-[calc(100svh-61px)]">
      {mode === 'guided' && <GuidedExperience journey={journey} />}
      {mode === 'photo' && <PhotoExperience journey={journey} />}
      {mode === 'stylist' && <StylistExperience journey={journey} />}
      {SHOW_TOGGLE && <ExperienceToggle value={mode} onChange={choose} />}
    </div>
  );
}

function ExperienceToggle({ value, onChange }: { value: PickMode; onChange: (mode: PickMode) => void }) {
  return (
    <div className="fixed bottom-[calc(0.75rem+env(safe-area-inset-bottom))] right-3 z-50 flex items-center gap-1 rounded-sm bg-[hsl(var(--pb-ink)/0.92)] p-1 text-white shadow-pb-lg backdrop-blur">
      <span className="text-eyebrow px-2 text-[0.6rem] text-white/60">Dev</span>
      {EXPERIENCES.map((e) => (
        <button
          key={e.id}
          type="button"
          onClick={() => onChange(e.id)}
          aria-pressed={value === e.id}
          className={cn(
            'h-7 rounded-sm px-2.5 text-xs font-medium transition-colors',
            value === e.id ? 'bg-white text-[hsl(var(--pb-ink))]' : 'text-white/80 hover:bg-white/10'
          )}
        >
          {e.label}
        </button>
      ))}
    </div>
  );
}
