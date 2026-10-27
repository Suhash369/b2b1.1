# BazroKart delivery checklist

## Public marketplace shell

- [x] The homepage provides a search bar, clear category/supplier discovery entry points, and explicit pathways for direct purchasing and RFQ-based purchasing.
- [x] The homepage uses the approved Boardroom Confidence palette, Manrope headings, Inter UI/body text, responsive layouts, accessible focus states, and restrained motion with reduced-motion support.
- [x] The public shell does not invent products, suppliers, brands, prices, stock, testimonials, statistics, or business policies; optional content is represented by intentional empty states.

## Catalog and supplier discovery surfaces

- [x] `/products` exposes a filter-ready catalog layout with search, sort, category, and availability controls, but shows a professional empty state until owner-approved product listings are published.
- [x] `/suppliers` exposes a supplier discovery layout and verification-aware copy, but does not fabricate supplier records.
- [x] `/products/:slug`, `/categories/:slug`, and `/suppliers/:slug` have route-safe, owner-neutral states for unpublished or unconfigured records.

## Marketplace route structure

- [x] Public, authentication, buyer, supplier, and administration route families are registered without duplicate competing pages.
- [x] The route manifest is served at `/manus-routes.json` and includes the current page patterns.
- [x] Buyer, supplier, and admin workspace routes communicate the next configuration/sign-in step rather than pretending that backend workflows are complete.

## Interaction quality

- [x] Search navigation carries the entered query to the catalog route.
- [x] Mobile navigation opens and closes accessibly.
- [x] Direct purchase and RFQ pathway cards route to the appropriate next surface.
- [x] Buttons and links have real behavior or are visibly marked as unavailable until the required configuration exists.

## Next milestone — open

- [ ] Connect owner-controlled catalog, category, supplier, inventory, pricing, and configuration records to the managed database without adding production seed data.
- [ ] Implement authenticated buyer, supplier, and admin permissions on the backend and connect the workspace route shells to real records.
- [ ] Implement transaction-safe cart, checkout, order snapshots, inventory reservations, RFQs, quotations, negotiations, and idempotency protections.
