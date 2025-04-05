import React from 'react';
import { Menu, X, Home, Info } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BookOpen } from 'lucide-react';
const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <nav className="backdrop-blur-sm bg-white/80 border-b border-gray-200/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <Link
            to="/dashboard"
            className="flex items-center gap-2 group"
          >
            {/* Animated gradient orb (smaller version) */}
            <div className="relative">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-400 via-purple-500 to-indigo-500 rounded-full shadow-lg flex items-center justify-center relative overflow-hidden group-hover:shadow-xl transition-all duration-300">
                {/* Core glow */}
                <div className="absolute inset-0 rounded-full bg-white/5 group-hover:bg-white/10 transition-all duration-300" />

                {/* Tiny particles (visible on hover) */}
                {[...Array(4)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute w-0.5 h-0.5 bg-white rounded-full opacity-0 group-hover:opacity-70 transition-opacity duration-300 animate-orb-particle"
                    style={{
                      top: `${20 + Math.random() * 60}%`,
                      left: `${20 + Math.random() * 60}%`,
                      animationDelay: `${i * 0.15}s`
                    }}
                  />
                ))}

                <BookOpen className="h-4 w-4 text-white" />
              </div>
            </div>

            {/* Text logo with enhanced effects */}
            <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent relative">
              BookPulse
              <span className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-purple-600 blur-md opacity-0 group-hover:opacity-30 transition-opacity duration-300 -z-10" />
            </span>
          </Link>

          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/dashboard" icon={<Home size={18} />} text="Home" />
            <NavLink to="/landing" icon={<Info size={18} />} text="About" />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-lg text-gray-700 hover:bg-gray-100/50 transition-all"
              aria-label="Toggle menu"
            >
              {isOpen ? (
                <X size={24} className="text-indigo-600" />
              ) : (
                <Menu size={24} className="text-gray-600" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu - Glass Panel */}
      {isOpen && (
        <div className="md:hidden bg-white/90 backdrop-blur-sm border-b border-gray-200/50 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-2">
            <MobileNavLink to="/dashboard" icon={<Home size={18} />} text="Home" setIsOpen={setIsOpen} />
            <MobileNavLink to="/landing" icon={<Info size={18} />} text="About" setIsOpen={setIsOpen} />
          </div>
        </div>
      )}
    </nav>
  );
};

// NavLink component (unchanged)
const NavLink = ({ icon, text, to }: { icon: React.ReactNode; text: string; to: string }) => (
  <Link
    to={to}
    className="flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100/50 transition-all group"
  >
    <span className="mr-2 text-indigo-500 group-hover:text-indigo-600 transition-colors">
      {icon}
    </span>
    {text}
  </Link>
);

// Updated MobileNavLink with setIsOpen prop
interface MobileNavLinkProps {
  icon: React.ReactNode;
  text: string;
  to: string;
  setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const MobileNavLink = ({ icon, text, to, setIsOpen }: MobileNavLinkProps) => (
  <Link
    to={to}
    className="flex items-center px-4 py-3 rounded-lg text-base font-medium text-gray-700 hover:text-indigo-600 hover:bg-gray-100/50 transition-all"
    onClick={() => setIsOpen(false)}
  >
    <span className="mr-3 text-indigo-500">{icon}</span>
    {text}
  </Link>
);

export default Navbar;