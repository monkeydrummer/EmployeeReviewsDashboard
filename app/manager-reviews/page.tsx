'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Review, Reviewee, Manager, CATEGORIES } from '@/lib/types';
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
  
  // Reviewee management
  const [showAddReviewee, setShowAddReviewee] = useState(false);
  const [newReviewee, setNewReviewee] = useState({
    name: '',
    email: '',
    title: ''
  });
  
  // Review creation
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [newReview, setNewReview] = useState({
    revieweeId: '',
    period: 'mid-year' as 'mid-year' | 'end-year',
    year: new Date().getFullYear()
  });

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

  const handleAddReviewee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manager) return;
    
    setLoading(true);
    try {
      const reviewee: Reviewee = {
        id: `emp-${Date.now()}`,
        name: newReviewee.name,
        email: newReviewee.email,
        title: newReviewee.title,
        managerIds: [manager.id] // Assign to this manager
      };
      
      const response = await fetch('/api/reviewees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          managerEmail: email, 
          action: 'add', 
          reviewee 
        })
      });
      
      if (response.ok) {
        setMessage('✓ Employee added successfully');
        setShowAddReviewee(false);
        setNewReviewee({ name: '', email: '', title: '' });
        loadData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error adding employee');
      }
    } catch (error) {
      setMessage('✗ Error adding employee');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReviewee = async (revieweeId: string) => {
    if (!confirm('Are you sure you want to remove this employee from your team?')) return;
    if (!manager) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/reviewees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          managerEmail: email, 
          action: 'delete', 
          reviewee: { id: revieweeId } 
        })
      });
      
      if (response.ok) {
        setMessage('✓ Employee removed');
        loadData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error removing employee');
      }
    } catch (error) {
      setMessage('✗ Error removing employee');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manager) return;
    
    setLoading(true);
    try {
      const initialRatings: Record<string, null> = {};
      CATEGORIES.forEach(cat => {
        initialRatings[cat.id] = null;
      });
      
      const review: Review = {
        id: `rev-${newReview.year}-${newReview.period}-${newReview.revieweeId}-${Date.now()}`,
        revieweeId: newReview.revieweeId,
        period: newReview.period,
        year: newReview.year,
        status: 'pending',
        employeeCategoryRatings: initialRatings,
        managerCategoryRatings: initialRatings,
        employeeOverallScore: null,
        managerOverallScore: null,
        employeeComments: {},
        managerComments: {},
        employeeCareerDev: '',
        managerCareerDev: ''
      };
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          managerEmail: email, 
          action: 'create', 
          review 
        })
      });
      
      if (response.ok) {
        setMessage('✓ Review created successfully');
        setShowCreateReview(false);
        loadData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error creating review');
      }
    } catch (error) {
      setMessage('✗ Error creating review');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !manager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (message && !manager) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="text-red-600 mb-4">{message}</div>
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
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
            >
              Logout
            </button>
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manager Dashboard</h1>
            <p className="text-gray-600 mt-1">
              Welcome, {manager?.name} - {reviewees.length} direct report(s)
            </p>
          </div>
          {message && (
            <div className={`mt-4 px-4 py-2 rounded-lg ${
              message.includes('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        {/* Reviewees Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">My Team</h2>
            <button
              onClick={() => setShowAddReviewee(!showAddReviewee)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Team Member
            </button>
          </div>

          {showAddReviewee && (
            <form onSubmit={handleAddReviewee} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newReviewee.name}
                    onChange={(e) => setNewReviewee({ ...newReviewee, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newReviewee.email}
                    onChange={(e) => setNewReviewee({ ...newReviewee, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newReviewee.title}
                    onChange={(e) => setNewReviewee({ ...newReviewee, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  Add Team Member
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddReviewee(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Name</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Email</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviewees.map((reviewee) => (
                  <tr key={reviewee.id} className="border-t">
                    <td className="px-4 py-3 text-sm text-gray-900">{reviewee.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{reviewee.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{reviewee.title}</td>
                    <td className="px-4 py-3 text-sm">
                      <button
                        onClick={() => handleDeleteReviewee(reviewee.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reviews Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Reviews</h2>
            <button
              onClick={() => setShowCreateReview(!showCreateReview)}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              disabled={reviewees.length === 0}
            >
              + Create Review
            </button>
          </div>

          {reviewees.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              <p>Add team members first to create reviews</p>
            </div>
          )}

          {showCreateReview && reviewees.length > 0 && (
            <form onSubmit={handleCreateReview} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Employee</label>
                  <select
                    value={newReview.revieweeId}
                    onChange={(e) => setNewReview({ ...newReview, revieweeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    <option value="">Select Employee</option>
                    {reviewees.map((reviewee) => (
                      <option key={reviewee.id} value={reviewee.id}>
                        {reviewee.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                  <select
                    value={newReview.period}
                    onChange={(e) => setNewReview({ ...newReview, period: e.target.value as any })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  >
                    <option value="mid-year">Mid-Year</option>
                    <option value="end-year">End-Year</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
                  <input
                    type="number"
                    value={newReview.year}
                    onChange={(e) => setNewReview({ ...newReview, year: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400"
                >
                  Create Review
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateReview(false)}
                  className="bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {reviews.length > 0 && (
            <div className="overflow-x-auto">
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
        </section>
      </main>
    </div>
  );
}
