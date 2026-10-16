import React, { useRef } from 'react';
import { Link } from 'react-router-dom';
import { motion, useInView } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { useSiteContent } from '../content';
import { PageHeroBackground } from './animations';
import { renderWithLogo } from './ui/lumenx-wordmark';

/** Fade-and-rise on scroll, shared by every block on the page. */
const Reveal: React.FC<{ children: React.ReactNode; delay?: number; className?: string }> = ({
  children,
  delay = 0,
  className,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-80px' }}
    transition={{ delay, duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);

/** Two engineers, in their own words — the whole About page. */
export const AboutPage: React.FC = () => {
  const { about } = useSiteContent();
  const { hero, team, closing } = about;
  const teamRef = useRef<HTMLDivElement>(null);
  const teamInView = useInView(teamRef, { once: true, margin: '-100px' });

  return (
    <div className="pt-[104px]">
      {/* ── Page title ─────────────────────────────────────────────────── */}
      <section className="relative py-20 sm:py-24 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary/40" />
              <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">
                {hero.eyebrow}
              </span>
            </div>

            <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
              {hero.heading.lead}
              <span className="gradient-text">{hero.heading.accent}</span>
              {hero.heading.tail}
            </h1>

            <p className="text-slate-400 max-w-2xl text-base leading-relaxed font-sans font-light">
              {hero.subcopy}
            </p>
          </motion.div>
        </div>
      </section>

      {/* ── The team ───────────────────────────────────────────────────── */}
      <section id="the-team" className="relative py-20 sm:py-28 overflow-hidden bg-[#06090F]">
        <PageHeroBackground rays={false} particles={false} dots={false} />
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-8 h-px bg-primary/40" />
              <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">
                {team.label}
              </span>
            </div>
            <h2 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] max-w-3xl mb-6">
              {team.heading}
            </h2>
          </Reveal>

          {/*
            Founder stories.

            A group photograph sat here until the 15 Oct review, and a 2-up
            headshot grid replaced it. That grid showed the same two portraits as
            the biography block below, so each founder's face appeared twice on
            one page — "I don't think we need to have a picture in twice… just
            the bottom, the bottom ones". The portraits now appear once, beside
            their biographies; the introduction flows above them.
          */}
          <div ref={teamRef} className="mt-12 sm:mt-14">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={teamInView ? { opacity: 1, y: 0 } : {}}
              transition={{ delay: 0.15, duration: 0.8 }}
            >
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-sans font-light mb-8 max-w-3xl">
                {team.lede}
              </p>

              <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#1E293B]/60 border border-[#1E293B]/60 rounded-2xl overflow-hidden">
                {team.highlights.map((item) => (
                  <div key={item.label} className="bg-[#0A101A] px-5 py-5 sm:px-6 sm:py-6">
                    <dt className="sr-only">{item.label}</dt>
                    <dd>
                      <span className="block font-display text-2xl sm:text-3xl font-bold text-white tracking-tight mb-1.5">
                        {item.value}
                      </span>
                      <span className="block text-[11px] sm:text-xs text-slate-500 leading-snug font-sans font-light">
                        {item.label}
                      </span>
                    </dd>
                  </div>
                ))}
              </dl>
            </motion.div>
          </div>

          {/* Founders — alternating portrait and biography */}
          <div className="mt-20 sm:mt-24 space-y-20 sm:space-y-24">
            {team.members.map((member, i) => (
              <Reveal key={member.name}>
                <article className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
                  {/* Portrait — stays in view while the longer biography scrolls */}
                  <div className={`lg:col-span-4 lg:sticky lg:top-[128px] ${i % 2 === 1 ? 'lg:order-2' : ''}`}>
                    <div className="relative">
                      <div className="absolute -inset-3 bg-primary/[0.04] blur-2xl rounded-full pointer-events-none" />
                      <div className="relative overflow-hidden rounded-2xl border border-[#1E293B]">
                        <img
                          src={member.image}
                          alt={member.imageAlt}
                          loading="lazy"
                          className="w-full h-[420px] sm:h-[520px] lg:h-[560px] object-cover object-top"
                        />
                        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-[#06090F]/90 to-transparent pointer-events-none" />
                      </div>
                    </div>
                  </div>

                  {/* Biography */}
                  <div className={`lg:col-span-8 ${i % 2 === 1 ? 'lg:order-1' : ''}`}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="font-mono text-[10px] text-primary/70 tracking-[0.25em]">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="flex-1 h-px bg-gradient-to-r from-primary/30 to-transparent" />
                    </div>

                    <h3 className="font-display text-2xl sm:text-3xl font-bold text-white tracking-[-0.02em]">
                      {member.name}
                    </h3>
                    <p className="text-[11px] font-mono text-primary tracking-[0.2em] uppercase mt-2 mb-6">
                      {member.role}
                    </p>

                    {member.focus && (
                      <p className="border-l-2 border-primary/40 pl-4 text-base sm:text-lg text-slate-200 leading-relaxed font-sans font-light mb-6">
                        {member.focus}
                      </p>
                    )}

                    <div className="space-y-4">
                      {member.blocks.map((block, b) => (
                        <p
                          key={b}
                          className="text-sm sm:text-base text-slate-400 leading-relaxed font-sans font-light"
                        >
                          {block.body}
                        </p>
                      ))}
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── Closing call to action ─────────────────────────────────────── */}
      <section id="talk-to-the-team" className="relative py-20 sm:py-28 overflow-hidden bg-[#06090F]">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/[0.03] rounded-full blur-[200px]" />
        </div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <h2 className="font-display text-3xl sm:text-4xl font-bold text-white tracking-[-0.02em] mb-5">
              {closing.heading.lead}
              <span className="gradient-text">{closing.heading.accent}</span>
              {closing.heading.tail}
            </h2>

            <p className="text-slate-400 text-base leading-relaxed font-sans font-light mb-9">
              {renderWithLogo(closing.subcopy)}
            </p>

            <Link to="/contact" className="btn btn-primary group no-underline">
              <span className="flex items-center gap-2">
                {closing.cta}
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform duration-300" />
              </span>
            </Link>
          </Reveal>
        </div>
      </section>
    </div>
  );
};
