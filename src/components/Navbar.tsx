import React from 'react';
import { Menu, X, Home, Info, Phone, Settings } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const navigate = useNavigate();
  
  return (
    <nav className="bg-white/80 backdrop-blur-sm shadow-sm border-b border-gray-200/50 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link 
              to="/" 
              className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent"
            >
              BookPulse
            </Link>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-1">
            <NavLink to="/" icon={<Home size={18} />} text="Home" />
            <NavLink to="/about" icon={<Info size={18} />} text="About" />
            <NavLink to="/profile" icon={<Phone size={18} />} text="Profile" />
            <NavLink to="/settings" icon={<Settings size={18} />} text="Settings" />
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
            <MobileNavLink to="/" icon={<Home size={18} />} text="Home" setIsOpen={setIsOpen} />
            <MobileNavLink to="/about" icon={<Info size={18} />} text="About" setIsOpen={setIsOpen} />
            <MobileNavLink to="/profile" icon={<Phone size={18} />} text="Profile" setIsOpen={setIsOpen} />
            <MobileNavLink to="/settings" icon={<Settings size={18} />} text="Settings" setIsOpen={setIsOpen} />
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