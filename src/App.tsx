import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomePage } from './components/HomePage';
import { ServicesPage } from './components/ServicesPage';
import { ProjectsPageWrapper } from './components/ProjectsPageWrapper';
import { ResourcesPage } from './components/ResourcesPage';
import { AboutPage } from './components/AboutPage';
import { ContactPage } from './components/ContactPage';
import { ProductCategoriesSection } from './components/ProductCategoriesSection';
import { ProductsPage } from './components/ProductsPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { ShieldCheck } from 'lucide-react';

type PageName = 'home' | 'services' | 'products' | 'projects' | 'resources' | 'about' | 'contact';
type Page = PageName | { type: 'product-detail'; categoryId: string };

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const navigateTo = useCallback((page: string) => {
    if (page === 'product-detail') return;
    setCurrentPage(page as PageName);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectCategory = useCallback((categoryId: string) => {
    setCurrentPage({ type: 'product-detail', categoryId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleInquireProduct = useCallback((productName: string) => {
    setCurrentPage('contact');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const isProductDetail = typeof currentPage === 'object' && currentPage.type === 'product-detail';
  const pageName: PageName = typeof currentPage === 'string' ? currentPage : 'products';

  const renderPage = () => {
    if (isProductDetail) {
      return (
        <ProductDetailPage
          categoryId={(currentPage as { type: 'product-detail'; categoryId: string }).categoryId}
          onBack={() => navigateTo('products')}
          onInquire={handleInquireProduct}
        />
      );
    }

    switch (pageName) {
      case 'home':
        return <HomePage onNavigate={navigateTo} />;
      case 'services':
        return <ServicesPage onNavigate={navigateTo} />;
      case 'products':
        return (
          <ProductsPage
            onBackToCompany={() => navigateTo('home')}
            onScrollToContact={() => navigateTo('contact')}
            onSelectCategory={selectCategory}
          />
        );
      case 'projects':
        return <ProjectsPageWrapper onNavigate={navigateTo} />;
      case 'resources':
        return <ResourcesPage />;
      case 'about':
        return <AboutPage />;
      case 'contact':
        return <ContactPage />;
      default:
        return <HomePage onNavigate={navigateTo} />;
    }
  };

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-300 flex flex-col selection:bg-primary/30 selection:text-white">
      <Header
        currentPage={pageName}
        onNavigate={navigateTo}
      />

      <main className="flex-grow">
        {renderPage()}
      </main>

      {/* Compliance bar */}
      <div className="bg-[#080B10] border-t border-[#1E293B]/60 text-slate-500 text-[10px] font-mono py-2.5 px-4 flex items-center justify-center space-x-2 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-primary mr-1" />
        <span>SANS 10114 & SABS Sourcing Compliance Certified</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">B-BBEE Level 2</span>
      </div>

      <Footer onNavigate={navigateTo} />
    </div>
  );
}
