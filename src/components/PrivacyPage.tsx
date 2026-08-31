import React from 'react';
import { Link } from 'react-router-dom';
import { CONTACT } from '../data';
import { PageHeroBackground } from './animations';
import { ShieldCheck, Mail } from 'lucide-react';

export const PrivacyPage: React.FC = () => {
  const updated = '26 August 2026';

  const sections: { title: string; body: React.ReactNode }[] = [
    {
      title: '1. Who we are',
      body: (
        <>
          LumenX Lighting Solutions (&ldquo;LumenX&rdquo;, &ldquo;we&rdquo;, &ldquo;us&rdquo;) is a South African
          lighting partner for retail, commercial and industrial projects. This policy explains how we collect,
          use and protect personal information in line with the Protection of Personal Information Act
          (POPIA), No. 4 of 2013.
        </>
      ),
    },
    {
      title: '2. Information we collect',
      body: (
        <>
          We collect only the information needed to respond to you and provide our services:
          <ul className="list-disc pl-5 mt-2 space-y-1.5">
            <li><strong>Enquiry form</strong> — name, email address, phone number, company, project name and project details you submit via the contact form.</li>
            <li><strong>Lighting planner</strong> — name, email, phone, company and project parameters you submit when requesting a quote.</li>
            <li><strong>Design tool</strong> — the email address you provide to export a lighting design report.</li>
            <li><strong>Account</strong> — the email address and password hash for an optional account used to download photometric (.IES) files. Passwords are stored as a one-way hash and are never readable in plain text.</li>
            <li><strong>Download logs</strong> — for anonymous public downloads we record the IP address; for signed-in downloads we record your account email.</li>
          </ul>
        </>
      ),
    },
    {
      title: '3. How we use your information',
      body: (
        <>
          We use personal information to respond to enquiries, prepare quotations and lighting specifications,
          provide the design tool and file downloads, manage accounts, and improve our service. We do not sell
          or rent personal information to third parties.
        </>
      ),
    },
    {
      title: '4. Legal basis and consent',
      body: (
        <>
          Where required, we process personal information on the basis of your consent, the performance of a
          contract or steps you ask us to take before entering into one, or our legitimate interest in
          responding to business enquiries. You may withdraw consent at any time by contacting us below.
        </>
      ),
    },
    {
      title: '5. Cookies',
      body: (
        <>
          If you sign in to download photometric files, we set a session cookie to keep you signed in. We do
          not use advertising or cross-site tracking cookies.
        </>
      ),
    },
    {
      title: '6. Analytics',
      body: (
        <>
          We use Umami, a privacy-friendly analytics service, to understand aggregate site usage. Umami does
          not use cookies and does not collect personal information such as names or email addresses.
        </>
      ),
    },
    {
      title: '7. Service providers',
      body: (
        <>
          We use trusted service providers to operate parts of the site, including our hosting provider and a
          transactional email provider (Resend) used to deliver lead notifications to our team. These
          providers process information only on our instructions and under appropriate safeguards.
        </>
      ),
    },
    {
      title: '8. Retention',
      body: (
        <>
          We keep enquiry and account information only for as long as reasonably necessary to fulfil the
          purpose for which it was collected, or as required by law. You may request deletion at any time.
        </>
      ),
    },
    {
      title: '9. Your rights',
      body: (
        <>
          You have the right to request access to, correction of, or deletion of your personal information,
          and to object to or restrict its processing. To exercise these rights, contact us using the details
          below.
        </>
      ),
    },
    {
      title: '10. Contact',
      body: (
        <>
          Questions about this policy or your information can be directed to our team at{' '}
          <a href={`mailto:${CONTACT.projectsEmail || CONTACT.email}`} className="text-primary/80 hover:text-primary underline">
            {CONTACT.projectsEmail || CONTACT.email}
          </a>{' '}
          or by phone at {CONTACT.phone}.
        </>
      ),
    },
  ];

  return (
    <div className="min-h-screen">
      <section className="relative pt-[104px] pb-16 sm:pb-20 overflow-hidden bg-[#06090F]">
        <PageHeroBackground />
        <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 mb-4">
            <span className="w-8 h-px bg-primary/40" />
            <span className="text-[10px] font-mono text-primary tracking-[0.25em] uppercase">Privacy</span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl font-bold text-white tracking-[-0.02em] mb-4">
            Privacy <span className="gradient-text">Policy</span>
          </h1>
          <p className="text-slate-400 text-sm font-mono">Last updated: {updated}</p>
        </div>
      </section>

      <section className="pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          {sections.map((s) => (
            <div key={s.title} className="border border-[#1E293B] bg-[#0A0D14] rounded-2xl p-6 sm:p-8">
              <h2 className="font-display text-lg sm:text-xl font-semibold text-white mb-3 tracking-tight">{s.title}</h2>
              <div className="text-sm sm:text-base text-slate-400 leading-relaxed font-sans font-light">{s.body}</div>
            </div>
          ))}

          <div className="flex items-center gap-3 p-5 rounded-2xl bg-primary/[0.05] border border-primary/15">
            <ShieldCheck className="w-5 h-5 text-primary/60 shrink-0" />
            <p className="text-xs text-slate-400 font-sans font-light">
              Your information is processed in accordance with POPIA. We are committed to protecting it and
              to being transparent about how we use it.
            </p>
          </div>

          <div className="text-center pt-2">
            <Link to="/contact" className="btn btn-outline inline-flex no-underline">
              <Mail className="w-4 h-4" />
              Contact us about your data
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
