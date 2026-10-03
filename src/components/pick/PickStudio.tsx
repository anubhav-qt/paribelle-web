'use client';

import { StylistExperience } from './StylistExperience';
import { usePickJourney } from './usePickJourney';

/** Find Your Pick: a styling session with Seelie, whose steps come from the OMS. */
export function PickStudio() {
  const journey = usePickJourney();
  return (
    <div className="pb-hero-paper min-h-[calc(100svh-57px)] md:min-h-[calc(100svh-61px)]">
      <StylistExperience journey={journey} />
    </div>
  );
}
