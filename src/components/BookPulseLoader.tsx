// components/BookPulseLoader.tsx
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
const LoadingPage = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(false);
  const [currentPath, setCurrentPath] = useState(location.pathname);

  useEffect(() => {
    if (location.pathname !== currentPath) {
      setLoading(true);
      setCurrentPath(location.pathname);
      
      // Simulate loading completion
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [location, currentPath]);

  if (!loading) return null;

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-white/90 backdrop-blur-sm z-50" aria-live="polite">
    {/* Floating gradient orb with particle effects */}
    <div className="relative mb-8 animate-float">
      <div className="w-20 h-20 bg-gradient-to-br from-indigo-400 via-purple-500 to-indigo-500 rounded-full shadow-2xl flex items-center justify-center relative overflow-hidden">
        {/* Core glow */}
        <div className="absolute inset-0 rounded-full bg-white/5 animate-pulse-glow" />
        
        {/* Particles */}
        {[...Array(8)].map((_, i) => (
          <div 
            key={i}
            className="absolute w-1 h-1 bg-white rounded-full animate-orb-particle"
            style={{
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              animationDelay: `${i * 0.2}s`
            }}
          />
        ))}
        
        <BookOpen className="h-8 w-8 text-white z-10" />
      </div>
    </div>
  
    {/* Enhanced logo with depth */}
    <div className="relative">
      <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent relative z-10">
        BookPulse
      </h1>
      <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-xl opacity-30 -z-0 animate-text-glow" />
    </div>
  </div>
  );
};


export default LoadingPage;