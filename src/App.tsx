import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useNavigate, useParams, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'motion/react';
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

/** Page transition animation variants */
const pageVariants = {
  initial: { opacity: 0, y: 20, filter: 'blur(4px)' },
  animate: { opacity: 1, y: 0, filter: 'blur(0px)' },
  exit: { opacity: 0, y: -20, filter: 'blur(4px)' },
};

const pageTransition = {
  duration: 0.4,
  ease: [0.16, 1, 0.3, 1] as const,
};

/** Animated route switch with page transitions */
function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        variants={pageVariants}
        initial="initial"
        animate="animate"
        exit="exit"
        transition={pageTransition}
      >
        <Routes location={location}>
          <Route path="/" element={<HomePage />} />
          <Route path="/services" element={<ServicesPage />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:categoryId" element={<ProductDetailWrapper />} />
          <Route path="/projects" element={<ProjectsPageWrapper />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="*" element={<HomePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
}

/** Set page title based on route */
function PageTitle() {
  const { pathname } = useLocation();
  useEffect(() => {
    const titles: Record<string, string> = {
      '/': 'LumenX Lighting — Lighting, Engineered for Real Projects',
      '/services': 'Services — LumenX Lighting',
      '/products': 'Lighting Products — LumenX Lighting',
      '/projects': 'Projects — LumenX Lighting',
      '/resources': 'Technical Resources — LumenX Lighting',
      '/about': 'About — LumenX Lighting',
      '/contact': 'Contact — LumenX Lighting',
    };
    // Check for product detail pages
    if (pathname.startsWith('/products/')) {
      document.title = 'Product Details — LumenX Lighting';
      return;
    }
    document.title = titles[pathname] || 'LumenX Lighting';
  }, [pathname]);
  return null;
}

function AppLayout() {
  return (
    <div className="min-h-screen bg-[#06090F] text-slate-300 flex flex-col selection:bg-primary/30 selection:text-white">
      <ScrollToTop />
      <ScrollToHash />
      <PageTitle />

      {/* Skip to content link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-primary focus:text-[#06090F] focus:rounded-lg focus:font-semibold focus:text-sm"
      >
        Skip to main content
      </a>

      <Header />

      <main id="main-content" className="flex-grow">
        <AnimatedRoutes />
      </main>

      {/* Compliance bar */}
      <div className="bg-[#080B10] border-t border-[#1E293B]/60 text-slate-500 text-label-sm py-2.5 px-4 flex items-center justify-center gap-x-2 shrink-0" role="contentinfo" aria-label="Compliance certification">
        <ShieldCheck className="w-3.5 h-3.5 text-primary mr-1" aria-hidden="true" />
        <span>SANS 10114 & SABS Sourcing Compliance Certified</span>
        <span className="hidden sm:inline" aria-hidden="true">•</span>
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

