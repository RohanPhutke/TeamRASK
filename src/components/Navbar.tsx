import React from 'react';
import { Menu, X, Home, Info, Phone, Settings } from 'lucide-react';

const Navbar = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  //settings
  return (
    <nav className="bg-white shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <span className="text-xl font-bold text-gray-800">RASK</span>
          </div>
          
          {/* Desktop Menu */}
          <div className="hidden md:flex items-center space-x-8">
            <NavLink icon={<Home size={18} />} text="Home" />
            <NavLink icon={<Info size={18} />} text="About" />
            <NavLink icon={<Phone size={18} />} text="Profile" />
            <NavLink icon={<Settings size={18} />} text="Setting" />
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:text-gray-900 hover:bg-gray-100 focus:outline-none"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <MobileNavLink icon={<Home size={18} />} text="Home" />
            <MobileNavLink icon={<Info size={18} />} text="About" />
            <MobileNavLink icon={<Phone size={18} />} text="Profile" />
            <MobileNavLink icon={<Settings size={18} />} text="Setting" />
          </div>
        </div>
      )}
    </nav>
  );
};

const NavLink = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <a
    href="#"
    className="flex items-center text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
  >
    <span className="mr-2">{icon}</span>
    {text}
  </a>
);

const MobileNavLink = ({ icon, text }: { icon: React.ReactNode; text: string }) => (
  <a
    href="#"
    className="flex items-center text-gray-700 hover:text-gray-900 block px-3 py-2 rounded-md text-base font-medium"
  >
    <span className="mr-2">{icon}</span>
    {text}
  </a>
);

export default Navbar;