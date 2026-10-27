# BazroKart implementation plan

## Scope for this milestone

Build the first complete public-facing BazroKart milestone on top of the initialized React/Express/tRPC/Drizzle starter. The milestone is intentionally infrastructure-first: it delivers a polished marketplace shell, real route structure, direct-purchase and RFQ entry points, catalog and supplier discovery surfaces, and professional empty states. It does not invent products, suppliers, prices, policies, ratings, metrics, or production business content. Backend-dependent actions remain clearly configuration-aware until their real workflows and owner-entered data are connected.

## Implementation approach

- Preserve the existing React + TypeScript + Vite + Tailwind + Express + tRPC + Drizzle stack.
- Use the existing `wouter` router and starter authentication helper rather than introducing competing routing or login systems.
- Keep the first batch frontend-focused, but retain the initialized server and database capabilities for the next milestone.
- Create reusable site primitives for the header, footer, page framing, status badges, workflow cards, and empty states.
- Use CSS design tokens for the approved Boardroom Confidence palette, typography, spacing, borders, focus states, and motion.
- Use only owner-neutral copy and empty states. No seed data will be written to the managed database.
- Keep route declarations synchronized with `client/public/manus-routes.json`.

## Project structure

- `client/src/App.tsx` — route registry and global application providers.
- `client/src/pages/Home.tsx` — public homepage and procurement pathway entry points.
- `client/src/pages/Catalog.tsx` — searchable, filter-ready product catalog surface with empty-state behavior.
- `client/src/pages/Suppliers.tsx` — supplier discovery surface with verification-aware messaging.
- `client/src/pages/Workspace.tsx` — buyer, supplier, and admin route shell for upcoming authenticated workflows.
- `client/src/components/site/` — reusable marketplace shell and state components.
- `client/src/index.css` — approved design tokens and responsive visual system.
- `client/public/manus-routes.json` — complete page route manifest for the current source.
- `drizzle/` and `server/` — preserved starter persistence and authentication foundation for the next backend milestone.

## Design direction

Three candidate directions were considered:

- **Boardroom Utility** (0.07): disciplined procurement software with dense information hierarchy and quiet confidence.
- **Editorial Trade Desk** (0.05): magazine-like structure with stronger narrative pacing and merchant context.
- **Industrial Ledger** (0.03): operational, data-forward interfaces with utilitarian controls.

### Chosen direction: Boardroom Utility

- **Design Movement:** contemporary B2B product design with boardroom-grade clarity, closer to a procurement console than a consumer storefront.
- **Core Principles:** explicit hierarchy, trustworthy restraint, progressive disclosure, and action clarity.
- **Color Philosophy:** primary navy creates institutional confidence; corporate blue carries action and navigation; amber marks attention without becoming decorative; teal is reserved for verified or successful states; cool off-white and slate keep dense information readable.
- **Layout Paradigm:** a full-width navy navigation rail anchors a sequence of editorial content bands; primary content uses asymmetric two-column compositions and left-aligned section markers instead of repetitive centered card grids.
- **Signature Elements:** a compact “BK” monogram mark, thin amber rule accents, and section labels with numbered/eyebrow treatment for procurement stages.
- **Interaction Philosophy:** every interaction should reduce uncertainty—search clarifies scope, filters expose intent, CTAs state their pathway, and empty states explain what is needed next.
- **Animation:** use opacity and short translate transitions for entrance, menu, hover, and state feedback; avoid bounce and decorative motion; respect `prefers-reduced-motion`.
- **Typography System:** Manrope for headings and strong labels; Inter for body copy, tables, controls, and metadata. Use tight, confident display sizes only where they support orientation.
- **Brand Essence:** the structured starting point for serious B2B sourcing; clear, dependable, ready for real procurement. Personality: composed, practical, accountable.
- **Brand Voice:** direct and operational, never inflated. Example lines: “Source with clarity. Buy with confidence.” and “Your marketplace is ready for approved catalog content.”
- **Wordmark & Logo:** a BK monogram built from two offset rectangular strokes beside the BazroKart wordmark; the amber stroke signals the next step in a procurement flow.
- **Signature Brand Color:** primary navy `#0A1F44`, used as the ownable visual anchor across the shell.

## Milestone sequence

1. Deliver the public shell, route manifest, responsive behavior, and empty-state language.
2. Add database-backed catalog, categories, suppliers, and owner-controlled configuration.
3. Add buyer cart, MOQ/tier pricing, address management, checkout, order snapshots, and idempotency.
4. Add RFQs, quotations, negotiation, acceptance, and order conversion.
5. Add supplier operations, administration, audit logs, integration hardening, and production checks.
6. Install Google Stitch Skills (`stitch-skills.git`) across global and workspace customization roots, and implement the consistent premium typography system:
   - Google Fonts preconnect and high-priority font asset loading for **Manrope** (600, 700, 800) and **Inter** (400, 500, 600, 700).
   - Manrope 800 for hero display headlines with responsive `clamp(2.35rem, 4.8vw, 4.25rem)`.
   - Manrope 700 for section headings with responsive `clamp(1.65rem, 2.5vw, 2.35rem)`.
   - Manrope 600 for navigation links, dropdowns, and button labels.
   - Inter 400 for long-form body copy, descriptions, and empty-state messaging.
   - Inter 500 for status badges, table headers, and form input labels.
   - Inter 600 for product names, wholesale pricing, HSN codes, and tabular data metrics.
   - Verified zero TypeScript compilation errors and production build deployed on port 3000.
