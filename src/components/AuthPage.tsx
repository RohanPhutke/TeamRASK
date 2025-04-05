import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
import { BookOpen} from 'lucide-react';


const BACKD_URL = import.meta.env.VITE_BACKD_URL;
console.log(BACKD_URL)
const AuthPage: React.FC = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (isSignUp) {
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
      try {
        const response = await fetch(`${BACKD_URL}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ username, password }),
        });
        if (!response.ok) {
          throw new Error('Registration failed');
        }
        login(username,password);
        navigate('/dashboard');
      } catch (error) {
        setError('Registration failed');
      }
      return;
    }

    try {
      const response = await fetch(`${BACKD_URL}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      if (!response.ok) {
        throw new Error('Invalid credentials');
      }
      login(username,password);
      navigate('/dashboard');
    } catch (error) {
      setError('Invalid credentials');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat px-4 py-12"
    style={{
      backgroundImage: "url('/assets/backgroundImg.png')",
    }}>
  <div className="max-w-md w-full space-y-8 bg-white/90 backdrop-blur-sm shadow-2xl rounded-3xl p-10 border border-white/20 transition-all duration-300 hover:shadow-3xl hover:bg-white/95">
    <div className="text-center">
      {/* Enhanced Logo with Particle Effects */}
      <div className="flex justify-center items-center gap-3 mb-3 relative">
        {/* Gradient Orb with Particles */}
        <div className="relative group">
          <div className="w-12 h-12 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg relative overflow-hidden transition-all duration-300 group-hover:shadow-xl group-hover:scale-105">
            {/* Core glow */}
            <div className="absolute inset-0 rounded-xl bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            
            {/* Particles */}
            {[...Array(5)].map((_, i) => (
              <div 
                key={i}
                className="absolute w-1 h-1 bg-white rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                style={{
                  top: `${Math.random() * 100}%`,
                  left: `${Math.random() * 100}%`,
                  transform: 'scale(0)',
                  transitionDelay: `${i * 0.1}s`,
                }}
              />
            ))}
            
            <BookOpen className="h-6 w-6 text-white z-10 transition-transform duration-300 group-hover:scale-110" />
          </div>
        </div>
        
        {/* Text Logo with Glow Effect */}
        <div className="relative group">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent relative z-10">
            BookPulse
          </h1>
          <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-xl opacity-0 group-hover:opacity-30 -z-0 transition-opacity duration-500" />
        </div>
      </div>
      
      <p className="text-lg text-gray-600 font-medium mb-2 transition-all duration-300 hover:text-gray-800">
        Your digital reading companion
      </p>
      
      <div className="relative overflow-hidden rounded-lg mt-6 mb-1">
        <h2 className="text-2xl font-bold text-gray-800 relative z-10">
          {isSignUp ? 'Create Your Account' : 'Welcome Back'}
        </h2>
        <div className="absolute bottom-0 left-0 h-1 bg-gradient-to-r from-indigo-400 to-purple-400 w-0 group-hover:w-full transition-all duration-500" />
      </div>
      
      <p className="text-gray-500 mb-6 transition-all duration-300 hover:text-gray-700">
        {isSignUp ? 'Join the BookPulse community' : 'Sign in to your personalized library'}
      </p>
    </div>
    
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-4">
        <div className="relative">
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:shadow-sm"
            required
          />
          <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 w-0 group-hover:w-full transition-all duration-300" />
        </div>
        
        <div className="relative">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:shadow-sm"
            required
          />
          <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 w-0 group-hover:w-full transition-all duration-300" />
        </div>
        
        {isSignUp && (
          <div className="relative">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="Confirm Password"
              className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all duration-300 hover:shadow-sm"
              required
            />
            <div className="absolute bottom-0 left-0 h-0.5 bg-gradient-to-r from-indigo-400 to-purple-400 w-0 group-hover:w-full transition-all duration-300" />
          </div>
        )}
      </div>
      
      {error && (
        <div className="text-red-600 text-sm animate-pulse">{error}</div>
      )}
      
      <button 
        type="submit" 
        className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white py-3 rounded-xl shadow-md hover:shadow-lg hover:from-indigo-500 hover:to-purple-500 transition-all duration-300 relative overflow-hidden group"
      >
        <span className="relative z-10">{isSignUp ? 'Sign Up' : 'Sign In'}</span>
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 to-purple-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
      </button>
      
      <button
        type="button"
        onClick={() => setIsSignUp(!isSignUp)}
        className="text-sm text-indigo-600 mt-2 hover:text-purple-600 transition-colors duration-300 flex items-center justify-center gap-1 mx-auto"
      >
        {isSignUp ? 'Already have an account? Sign In' : 'Don\'t have an account? Sign Up'}
        <svg 
          xmlns="http://www.w3.org/2000/svg" 
          width="16" 
          height="16" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round"
          className="transition-transform duration-300 group-hover:translate-x-1"
        >
          <path d="M5 12h14M12 5l7 7-7 7" />
        </svg>
      </button>
    </form>
  </div>
</div>
  );
};

export default AuthPage;
