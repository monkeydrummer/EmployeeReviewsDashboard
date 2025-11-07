'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Review, Reviewee, Manager } from '@/lib/types';
import ReviewStatusBadge from '@/components/ReviewStatusBadge';
import { formatPeriod } from '@/lib/utils';

export default function ManagerReviewsPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  
  const [manager, setManager] = useState<Manager | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewees, setReviewees] = useState<Reviewee[]>([]);
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
      // Get all data
      const [managersRes, revieweesRes, reviewsRes] = await Promise.all([
        fetch('/api/managers'),
        fetch('/api/reviewees'),
        fetch('/api/reviews')
      ]);
      
      const managersData = await managersRes.json();
      const revieweesData = await revieweesRes.json();
      const reviewsData = await reviewsRes.json();
      
      // Find this manager
      const currentManager = managersData.managers.find((m: Manager) => m.email === email);
      if (!currentManager) {
        setMessage('Manager not found. Please contact admin.');
        setLoading(false);
        return;
      }
      
      setManager(currentManager);
      
      // Find reviewees managed by this manager
      const managedReviewees = revieweesData.reviewees.filter((r: Reviewee) => 
        r.managerIds.includes(currentManager.id)
      );
      
      setReviewees(managedReviewees);
      
      // Filter reviews for these reviewees
      const managedReviews = reviewsData.reviews.filter((review: Review) =>
        managedReviewees.some((r: Reviewee) => r.id === review.revieweeId)
      );
      
      setReviews(managedReviews);
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

  if (message || !manager) {
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Welcome, {manager.name} - {reviewees.length} direct report(s)
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {reviews.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No reviews found for your direct reports.</p>
            <p className="text-gray-500 text-sm mt-2">Contact admin to create reviews.</p>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Employee</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Title</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Period</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Year</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Status</th>
                  <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {reviews.map((review) => {
                  const reviewee = reviewees.find(r => r.id === review.revieweeId);
                  if (!reviewee) return null;
                  
                  return (
                    <tr key={review.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        {reviewee.name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {reviewee.title}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
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
                          onClick={() => router.push(`/review/${review.id}/manager`)}
                          className="text-purple-600 hover:text-purple-800 font-medium"
                        >
                          {review.status === 'completed' ? 'View' : 'Complete Review'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}

