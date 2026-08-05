import { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HeroSection } from './components/HeroSection';
import { OverviewSection } from './components/OverviewSection';
import { ServicesSection } from './components/ServicesSection';
import { PortfolioSection } from './components/PortfolioSection';
import { ComplianceSection } from './components/ComplianceSection';
import { ContactSection } from './components/ContactSection';
import { ProductsPage } from './components/ProductsPage';
import { ProductDetailPage } from './components/ProductDetailPage';
import { PrismBeam } from './components/animations';
import { ShieldCheck } from 'lucide-react';

type Page = 'company' | 'products' | { type: 'product-detail'; categoryId: string };

export default function App() {
  const [currentPage, setCurrentPage] = useState<Page>('company');

  const scrollToSection = useCallback((sectionId: string) => {
    setCurrentPage('company');
    setTimeout(() => {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }, 50);
  }, []);

  const navigateTo = useCallback((page: 'company' | 'products') => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const selectCategory = useCallback((categoryId: string) => {
    setCurrentPage({ type: 'product-detail', categoryId });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleInquireProduct = useCallback((productName: string) => {
    scrollToSection('contact');
  }, [scrollToSection]);

  const isProductDetail = typeof currentPage === 'object' && currentPage.type === 'product-detail';

  return (
    <div className="min-h-screen bg-[#06090F] text-slate-300 flex flex-col selection:bg-primary/30 selection:text-white">
      <Header
        currentPage={currentPage === 'company' ? 'company' : 'products'}
        onScrollTo={scrollToSection}
        onNavigate={navigateTo}
      />

      <main className="flex-grow">
        {currentPage === 'company' ? (
          <>
            <HeroSection onScrollTo={scrollToSection} />
            <PrismBeam className="h-24" />
            <OverviewSection />
            <PrismBeam className="h-24" count={3} colors={["#00D4FF", "#60A5FA", "#5165FF"]} />
            <ServicesSection />
            <PrismBeam className="h-20" count={4} />
            <PortfolioSection />
            <PrismBeam className="h-20" count={3} colors={["#5165FF", "#60A5FA", "#00D4FF"]} />
            <ComplianceSection />
            <PrismBeam className="h-24" count={2} colors={["#00D4FF", "#5165FF"]} />
            <ContactSection />
          </>
        ) : currentPage === 'products' ? (
          <ProductsPage
            onBackToCompany={() => navigateTo('company')}
            onScrollToContact={() => scrollToSection('contact')}
            onSelectCategory={selectCategory}
          />
        ) : isProductDetail ? (
          <ProductDetailPage
            categoryId={(currentPage as { type: 'product-detail'; categoryId: string }).categoryId}
            onBack={() => navigateTo('products')}
            onInquire={handleInquireProduct}
          />
        ) : null}
      </main>

      {/* Compliance bar */}
      <div className="bg-[#080B10] border-t border-[#1E293B]/60 text-slate-500 text-[10px] font-mono py-2.5 px-4 flex items-center justify-center space-x-2 shrink-0">
        <ShieldCheck className="w-3.5 h-3.5 text-primary mr-1" />
        <span>SANS 10114 & SABS Sourcing Compliance Certified</span>
        <span className="hidden sm:inline">•</span>
        <span className="hidden sm:inline">B-BBEE Level 2</span>
      </div>

      <Footer onScrollTo={scrollToSection} />
    </div>
  );
}
