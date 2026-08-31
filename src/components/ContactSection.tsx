import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { api } from '../lib/api';
import { MANAGING_DIRECTOR } from '../data';
import { useSiteContent } from '../content';
import { Mail, Phone, MapPin, Send, User, AtSign, Building2, FileText } from 'lucide-react';
import { PageHeroBackground } from './animations';
import { LumenXWordmark } from './ui/lumenx-wordmark';

export const ContactSection: React.FC = () => {
  const { contact, managingDirector } = useSiteContent();
  const [formData, setFormData] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    projectName: '',
    projectType: '',
    projectStage: '',
    supportRequired: '',
    projectDetails: '',
  });
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!consent) {
      setError('Please confirm you agree to the privacy policy before submitting.');
      setStatus('error');
      return;
    }
    setStatus('sending');
    setError(null);
    try {
      await api.contact({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
        company: formData.company,
        projectName: formData.projectName,
        projectType: formData.projectType,
        projectStage: formData.projectStage,
        supportRequired: formData.supportRequired,
        message: formData.projectDetails,
      });
      setStatus('sent');
    } catch (err) {
      setError((err as Error).message || 'Something went wrong. Please email us directly instead.');
      setStatus('error');
    }
  };

  const update = (field: string, value: string) => setFormData((p) => ({ ...p, [field]: value }));

  const whatsappLink = `https://wa.me/${contact.phone.replace(/[\s\+]/g, '')}?text=${encodeURIComponent('Hi LumenX, I would like to discuss a lighting project.')}`;

  const projectTypes = ['Commercial', 'Industrial', 'Retail', 'Hospitality', 'Education', 'Healthcare', 'Government', 'Other'];
  const projectStages = ['Concept / Design', 'Tender / Specification', 'Value Engineering', 'Procurement', 'Installation', 'Other'];

  return (
    <section id="contact" className="relative py-20 sm:py-28 bg-[#06090F] overflow-hidden">
      <PageHeroBackground rays={false} particles={false} dots={false} />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/15 to-transparent" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <div className="flex items-center justify-center gap-3 mb-3">
            <span className="w-6 h-px bg-primary/30" />
            <span className="text-primary font-mono text-xs tracking-[0.3em] uppercase">{contact.eyebrow}</span>
            <span className="w-6 h-px bg-primary/30" />
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold text-white mb-4 tracking-[-0.02em]">
            Bring <LumenXWordmark className="!h-20 !align-middle" /> into <span className="gradient-text">the project</span>
          </h2>
          <p className="text-slate-400 max-w-xl mx-auto text-sm">
            {contact.subcopy}
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 max-w-5xl mx-auto">
          {/* Contact Form */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="lg:col-span-3"
          >
            <div className="p-6 sm:p-8 rounded-2xl bg-gradient-to-b from-[#0F141C] to-[#0A0D14] border border-[#1E293B] h-full">
              <h3 className="font-display text-lg font-semibold text-white mb-6 tracking-tight">Project details</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text" placeholder="Your name *" required aria-label="Your name" autoComplete="name"
                      value={formData.name} onChange={(e) => update('name', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>
                  <div className="relative">
                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text" placeholder="Company" aria-label="Company" autoComplete="organization"
                      value={formData.company} onChange={(e) => update('company', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="email" placeholder="Work email *" required aria-label="Work email" autoComplete="email"
                      value={formData.email} onChange={(e) => update('email', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="tel" placeholder="Phone number" aria-label="Phone number" autoComplete="tel"
                      value={formData.phone} onChange={(e) => update('phone', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text" placeholder="Project name" aria-label="Project name"
                      value={formData.projectName} onChange={(e) => update('projectName', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>
                  <div>
                    <select
                      aria-label="Project type"
                      value={formData.projectType} onChange={(e) => update('projectType', e.target.value)}
                      className="w-full px-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans appearance-none cursor-pointer"
                    >
                      <option value="" className="text-slate-500">Project type</option>
                      {projectTypes.map((t) => <option key={t} value={t} className="bg-[#0A0D14] text-white">{t}</option>)}
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <select
                      aria-label="Current project stage"
                      value={formData.projectStage} onChange={(e) => update('projectStage', e.target.value)}
                      className="w-full px-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans appearance-none cursor-pointer"
                    >
                      <option value="" className="text-slate-500">Current project stage</option>
                      {projectStages.map((s) => <option key={s} value={s} className="bg-[#0A0D14] text-white">{s}</option>)}
                    </select>
                  </div>
                  <div className="relative">
                    <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type="text" placeholder="Support required (e.g. BOQ quote)" aria-label="Support required"
                      value={formData.supportRequired} onChange={(e) => update('supportRequired', e.target.value)}
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>
                </div>
                <textarea
                  placeholder="Project details — tell us about the scope, requirements, quantities, or any specific lighting needs..."
                  aria-label="Project details"
                  required
                  rows={4}
                  value={formData.projectDetails} onChange={(e) => update('projectDetails', e.target.value)}
                  className="w-full px-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors resize-none font-sans"
                />

                {/* File upload hint */}
                <p className="text-[10px] font-mono text-slate-600">
                  Need to attach drawings, a BOQ, or a spec? Email them to{' '}
                  <a href={`mailto:${contact.projectsEmail || contact.email}`} className="text-primary/60 hover:text-primary transition-colors">
                    {contact.projectsEmail || contact.email}
                  </a>
                  , or submit below and our team will reply with next steps.
                </p>

                {/* POPIA consent */}
                <label className="flex items-start gap-3 text-xs text-slate-400 font-sans cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consent}
                    onChange={(e) => setConsent(e.target.checked)}
                    className="mt-0.5 shrink-0 accent-[#00D4FF]"
                    aria-label="Privacy consent"
                  />
                  <span>
                    I consent to LumenX processing my details to respond to this enquiry, in line with the{' '}
                    <Link to="/privacy" className="text-primary/70 hover:text-primary underline">Privacy Policy</Link>.
                  </span>
                </label>

                {status === 'sent' && (
                  <p className="text-xs text-emerald-400 font-sans">
                    Thank you — your enquiry has been received. Our team will be in touch shortly.
                  </p>
                )}
                {error && <p className="text-xs text-red-400 font-sans">{error}</p>}

                <button
                  type="submit"
                  disabled={status === 'sending'}
                  className="btn btn-primary btn-block"
                >
                  <span className="flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    {status === 'sending' ? 'Sending…' : status === 'sent' ? 'Submitted — thank you!' : 'Submit your lighting requirement'}
                  </span>
                </button>
              </form>
            </div>
          </motion.div>

          {/* Contact Details + WhatsApp */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="lg:col-span-2 space-y-4"
          >
            {/* Quick Contact Cards */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0F141C] to-[#0A0D14] border border-[#1E293B] space-y-4">
              <a
                href={`mailto:${contact.email}`}
                className="group flex items-center gap-3 p-3 rounded-xl bg-[#0A0D14] border border-[#1E293B] hover:border-primary/20 transition-all duration-300 no-underline"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Email</p>
                  <p className="text-xs text-white truncate group-hover:text-primary transition-colors font-sans">{contact.email}</p>
                </div>
              </a>

              <a
                href={`tel:${contact.phone.replace(/\s/g, '')}`}
                className="group flex items-center gap-3 p-3 rounded-xl bg-[#0A0D14] border border-[#1E293B] hover:border-primary/20 transition-all duration-300 no-underline"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Phone</p>
                  <p className="text-xs text-white group-hover:text-primary transition-colors font-sans">{contact.phone}</p>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0D14] border border-[#1E293B]">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">Location</p>
                  <p className="text-xs text-white font-sans">South Africa — Nationwide</p>
                </div>
              </div>
            </div>

            {/* WhatsApp Button */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-3 p-4 rounded-2xl bg-[#075E54]/20 border border-[#25D366]/30 hover:border-[#25D366]/50 transition-all duration-300 no-underline cursor-pointer hover:bg-[#075E54]/30"
            >
              <div className="w-10 h-10 rounded-xl bg-[#25D366]/20 border border-[#25D366]/30 flex items-center justify-center shrink-0 group-hover:bg-[#25D366]/30 transition-colors">
                <img
                  src="/icons/whatsapp.svg"
                  alt="WhatsApp"
                  className="w-6 h-6 object-contain drop-shadow-[0_0_8px_rgba(37,211,102,0.4)]"
                />
              </div>
              <div>
                <p className="font-display text-xs font-semibold text-white tracking-tight group-hover:text-[#25D366] transition-colors">Chat on WhatsApp</p>
                <p className="text-[10px] text-slate-500 font-mono">Quick response during business hours</p>
              </div>
            </a>

            {/* Leadership */}
            <div className="p-6 rounded-2xl bg-gradient-to-b from-[#0F141C] to-[#0A0D14] border border-[#1E293B]">
              <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider mb-4">Leadership</p>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src={MANAGING_DIRECTOR.headshot}
                  alt={`${managingDirector.name}, ${managingDirector.role}`}
                  loading="lazy"
                  className="w-14 h-14 rounded-full object-cover border-2 border-primary/40 shadow-[0_0_18px_rgba(0,212,255,0.25)] shrink-0"
                />
                <div>
                  <p className="font-display text-sm font-semibold text-white tracking-tight">{managingDirector.name}</p>
                  <p className="text-[10px] text-slate-500 font-mono uppercase tracking-wider">{managingDirector.role}</p>
                  <a href={`mailto:${managingDirector.email}`} className="block text-[10px] text-slate-500 hover:text-primary transition-colors font-sans no-underline mt-1">
                    {managingDirector.email}
                  </a>
                  <a href={`tel:${managingDirector.phone.replace(/\s/g, '')}`} className="block text-[10px] text-slate-500 hover:text-primary transition-colors font-sans no-underline">
                    {managingDirector.phone}
                  </a>
                </div>
              </div>
              <div className="rounded-xl overflow-hidden border border-[#1E293B] bg-[#06090F]">
                <img
                  src={MANAGING_DIRECTOR.signatureImage}
                  alt={MANAGING_DIRECTOR.signatureAlt}
                  loading="lazy"
                  className="w-full h-auto object-cover"
                />
              </div>
            </div>

            {/* Brand */}
            <div className="text-center p-4 rounded-2xl bg-gradient-to-b from-[#0F141C] to-[#0A0D14] border border-[#1E293B]">
              <LumenXWordmark className="h-9 mx-auto" />
              <p className="text-[10px] text-slate-500 font-mono tracking-widest mt-2">{contact.tagline}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
