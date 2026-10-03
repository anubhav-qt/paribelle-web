import type { Metadata } from 'next';
import { PickStudio } from '@/components/pick/PickStudio';

export const metadata: Metadata = {
  title: 'Find Your Pick',
  description: 'A few quick taps with Seelie, our AI stylist, and it picks the PariBelle pieces made for you.',
};

export default function FindYourPickPage() {
  return <PickStudio />;
}
