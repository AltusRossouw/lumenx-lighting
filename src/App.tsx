import { useEffect, lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useParams, useLocation } from 'react-router-dom';
import { useSiteContent, loadSiteContent } from './content';
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
import { ProductPage } from './components/ProductPage';
import { DesignToolPage } from './components/DesignToolPage';
import { AuthPage } from './components/AuthPage';
import { AdminPage } from './components/AdminPage';
import { IESLibraryPage } from './components/IESLibraryPage';
import { NotFoundPage } from './components/NotFoundPage';
import { PrivacyPage } from './components/PrivacyPage';
import { FloatingWhatsAppButton } from './components/FloatingWhatsAppButton';
import { ShieldCheck } from 'lucide-react';
import { LumenXMark } from './components/ui/lumenx-mark';

// Lazy-loaded so the OrbitX planner (and its self-contained Tailwind v3
// stylesheet) never loads on the rest of the site.
const PlannerPage = lazy(() => import('./components/PlannerPage'));
const PlannerProPage = lazy(() => import('./components/PlannerProPage'));

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

/** Set per-route <title> and meta description (the SPA ships one static index). */
function SeoManager() {
  const { seo } = useSiteContent();
  const { pathname } = useLocation();

  const SEO_MAP: { match: RegExp; title: string; description?: string }[] = [
    {
      match: /^\/$/,
      title: seo.homeTitle,
      description: seo.homeDescription,
    },
    { match: /^\/the-solution(\/|$)/, title: seo.solutionTitle, description: seo.solutionDescription },
    { match: /^\/products\/[^/]+\/[^/]+$/, title: 'Product Details — LumenX Lighting' },
    { match: /^\/products\/[^/]+$/, title: 'Product Range — LumenX Lighting' },
    { match: /^\/products(\/|$)/, title: seo.productsTitle, description: seo.productsDescription },
    { match: /^\/projects(\/|$)/, title: 'Projects — LumenX Lighting' },
    { match: /^\/resources(\/|$)/, title: 'Technical Resources — LumenX Lighting' },
    { match: /^\/design-tool(\/|$)/, title: 'Lighting Design Tool — LumenX Lighting' },
    { match: /^\/ies(\/|$)/, title: 'IES Downloads — LumenX Lighting' },
    { match: /^\/planner(\/|$)/, title: 'Lighting Planner — LumenX Lighting' },
    { match: /^\/about(\/|$)/, title: 'About — LumenX Lighting' },
    { match: /^\/contact(\/|$)/, title: 'Contact — LumenX Lighting' },
    { match: /^\/privacy(\/|$)/, title: 'Privacy Policy — LumenX Lighting' },
  ];

  useEffect(() => {
    const entry = SEO_MAP.find((e) => e.match.test(pathname));
    if (!entry) return;
    document.title = entry.title;
    if (entry.description) {
      let tag = document.querySelector('meta[name="description"]');
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('name', 'description');
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', entry.description);
    }
  }, [pathname, seo]);
  return null;
}

/** Wrapper that reads :categoryId from the URL and renders ProductDetailPage */
function ProductDetailWrapper() {
  const { categoryId } = useParams<{ categoryId: string }>();

  if (!categoryId) {
    return <div className="py-40 text-center text-[#78716C]">Category not found.</div>;
  }

  return <ProductDetailPage categoryId={categoryId} />;
}

/** Wrapper that reads :categoryId and :slug from the URL and renders ProductPage */
function ProductPageWrapper() {
  const { categoryId, slug } = useParams<{ categoryId: string; slug: string }>();

  if (!categoryId || !slug) {
    return <div className="py-40 text-center text-[#78716C]">Product not found.</div>;
  }

  return <ProductPage categoryId={categoryId} slug={slug} />;
}

function AppLayout() {
  const location = useLocation();
  const { complianceBar } = useSiteContent();

  useEffect(() => {
    loadSiteContent();
  }, []);

  // The OrbitX planner is a full-screen tool with its own header/chrome.
  const isFullscreenTool = location.pathname.startsWith('/planner');

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-300 flex flex-col selection:bg-primary/30 selection:text-white">
      <ScrollToTop />
      <ScrollToHash />
      <SeoManager />

      {!isFullscreenTool && <Header />}

      {!isFullscreenTool && <FloatingWhatsAppButton />}

      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/the-solution" element={<ServicesPage />} />
          <Route path="/services" element={<Navigate to="/the-solution" replace />} />
          <Route path="/products" element={<ProductsPage />} />
          <Route path="/products/:categoryId/:slug" element={<ProductPageWrapper />} />
          <Route path="/products/:categoryId" element={<ProductDetailWrapper />} />
          <Route path="/projects" element={<ProjectsPageWrapper />} />
          <Route path="/resources" element={<ResourcesPage />} />
          <Route path="/design-tool" element={<DesignToolPage />} />
          <Route path="/ies" element={<IESLibraryPage />} />
          <Route path="/account" element={<AuthPage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route
            path="/planner"
            element={
              <Suspense fallback={<div className="flex items-center justify-center py-40 text-slate-400">Loading planner…</div>}>
                <PlannerPage />
              </Suspense>
            }
          />
          <Route
            path="/planner/pro"
            element={
              <Suspense fallback={<div className="flex items-center justify-center py-40 text-slate-400">Loading planner…</div>}>
                <PlannerProPage />
              </Suspense>
            }
          />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>

      {/* Compliance bar */}
      {!isFullscreenTool && (
        <div className="bg-[#080B10] border-t border-[#1E293B]/60 text-slate-500 text-[10px] font-mono py-2.5 px-4 flex items-center justify-center space-x-2 shrink-0">
          <ShieldCheck className="w-3.5 h-3.5 text-primary mr-1" />
          <span>{complianceBar.text}</span>
          <LumenXMark className="hidden sm:inline-block w-2 h-2" />
          <span className="hidden sm:inline">B-BBEE Level 2</span>
        </div>
      )}

      {!isFullscreenTool && <Footer />}
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

