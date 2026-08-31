// Declarative schema for the /admin "Content" editor.
//
// Each field describes a path into the SiteContent document. The editor renders
// these generically so adding a new editable field is a schema change, not a UI
// rewrite. Paths are arrays of object keys (e.g. ['company', 'intro']).

export type ItemFieldKind = 'text' | 'textarea';

export interface FieldDef {
  kind: 'text' | 'textarea' | 'heading' | 'stringList' | 'objectList';
  label: string;
  path: string[];
  /** For objectList: the editable fields within each item. */
  itemFields?: { key: string; label: string; kind: ItemFieldKind }[];
  /** For lists: whether items may be added/removed (defaults true). */
  addable?: boolean;
}

export interface Group {
  title: string;
  description?: string;
  fields: FieldDef[];
}

const heading = (label: string, path: string[]): FieldDef => ({ kind: 'heading', label, path });

const textItem = { key: 'title', label: 'Title', kind: 'text' as const };
const descriptionItem = { key: 'description', label: 'Description', kind: 'textarea' as const };
const labelItem = { key: 'label', label: 'Label', kind: 'text' as const };
const questionItem = { key: 'question', label: 'Question', kind: 'text' as const };
const answerItem = { key: 'answer', label: 'Answer', kind: 'textarea' as const };

const teaserFields = (prefix: string[], opts: { withLabel?: boolean; withBullets?: boolean } = {}): FieldDef[] => {
  const fields: FieldDef[] = [];
  if (opts.withLabel) fields.push({ kind: 'text', label: 'Eyebrow label', path: [...prefix, 'label'] });
  fields.push(heading('Heading (lead / highlighted / tail)', [...prefix, 'title']));
  fields.push({ kind: 'textarea', label: 'Supporting copy', path: [...prefix, 'copy'] });
  fields.push({ kind: 'text', label: 'Link label', path: [...prefix, 'link'] });
  if (opts.withBullets) fields.push({ kind: 'stringList', label: 'Checklist items', path: [...prefix, 'bullets'] });
  return fields;
};

export const CONTENT_SCHEMA: Group[] = [
  {
    title: 'Company & brand',
    description: 'The core positioning statements used across the site.',
    fields: [
      { kind: 'textarea', label: 'Intro', path: ['company', 'intro'] },
    ],
  },
  {
    title: 'Homepage hero',
    fields: [
      { kind: 'text', label: 'Location badge', path: ['hero', 'badge'] },
      { kind: 'text', label: 'Headline — line 1', path: ['hero', 'headlineLead'] },
      { kind: 'text', label: 'Headline — highlighted line', path: ['hero', 'headlineAccent'] },
      { kind: 'text', label: 'Headline — line 3', path: ['hero', 'headlineTail'] },
      { kind: 'stringList', label: 'Service tags', path: ['hero', 'serviceTags'] },
      { kind: 'text', label: 'Primary button', path: ['hero', 'primaryCta'] },
      { kind: 'text', label: 'Secondary button', path: ['hero', 'secondaryCta'] },
      { kind: 'stringList', label: 'Trust strip', path: ['hero', 'trustItems'] },
    ],
  },
  {
    title: 'Homepage teasers',
    description: 'The six headline/copy blocks on the home page.',
    fields: [
      ...teaserFields(['home', 'solution']),
      ...teaserFields(['home', 'projects'], { withLabel: true }),
      ...teaserFields(['home', 'technicalProof'], { withLabel: true, withBullets: true }),
      ...teaserFields(['home', 'process'], { withLabel: true }),
      ...teaserFields(['home', 'categories'], { withLabel: true }),
      ...teaserFields(['home', 'who'], { withLabel: true }),
    ],
  },
  {
    title: 'The Solution',
    fields: [
      { kind: 'text', label: 'Heading — line 1', path: ['solution', 'headingTop'] },
      { kind: 'text', label: 'Heading — line 2', path: ['solution', 'headingBottom'] },
      { kind: 'textarea', label: 'Subcopy', path: ['solution', 'subcopy'] },
      {
        kind: 'objectList',
        label: 'Capabilities',
        path: ['solution', 'items'],
        addable: false,
        itemFields: [textItem, descriptionItem],
      },
    ],
  },
  {
    title: 'Compliance & quality',
    fields: [
      { kind: 'text', label: 'Eyebrow label', path: ['compliance', 'label'] },
      heading('Heading', ['compliance', 'heading']),
      { kind: 'textarea', label: 'About paragraph', path: ['compliance', 'about'] },
      { kind: 'text', label: 'Partners heading', path: ['compliance', 'partnersHeading'] },
      { kind: 'textarea', label: 'Partners copy', path: ['compliance', 'partnersCopy'] },
      { kind: 'text', label: 'Quality heading', path: ['compliance', 'qaHeading'] },
      {
        kind: 'objectList',
        label: 'Compliance points',
        path: ['compliance', 'items'],
        addable: true,
        itemFields: [labelItem, descriptionItem],
      },
    ],
  },
  {
    title: 'Why LumenX',
    fields: [
      { kind: 'textarea', label: 'Subcopy', path: ['whyChoose', 'subcopy'] },
      {
        kind: 'objectList',
        label: 'Reasons',
        path: ['whyChoose', 'items'],
        addable: false,
        itemFields: [textItem, descriptionItem],
      },
    ],
  },
  {
    title: 'Process',
    fields: [
      { kind: 'text', label: 'Eyebrow label', path: ['process', 'label'] },
      heading('Heading', ['process', 'heading']),
      { kind: 'textarea', label: 'Subcopy', path: ['process', 'subcopy'] },
      {
        kind: 'objectList',
        label: 'Steps',
        path: ['process', 'items'],
        addable: false,
        itemFields: [textItem, descriptionItem],
      },
    ],
  },
  {
    title: 'Audience',
    fields: [
      { kind: 'text', label: 'Eyebrow label', path: ['audience', 'label'] },
      heading('Heading', ['audience', 'heading']),
      {
        kind: 'objectList',
        label: 'Profiles',
        path: ['audience', 'items'],
        addable: false,
        itemFields: [textItem, descriptionItem],
      },
    ],
  },
  {
    title: 'Industries',
    description: 'Sector names shown across the site (icons stay fixed).',
    fields: [{ kind: 'stringList', label: 'Sectors', path: ['industries', 'items'], addable: false }],
  },
  {
    title: 'FAQs',
    fields: [
      { kind: 'text', label: 'Eyebrow label', path: ['faqs', 'label'] },
      heading('Heading', ['faqs', 'heading']),
      {
        kind: 'objectList',
        label: 'Questions & answers',
        path: ['faqs', 'items'],
        addable: true,
        itemFields: [questionItem, answerItem],
      },
    ],
  },
  {
    title: 'Contact details',
    fields: [
      { kind: 'text', label: 'Email', path: ['contact', 'email'] },
      { kind: 'text', label: 'Projects email', path: ['contact', 'projectsEmail'] },
      { kind: 'text', label: 'Phone', path: ['contact', 'phone'] },
      { kind: 'text', label: 'Website', path: ['contact', 'website'] },
      { kind: 'text', label: 'Tagline', path: ['contact', 'tagline'] },
      { kind: 'textarea', label: 'Footer blurb', path: ['contact', 'footerBlurb'] },
    ],
  },
  {
    title: 'Call to action',
    fields: [
      { kind: 'text', label: 'Eyebrow label', path: ['cta', 'label'] },
      heading('Heading', ['cta', 'heading']),
      { kind: 'textarea', label: 'Subcopy', path: ['cta', 'subcopy'] },
      { kind: 'text', label: 'Button label', path: ['cta', 'button'] },
    ],
  },
  {
    title: 'Services page',
    fields: [heading('Heading', ['services', 'heading']), { kind: 'textarea', label: 'Subcopy', path: ['services', 'subcopy'] }],
  },
  {
    title: 'Products page',
    fields: [
      { kind: 'text', label: 'Badge', path: ['products', 'badge'] },
      heading('Heading', ['products', 'heading']),
      { kind: 'textarea', label: 'Subcopy', path: ['products', 'subcopy'] },
    ],
  },
  {
    title: 'Resources page',
    fields: [
      { kind: 'text', label: 'Eyebrow label', path: ['resources', 'label'] },
      heading('Heading', ['resources', 'heading']),
      { kind: 'textarea', label: 'Subcopy', path: ['resources', 'subcopy'] },
    ],
  },
  {
    title: 'Projects page',
    fields: [
      { kind: 'text', label: 'Eyebrow label', path: ['projects', 'label'] },
      heading('Heading', ['projects', 'heading']),
      { kind: 'textarea', label: 'Subcopy', path: ['projects', 'subcopy'] },
    ],
  },
  {
    title: 'SEO',
    description: 'Browser tab titles and meta descriptions.',
    fields: [
      { kind: 'text', label: 'Home title', path: ['seo', 'homeTitle'] },
      { kind: 'textarea', label: 'Home description', path: ['seo', 'homeDescription'] },
      { kind: 'text', label: 'Solution title', path: ['seo', 'solutionTitle'] },
      { kind: 'textarea', label: 'Solution description', path: ['seo', 'solutionDescription'] },
      { kind: 'text', label: 'Products title', path: ['seo', 'productsTitle'] },
      { kind: 'textarea', label: 'Products description', path: ['seo', 'productsDescription'] },
    ],
  },
  {
    title: 'Compliance bar',
    fields: [{ kind: 'text', label: 'Text', path: ['complianceBar', 'text'] }],
  },
];
