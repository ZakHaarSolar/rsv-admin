# Diego Soto Borja Almeida
**Software Engineer & AI Data Evaluator**

Cancún, Mexico (UTC-5)  ·  Remote, flexible hours  ·  Native Spanish (Mexico)  ·  Professional working English  
zakhaarsol@pm.me  ·  escanervibracional.com  ·  redsolarviva.com  

## Summary
Software engineer and AI data evaluator. I build and ship a full-stack app for iOS, Android, macOS and the web, working hands-on with frontier coding models: I write the spec, drive the model through each change, and verify it on real devices before it ships. Since September 2026 I also annotate multimodal robotics video for AI training, full time. Strengths: reviewing AI-generated output against written specs, catching confidently wrong answers, strong visual judgment, and following long guidelines without drifting. Native Spanish (Mexico), with years of bilingual writing and localization.

## Tech stack (in production)
- **Languages:** TypeScript, JavaScript, SQL (PostgreSQL), Python
- **Front end:** React, Vite, Framer Motion, Three.js (React Three Fiber), WebGL, Web Audio API
- **Apps:** Capacitor (iOS, Android), Tauri (macOS), native iOS plugins in Swift and Metal, App Store and Google Play releases
- **Back end:** Supabase (Postgres, row-level security, RPCs, Edge Functions), Clerk auth, Stripe, RevenueCat, Vercel, Cloudflare R2
- **AI:** Claude Code (agentic coding), Gemini API, Cloud Vision OCR, ElevenLabs voice; prompt design and output evaluation
- **Tools:** Git and GitHub, Xcode, Android Studio, Blender, ffmpeg

## Experience

### AI Data Evaluator (Video Annotation Specialist)  ·  Multimodal Robotics
*Sep 2026 – Present  ·  Remote contract  ·  AI training data  ·  Under NDA: client name withheld*

- Evaluate and annotate long multi-camera video episodes of robotic manipulation (up to 8 synchronized views, about 18 minutes each) that become AI training data; full-time load of 40 hours per week.
- Make frame-accurate spatial and temporal calls across views: where each action starts and ends, left vs. right arm, object contact, and whether the outcome matches the instruction.
- Apply a long, evolving rubric with strict consistency; reason through ambiguous moments (occlusions, retries, overlapping actions) with its decision rules and flag true edge cases in short, objective English.
- Self-QA every episode before submitting; deliver in a single pass at about 35% under the per-task time budget.

### Founder & Software Engineer  ·  Escáner Vibracional / Red Solar Viva
*2024 – Present  ·  escanervibracional.com  ·  App Store, Google Play, macOS and web  ·  Cancún, remote*

- Built the full-stack architecture of a self-tracking app that measures six life domains and routes each user to a next action: React and TypeScript (Vite) with Framer Motion, Capacitor for iOS and Android, Tauri for macOS, and Supabase (Postgres, RPCs, Edge Functions) with Clerk auth. Three.js drives the 3D scenes of the companion site.
- In production: about 245,000 lines of TypeScript, 349 database migrations and 59 serverless functions. Own specs, implementation, QA, store releases, payments (Stripe, RevenueCat) and copy.
- Work daily with frontier coding models (Claude Code): spec the change, drive the model, test on real devices before release. Catch regressions, confidently wrong fixes and verifications that never ran; tighten the spec when the model drifts.
- Debug with evidence: traced an iOS freeze to the animation-frame clock stalling after background resume, using logs pulled from the device, and shipped a watchdog that keeps the interface responsive.
- Built a two-stage vision pipeline (Google Cloud Vision OCR, then Gemini evaluation); review failures and edge cases (glare, curved bottles, low contrast) and rewrite the guideline when the model is wrong.

## Native Spanish & localization
- Review and edit AI-generated Spanish every day for fidelity, fluency and tone: catch regional drift (Rioplatense voseo, or Spain's "bombilla" where Mexico says "foco"), wrong register, and punctuation that reads as machine-written; turn each fix into a style-guide rule.
- Localized the whole product: about 3,700 interface strings written in Spanish with their English versions, under a locked glossary of which terms never get translated and which have fixed equivalents. The same discipline as applying an annotation rubric.
- Author, as Zak'Haar, of Spanish-language nonfiction in the Códices de Luz book series (ebook, PDF and audiobook). Direct and QA Spanish AI voice narration: pronunciation, pacing, sibilance.

## Creative work

### Founder  ·  Fotón Cero (audiovisual catalog)
*2025 – Present  ·  fotoncero.com  ·  youtube.com/@zakhaarsolar  ·  Cancún, remote*

- Run an independent catalog of animated music videos, original series and game trailers. Review sequences for continuity, timing, completeness of an action, and whether a shot matches the intended instruction: the same visual judgment used to label robot videos.
