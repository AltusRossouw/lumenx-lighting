import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useParams, useLocation } from 'react-router-dom';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { ServicesPage } from './components/ServicesPage';
import { ProjectsPageWrapper } from './components/ProjectsPageWrapper';
import { ResourcesPage } from './components/ResourcesPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { ProductsPage } from './components/ProductsPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { ShieldCheck } from 'lucide-react';
import { LumenXMark } from './components/ui/lumenx-mark';

/** Scroll to top on every route change */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

/** Scroll to a hash anchor when the URL fragment changes */
function ScrollToHash() {
  const { hash } = useLocation();
  useEffect(() => {
    if (!hash) return;
    // Small delay so the DOM has rendered
    const tid = setTimeout(() => {
      const el = document.querySelector(hash);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }, 100);
    return () => clearTimeout(tid);
  }, [hash]);
  return null;
}

/** Wrapper that reads :categoryId from the URL and renders ProductDetailPage */
function ProductDetailWrapper() {
  const { categoryId } = useParams<{ categoryId: string }>();
  const navigate = useNavigate();

  if (!categoryId) {
    return <div className="py-40 text-center text-[#78716C]">Category not found.</div>;
  }

  return (
    <ProductDetailPage
      categoryId={categoryId}
      onBack={() => navigate('/products')}
      onInquire={() => navigate('/contact')}
    />
  );
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#06090F] text-slate-300 flex flex-col selection:bg-primary/30 selection:text-white">
      <ScrollToTop />
      <ScrollToHash />

      <Header />

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/the-solution" element={<ServicesPage />} />
          <Route path="/services" element={<Navigate to="/the-solution" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:categoryId" element={<ProductDetailWrapper />} />
          <Route path="/projects" element={<ProjectsPageWrapper />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </main>

      {/* Compliance bar */}
      <div className="bg-[#080B10] border-t border-[#1E293B]/60 text-slate-500 text-[10px] font-mono py-2.5 px-4 flex items-center justify-center space-x-2 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-primary mr-1" />
        <span>SANS 10114 & SABS Sourcing Compliance Certified</span>
        <LumenXMark className="hidden sm:inline-block w-2 h-2" />
        <span className="hidden sm:inline">B-BBEE Level 2</span>
      </div>

      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

