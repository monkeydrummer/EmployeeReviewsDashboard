'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Review, Reviewee } from '@/lib/types';
import ReviewStatusBadge from '@/components/ReviewStatusBadge';
import { formatPeriod } from '@/lib/utils';

export default function EmployeeReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [reviewee, setReviewee] = useState<Reviewee | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (email) {
      loadData();
    }
  }, [email]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [revieweesRes, reviewsRes] = await Promise.all([
        fetch('/api/reviewees'),
        fetch('/api/reviews')
      ]);
      
      const revieweesData = await revieweesRes.json();
      const reviewsData = await reviewsRes.json();
      
      // Find this reviewee
      const currentReviewee = revieweesData.reviewees.find((r: Reviewee) => r.email === email);
      if (!currentReviewee) {
        setMessage('Employee not found. Please contact admin.');
        setLoading(false);
        return;
      }
      
      setReviewee(currentReviewee);
      
      // Filter reviews for this employee
      const employeeReviews = reviewsData.reviews.filter((review: Review) =>
        review.revieweeId === currentReviewee.id
      );
      
      setReviews(employeeReviews);
    } catch (error) {
      console.error('Error loading data:', error);
      setMessage('Error loading reviews');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (message || !reviewee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-600 mb-4">{message || 'Access denied'}</div>
          <button
            onClick={() => router.push('/')}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Image
              src="/images/rocscience_logo.jpg"
              alt="Rocscience Logo"
              width={150}
              height={60}
              className="object-contain"
            />
            <div className="flex gap-2">
              <button
                onClick={() => router.push(`/change-password?email=${encodeURIComponent(email)}&role=employee`)}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                Change Password
              </button>
              <button
                onClick={() => router.push('/')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Reviews</h1>
            <p className="text-gray-600 mt-1">
              Welcome, {reviewee.name} - {reviewee.title}
            </p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No reviews found.</p>
            <p className="text-gray-500 text-sm mt-2">Contact your manager if you expected to see reviews here.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Period</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Year</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.map((review) => (
                  <tr key={review.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {formatPeriod(review.period)}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      {review.year}
                    </td>
                    <td className="px-6 py-4">
                      <ReviewStatusBadge status={review.status} />
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <button
                        onClick={() => router.push(`/review/${review.id}/employee`)}
                        className="text-green-600 hover:text-green-800 font-medium"
                      >
                        {review.status === 'pending' ? 'Start Review' : 'View Review'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

