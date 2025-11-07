'use client';

import { CategoryRating } from '@/lib/types';
import { getCategoryRatingColor, getCategoryRatingText } from '@/lib/utils';

interface CategoryRatingSelectProps {
  value: CategoryRating;
  onChange: (value: CategoryRating) => void;
  disabled?: boolean;
  label?: string;
}

const RATING_OPTIONS: { value: CategoryRating; label: string }[] = [
  { value: null, label: 'Not Rated' },
  { value: 'unsatisfactory', label: 'Unsatisfactory' },
  { value: 'needs-improvement', label: 'Needs Improvement' },
  { value: 'delivers', label: 'Delivers on Expectations' },
  { value: 'exceeds', label: 'Exceeds Expectations' },
  { value: 'distinguished', label: 'Distinguished' },
];

export default function CategoryRatingSelect({
  value,
  onChange,
  disabled = false,
  label,
}: CategoryRatingSelectProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <select
        value={value || ''}
        onChange={(e) => onChange((e.target.value || null) as CategoryRating)}
        disabled={disabled}
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
      >
        {RATING_OPTIONS.map((option) => (
          <option key={option.value || 'null'} value={option.value || ''}>
            {option.label}
          </option>
        ))}
      </select>
      {value && (
        <div className="mt-2">
          <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryRatingColor(value)}`}>
            {getCategoryRatingText(value)}
          </span>
        </div>
      )}
    </div>
  );
}

