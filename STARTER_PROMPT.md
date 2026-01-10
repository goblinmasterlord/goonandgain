# GoonAndGain - Session Starter Prompt

Copy this prompt when starting a new Claude session for this project:

---

## Prompt Start

I'm continuing work on **GoonAndGain**, a Hungarian-language PWA gym planner app for intermediate lifters.

### CRITICAL: Read These Files First
Before doing anything else, you MUST read these files in order:
1. **CLAUDE.md** - Project context, structure, implementation status, all major systems documented
2. **DESIGN.md** - Design philosophy and aesthetic rules (this is ESSENTIAL for any UI work)
3. **PRD.md** - Full product requirements with detailed algorithms and specifications (reference when needed)

### Quick Context
- **Tech Stack:** React 18 + TypeScript + Vite, Tailwind CSS, Zustand, Dexie.js (IndexedDB), vite-plugin-pwa
- **Language:** ALL user-facing text must be in **Hungarian**
- **Design:** Industrial brutalist aesthetic - **NO rounded corners anywhere**, harsh shadows, grain texture, uppercase labels

### Key Design Rules (from DESIGN.md)
- Squared edges on EVERYTHING (buttons, cards, inputs, modals)
- Colors: bg-primary (#050505), accent (#ff4d00 orange), muscle-specific colors
- Fonts: Syne (display/headings), Outfit (body), JetBrains Mono (numbers)
- Use `font-mono` for all numerical data
- Uppercase with wide letter-spacing for labels

### The AI Coach - "Coach Bebi"
The app has an AI coach named **Coach Bebi** powered by Gemini. Bebi is:
- Motivating but direct
- Uses Hungarian with occasional English gym terms
- Has a slightly humorous, encouraging personality
- Provides post-workout feedback, weekly reviews, and on-demand chat

### Current Session Focus
We're working on **UX/UI improvements and app functionality**. This includes:
- Polishing existing flows
- Improving user experience
- Adding missing features
- Fixing issues

### Project Structure Overview
```
src/
├── components/     # UI components (ui/, layout/, workout/, ai/, pwa/, weight/)
├── pages/          # Route pages (Onboarding, Home, Workout, Exercises, Progress, History, Coach, Settings)
├── lib/            # Core logic (db/, ai/, workout/)
├── stores/         # Zustand state (workoutStore.ts)
├── data/           # Static data (exercises, templates, muscleGroups)
├── types/          # TypeScript interfaces
```

### Important Notes
- Local-first app - all data stored in IndexedDB via Dexie
- PWA with offline support
- Progressive overload tracking with 1RM estimation
- Strength benchmarks based on bodyweight ratios
- Volume tracking per muscle group with optimal ranges

Read the files I mentioned, then let me know you're ready to work!

---

## Prompt End
