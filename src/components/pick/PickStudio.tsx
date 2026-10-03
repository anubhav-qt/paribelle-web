'use client';

import { PickFlow } from './PickFlow';
import { usePickJourney } from './usePickJourney';

/** Find Your Pick: a few quick questions with Seelie, whose steps come from the OMS. */
export function PickStudio() {
  const journey = usePickJourney();
  return (
    <div className="min-h-[calc(100svh-57px)] bg-[hsl(var(--pb-ivory))] md:min-h-[calc(100svh-61px)]">
      <PickFlow journey={journey} />
    </div>
  );
}
