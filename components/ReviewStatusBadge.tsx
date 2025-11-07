'use client';

import { ReviewStatus } from '@/lib/types';
import { getStatusColor, formatStatus } from '@/lib/utils';

interface ReviewStatusBadgeProps {
  status: ReviewStatus;
}

export default function ReviewStatusBadge({ status }: ReviewStatusBadgeProps) {
  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(status)}`}>
      {formatStatus(status)}
    </span>
  );
}

