'use client';

import { useState } from 'react';
import { RATING_DEFINITIONS } from '@/lib/types';

export default function RatingDefinitions() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-100 transition-colors"
      >
        <h3 className="text-lg font-semibold text-gray-900">Rating Definitions</h3>
        <svg
          className={`w-5 h-5 text-gray-600 transition-transform ${isExpanded ? 'rotate-180' : ''}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      
      {isExpanded && (
        <div className="px-6 pb-6 space-y-4">
          {RATING_DEFINITIONS.map((def) => (
            <div key={def.level} className="border-l-4 border-blue-500 pl-4 py-2">
              <h4 className="font-bold text-gray-900">
                {def.label} ({def.level})
              </h4>
              <p className="text-gray-700 mt-1 text-sm">
                {def.description}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

