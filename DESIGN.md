---
name: Nomi
platform: web
mode: operate
colors:
  ink: "#11100f"
  ink-soft: "#5f5b55"
  paper: "#f7f5ef"
  surface: "#fffefb"
  surface-2: "#eeebe3"
  line: "#dedad0"
  accent: "#ff7048"
  success: "#177245"
  danger: "#b42318"
typography:
  family: Geist
  body: 16px
  interface-scale: 1.125
rounded:
  control: 13px
  message: 18px
  panel: 20px
  feature: 28px
spacing:
  base: 4px
  content-mobile: 15px
  content-desktop: 24px
---

# Nomi Design System

## Direction

Nomi is a conversation-first financial tool. The visual world is paper, ink, and a restrained apricot signal. It avoids trading-terminal density and decorative Web3 tropes. The interface should feel familiar enough to trust immediately, while the custom speech-bubble mark and transaction objects keep it recognizable.

## Surface modes

- Landing page: Persuade. A large plainspoken thesis sits beside an honest example clearly labelled as an example.
- Signed-in app: Operate. Chat is the workspace; state and verified transaction details outrank expression.
- Documentation: Read. Narrow measure, strong hierarchy, exact procedural language.

## Components

### Brand

The original Nomi mark is a rounded black conversation bubble containing a white lowercase “n” and an apricot voice-status dot. Use the mark with the Nomi wordmark; never recolor it with gradients.

### Navigation

Desktop uses a quiet fixed side rail. Mobile uses four persistent bottom destinations: Chat, Activity, Contacts, Settings. The current destination is indicated by fill and label, not color alone.

### Messages

User messages use ink-filled bubbles. Nomi responses remain primarily uncontained for a lighter reading rhythm. Voice notes receive a visible text label and transcript.

### Transaction plan

The plan is one structured financial object with amount, network, status, asset, recipient name, and shortened address. It is never replaced by prose alone. Changed plans remain in awaiting-confirmation state.

### Composer

The composer stays close to the bottom safe area and contains text, voice-note, and send controls. Recording has text plus a red status signal; motion is not the only cue.

### Settings and contacts

Settings use grouped sections, not a dashboard of interchangeable cards. Contacts display both human names and shortened addresses. Destructive actions use explicit danger styling.

## Motion

Use 150–250ms state transitions. Recording and thinking indicators may pulse unless reduced motion is requested. There are no decorative page-load sequences.

## Accessibility

- Minimum 44px primary touch targets
- Visible focus rings
- Text contrast at least 4.5:1
- Screen-reader labels on icon-only controls
- Safe-area-aware mobile navigation and composer
- Reduced-motion support
- Wrapping and truncation for long names and addresses
