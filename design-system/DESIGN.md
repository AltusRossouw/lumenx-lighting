---
name: LumenX Engineering
colors:
  surface: '#0e1417'
  surface-dim: '#0e1417'
  surface-bright: '#333a3d'
  surface-container-lowest: '#080f12'
  surface-container-low: '#161d1f'
  surface-container: '#1a2123'
  surface-container-high: '#242b2e'
  surface-container-highest: '#2f3639'
  on-surface: '#dde3e7'
  on-surface-variant: '#bbc9cf'
  inverse-surface: '#dde3e7'
  inverse-on-surface: '#2b3134'
  outline: '#859398'
  outline-variant: '#3c494e'
  surface-tint: '#3cd7ff'
  primary: '#a8e8ff'
  on-primary: '#003642'
  primary-container: '#00d4ff'
  on-primary-container: '#00586b'
  inverse-primary: '#00677e'
  secondary: '#bcc2ff'
  on-secondary: '#00179b'
  secondary-container: '#0f2acf'
  on-secondary-container: '#a6afff'
  tertiary: '#ffd5cf'
  on-tertiary: '#690002'
  tertiary-container: '#ffaea3'
  on-tertiary-container: '#a40207'
  error: '#ffb4ab'
  on-error: '#690005'
  error-container: '#93000a'
  on-error-container: '#ffdad6'
  primary-fixed: '#b4ebff'
  primary-fixed-dim: '#3cd7ff'
  on-primary-fixed: '#001f27'
  on-primary-fixed-variant: '#004e5f'
  secondary-fixed: '#dfe0ff'
  secondary-fixed-dim: '#bcc2ff'
  on-secondary-fixed: '#000b62'
  on-secondary-fixed-variant: '#0f2acf'
  tertiary-fixed: '#ffdad5'
  tertiary-fixed-dim: '#ffb4a9'
  on-tertiary-fixed: '#410001'
  on-tertiary-fixed-variant: '#930005'
  background: '#0e1417'
  on-background: '#dde3e7'
  surface-variant: '#2f3639'
typography:
  headline-lg:
    fontFamily: Space Grotesk
    fontSize: 32px
    fontWeight: '700'
    lineHeight: 40px
    letterSpacing: -0.02em
  headline-md:
    fontFamily: Space Grotesk
    fontSize: 24px
    fontWeight: '600'
    lineHeight: 32px
    letterSpacing: -0.01em
  headline-sm:
    fontFamily: Space Grotesk
    fontSize: 18px
    fontWeight: '600'
    lineHeight: 24px
  body-lg:
    fontFamily: JetBrains Mono
    fontSize: 16px
    fontWeight: '400'
    lineHeight: 24px
  body-md:
    fontFamily: JetBrains Mono
    fontSize: 14px
    fontWeight: '400'
    lineHeight: 20px
  label-caps:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '700'
    lineHeight: 16px
    letterSpacing: 0.1em
  code-sm:
    fontFamily: JetBrains Mono
    fontSize: 12px
    fontWeight: '500'
    lineHeight: 16px
rounded:
  sm: 0.125rem
  DEFAULT: 0.25rem
  md: 0.375rem
  lg: 0.5rem
  xl: 0.75rem
  full: 9999px
spacing:
  base: 4px
  xs: 4px
  sm: 8px
  md: 16px
  lg: 24px
  xl: 48px
  gutter: 16px
  margin: 24px
---

## Brand & Style

This design system is built for mission-critical technical environments where precision, legibility, and high-speed data interpretation are paramount. The brand personality is unapologetically technical, cold-coded, and authoritative. It targets engineers, system architects, and data analysts who require a "heads-up display" (HUD) interface.

The visual style blends **Minimalism** with **Modern Corporate** efficiency, leaning into a dashboard-centric aesthetic. It utilizes a high-contrast dark mode to reduce eye strain during long-duration monitoring. The look is characterized by "wireframe" aesthetics—thin borders, subtle glows, and a strict adherence to a grid—evoking the feeling of a sophisticated control center or a developer terminal.

## Colors

The palette is anchored in a monochromatic "Deep Charcoal" spectrum to provide maximum depth and focus for data-rich content.

- **Primary (Electric Cyan):** Used for system-critical active states, success indicators, and primary navigation focus.
- **Secondary (Electric Indigo):** Applied to forward-looking tasks, planning states, and secondary interactive elements.
- **Accent (Technical Red):** Reserved strictly for "Urgent" status, errors, and high-priority destructive actions.
- **Neutrals:** A range of cool-toned greys facilitate hierarchy without competing with the vibrant accents.
- **Surface Strategy:** The UI uses layered darks (#0E0E0E for base, #141414 for cards) to create a subtle sense of physical depth within a digital terminal.

## Typography

The typography system pairs a geometric sans-serif for high-level information architecture with a high-performance monospaced font for data and body content.

- **Space Grotesk** is used for headlines to provide a modern, "space-age" geometric feel that remains highly legible at larger scales.
- **JetBrains Mono** is the workhorse for all body text, labels, and data visualizations. Its monospaced nature ensures that numeric data aligns perfectly in tables and dashboard widgets.
- **Case Styling:** Use `label-caps` for section headers and status indicators to reinforce the technical, "labeled" look of engineering blueprints.

## Layout & Spacing

This design system utilizes a **Fixed Grid** model for desktop dashboards and a fluid reflow for mobile viewports.

- **Grid:** 12-column system for desktop (1440px max-width) with 16px gutters.
- **Density:** High-density spacing. Elements are packed tightly to maximize information density, typical of expert-user interfaces.
- **Rhythm:** A 4px baseline grid governs all padding and margins. 
- **Adaptation:** On mobile, the 12-column grid collapses to a 4-column layout. Data bars and charts reflow from horizontal to vertical stacks to maintain legibility.

## Elevation & Depth

Depth is conveyed through **Tonal Layering** and **Thin Outlines** rather than traditional shadows. 

- **Surface Levels:** The background is the darkest layer (#0E0E0E). Interactive cards and containers use a slightly lighter shade (#141414).
- **Outlines:** Containers use a 1px border (#2A2A2A) to define edges.
- **Glows:** Instead of drop shadows, active or urgent components utilize a "Neon Glow"—a soft, colored outer blur (5px to 10px) that matches the element's primary or secondary color, simulating an illuminated display.
- **Glassmorphism:** Used sparingly for floating tooltips or dropdown menus, employing a subtle backdrop-blur (10px) and a semi-transparent dark fill.

## Shapes

The shape language is rigid and industrial. We use **Soft (1)** roundedness (4px) as the default for most components to prevent the UI from feeling overly aggressive while maintaining a sharp, engineered appearance.

- **Standard Buttons/Inputs:** 4px radius.
- **Status Tags:** 2px radius for a nearly-sharp look.
- **Data Bars:** Squared off or 2px radius on the leading edge.
- **Selection Indicators:** Sharp vertical lines or rectangles are preferred over rounded pills.

## Components

- **Buttons:** 
  - *Primary:* Solid fill (#00D4FF) with black text.
  - *Secondary:* Ghost style with a 1px neutral border and cyan text on hover.
  - *Accent:* Solid fill (#E23A2E) reserved for high-risk actions.
- **Status Tags:** Small, rectangular containers with a leading "indicator dot" that pulses for "Active" states.
- **Data Bars:** Progress bars should be slim (8px height) with a high-contrast background track. Use the Accent color for bars exceeding a "Warning" threshold (e.g., >90%).
- **Input Fields:** Dark backgrounds (#0E0E0E) with 1px borders. The border should change to Primary Cyan on focus with a subtle outer glow.
- **Iconography:** Use line-based, geometric icons with a consistent 2px stroke weight. Avoid filled icons unless they represent an active state.
- **Cards:** Use a 1px border and a subtle header section separated by a horizontal rule to organize metadata.