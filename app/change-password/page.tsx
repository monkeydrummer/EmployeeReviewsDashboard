'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function ChangePasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  const role = searchParams?.get('role') as 'employee' | 'manager' || 'employee';
  
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!email || !role) {
      router.push('/');
      return;
    }
    fetchUserInfo();
  }, [email, role]);

  const fetchUserInfo = async () => {
    try {
      const endpoint = role === 'manager' ? '/api/managers' : '/api/reviewees';
      const response = await fetch(endpoint);
      const data = await response.json();
      
      const users = role === 'manager' ? data.managers : data.reviewees;
      const user = users.find((u: any) => u.email === email);
      
      if (user) {
        setName(user.name);
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    // Validation
    if (newPassword.length < 8) {
      setMessage('New password must be at least 8 characters long');
      return;
    }
    
    if (newPassword !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    
    if (currentPassword === newPassword) {
      setMessage('New password must be different from current password');
      return;
    }
    
    setLoading(true);
    
    try {
      const endpoint = role === 'manager' ? '/api/managers' : '/api/reviewees';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'change-password',
          email,
          oldPassword: currentPassword,
          newPassword
        })
      });
      
      if (response.ok) {
        setMessage('✓ Password changed successfully! Redirecting...');
        setTimeout(() => {
          const dashboardUrl = role === 'manager' 
            ? `/manager-reviews?email=${encodeURIComponent(email)}`
            : `/employee-reviews?email=${encodeURIComponent(email)}`;
          router.push(dashboardUrl);
        }, 1500);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Error changing password');
      }
    } catch (error) {
      setMessage('Error changing password');
    } finally {
      setLoading(false);
    }
  };

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
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Change Password</h1>
        {name && (
          <p className="text-gray-600 text-center mb-6">{name}</p>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Email
            </label>
            <input
              type="email"
              value={email}
              disabled
              className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-gray-50"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter current password"
              required
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter new password (min 8 characters)"
              required
              minLength={8}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm new password"
              required
              minLength={8}
            />
          </div>
          
          {message && (
            <div className={`px-4 py-2 rounded-lg text-sm ${
              message.includes('✓') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {message}
            </div>
          )}
          
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 transition-colors"
          >
            {loading ? 'Changing Password...' : 'Change Password'}
          </button>
          
          <button
            type="button"
            onClick={() => {
              const dashboardUrl = role === 'manager' 
                ? `/manager-reviews?email=${encodeURIComponent(email)}`
                : `/employee-reviews?email=${encodeURIComponent(email)}`;
              router.push(dashboardUrl);
            }}
            className="w-full text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Dashboard
          </button>
        </form>
      </div>
    </div>
  );
}

