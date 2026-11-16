# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Ollie and prospective Arcanium Digital clients trying the seller-enquiry conversation before using it with homeowners.

## Product Purpose

Add an isolated demonstration page to the existing Arcanium Digital website. The latest request extends the website conversation into an owner-only form-to-SMS test, collecting name, mobile, suburb and property address with two intent options.

## Capabilities and Constraints

- The user superseded the website-only scope on 21 October: SMS testing is authorised only to the previously approved owner test mobile. Its value stays in server-only configuration, not client code or documentation.
- No messages, assignments or notifications to Kael or client accounts.
- Preserve the existing live lead forms, backend, integrations, website design and deployment project.
- Label the experience as a demonstration, not proof that the complete production automation lifecycle is ready.
- Use fictional property details and explicit test-SMS consent. Enforce the single approved recipient on the server, never in a client-supplied allowlist.
- Arcanium GHL Phone System was inspected on 21 October and contains no phone numbers. SMS sending is BLOCKED until a verified two-way Arcanium sender, isolated routing, credentials and delivery controls are connected and tested. Do not borrow Kael's number.
- Keep the current live website conversation working; review the SMS form in preview until its external connection is available.
- The only form intent options are Just curious and Thinking of selling.
- Use a dedicated Arcanium GHL demo widget/responder, not Kael's live bot or calendar.
- A form-to-chat demonstration does not prove SMS, email, real booking or all production workflows.

## Brand Commitments

Preserve Arcanium Digital's existing identity and source components; this request does not authorise a redesign.

## Evidence on Hand

Existing Next.js repository arcaniumdigital/arcanium-digital-site; existing Arcanium GHL location sAZLKsXRU0jvrBUziSr3. Native widgets and bot routing still require controlled verification before public use.

## Product Principles

- Demonstrate the conversation directly.
- Separate demonstration data and effects from production.
- Never imply a real appraisal, delivery or booking occurred when only simulated.

## 2026 Public Website Redesign

The user subsequently authorised a full public-site redesign. The homepage now presents Arcanium Digital as a specialist seller-pipeline partner for Australian real estate agents. It explains the journey from local campaign to homeowner conversation, appraisal booking and visible listing opportunity, then offers the existing free Seller Appraisal Growth Plan and strategy call.

The redesign preserves the existing Next.js application, first-party lead endpoint, Turnstile protection, attribution, Meta Pixel, Clarity, Vercel Analytics, Sentry, privacy route, seller demo and deployment path. Public proof remains source-backed: Meta results are labelled as lead enquiries, not confirmed appraisals or listings. The three system illustrations are explanatory and do not claim every enquiry reaches a listing.

The visual direction is light, editorial and proof-led. LeadFleet informed the level of spacing and restraint; Arcanium's content, imagery, identity and compositions remain original. AgentEA informed the three motion concepts, which are custom-built and do not reuse its source.

### Hybrid homepage scope

The final approved scope is a hybrid of the incumbent Arcanium funnel and selected reference patterns, not a wholesale replacement. The incumbent navigation, Wistia VSL, protected lead form, form-to-booking route, testimonials, seller-path explanation and campaign proof remain. New presentation is limited to a LeadFleet-inspired hero frame and client-name marquee, a creative gallery, an evidence-safe client showcase, a scrolling system-event CTA and three custom AgentEA-inspired explanatory animations. A `NEXT_PUBLIC_HOMEPAGE_VARIANT=legacy` rollback path keeps the previous homepage composition available without changing the funnel or operational routes.
