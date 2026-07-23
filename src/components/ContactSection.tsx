import { useState } from 'react';
import { motion } from 'motion/react';
import { CONTACT } from '../data';
import { Mail, Phone, Globe, MapPin, Send, MessageCircle, User, AtSign, FileText } from 'lucide-react';

export const ContactSection: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const mailtoLink = `mailto:${CONTACT.email}?subject=${encodeURIComponent(formData.subject || 'LumenX Inquiry')}&body=${encodeURIComponent(`Name: ${formData.name}\nEmail: ${formData.email}\n\n${formData.message}`)}`;
    window.location.href = mailtoLink;
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 3000);
  };

  const whatsappLink = `https://wa.me/${CONTACT.phone.replace(/[\s\+]/g, '')}?text=${encodeURIComponent('Hi LumenX, I would like to discuss a lighting project.')}`;

  return (
    <section id="contact" className="py-20 sm:py-28 relative">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/3 via-transparent to-transparent pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-100px' }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-primary font-mono text-xs tracking-[0.3em] uppercase">Contact</span>
          <h2 className="font-serif font-semibold text-3xl sm:text-4xl font-normal text-[#FFFFFF] mt-3 mb-4 tracking-[-0.02em]">
            Let's <span className="text-primary">Talk</span>
          </h2>
          <p className="text-[#78716C] max-w-xl mx-auto">
            Ready to discuss your lighting project? Reach out and our team will respond with
            technical guidance and a competitive quotation.
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
              <h3 className="font-serif font-semibold text-lg font-semibold text-[#FFFFFF] mb-6 tracking-tight">Send us a message</h3>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="text"
                      placeholder="Your name"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData((p) => ({ ...p, name: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-[#FFFFFF] placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>
                  <div className="relative">
                    <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                    <input
                      type="email"
                      placeholder="Your email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData((p) => ({ ...p, email: e.target.value }))}
                      className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-[#FFFFFF] placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                    />
                  </div>
                </div>
                <div className="relative">
                  <FileText className="absolute left-3 top-3.5 w-4 h-4 text-[#64748B]" />
                  <input
                    type="text"
                    placeholder="Subject (e.g. High Bay Quote Request)"
                    value={formData.subject}
                    onChange={(e) => setFormData((p) => ({ ...p, subject: e.target.value }))}
                    className="w-full pl-10 pr-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-[#FFFFFF] placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors font-sans"
                  />
                </div>
                <textarea
                  placeholder="Tell us about your project, requirements, or questions..."
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) => setFormData((p) => ({ ...p, message: e.target.value }))}
                  className="w-full px-4 py-3 bg-[#0A0D14] border border-[#1E293B] rounded-lg text-sm text-[#FFFFFF] placeholder-slate-500 focus:outline-none focus:border-primary/50 transition-colors resize-none font-sans"
                />

                <button
                  type="submit"
                  className="w-full group relative overflow-hidden px-6 py-3.5 bg-gradient-to-r from-primary to-[#00A8D5] text-[#FFFFFF] font-normal rounded-lg text-sm shadow-lg shadow-primary/10 hover:shadow-primary/20 transition-all duration-300 transform active:scale-[0.98] cursor-pointer"
                >
                  <span className="relative z-10 flex items-center justify-center gap-2">
                    <Send className="w-4 h-4" />
                    {submitted ? 'Message Sent! Opening Email…' : 'Send Message'}
                  </span>
                  <div className="absolute inset-0 bg-[#0A0D14]/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
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
                href={`mailto:${CONTACT.email}`}
                className="group flex items-center gap-3 p-3 rounded-xl bg-[#0A0D14] border border-[#1E293B] hover:border-primary/20 transition-all duration-300 no-underline"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Mail className="w-4 h-4 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] text-[#64748B] font-mono uppercase tracking-wider">Email</p>
                  <p className="text-xs text-[#FFFFFF] truncate group-hover:text-primary transition-colors font-sans">{CONTACT.email}</p>
                </div>
              </a>

              <a
                href={`tel:${CONTACT.phone.replace(/\s/g, '')}`}
                className="group flex items-center gap-3 p-3 rounded-xl bg-[#0A0D14] border border-[#1E293B] hover:border-primary/20 transition-all duration-300 no-underline"
              >
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                  <Phone className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-[#64748B] font-mono uppercase tracking-wider">Phone</p>
                  <p className="text-xs text-[#FFFFFF] group-hover:text-primary transition-colors font-sans">{CONTACT.phone}</p>
                </div>
              </a>

              <div className="flex items-center gap-3 p-3 rounded-xl bg-[#0A0D14] border border-[#1E293B]">
                <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <div>
                  <p className="text-[10px] text-[#64748B] font-mono uppercase tracking-wider">Location</p>
                  <p className="text-xs text-[#FFFFFF] font-sans">South Africa — Nationwide</p>
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
                <MessageCircle className="w-5 h-5 text-[#25D366]" />
              </div>
              <div>
                <p className="font-serif text-xs font-semibold text-[#FFFFFF] tracking-tight group-hover:text-[#25D366] transition-colors">Chat on WhatsApp</p>
                <p className="text-[10px] text-[#78716C] font-mono">Quick response during business hours</p>
              </div>
            </a>

            {/* Brand */}
            <div className="text-center p-4 rounded-2xl bg-gradient-to-b from-[#0F141C] to-[#0A0D14] border border-[#1E293B]">
              <h3 className="font-serif font-semibold text-lg font-semibold text-[#FFFFFF] tracking-tight">
                LUMEN<span className="text-primary">X</span>
              </h3>
              <p className="text-[10px] text-[#64748B] font-mono tracking-widest mt-1">{CONTACT.tagline}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
