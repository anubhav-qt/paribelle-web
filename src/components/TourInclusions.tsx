'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Check, X } from 'lucide-react';

interface TourInclusionsProps {
  inclusions: string[];
  exclusions: string[];
}

export default function TourInclusions({ inclusions, exclusions }: TourInclusionsProps) {
  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Inclusions */}
      <Card className="border-green-200">
        <CardHeader className="bg-green-50">
          <CardTitle className="text-lg flex items-center gap-2 text-green-800">
            <Check className="w-5 h-5" />
            What's Included
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="space-y-3">
            {inclusions.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Check className="w-3 h-3 text-green-600" />
                </div>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {/* Exclusions */}
      <Card className="border-red-200">
        <CardHeader className="bg-red-50">
          <CardTitle className="text-lg flex items-center gap-2 text-red-800">
            <X className="w-5 h-5" />
            What's Not Included
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <ul className="space-y-3">
            {exclusions.map((item, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <X className="w-3 h-3 text-red-600" />
                </div>
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
