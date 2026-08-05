import React, { useState, useEffect } from 'react';
import { Menu, X } from 'lucide-react';

type PageName = 'home' | 'services' | 'products' | 'projects' | 'resources' | 'about' | 'contact';

interface HeaderProps {
  currentPage: PageName | 'product-detail';
  onNavigate: (page: string) => void;
}

const NAV_ITEMS: { id: PageName; label: string }[] = [
  { id: 'home', label: 'Home' },
  { id: 'services', label: 'Services' },
  { id: 'products', label: 'Products' },
  { id: 'projects', label: 'Projects' },
  { id: 'resources', label: 'Technical Resources' },
  { id: 'about', label: 'About' },
  { id: 'contact', label: 'Contact' },
];

export const Header: React.FC<HeaderProps> = ({ currentPage, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const isActive = (id: string) => {
    if (id === 'products' && currentPage === 'product-detail') return true;
    return currentPage === id;
  };

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#06090F]/95 backdrop-blur-xl border-b border-white/[0.04]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[88px]">
          <button onClick={() => onNavigate('home')} className="flex items-center cursor-pointer">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtixXadgYwhrFpYYaLMMI8uPOGQjsG_DLKEAHPRvCRAgNAyGCy7lmjYEH1fvWlL9FygFtBI5PMZwjTHvWdaekRg5hSVnaWyK5JUZixT0tfltpJF47LxVHFh9ZX7PBl9i65v61nci_HTweNE8jid_dOBgjkZMMI-JwlRawshv-poFsQT68QCi3G8_SsZV5Xqya01GgwskWABso8Xz27Pk0ZGdujIo725MFz75FsKbbye49gDJOnhHMT_yfn7_yX72ghPg"
              alt="LumenX" className="h-20 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setIsOpen(false); }}
                className={`px-3.5 py-2 text-[13px] font-medium transition-colors duration-200 cursor-pointer font-sans ${isActive(item.id) ? 'text-white' : 'text-slate-500 hover:text-white'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          <div className="hidden md:block">
            <button
              onClick={() => onNavigate('contact')}
              className="px-5 py-2.5 bg-primary text-[#06090F] font-semibold text-[13px] tracking-wide transition-all duration-300 cursor-pointer font-display hover:shadow-[0_0_30px_rgba(0,212,255,0.3)]"
            >
              Discuss a Project
            </button>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2.5 text-slate-500 hover:text-white transition-colors cursor-pointer">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#0A0D14] border-b border-[#1E293B]">
          <div className="px-4 py-6 space-y-1">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                onClick={() => { onNavigate(item.id); setIsOpen(false); }}
                className={`block w-full text-left px-4 py-3 text-[15px] font-medium transition-colors cursor-pointer font-sans ${isActive(item.id) ? 'text-primary' : 'text-white hover:text-primary'}`}
              >
                {item.label}
              </button>
            ))}
            <div className="pt-4 px-4">
              <button
                onClick={() => { onNavigate('contact'); setIsOpen(false); }}
                className="w-full px-5 py-3 bg-primary text-[#06090F] font-semibold text-sm text-center cursor-pointer font-display"
              >
                Discuss a Project
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
