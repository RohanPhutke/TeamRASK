import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { BookOpen, AlertCircle, ArrowRight } from 'lucide-react';

const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
      // Sign Up Logic
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (username.length < 3) {
        setError('Username must be at least 3 characters');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    // Simulating authentication (replace with actual backend call)
    if (username && password) {
      login(username);
      navigate('/dashboard');
    } else {
      setError('Please enter valid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-50 to-purple-50 px-4 py-12">
    <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl p-10 border border-white/20">
      {/* BookPulse Branding Header */}
      <div className="text-center">
        <div className="flex justify-center items-center gap-3 mb-3">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <BookOpen className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
            BookPulse
          </h1>
        </div>
        <p className="text-lg text-gray-600 font-medium mb-2">
          Your digital reading companion
        </p>
        
        {/* Form Title */}
        <h2 className="text-2xl font-bold text-gray-800 mt-6 mb-1">
          {isSignUp ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <p className="text-gray-500 mb-6">
          {isSignUp 
            ? 'Join the BookPulse community' 
            : 'Sign in to your personalized library'}
        </p>
      </div>
  
      {/* Form */}
      <form className="space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-4">
          {/* Username Field */}
          <div className="relative group">
            <input
              id="username"
              name="username"
              type="text"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="peer w-full px-4 py-3 rounded-xl border border-gray-300/80 focus:border-transparent focus:ring-2 focus:ring-indigo-500/30 bg-white/95 text-gray-700 placeholder-transparent"
              placeholder="Username"
            />
            <label 
              htmlFor="username" 
              className="absolute left-4 -top-2.5 px-1 text-xs text-gray-500 bg-white transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600"
            >
              Username
            </label>
          </div>
  
          {/* Password Field */}
          <div className="relative group">
            <input
              id="password"
              name="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="peer w-full px-4 py-3 rounded-xl border border-gray-300/80 focus:border-transparent focus:ring-2 focus:ring-indigo-500/30 bg-white/95 text-gray-700 placeholder-transparent"
              placeholder="Password"
            />
            <label 
              htmlFor="password" 
              className="absolute left-4 -top-2.5 px-1 text-xs text-gray-500 bg-white transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600"
            >
              Password
            </label>
          </div>
  
          {/* Confirm Password (Sign Up Only) */}
          {isSignUp && (
            <div className="relative group">
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="peer w-full px-4 py-3 rounded-xl border border-gray-300/80 focus:border-transparent focus:ring-2 focus:ring-indigo-500/30 bg-white/95 text-gray-700 placeholder-transparent"
                placeholder="Confirm Password"
              />
              <label 
                htmlFor="confirm-password" 
                className="absolute left-4 -top-2.5 px-1 text-xs text-gray-500 bg-white transition-all duration-200 peer-placeholder-shown:text-sm peer-placeholder-shown:text-gray-400 peer-placeholder-shown:top-3 peer-focus:-top-2.5 peer-focus:text-xs peer-focus:text-indigo-600"
              >
                Confirm Password
              </label>
            </div>
          )}
        </div>
  
        {/* Error Message */}
        {error && (
          <div className="px-4 py-3 bg-red-50 text-red-600 rounded-lg text-sm flex items-center">
            <AlertCircle className="h-5 w-5 mr-2" />
            {error}
          </div>
        )}
  
        {/* Submit Button */}
        <button
          type="submit"
          className="group relative w-full flex justify-center items-center py-3.5 px-4 border border-transparent text-lg font-medium rounded-xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <span className="absolute left-0 inset-y-0 flex items-center pl-3">
            <ArrowRight className="h-5 w-5 text-indigo-200 group-hover:text-white transition-colors" />
          </span>
          {isSignUp ? 'Get Started' : 'Sign In'}
        </button>
  
        {/* Toggle Sign Up/Sign In */}
        <div className="text-center pt-2">
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            className="text-sm font-medium text-gray-500 hover:text-indigo-600 transition-colors group"
          >
            {isSignUp 
              ? 'Already have an account? ' 
              : "Don't have an account? "}
            <span className="text-indigo-600 group-hover:underline">
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
  );
};

export default AuthPage;