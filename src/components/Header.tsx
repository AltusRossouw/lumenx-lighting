import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from './ui/lumenx-button';

const NAV_ITEMS: { id: string; label: string; path: string }[] = [
  { id: 'home', label: 'Home', path: '/' },
  { id: 'services', label: 'Services', path: '/services' },
  { id: 'products', label: 'Products', path: '/products' },
  { id: 'projects', label: 'Projects', path: '/projects' },
  { id: 'resources', label: 'Technical Resources', path: '/resources' },
  { id: 'about', label: 'About', path: '/about' },
  { id: 'contact', label: 'Contact', path: '/contact' },
];

export const Header: React.FC = () => {
  const navigate = useNavigate();
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
          <button onClick={() => navigate('/')} className="flex items-center cursor-pointer" aria-label="LumenX Lighting — Home">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtixXadgYwhrFpYYaLMMI8uPOGQjsG_DLKEAHPRvCRAgNAyGCy7lmjYEH1fvWlL9FygFtBI5PMZwjTHvWdaekRg5hSVnaWyK5JUZixT0tfltpJF47LxVHFh9ZX7PBl9i65v61nci_HTweNE8jid_dOBgjkZMMI-JwlRawshv-poFsQT68QCi3G8_SsZV5Xqya01GgwskWABso8Xz27Pk0ZGdujIo725MFz75FsKbbye49gDJOnhHMT_yfn7_yX72ghPg"
              alt="LumenX Lighting" className="h-20 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </button>

          <nav className="hidden md:flex items-center gap-1" aria-label="Main navigation">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => navigate(item.path)}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`px-3.5 py-2 text-[13px] font-medium transition-colors duration-200 cursor-pointer font-sans ${isActive(item.path) ? 'text-white' : 'text-slate-500 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:block">
            <Button
              size="sm"
              onClick={() => navigate('/contact')}
              aria-label="Discuss a lighting project"
            >
              Discuss a Project
            </Button>
          </div>

          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2.5 text-slate-500 hover:text-white transition-colors cursor-pointer"
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <nav className="md:hidden bg-[#0A0D14] border-b border-[#1E293B]" aria-label="Mobile navigation">
          <div className="px-4 py-6 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { navigate(item.path); setIsOpen(false); }}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`block w-full text-left px-4 py-3 text-[15px] font-medium transition-colors cursor-pointer font-sans ${isActive(item.path) ? 'text-primary' : 'text-white hover:text-primary'}`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-4 px-4">
              <Button
                size="md"
                className="w-full"
                onClick={() => { navigate('/contact'); setIsOpen(false); }}
              >
                Discuss a Project
              </Button>
            </div>
          </div>
        </nav>
      )}
    </header>
  );
};
