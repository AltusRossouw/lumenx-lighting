import React, { useRef, useState } from 'react';
import { motion, useInView } from 'motion/react';
import { FAQS } from '../data';
import { ChevronDown } from 'lucide-react';

export const FAQSection: React.FC = () => {
  const ref = useRef<HTMLElement>(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggle = (i: number) => setOpenIndex(openIndex === i ? null : i);

  return (
    <section id="faqs" className="relative py-24 sm:py-32 overflow-hidden bg-[#080B12]">
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.8 }}
          className="mb-14 text-center"
        >
          <div className="flex items-center justify-center gap-3 mb-4">
            <span className="w-6 h-px bg-primary/30" />
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Frequently Asked Questions</span>
            <span className="w-6 h-px bg-primary/30" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em]">
            Common questions <span className="gradient-text">answered</span>
          </h2>
        </motion.div>

        <div className="space-y-3" ref={ref}>
          {FAQS.map((faq, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 10 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.1 + i * 0.05, duration: 0.5 }}
              className="border border-[#1E293B] hover:border-[#1E293B]/80 transition-colors duration-300"
            >
              <button
                onClick={() => toggle(i)}
                className="w-full flex items-center justify-between gap-4 px-5 py-4 text-left cursor-pointer"
              >
                <span className="text-sm font-medium text-slate-200 font-sans">{faq.question}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-300 ${openIndex === i ? 'rotate-180' : ''}`}
                />
              </button>
              {openIndex === i && (
                <div className="px-5 pb-4">
                  <p className="text-sm text-slate-400 leading-relaxed font-sans font-light">{faq.answer}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
