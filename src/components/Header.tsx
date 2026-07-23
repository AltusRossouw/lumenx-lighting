import React, { useState, useEffect } from 'react';
import { NAV_SECTIONS } from '../data';
import { Menu, X, Package } from 'lucide-react';

interface HeaderProps {
  currentPage: 'company' | 'products';
  onScrollTo: (sectionId: string) => void;
  onNavigate: (page: 'company' | 'products') => void;
}

export const Header: React.FC<HeaderProps> = ({ currentPage, onScrollTo, onNavigate }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const isCompany = currentPage === 'company';

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${scrolled ? 'bg-[#06090F]/95 backdrop-blur-xl border-b border-white/[0.04]' : 'bg-transparent'}`}>
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-[88px]">
          <button onClick={() => onNavigate('company')} className="flex items-center cursor-pointer">
            <img
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCtixXadgYwhrFpYYaLMMI8uPOGQjsG_DLKEAHPRvCRAgNAyGCy7lmjYEH1fvWlL9FygFtBI5PMZwjTHvWdaekRg5hSVnaWyK5JUZixT0tfltpJF47LxVHFh9ZX7PBl9i65v61nci_HTweNE8jid_dOBgjkZMMI-JwlRawshv-poFsQT68QCi3G8_SsZV5Xqya01GgwskWABso8Xz27Pk0ZGdujIo725MFz75FsKbbye49gDJOnhHMT_yfn7_yX72ghPg"
              alt="LumenX" className="h-20 w-auto object-contain"
              referrerPolicy="no-referrer"
            />
          </button>

          <nav className="hidden md:flex items-center gap-1">
            {isCompany ? (
              <>
                {NAV_SECTIONS.filter(s => s.id !== 'hero').map((s) => (
                  <button key={s.id} onClick={() => onScrollTo(s.id)} className="px-3.5 py-2 text-[13px] font-medium text-[#78716C] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer font-sans">
                    {s.label}
                  </button>
                ))}
                <span className="w-px h-5 bg-[#1E293B] mx-2" />
                <button onClick={() => onNavigate('products')} className="flex items-center gap-1.5 px-3.5 py-2 text-[13px] font-semibold text-primary hover:text-[#0052A3] transition-colors cursor-pointer font-sans">
                  <Package className="w-3.5 h-3.5" /> Products
                </button>
              </>
            ) : (
              <button onClick={() => onNavigate('company')} className="px-3.5 py-2 text-[13px] font-medium text-[#78716C] hover:text-[#FFFFFF] transition-colors cursor-pointer font-sans">
                ← Company
              </button>
            )}
          </nav>

          <div className="hidden md:block">
            <button onClick={() => onScrollTo('contact')} className="btn-primary">
              Get in Touch
            </button>
          </div>

          <button onClick={() => setIsOpen(!isOpen)} className="md:hidden p-2.5 text-[#78716C] hover:text-[#FFFFFF] transition-colors cursor-pointer">
            {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {isOpen && (
        <div className="md:hidden bg-[#0A0D14] border-b border-[#1E293B]">
          <div className="px-4 py-6 space-y-1">
            {isCompany ? (
              <>
                {NAV_SECTIONS.filter(s => s.id !== 'hero').map((s) => (
                  <button key={s.id} onClick={() => { onScrollTo(s.id); setIsOpen(false); }} className="block w-full text-left px-4 py-3 text-[15px] font-medium text-[#FFFFFF] hover:text-primary transition-colors cursor-pointer font-sans">
                    {s.label}
                  </button>
                ))}
                <button onClick={() => { onNavigate('products'); setIsOpen(false); }} className="flex items-center gap-2 w-full px-4 py-3 text-[15px] font-semibold text-primary transition-colors cursor-pointer font-sans">
                  <Package className="w-4 h-4" /> Products
                </button>
              </>
            ) : (
              <button onClick={() => { onNavigate('company'); setIsOpen(false); }} className="block w-full text-left px-4 py-3 text-[15px] font-medium text-[#FFFFFF] transition-colors cursor-pointer font-sans">
                ← Company Profile
              </button>
            )}
            <div className="pt-4 px-4">
              <button onClick={() => { onScrollTo('contact'); setIsOpen(false); }} className="btn-primary w-full text-center">
                Get in Touch
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
