'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Review, Reviewee, CATEGORIES, CAREER_DEV_QUESTION, CategoryRating } from '@/lib/types';
import CategoryRatingSelect from '@/components/CategoryRatingSelect';
import OverallScoreInput from '@/components/OverallScoreInput';
import RatingDefinitions from '@/components/RatingDefinitions';
import { formatPeriod } from '@/lib/utils';

export default function EmployeeReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;
  
  const [email, setEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewee, setReviewee] = useState<Reviewee | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const storedEmail = sessionStorage.getItem('employeeEmail');
    if (storedEmail) {
      setEmail(storedEmail);
      loadReview(storedEmail);
    }
  }, [reviewId]);

  const loadReview = async (userEmail: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/review/${reviewId}`);
      const data = await response.json();
      
      if (response.ok) {
        if (data.reviewee.email === userEmail) {
          setReview(data.review);
          setReviewee(data.reviewee);
          setIsAuthenticated(true);
        } else {
          setMessage('You do not have permission to access this review');
        }
      } else {
        setMessage('Review not found');
      }
    } catch (error) {
      setMessage('Error loading review');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    sessionStorage.setItem('employeeEmail', email);
    loadReview(email);
  };

  const updateCategoryRating = (categoryId: string, rating: CategoryRating) => {
    if (!review) return;
    setReview({
      ...review,
      employeeCategoryRatings: {
        ...review.employeeCategoryRatings,
        [categoryId]: rating
      }
    });
  };

  const updateComment = (categoryId: string, comment: string) => {
    if (!review) return;
    setReview({
      ...review,
      employeeComments: {
        ...review.employeeComments,
        [categoryId]: comment
      }
    });
  };

  const handleSave = async () => {
    if (!review) return;
    
    setSaving(true);
    setMessage('');
    
    try {
      const response = await fetch(`/api/review/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review, email })
      });
      
      if (response.ok) {
        setMessage('✓ Changes saved successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error saving changes');
      }
    } catch (error) {
      setMessage('✗ Error saving changes');
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!review) return;
    
    // Check if all required fields are filled
    const allCategoriesRated = CATEGORIES.every(cat => review.employeeCategoryRatings[cat.id] !== null);
    if (!allCategoriesRated || review.employeeOverallScore === null) {
      setMessage('✗ Please complete all ratings before submitting');
      return;
    }
    
    setSaving(true);
    setMessage('');
    
    try {
      const updatedReview = {
        ...review,
        status: 'employee-submitted' as const
      };
      
      const response = await fetch(`/api/review/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: updatedReview, email })
      });
      
      if (response.ok) {
        setReview(updatedReview);
        setMessage('✓ Review submitted successfully! Your manager will now complete their assessment.');
      } else {
        setMessage('✗ Error submitting review');
      }
    } catch (error) {
      setMessage('✗ Error submitting review');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Employee Review Access</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                placeholder="your.email@rocscience.com"
                required
              />
            </div>
            {message && <div className="mb-4 text-red-600 text-sm">{message}</div>}
            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700"
            >
              Access Review
            </button>
            <button
              type="button"
              onClick={() => router.push('/')}
              className="w-full mt-2 text-blue-600 hover:text-blue-800 text-sm"
            >
              ← Back to Home
            </button>
          </form>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!review || !reviewee) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="text-red-600">{message || 'Review not found'}</div>
      </div>
    );
  }

  const isReadOnly = review.status !== 'pending' && review.status !== 'employee-submitted';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Self-Assessment Review</h1>
              <div className="text-sm text-gray-600 mt-2 space-y-1">
                <div><span className="font-medium">Employee:</span> {reviewee.name}</div>
                <div><span className="font-medium">Title:</span> {reviewee.title}</div>
                <div><span className="font-medium">Period:</span> {formatPeriod(review.period)} {review.year}</div>
                <div><span className="font-medium">Status:</span> {review.status}</div>
              </div>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Home
            </button>
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

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {isReadOnly && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-blue-800">
            This review has been submitted and is now read-only. Your manager will complete their assessment.
          </div>
        )}

        {/* Category Ratings */}
        {CATEGORIES.map((category) => (
          <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Core Value: <span className="font-medium text-blue-600">{category.coreValue}</span>
              </p>
            </div>
            
            <CategoryRatingSelect
              value={review.employeeCategoryRatings[category.id]}
              onChange={(rating) => updateCategoryRating(category.id, rating)}
              disabled={isReadOnly}
              label="Your Rating"
            />
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Comments
              </label>
              <textarea
                value={review.employeeComments[category.id] || ''}
                onChange={(e) => updateComment(category.id, e.target.value)}
                rows={3}
                disabled={isReadOnly}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
                placeholder="Share your thoughts on this category..."
              />
            </div>
          </div>
        ))}

        {/* Overall Score */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
            Overall Self-Assessment Score
          </h3>
          <OverallScoreInput
            value={review.employeeOverallScore}
            onChange={(score) => setReview({ ...review, employeeOverallScore: score })}
            disabled={isReadOnly}
            label="Your Overall Score"
          />
        </div>

        {/* Career Development */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
            Career Development
          </h3>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 italic">
            {CAREER_DEV_QUESTION}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Your Response
            </label>
            <textarea
              value={review.employeeCareerDev}
              onChange={(e) => setReview({ ...review, employeeCareerDev: e.target.value })}
              rows={6}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 disabled:bg-gray-100"
              placeholder="Share your career development goals and aspirations..."
            />
          </div>
        </div>

        {/* Rating Definitions */}
        <RatingDefinitions />

        {/* Action Buttons */}
        {!isReadOnly && (
          <div className="flex gap-4 sticky bottom-4">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 disabled:bg-gray-400 font-medium"
            >
              {saving ? 'Saving...' : 'Save Progress'}
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="flex-1 bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 disabled:bg-gray-400 font-medium"
            >
              {saving ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

