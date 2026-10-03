import type { Metadata } from 'next';
import { PickStudio } from '@/components/pick/PickStudio';

export const metadata: Metadata = {
  title: 'Find Your Pick',
  description: 'A styling session with Seelie, our AI stylist: tell it where you are headed and what you love, and it puts together your edit from the PariBelle collection.',
};

export default function FindYourPickPage() {
  return <PickStudio />;
}
