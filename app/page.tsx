'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { verifyAdminPassword, isValidEmail } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [mode, setMode] = useState<'select' | 'admin' | 'employee' | 'manager'>('select');
  const [password, setPassword] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (verifyAdminPassword(password)) {
      router.push('/admin');
    } else {
      setError('Incorrect password');
    }
  };

  const handleEmployeeLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Store email in session storage for authentication
    sessionStorage.setItem('employeeEmail', email);
    router.push(`/employee-reviews?email=${encodeURIComponent(email)}`);
  };

  const handleManagerLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!isValidEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }
    
    // Store email in session storage for authentication
    sessionStorage.setItem('managerEmail', email);
    router.push(`/manager-reviews?email=${encodeURIComponent(email)}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-8">
        {/* Logo */}
        <div className="flex justify-center mb-6">
          <Image
            src="/images/rocscience_logo.jpg"
            alt="Rocscience Logo"
            width={200}
            height={80}
            className="object-contain"
          />
        </div>

        <h1 className="text-3xl font-bold text-gray-900 text-center mb-2">
          Employee Reviews
        </h1>
        <p className="text-gray-600 text-center mb-8">
          Performance Review Management System
        </p>

        {mode === 'select' && (
          <div className="space-y-4">
            <button
              onClick={() => setMode('admin')}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Admin Login
            </button>
            <button
              onClick={() => setMode('employee')}
              className="w-full bg-green-600 text-white py-3 px-4 rounded-lg hover:bg-green-700 transition-colors font-medium"
            >
              Employee Login
            </button>
            <button
              onClick={() => setMode('manager')}
              className="w-full bg-purple-600 text-white py-3 px-4 rounded-lg hover:bg-purple-700 transition-colors font-medium"
            >
              Manager Login
            </button>
          </div>
        )}

        {mode === 'admin' && (
          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Admin Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter admin password"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setMode('select'); setPassword(''); setError(''); }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </button>
            </div>
          </form>
        )}

        {mode === 'employee' && (
          <form onSubmit={handleEmployeeLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Employee Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                placeholder="your.email@rocscience.com"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setMode('select'); setEmail(''); setError(''); }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors"
              >
                Login
              </button>
            </div>
          </form>
        )}

        {mode === 'manager' && (
          <form onSubmit={handleManagerLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Manager Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                placeholder="your.email@rocscience.com"
                required
              />
            </div>
            {error && (
              <div className="text-red-600 text-sm">{error}</div>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => { setMode('select'); setEmail(''); setError(''); }}
                className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Back
              </button>
              <button
                type="submit"
                className="flex-1 bg-purple-600 text-white py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Login
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

