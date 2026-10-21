---
name: Arcanium Digital
description: Observed incumbent identity and scoped seller-demo interface reference.
colors:
  background: "#08090c"
  foreground: "#f5f5f3"
  primary: "oklch(0.61 0.24 305)"
  accent: "oklch(0.9 0.035 305)"
  seller-demo-lead-surface: "#101116"
  seller-demo-chat-surface: "#15151d"
  seller-demo-heading-accent: "#bca4e6"
  seller-demo-action: "#e3d3fc"
  seller-demo-action-hover: "#f0e6ff"
  seller-demo-action-text: "#1a1126"
  seller-demo-field-border: "#ffffff30"
  seller-demo-focus: "#d4b8ff"
typography:
  display:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
  body:
    fontFamily: "Inter, system-ui, sans-serif"
  seller-demo-headline:
    fontFamily: "Space Grotesk, system-ui, sans-serif"
    fontSize: "clamp(36px,4.5vw,62px)"
    fontWeight: 600
    lineHeight: 1.08
    letterSpacing: "-.035em"
rounded:
  base: "0.875rem"
  seller-demo-panel: "16px"
  seller-demo-input: "8px"
  seller-demo-action: "9px"
  seller-demo-secondary: "7px"
spacing:
  seller-demo-panel: "30px"
  seller-demo-panel-mobile: "24px"
  seller-demo-panel-small: "20px"
components:
  seller-demo-primary:
    backgroundColor: "{colors.seller-demo-action}"
    textColor: "{colors.seller-demo-action-text}"
    rounded: "{rounded.seller-demo-action}"
    padding: "12px 20px"
    width: "100%"
  seller-demo-primary-hover:
    backgroundColor: "{colors.seller-demo-action-hover}"
  seller-demo-input:
    backgroundColor: "{colors.background}"
    rounded: "{rounded.seller-demo-input}"
    padding: "10px 12px"
---

# Design System: Arcanium Digital

## Overview

Preserve Arcanium Digital's existing identity and source components. The user authorised an isolated seller conversation demo, not a site redesign. This document records observed code and the reviewed desktop/mobile interface; it introduces no replacement brand strategy.

**Key Characteristics:**

- Near-black surfaces with lilac and purple accents.
- Inter body text, Space Grotesk display text and the existing Arcanium logo.
- Scoped demo controls with visible labels, numbered steps and explicit feedback.

Sources: `PRODUCT.md`, `app/layout.tsx`, `app/globals.css`, `app/seller-demo/page.tsx`, `app/seller-demo/seller-demo.module.css`, `components/seller-demo/seller-demo.tsx`, and `.impeccable/review/{desktop,mobile}.jpg`. Tokens prefixed `seller-demo-` describe only `/seller-demo`.

## Colors

### Primary

The incumbent global primary and accent retain their source OKLCH values. The demo uses pale lilac for its main action and highlighted heading, with darker purple text on the action.

### Neutral

The global near-black background and off-white foreground frame the demo. Slightly lighter lead and chat surfaces distinguish the two steps; translucent white borders separate fields and panels. The native GHL widget retains its provider-owned white/blue appearance, which is not an Arcanium brand token.

## Typography

The root layout loads Inter and Space Grotesk through Next.js font variables. Display text uses the latter; body and controls use the former. On `/seller-demo`, the headline uses the recorded clamp, section titles use (21px), supporting introduction copy uses (17px / 1.65), and panel copy uses (14px / 1.7). At the smallest demo breakpoint the headline is (36px) and section titles are (19px). These sizes are route-specific observations, not a new global type scale.

## Layout

`/seller-demo` uses a centred container with maximum width (1240px), desktop horizontal padding (32px), and two numbered steps in adjacent columns (0.9fr / 1.1fr). At (800px) and below the panels stack in reading order; at (430px) and below the name/suburb fields and copy feedback also stack. Panel padding follows the scoped spacing tokens. These composition rules belong to the demo only; incumbent landing-page layouts remain authoritative elsewhere.

## Elevation & Depth

The demo separates surfaces with tone and thin borders; its panels have no box shadow. Other incumbent components already use shadows, such as the global browser frame, so this is not a brand-wide ban. The demo buttons transition background and text color over (.2s ease-out), with transitions disabled for reduced motion.

## Shapes

The global base radius is retained. Demo containers, fields and actions use their scoped rounded tokens; numbered step markers are circular. The existing logo asset remains `/images/brand/logo-ad.png`.

## Components

The demo's primary action is full-width with minimum height (48px), a pale lilac fill, dark text and a lighter hover fill. Its secondary copy action is outlined, transparent, and at least (40px) high. Inputs have dark fills, minimum height (46px), translucent borders and visible labels. The route's focus indicator is a (2px) lilac outline offset by (4px).

The header links the existing logo/name and “Back to website” to the homepage. The form prepares a practice message for copying into the native GHL widget. Updating the practice enquiry or returning to the form does not claim to reset chat history. The embedded widget's internal visual system is provider-owned. Documentation and interface review do not certify provider routing, external effects or production lifecycle readiness.

## Do's and Don'ts

- Do preserve the existing logo, fonts, palette and source components.
- Do keep demo-specific measurements and two-step composition scoped to `/seller-demo`.
- Do retain the visible demo boundary, labelled controls, focus feedback and truthful chat-history wording.
- Don't introduce a redesign or change incumbent site and live lead behaviour through this reference.
- Don't promote the native GHL widget's appearance into the Arcanium design system.
- Don't treat interface review as evidence of production lead delivery or provider lifecycle readiness.
