'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';

export default function SetupPasswordPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams?.get('email') || '';
  const role = searchParams?.get('role') as 'employee' | 'manager' || 'employee';
  const returnTo = searchParams?.get('returnTo') || '';
  
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [name, setName] = useState('');

  useEffect(() => {
    if (!email || !role) {
      router.push('/');
      return;
    }
    // Verify user exists and get their name
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
      } else {
        setMessage('User not found');
      }
    } catch (error) {
      console.error('Error fetching user info:', error);
      setMessage('Error loading user information');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    
    // Validation
    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long');
      return;
    }
    
    if (password !== confirmPassword) {
      setMessage('Passwords do not match');
      return;
    }
    
    setLoading(true);
    
    try {
      const endpoint = role === 'manager' ? '/api/managers' : '/api/reviewees';
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set-password',
          email,
          password
        })
      });
      
      if (response.ok) {
        setMessage('✓ Password set successfully! Redirecting...');
        
        // Store email for authentication
        if (role === 'manager') {
          sessionStorage.setItem('managerEmail', email);
        } else {
          sessionStorage.setItem('employeeEmail', email);
        }
        
        setTimeout(() => {
          if (returnTo) {
            router.push(returnTo);
          } else {
            const dashboardUrl = role === 'manager' 
              ? `/manager-reviews?email=${encodeURIComponent(email)}`
              : `/employee-reviews?email=${encodeURIComponent(email)}`;
            router.push(dashboardUrl);
          }
        }, 1500);
      } else {
        const data = await response.json();
        setMessage(data.error || 'Error setting password');
      }
    } catch (error) {
      setMessage('Error setting password');
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
        
        <h1 className="text-2xl font-bold text-gray-900 mb-2 text-center">Set Up Your Password</h1>
        {name && (
          <p className="text-gray-600 text-center mb-6">Welcome, {name}!</p>
        )}
        <p className="text-gray-600 text-sm text-center mb-6">
          Please create a secure password for your account.
        </p>
        
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
              New Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password (min 8 characters)"
              required
              minLength={8}
              autoFocus
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Confirm password"
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
            {loading ? 'Setting up...' : 'Set Password'}
          </button>
          
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full text-blue-600 hover:text-blue-800 text-sm"
          >
            ← Back to Login
          </button>
        </form>
      </div>
    </div>
  );
}

