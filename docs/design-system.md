# SOVRN — Design System (Obsidian Oracle)

## Visual Narrative
The entire experience is dark — deep night sky (#0A0E1A) throughout,
so every screen and every screenshot reads as dark + glowing (which
dominates bright social feeds). A one-time OPENING CEREMONY (three
fading lines) precedes the landing page and turns "opening a website"
into "entering a portal." The revelation is the blueprint itself
inscribing into being, not a background color change.

(Historical note: an earlier version made the blueprint warm-white for a
"dark→light emergence." That was reverted in favor of an all-dark app
for social-screenshot performance.)

## Dark Screens (1-3: Landing, Quiz, Loading)

Background: #0A0E1A deep midnight blue-black
Surface/cards: glass-morphism
  background: rgba(255, 255, 255, 0.06)
  backdrop-filter: blur(20px) saturate(1.2)
  border: 1px solid rgba(255, 255, 255, 0.12)
  box-shadow: 0 0 40px rgba(232, 176, 75, 0.08)
  border-radius: 16px
Card left borders: 3px solid #E8B04B (gilt gold)
Accent primary: #C21F2C ember red — CTAs and action elements ONLY
Accent secondary: #E8B04B gilt gold — oracle elements, brands, borders
Text primary: #F4F1EA bone white
Text secondary: #A8A29B warm gray
Text muted: #6E6A66
Progress bar track: #2A272B, fill: #C21F2C

## Blueprint Results (Screen 4 — DARK, same system as 1-3)

Background: #0A0E1A (transparent page over the shared night-sky backdrop)
Cards: glass-morphism (same as landing/quiz)
  background: rgba(255, 255, 255, 0.06)
  backdrop-filter: blur(20px) saturate(1.2)
  border: 1px solid rgba(255, 255, 255, 0.12)
  border-radius: 16px
Card left borders: alternating #C21F2C (ember) and #E8B04B (gilt)
Section titles: Space Grotesk 700, #F4F1EA bone
Section numbers: Space Grotesk 700, gilt at ~35% opacity
Body text: 16px, #A8A29B, line-height 1.7
Key quotes ("screenshot moments"): Fraunces italic, 18px, #C21F2C ember
Streaming cursor: ember, blinks 800ms
Masthead: gilt "SOVRN" + muted "BLUEPRINT NO. NNNN"; ember
  "RESULTS · VERIFIED READING"
Text is inscribed at a paced ~30ms cadence, not flooded.

### Post-blueprint (value, not paywall)
After completion: "Download Blueprint" (outline) → then YOUR SOVEREIGN
PRACTICE — three glass cards (Morning / Midday / Evening) giving a 7-day
practice, then an early-access email capture ("I'M IN" → Formspree
signup_type: early_access). No waitlist-for-vaporware framing.

## Typography

Headlines/display: Fraunces 700-900 (import from Google Fonts)
  - Hero headline: 34px mobile / 48px desktop
  - Section headers: 12px uppercase, tracked 0.08em (Space Grotesk)
  - Core quote: 24px mobile / 28px desktop, italic
  - Archetype names: 28px, Fraunces 800

UI labels/coordinates: Space Grotesk 500-700 (import from Google Fonts)
  - uppercase, letter-spacing 0.08-0.15em
  - Used for: section numbers, progress labels, status text, 
    wordmark, button text

Body: Georgia, serif fallback
  - 16px, line-height 1.6-1.7
  - Used for: all prose, helper text, card body content

Key quotes within blueprint: Fraunces italic, 18px, #C21F2C

## Buttons

Primary CTA:
  background: #C21F2C
  color: white
  font: Space Grotesk 600, 14px, uppercase, tracking 0.08em
  padding: 18px 24px (full width on mobile, max 340px)
  border-radius: 12px
  animation: breathing pulse
    @keyframes pulse {
      0%, 100% { transform: scale(1); 
        box-shadow: 0 0 20px rgba(220,38,38,0.15); }
      50% { transform: scale(1.02); 
        box-shadow: 0 0 30px rgba(220,38,38,0.3); }
    }
    animation: pulse 2.5s ease-in-out infinite

Secondary (outline):
  background: transparent
  border: 1px solid #1A1A1A (dark screens: #F4F1EA)
  color: #1A1A1A (dark screens: #F4F1EA)
  Same font, padding, radius as primary

## Animation

Opening ceremony (once per session, sessionStorage 'sovrn_ceremony_seen'):
  three lines, each fade in 1s → hold 2s → fade out 0.5s (~10s total),
  then a 500ms crossfade into the landing page. Line 3 emphasizes
  "visible" in ember red. Tap to skip.
Screen transitions: 300ms ease-out (opacity 0→1 + translateX)
Loading messages: fade in/out over 3.5s cycle
Streaming cursor: 2px wide, 20px tall, #C21F2C, blinks 800ms
  @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
Ember wave dots (loading): three 6px dots, left-to-right 
  lighting sequence, 280ms per dot, #6E6A66 → #D93A2B with glow
Constellation: 5-7 dots (3px, #E8B04B at 40% opacity) connected 
  by 0.5px lines at 15% opacity, gentle pulse (opacity 0.3-0.5, 
  3s staggered)

## Mobile First
Primary viewport: 375px
All tap targets: minimum 48px
Page padding: 20px horizontal
Max content width: 340px on mobile
Cards: always stack vertically on mobile, never side-by-side
Native pickers: date and time inputs use native mobile pickers
