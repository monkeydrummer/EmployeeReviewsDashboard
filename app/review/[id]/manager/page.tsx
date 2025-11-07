'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Review, Reviewee, CATEGORIES, CAREER_DEV_QUESTION, CategoryRating } from '@/lib/types';
import CategoryRatingSelect from '@/components/CategoryRatingSelect';
import OverallScoreInput from '@/components/OverallScoreInput';
import RatingDefinitions from '@/components/RatingDefinitions';
import { formatPeriod, getCategoryRatingColor, getCategoryRatingText } from '@/lib/utils';

export default function ManagerReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params?.id as string;
  
  const [email, setEmail] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [review, setReview] = useState<Review | null>(null);
  const [reviewee, setReviewee] = useState<Reviewee | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (reviewId) {
      const storedEmail = sessionStorage.getItem('managerEmail');
      if (storedEmail) {
        setEmail(storedEmail);
        loadReview(storedEmail);
      }
    }
  }, [reviewId]);

  const loadReview = async (userEmail: string) => {
    setLoading(true);
    try {
      const response = await fetch(`/api/review/${reviewId}`);
      const data = await response.json();
      
      if (response.ok) {
        // Check if user's email matches any manager assigned to this reviewee
        const isManager = data.managers && data.managers.some((m: any) => 
          data.reviewee.managerIds.includes(m.id) && m.email === userEmail
        );
        
        if (isManager) {
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
    sessionStorage.setItem('managerEmail', email);
    loadReview(email);
  };

  const updateCategoryRating = (categoryId: string, rating: CategoryRating) => {
    if (!review) return;
    setReview({
      ...review,
      managerCategoryRatings: {
        ...review.managerCategoryRatings,
        [categoryId]: rating
      }
    });
  };

  const updateComment = (categoryId: string, comment: string) => {
    if (!review) return;
    setReview({
      ...review,
      managerComments: {
        ...review.managerComments,
        [categoryId]: comment
      }
    });
  };

  const handleSave = async () => {
    if (!review) return;
    
    setSaving(true);
    setMessage('');
    
    try {
      // Check if all manager fields are filled to determine status
      const allCategoriesRated = CATEGORIES.every(cat => review.managerCategoryRatings[cat.id] !== null);
      const isComplete = allCategoriesRated && review.managerOverallScore !== null;
      
      let newStatus = review.status;
      if (review.status === 'not-started' || review.status === 'in-progress') {
        newStatus = 'in-progress';
      }
      if (isComplete && (review.status === 'not-started' || review.status === 'in-progress')) {
        newStatus = 'manager-completed';
      }
      
      const updatedReview = {
        ...review,
        status: newStatus
      };
      
      const response = await fetch(`/api/review/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: updatedReview, email })
      });
      
      if (response.ok) {
        setReview(updatedReview);
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

  const handleComplete = async () => {
    if (!review) return;
    
    // Check if all required fields are filled
    const allCategoriesRated = CATEGORIES.every(cat => review.managerCategoryRatings[cat.id] !== null);
    if (!allCategoriesRated || review.managerOverallScore === null) {
      setMessage('✗ Please complete all ratings before submitting');
      return;
    }
    
    setSaving(true);
    setMessage('');
    
    try {
      const updatedReview = {
        ...review,
        status: 'completed' as const,
        completedDate: new Date().toISOString()
      };
      
      const response = await fetch(`/api/review/${reviewId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ review: updatedReview, email })
      });
      
      if (response.ok) {
        setReview(updatedReview);
        setMessage('✓ Review completed successfully!');
      } else {
        setMessage('✗ Error completing review');
      }
    } catch (error) {
      setMessage('✗ Error completing review');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Manager Review Access</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500"
                placeholder="your.email@rocscience.com"
                required
              />
            </div>
            {message && <div className="mb-4 text-red-600 text-sm">{message}</div>}
            <button
              type="submit"
              className="w-full bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700"
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

  const isReadOnly = review.status === 'completed';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-4">
            <Image
              src="/images/rocscience_logo.jpg"
              alt="Rocscience Logo"
              width={150}
              height={60}
              className="object-contain"
            />
            <button
              onClick={() => router.push(`/manager-reviews?email=${encodeURIComponent(email)}`)}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Home
            </button>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Manager Assessment</h1>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <div><span className="font-medium">Employee:</span> {reviewee.name}</div>
              <div><span className="font-medium">Title:</span> {reviewee.title}</div>
              <div><span className="font-medium">Period:</span> {formatPeriod(review.period)} {review.year}</div>
              <div><span className="font-medium">Status:</span> {review.status}</div>
            </div>
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
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800">
            This review has been completed and is now read-only.
          </div>
        )}

        {review.status === 'pending' && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-yellow-800">
            The employee has not yet submitted their self-assessment.
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
            
            {/* Employee Assessment (Read-Only) */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-gray-800">Employee Self-Assessment</h4>
              <div>
                <span className="text-sm font-medium text-gray-700">Rating: </span>
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryRatingColor(review.employeeCategoryRatings[category.id])}`}>
                  {getCategoryRatingText(review.employeeCategoryRatings[category.id])}
                </span>
              </div>
              {review.employeeComments[category.id] && (
                <div>
                  <span className="text-sm font-medium text-gray-700">Comments: </span>
                  <p className="text-sm text-gray-700 mt-1">{review.employeeComments[category.id]}</p>
                </div>
              )}
            </div>
            
            {/* Manager Assessment */}
            <div className="space-y-3 pt-3 border-t border-gray-200">
              <h4 className="font-medium text-gray-800">Your Manager Assessment</h4>
              
              <CategoryRatingSelect
                value={review.managerCategoryRatings[category.id]}
                onChange={(rating) => updateCategoryRating(category.id, rating)}
                disabled={isReadOnly}
                label="Manager Rating"
              />
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Manager Comments
                </label>
                <textarea
                  value={review.managerComments[category.id] || ''}
                  onChange={(e) => updateComment(category.id, e.target.value)}
                  rows={3}
                  disabled={isReadOnly}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
                  placeholder="Provide your assessment and feedback..."
                />
              </div>
            </div>
          </div>
        ))}

        {/* Overall Scores */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
            Overall Scores
          </h3>
          
          {/* Employee Score (Read-Only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Employee Overall Score:</div>
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
              {review.employeeOverallScore !== null ? review.employeeOverallScore.toFixed(2) : 'Not Rated'}
            </span>
          </div>
          
          {/* Manager Score */}
          <OverallScoreInput
            value={review.managerOverallScore}
            onChange={(score) => setReview({ ...review, managerOverallScore: score })}
            disabled={isReadOnly}
            label="Manager Overall Score"
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
          
          {/* Employee Response (Read-Only) */}
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Employee Response:</div>
            <p className="text-sm text-gray-700">
              {review.employeeCareerDev || 'No response provided'}
            </p>
          </div>
          
          {/* Manager Response */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Manager Response & Guidance
            </label>
            <textarea
              value={review.managerCareerDev}
              onChange={(e) => setReview({ ...review, managerCareerDev: e.target.value })}
              rows={6}
              disabled={isReadOnly}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 disabled:bg-gray-100"
              placeholder="Provide guidance and support for the employee's career development..."
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
              onClick={handleComplete}
              disabled={saving}
              className="flex-1 bg-purple-600 text-white py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-400 font-medium"
            >
              {saving ? 'Submitting...' : 'Mark Complete'}
            </button>
          </div>
        )}
      </main>
    </div>
  );
}

