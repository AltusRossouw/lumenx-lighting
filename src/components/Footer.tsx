import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT, LOGO_URL } from '../data';
import { Mail, Phone, Globe, ArrowUp } from 'lucide-react';

export const Footer: React.FC = () => {
  const currentYear = new Date().getFullYear();

  const footerLinks = [
    { label: 'The Solution', path: '/the-solution' },
    { label: 'Products', path: '/products' },
    { label: 'Design Tool', path: '/design-tool' },
    // Lighting Planner temporarily disabled for testing — re-add when ready.
    { label: 'Projects', path: '/projects' },
    { label: 'Technical Resources', path: '/resources' },
    { label: 'IES Downloads', path: '/ies' },
    { label: 'About', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'Privacy Policy', path: '/privacy' },
    { label: 'Admin', path: '/admin' },
  ];

  return (
    <footer className="relative bg-[#04070D] border-t border-[#1E293B] text-[#64748B] pt-16 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10 mb-12">
          {/* Brand */}
          <div className="md:col-span-5 space-y-5">
            <div className="flex items-center gap-4">
              <img
                src={LOGO_URL}
                alt="LumenX" className="h-8 w-auto object-contain opacity-70 hover:opacity-100 transition-opacity duration-300"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed max-w-sm font-sans font-light">
              {CONTACT.tagline}. Technically driven lighting solutions serving retail, commercial, and industrial projects across South Africa.
            </p>
          </div>

          {/* Nav */}
          <div className="md:col-span-3">
            <h4 className="font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-4">Navigation</h4>
            <ul className="space-y-2.5">
              {footerLinks.map((link) => (
                <li key={link.label}>
                  <Link to={link.path} className="text-xs text-[#64748B] hover:text-[#FFFFFF] transition-colors duration-200 cursor-pointer font-sans">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div className="md:col-span-4">
            <h4 className="font-mono text-[11px] font-semibold text-slate-500 uppercase tracking-[0.2em] mb-4">Contact</h4>
            <ul className="space-y-3 text-xs">
              <li className="flex items-center gap-3">
                <Mail className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                <a href={`mailto:${CONTACT.email}`} className="text-[#64748B] hover:text-[#FFFFFF] transition-colors duration-200 font-sans">{CONTACT.email}</a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                <span className="text-[#64748B] font-sans">{CONTACT.phone}</span>
              </li>
              <li className="flex items-center gap-3">
                <Globe className="w-3.5 h-3.5 text-[#64748B] shrink-0" />
                <span className="text-[#64748B] font-sans">{CONTACT.website}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-8 border-t border-[#1E293B]">
          <p className="text-[10px] text-[#64748B] font-mono">
            © {currentYear} LumenX Lighting Solutions
          </p>
          <div className="flex items-center gap-6 text-[10px] text-[#64748B] font-mono">
            <span>B-BBEE Level 2</span>
            <span>SABS Compliant</span>
            <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="flex items-center gap-1.5 text-[#64748B] hover:text-[#FFFFFF] transition-colors cursor-pointer">
              Back to top <ArrowUp className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
