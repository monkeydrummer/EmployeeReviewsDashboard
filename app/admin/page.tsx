'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { verifyAdminPassword } from '@/lib/auth';
import { Review, Reviewee, Manager, CATEGORIES } from '@/lib/types';
import ReviewStatusBadge from '@/components/ReviewStatusBadge';
import { formatPeriod } from '@/lib/utils';

interface ReviewGroup {
  period: 'mid-year' | 'end-year';
  year: number;
  reviews: Review[];
}

export default function AdminPage() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [managers, setManagers] = useState<Manager[]>([]);
  const [reviewees, setReviewees] = useState<Reviewee[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [reviewGroups, setReviewGroups] = useState<ReviewGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  
  // Manager management
  const [showAddManager, setShowAddManager] = useState(false);
  const [newManager, setNewManager] = useState({
    name: '',
    email: '',
    title: ''
  });
  
  // Reviewee management
  const [showAddReviewee, setShowAddReviewee] = useState(false);
  const [newReviewee, setNewReviewee] = useState({
    name: '',
    email: '',
    title: '',
    managerIds: [] as string[]
  });
  
  // Review creation
  const [showCreateReview, setShowCreateReview] = useState(false);
  const [newReview, setNewReview] = useState({
    revieweeId: '',
    period: 'mid-year' as 'mid-year' | 'end-year',
    year: new Date().getFullYear()
  });

  useEffect(() => {
    if (isAuthenticated) {
      fetchData();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Group reviews by period/year
    if (reviews.length > 0) {
      const groups: Map<string, ReviewGroup> = new Map();
      
      reviews.forEach(review => {
        const key = `${review.year}-${review.period}`;
        if (!groups.has(key)) {
          groups.set(key, {
            period: review.period,
            year: review.year,
            reviews: []
          });
        }
        groups.get(key)!.reviews.push(review);
      });
      
      // Sort by year (desc) then period (end-year first)
      const sortedGroups = Array.from(groups.values()).sort((a, b) => {
        if (a.year !== b.year) return b.year - a.year;
        return a.period === 'end-year' ? -1 : 1;
      });
      
      setReviewGroups(sortedGroups);
    } else {
      setReviewGroups([]);
    }
  }, [reviews]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [managersRes, revieweesRes, reviewsRes] = await Promise.all([
        fetch('/api/managers'),
        fetch('/api/reviewees'),
        fetch('/api/reviews')
      ]);
      
      const managersData = await managersRes.json();
      const revieweesData = await revieweesRes.json();
      const reviewsData = await reviewsRes.json();
      
      setManagers(managersData.managers);
      setReviewees(revieweesData.reviewees);
      setReviews(reviewsData.reviews);
    } catch (error) {
      console.error('Error fetching data:', error);
      setMessage('Error loading data');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (verifyAdminPassword(password)) {
      setIsAuthenticated(true);
    } else {
      setMessage('Incorrect password');
    }
  };

  const handleAddManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const manager: Manager = {
        id: `mgr-${Date.now()}`,
        name: newManager.name,
        email: newManager.email,
        title: newManager.title
      };
      
      const response = await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'add', manager })
      });
      
      if (response.ok) {
        setMessage('✓ Manager added successfully');
        setShowAddManager(false);
        setNewManager({ name: '', email: '', title: '' });
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error adding manager');
      }
    } catch (error) {
      setMessage('✗ Error adding manager');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteManager = async (managerId: string) => {
    if (!confirm('Are you sure you want to delete this manager?')) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'delete', manager: { id: managerId } })
      });
      
      if (response.ok) {
        setMessage('✓ Manager deleted');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error deleting manager');
      }
    } catch (error) {
      setMessage('✗ Error deleting manager');
    } finally {
      setLoading(false);
    }
  };

  const handleResetManagerPassword = async (managerEmail: string, managerName: string) => {
    if (!confirm(`Reset password for ${managerName}? They will need to set up a new password on next login.`)) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/managers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'reset-password', email: managerEmail })
      });
      
      if (response.ok) {
        setMessage('✓ Password reset successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error resetting password');
      }
    } catch (error) {
      setMessage('✗ Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  const handleAddReviewee = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const reviewee: Reviewee = {
        id: `emp-${Date.now()}`,
        name: newReviewee.name,
        email: newReviewee.email,
        title: newReviewee.title,
        managerIds: newReviewee.managerIds
      };
      
      const response = await fetch('/api/reviewees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'add', reviewee })
      });
      
      if (response.ok) {
        setMessage('✓ Reviewee added successfully');
        setShowAddReviewee(false);
        setNewReviewee({ name: '', email: '', title: '', managerIds: [] });
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error adding reviewee');
      }
    } catch (error) {
      setMessage('✗ Error adding reviewee');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReviewee = async (revieweeId: string) => {
    if (!confirm('Are you sure you want to delete this reviewee?')) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/reviewees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'delete', reviewee: { id: revieweeId } })
      });
      
      if (response.ok) {
        setMessage('✓ Reviewee deleted');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error deleting reviewee');
      }
    } catch (error) {
      setMessage('✗ Error deleting reviewee');
    } finally {
      setLoading(false);
    }
  };

  const handleResetEmployeePassword = async (employeeEmail: string, employeeName: string) => {
    if (!confirm(`Reset password for ${employeeName}? They will need to set up a new password on next login.`)) return;
    
    setLoading(true);
    try {
      const response = await fetch('/api/reviewees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password, action: 'reset-password', email: employeeEmail })
      });
      
      if (response.ok) {
        setMessage('✓ Password reset successfully');
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error resetting password');
      }
    } catch (error) {
      setMessage('✗ Error resetting password');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateReview = async (e: React.FormEvent) => {
    e.preventDefault();
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
        status: 'not-started',
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
        body: JSON.stringify({ password, action: 'create', review })
      });
      
      if (response.ok) {
        setMessage('✓ Review created successfully');
        setShowCreateReview(false);
        fetchData();
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

  const handleMarkCompleted = async (reviewId: string) => {
    setLoading(true);
    try {
      const review = reviews.find(r => r.id === reviewId);
      if (!review) return;
      
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          action: 'update-status',
          review: { id: reviewId, status: 'completed' }
        })
      });
      
      if (response.ok) {
        setMessage('✓ Review marked as completed');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        setMessage('✗ Error updating review');
      }
    } catch (error) {
      setMessage('✗ Error updating review');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId: string, revieweeName: string) => {
    if (!confirm(`Are you sure you want to delete the review for ${revieweeName}? This action cannot be undone.`)) {
      return;
    }
    
    setLoading(true);
    try {
      const response = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          password,
          action: 'delete',
          reviewId
        })
      });
      
      if (response.ok) {
        setMessage('✓ Review deleted successfully');
        fetchData();
        setTimeout(() => setMessage(''), 3000);
      } else {
        const data = await response.json();
        setMessage(data.error || '✗ Error deleting review');
      }
    } catch (error) {
      setMessage('✗ Error deleting review');
    } finally {
      setLoading(false);
    }
  };

  const getManagerNames = (managerIds: string[]) => {
    return managerIds
      .map(id => managers.find(m => m.id === id)?.name)
      .filter(Boolean)
      .join(', ') || 'No managers';
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
          <div className="flex justify-center mb-6">
            <Image
              src="/images/rocscience_logo.jpg"
              alt="Rocscience Logo"
              width={150}
              height={60}
              className="object-contain"
            />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-6 text-center">Admin Login</h1>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
              />
            </div>
            {message && (
              <div className="mb-4 text-red-600 text-sm">{message}</div>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Login
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">Manage managers, reviewees, and reviews</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => router.push('/admin/change-password')}
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
        {/* Managers Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Managers</h2>
            <button
              onClick={() => setShowAddManager(!showAddManager)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
            >
              + Add Manager
            </button>
          </div>

          {showAddManager && (
            <form onSubmit={handleAddManager} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={newManager.name}
                    onChange={(e) => setNewManager({ ...newManager, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    value={newManager.email}
                    onChange={(e) => setNewManager({ ...newManager, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                  <input
                    type="text"
                    value={newManager.title}
                    onChange={(e) => setNewManager({ ...newManager, title: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  />
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 disabled:bg-gray-400"
                >
                  Add Manager
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddManager(false)}
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
                {managers.map((manager) => (
                  <tr key={manager.id} className="border-t">
                    <td className="px-4 py-3 text-sm text-gray-900">{manager.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{manager.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{manager.title}</td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => handleResetManagerPassword(manager.email, manager.name)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDeleteManager(manager.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Reviewees Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Reviewees (Employees)</h2>
            <button
              onClick={() => setShowAddReviewee(!showAddReviewee)}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
            >
              + Add Reviewee
            </button>
          </div>

          {showAddReviewee && (
            <form onSubmit={handleAddReviewee} className="mb-6 p-4 bg-gray-50 rounded-lg space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Managers (select one or more)</label>
                  <select
                    multiple
                    size={Math.min(managers.length, 4)}
                    value={newReviewee.managerIds}
                    onChange={(e) => {
                      const selected = Array.from(e.target.selectedOptions, option => option.value);
                      setNewReviewee({ ...newReviewee, managerIds: selected });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                    required
                  >
                    {managers.map((manager) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name} ({manager.title})
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">Hold Ctrl (Cmd on Mac) to select multiple</p>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading || newReviewee.managerIds.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 disabled:bg-gray-400"
                >
                  Add Reviewee
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
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Managers</th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {reviewees.map((reviewee) => (
                  <tr key={reviewee.id} className="border-t">
                    <td className="px-4 py-3 text-sm text-gray-900">{reviewee.name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{reviewee.email}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{reviewee.title}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{getManagerNames(reviewee.managerIds)}</td>
                    <td className="px-4 py-3 text-sm space-x-2">
                      <button
                        onClick={() => handleResetEmployeePassword(reviewee.email, reviewee.name)}
                        className="text-orange-600 hover:text-orange-800"
                      >
                        Reset Password
                      </button>
                      <button
                        onClick={() => handleDeleteReviewee(reviewee.id)}
                        className="text-red-600 hover:text-red-800"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* Review Creation Section */}
        <section className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">Create New Review</h2>
          </div>

          <form onSubmit={handleCreateReview} className="p-4 bg-gray-50 rounded-lg space-y-4">
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
            </div>
          </form>
        </section>

        {/* Reviews by Period Section */}
        {reviewGroups.map((group) => (
          <section key={`${group.year}-${group.period}`} className="border border-gray-200 rounded-lg overflow-hidden shadow-md">
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 px-6 py-4">
              <h2 className="text-2xl font-bold text-white">
                {formatPeriod(group.period)} Review {group.year}
              </h2>
              <p className="text-orange-50 text-sm mt-1">
                {group.reviews.length} review{group.reviews.length !== 1 ? 's' : ''}
              </p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Employee</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Title</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Manager(s)</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Status</th>
                    <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {group.reviews.map((review) => {
                    const reviewee = reviewees.find(r => r.id === review.revieweeId);
                    return (
                      <tr key={review.id} className="border-t">
                        <td className="px-4 py-3 text-sm text-gray-900">{reviewee?.name || 'Unknown'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{reviewee?.title || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {reviewee ? getManagerNames(reviewee.managerIds) : '-'}
                        </td>
                        <td className="px-4 py-3">
                          <ReviewStatusBadge status={review.status} />
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-col gap-1">
                            <div className="space-x-2">
                              <button
                                onClick={() => router.push(`/review/${review.id}/view`)}
                                className="text-blue-600 hover:text-blue-800"
                              >
                                View
                              </button>
                              {review.status !== 'completed' && (
                                <button
                                  onClick={() => handleMarkCompleted(review.id)}
                                  className="text-green-600 hover:text-green-800"
                                >
                                  Mark Complete
                                </button>
                              )}
                            </div>
                            <button
                              onClick={() => handleDeleteReview(review.id, reviewee?.name || 'Unknown')}
                              className="text-red-600 hover:text-red-800 text-xs text-left"
                              disabled={loading}
                            >
                              Delete Review
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        {reviewGroups.length === 0 && (
          <section className="bg-white rounded-lg shadow-md p-12 text-center">
            <p className="text-gray-600 text-lg">No reviews created yet.</p>
            <p className="text-gray-500 text-sm mt-2">Create a review to get started.</p>
          </section>
        )}
      </main>
    </div>
  );
}
