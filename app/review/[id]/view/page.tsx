'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { Review, Reviewee, CATEGORIES, CAREER_DEV_QUESTION } from '@/lib/types';
import { formatPeriod, getCategoryRatingColor, getCategoryRatingText, formatOverallScore } from '@/lib/utils';
import RatingDefinitions from '@/components/RatingDefinitions';
import ReviewStatusBadge from '@/components/ReviewStatusBadge';

export default function ViewReviewPage() {
  const params = useParams();
  const router = useRouter();
  const reviewId = params.id as string;
  
  const [review, setReview] = useState<Review | null>(null);
  const [reviewee, setReviewee] = useState<Reviewee | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState('');

  useEffect(() => {
    loadReview();
  }, [reviewId]);

  const loadReview = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/review/${reviewId}`);
      const data = await response.json();
      
      if (response.ok) {
        setReview(data.review);
        setReviewee(data.reviewee);
      } else {
        setMessage('Review not found');
      }
    } catch (error) {
      setMessage('Error loading review');
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = () => {
    window.open(`/api/review/${reviewId}/pdf`, '_blank');
  };

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
            <div className="flex gap-2">
              <button
                onClick={handleExportPDF}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Export PDF
              </button>
              <button
                onClick={() => router.push('/admin')}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back to Admin
              </button>
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Review Summary</h1>
            <div className="text-sm text-gray-600 mt-2 space-y-1">
              <div><span className="font-medium">Employee:</span> {reviewee.name}</div>
              <div><span className="font-medium">Title:</span> {reviewee.title}</div>
              <div><span className="font-medium">Period:</span> {formatPeriod(review.period)} {review.year}</div>
              <div className="flex items-center gap-2">
                <span className="font-medium">Status:</span>
                <ReviewStatusBadge status={review.status} />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Category Ratings */}
        {CATEGORIES.map((category) => (
          <div key={category.id} className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
            <div className="border-b border-gray-200 pb-3">
              <h3 className="text-lg font-semibold text-gray-900">{category.name}</h3>
              <p className="text-sm text-gray-600 mt-1">
                Core Value: <span className="font-medium text-blue-600">{category.coreValue}</span>
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Employee Assessment */}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-800">Employee Self-Assessment</h4>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryRatingColor(review.employeeCategoryRatings[category.id])}`}>
                    {getCategoryRatingText(review.employeeCategoryRatings[category.id])}
                  </span>
                </div>
                {review.employeeComments[category.id] && (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Comments:</span>
                    <p className="mt-1">{review.employeeComments[category.id]}</p>
                  </div>
                )}
              </div>
              
              {/* Manager Assessment */}
              <div className="bg-purple-50 rounded-lg p-4 space-y-3">
                <h4 className="font-medium text-gray-800">Manager Assessment</h4>
                <div>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getCategoryRatingColor(review.managerCategoryRatings[category.id])}`}>
                    {getCategoryRatingText(review.managerCategoryRatings[category.id])}
                  </span>
                </div>
                {review.managerComments[category.id] && (
                  <div className="text-sm text-gray-700">
                    <span className="font-medium">Comments:</span>
                    <p className="mt-1">{review.managerComments[category.id]}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        {/* Overall Scores */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
            Overall Scores
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Employee Overall Score:</div>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-blue-100 text-blue-800">
                {formatOverallScore(review.employeeOverallScore)}
              </span>
            </div>
            <div className="bg-purple-50 rounded-lg p-4">
              <div className="text-sm font-medium text-gray-700 mb-2">Manager Overall Score:</div>
              <span className="inline-flex items-center px-4 py-2 rounded-full text-lg font-medium bg-purple-100 text-purple-800">
                {formatOverallScore(review.managerOverallScore)}
              </span>
            </div>
          </div>
        </div>

        {/* Career Development */}
        <div className="bg-white rounded-lg border border-gray-200 p-6 space-y-4">
          <h3 className="text-lg font-semibold text-gray-900 border-b border-gray-200 pb-3">
            Career Development
          </h3>
          <div className="bg-blue-50 rounded-lg p-4 text-sm text-gray-700 italic">
            {CAREER_DEV_QUESTION}
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Employee Response:</div>
            <p className="text-sm text-gray-700">
              {review.employeeCareerDev || 'No response provided'}
            </p>
          </div>
          
          <div className="bg-purple-50 rounded-lg p-4">
            <div className="text-sm font-medium text-gray-700 mb-2">Manager Response:</div>
            <p className="text-sm text-gray-700">
              {review.managerCareerDev || 'No response provided'}
            </p>
          </div>
        </div>

        {/* Rating Definitions */}
        <RatingDefinitions />

        {review.completedDate && (
          <div className="text-center text-sm text-gray-600">
            Review completed on {new Date(review.completedDate).toLocaleDateString()}
          </div>
        )}
      </main>
    </div>
  );
}

