'use client';

import { formatOverallScore } from '@/lib/utils';

interface OverallScoreInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  disabled?: boolean;
  label?: string;
}

export default function OverallScoreInput({
  value,
  onChange,
  disabled = false,
  label,
}: OverallScoreInputProps) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="flex items-center gap-4">
        <input
          type="number"
          min="0"
          max="5"
          step="0.25"
          value={value ?? ''}
          onChange={(e) => {
            const val = e.target.value;
            onChange(val === '' ? null : parseFloat(val));
          }}
          disabled={disabled}
          className="w-32 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
          placeholder="0.00"
        />
        <div className="text-sm text-gray-600">
          (0 - 5, in 0.25 increments)
        </div>
      </div>
      {value !== null && (
        <div className="mt-2">
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
            Score: {formatOverallScore(value)}
          </span>
        </div>
      )}
    </div>
  );
}

