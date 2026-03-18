# DESIGN_PLAN.md — MarkIt Frontend Design Plan

## Context

The MarkIt web app needs a public-facing frontend that matches the provided design screenshots. This covers two main areas: (1) the **main landing/marketing page** visitors see at the root URL, and (2) the **public market pages** users see after searching for a specific market (e.g., Cedar Falls Farmers Market). The existing Next.js app already has authenticated market pages (mobile-first with bottom nav); this plan covers the **public/unauthenticated** desktop-oriented pages that serve as the entry point and marketing experience.

---

## Page Breakdown (from screenshots)

### A. Main Landing Page (`/`)

**1. Navbar**
- MarkIt logo (top-left, red cursive text)
- Nav links: Home, About, Features
- Right side: "Find Your Market" button, Login button, "Become a Market Manager" button
- Background: `#FFF5F5` (pink-light), sticky

**2. Hero Section**
- Full-bleed background image (farmer in field, dark overlay)
- Large heading: **"Connecting people and farmers"** (white text, simple fade-in animation on load)
- App store badges (Google Play + App Store) bottom-left area
- "Find Your Market" search button (bottom-right, opens search modal/panel)

**3. About Section (scroll down)**
- Background: wheat field image with semi-transparent overlay
- Three columns side by side:
  - **Our Mission** — connecting people, technology, sustainability
  - **Commitment of Privacy** — data protection messaging
  - **Vision Statement** — future vision
- Text: dark `#171717`, headings bold

**4. Features Section**
- Background: food/charcuterie spread image
- Title: **"Discover Something New"**
- Left side: phone mockup showing the app's discover screen (with vendor cards, categories)
- Right side: descriptive text about market discovery features
- Clean white content area overlaying the background

**5. Footer**
- Phone number, Privacy Policy link, Terms and Conditions link
- Copyright: "© 2023 MarkIt"
- MarkIt logo (bottom-right)
- Dark background (`#171717`)

---

### B. Market Landing Page (`/market/[slug]`)

Once a user selects a market, they see a public market site with a top navbar and tabbed navigation.

**Market Navbar (shared across all market sub-pages)**
- Left: Market logo (circular image)
- Center: Tab links — About, Vendors, Sponsors, Market Info
- Right: "Download the app" link + MarkIt app icon
- Active tab has underline/highlight in red (`#B20000`)
- Background: white, with light bottom border

**6. Market Home / Discover**
- Sponsor Carousel at top — large rotating banner with sponsor logos/images
- News Section — horizontal row of news cards (image + title + "Read More")
- Featured Vendors Section — grid of vendor cards with images (2-column)

**7. About Page (`/market/[slug]/about`)**
- Hero banner with market scene photo
- Market name centered with market logo
- "Our Story" section with market history
- Our Mission block — image left, text right
- Our Vision block — text left, image right (alternating)

**8. Vendors Page (`/market/[slug]/vendors`)**
- Hero section with "INTERESTED IN BECOMING A MARKET VENDOR?" heading
- Vendor directory list in two-column grid with circular avatars

**9. Sponsors Page (`/market/[slug]/sponsors`)**
- Hero section with "BECOME A MARKET SPONSOR" heading
- Sponsor listings with images and descriptions

**10. Market Info Page (`/market/[slug]/market-info`)**
- Market logo + name + stats
- Hours and location info
- Embedded Leaflet map
- "Contact us" button

---

## Design Tokens

| Token | Value | Usage |
|-------|-------|-------|
| `markit-pink-light` | `#FFF5F5` | Navbar bg, card backgrounds |
| `markit-pink` | `#FFE6E6` | Button hover states, accents |
| `markit-red` | `#B20000` | Primary CTAs, active tab underline |
| `markit-dark` | `#171717` | Body text, footer bg |
| Font | Roboto, system-ui | Global font family |
