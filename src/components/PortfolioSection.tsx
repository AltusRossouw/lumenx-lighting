import { motion } from 'motion/react';
import { PRODUCT_CATEGORIES, INDUSTRIES } from '../data';
import { Building2, Factory, ShoppingBag, GraduationCap, Hotel, Landmark, Heart, FlaskConical } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { LightBloom } from './animations';

const industryIcons: Record<string, LucideIcon> = {
  'Commercial developments': Building2,
  'Education': GraduationCap,
  'Retail centres': ShoppingBag,
  'Industrial facilities': Factory,
  'Hospitality': Hotel,
  'Government and infrastructure': Landmark,
  'Healthcare': Heart,
  'Explosive Environments': FlaskConical,
};

export const PortfolioSection: React.FC = () => {
  return (
    <section id="portfolio" className="py-20 sm:py-28 relative overflow-hidden">
        <div className="spotlight" style={{ top: '30%', height: '35%', animationDelay: '3s' }} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-mono text-xs tracking-[0.3em] uppercase">
            Product Portfolio
          </span>
          <h2 className="text-3xl sm:text-4xl font-semibold text-[#FFFFFF] mt-3 mb-4 font-display">
            Lighting <span className="text-primary">Categories</span>
          </h2>
          <p className="text-[#64748B] max-w-2xl mx-auto">
            Our portfolio is shaped around practical project demands, allowing us to support a wide range of
            environments without compromising on technical fit, quality, or compliance.
          </p>
        </motion.div>

        {/* Product Category Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-20">
          {PRODUCT_CATEGORIES.map((category, i) => (
            <LightBloom key={i} delay={i * 0.08} bloomIntensity={0.3}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.5, delay: i * 0.08 }}
                  className="gradient-border-card card-lift relative overflow-hidden"
              >
                <div className="h-44 overflow-hidden">
                  <div
                    className="w-full h-full bg-cover bg-center group-hover:scale-105 transition-transform duration-500"
                    style={{ backgroundImage: `url(${category.imageUrl})` }}
                  />
                </div>
                <div className="p-5 relative">
                  <h3 className="text-base font-semibold text-[#FFFFFF] mb-2 font-display group-hover:text-primary transition-colors">
                    {category.title}
                  </h3>
                  <p className="text-sm text-[#64748B] leading-relaxed">{category.description}</p>
                </div>
              </motion.div>
            </LightBloom>
          ))}
        </div>

        {/* Industries Served */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-primary font-mono text-xs tracking-[0.3em] uppercase">
            Industries Served
          </span>
          <h2 className="text-2xl sm:text-3xl font-semibold text-[#FFFFFF] mt-3 mb-10 font-display">
            Trusted Across <span className="text-primary">Sectors</span>
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {INDUSTRIES.map((industry, i) => {
              const Icon = industryIcons[industry.name] || Building2;
              return (
                <LightBloom key={i} delay={i * 0.05} bloomIntensity={0.2} duration={0.6}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.4, delay: i * 0.05 }}
                    className="gradient-border-card card-lift p-5 flex flex-col items-center gap-3"
                  >
                    <div className="w-10 h-10 rounded-lg bg-white/[0.03] flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                      <Icon className="w-5 h-5 text-[#64748B] group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-xs sm:text-sm text-[#64748B] text-center leading-tight font-sans font-light">
                      {industry.name}
                    </span>
                  </motion.div>
                </LightBloom>
              );
            })}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
