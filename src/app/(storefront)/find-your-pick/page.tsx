import type { Metadata } from 'next';
import { PickStudio } from '@/components/pick/PickStudio';

export const metadata: Metadata = {
  title: 'Find Your Pick',
  description: 'Answer a few quick questions, or start from a photo, and Seelie, our AI stylist, picks the PariBelle pieces that suit you.',
};

export default function FindYourPickPage() {
  return <PickStudio />;
}
