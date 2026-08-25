import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { LOGO_URL } from '../data';

const NAV_ITEMS: { id: string; label: string; path: string }[] = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'services', label: 'The Solution', path: '/the-solution' },
  { id: 'products', label: 'Products', path: '/products' },
  { id: 'projects', label: 'Projects', path: '/projects' },
  { id: 'resources', label: 'Technical Resources', path: '/resources' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'contact', label: 'Contact', path: '/contact' },
];

export const Header: React.FC = () => {
  const location = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#06090F]/95 backdrop-blur-xl border-b border-white/[0.04]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[88px]">
          <Link to="/" className="flex items-center cursor-pointer">
            <img
              src={LOGO_URL}
              alt="LumenX" className="h-20 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </Link>

          <nav className="hidden lg:flex items-center gap-1" aria-label="Primary">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                className={`px-3.5 py-2 text-[13px] font-medium transition-colors duration-200 cursor-pointer font-sans ${isActive(item.path) ? 'text-white' : 'text-slate-500 hover:text-white'}`}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            <Link to="/design-tool" className="btn btn-outline btn-sm">
              Design Tool
            </Link>
            <Link to="/contact" className="btn btn-primary">
              Discuss a Project
            </Link>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="lg:hidden p-2.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-[#0A0D14] border-b border-[#1E293B]">
          <nav className="px-4 py-6 space-y-1" aria-label="Mobile">
            {NAV_ITEMS.map((item) => (
              <Link
                key={item.id}
                to={item.path}
                onClick={() => setIsOpen(false)}
                className={`block w-full text-left px-4 py-3 text-[15px] font-medium transition-colors cursor-pointer font-sans ${isActive(item.path) ? 'text-primary' : 'text-white hover:text-primary'}`}
              >
                {item.label}
              </Link>
            ))}
            <div className="pt-4 px-4 space-y-2">
              <Link to="/design-tool" onClick={() => setIsOpen(false)} className="btn btn-outline btn-block">
                Design Tool
              </Link>
              <Link to="/contact" onClick={() => setIsOpen(false)} className="btn btn-primary btn-block">
                Discuss a Project
              </Link>
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
