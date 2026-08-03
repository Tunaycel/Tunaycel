# Hüseyin Tunay Çelik

Software developer in Wrocław, Poland. I work mostly on the frontend of production systems
and on the security side of cloud infrastructure. Final-year B.Sc. Software Development at
WSB Merito University, graduating February 2027.

Currently: frontend engineer on a real-estate SaaS shipping to a live pilot, and writing a
thesis on measuring incident-response time under Zero Trust in Azure.

---

## What I've shipped

**PlusEmlak** — real-estate CRM and marketing-automation SaaS · private repo · 3-person team,
I own the frontend
[· case study](https://github.com/Tunaycel/emlakplus-ai-case-study)

39 merged PRs and 69 commits between June and July 2026, +16,579 / −10,057 lines in
`frontend/` excluding lockfiles and image assets. Next.js 16 · React 19 · Tailwind v4.
Merges to `main` auto-deploy to the pilot environment, so every PR had to be releasable.

The work I'd point at:

- **Template studio** — photo upload → server-side slot detection → compositing → social
  share. Three screens plus the client-side canvas fallback that keeps the flow alive when
  the compositor times out. Verified end to end with Playwright.
- **Bug sweep (PR #166)** — removed ~2,300 lines of dead 3D/neon components and fixed the
  bugs behind them: a hard-refresh logout caused by `AuthContext` clearing the token on any
  failed `/auth/me`, three memory leaks (one an infinite refetch loop rooted in a toast),
  race conditions on three route components, and skeleton-flash across nine pages via a
  250 ms `useDelayedFlag` hook.
- **Template refactor (PR #91)** — net −196 lines: deleted dead code, pulled duplicated
  canvas logic into one helper, and moved the manual sliders behind an advanced toggle so
  the automatic path became the default.

**PazarPilot** — multi-channel e-commerce integration panel · private repo
· Next.js · Prisma · PostgreSQL

38 merged PRs over two weeks, ~338k lines of TypeScript. Trendyol / Hepsiburada order sync,
warehouse management, shipping, and a reconciliation module. `gitleaks` in CI.

**[AI Producer Platform](https://github.com/Tunaycel/ai-producer-platform)** — public ·
FastAPI · React 19 · Python DSP

19 merged PRs. Five endpoints over ~800 lines of Python and ~4,700 of TypeScript, 21 pytest
cases. Real signal processing rather than a wrapper around a generation API: BPM via
onset-strength beat tracking and key via Krumhansl–Schmuckler chroma correlation (librosa),
and a highpass → shelf → presence → compressor → limiter mastering chain (Pedalboard). The
README says plainly which parts are not integrated yet.

**data-stock** — scan-based inventory system replacing spreadsheet stock tracking · private
repo · FastAPI · PostgreSQL · Expo
[· case study](https://github.com/Tunaycel/data-stock-case-study)

I built the campaign and discount pricing engine and the multi-warehouse foundation.

---

## Thesis

*Automated Incident Response under Zero Trust Architecture: An Empirical Evaluation of MTTR
Reduction in Microsoft Azure IaaS* — WSB Merito Wrocław, February 2026 – February 2027,
supervised by Paweł Sikora.

Azure Sentinel, KQL detection rules, Logic Apps playbooks and NSG isolation, built against
NIST SP 800-207. It is an empirical study, so the point is the measurement: mean time to
respond with and without automated containment, detection accuracy, and false-positive rate
under a fixed attack scenario set. Targets are ≥60% MTTR reduction, ≥95% detection accuracy
and ≤1% false positives — targets, not results; the lab is still being built.

---

## Other public work

| | |
|---|---|
| [CVForge](https://github.com/Tunaycel/-CVForge) | CV builder with ATS scoring and PDF generation, deployed on AWS Elastic Beanstalk |
| [globallife-ai](https://github.com/Tunaycel/globallife-ai) | Next.js + TypeScript web app, Google OAuth via NextAuth |
| [ai-assistant-bot](https://github.com/Tunaycel/ai-assistant-bot) | RAG document analysis over Gemini, Streamlit UI, SQLite-backed sessions |
| [3d-solar-system-simulator](https://github.com/Tunaycel/3d-solar-system-simulator) | Real-time orbital simulation in Python + OpenGL |
| [focusss-project](https://focusss-project.vercel.app) | Pomodoro PWA — [live](https://focusss-project.vercel.app) |

---

## Tools I actually use

TypeScript · Python · Next.js · React · Tailwind · FastAPI · PostgreSQL · Prisma · Docker ·
GitHub Actions · Azure (Sentinel, KQL, Logic Apps) · AWS Elastic Beanstalk · Playwright ·
pytest

Oracle Cloud Infrastructure 2025 Certified Foundations Associate, January 2026.

I use AI coding tools daily and treat their output as a draft: it gets reviewed, cut down,
and tested before it goes near a branch. The dead-code deletions above are mostly that.

---

Software engineering intern at NEST2MOVE / Pro2Move, March – September 2026.

[LinkedIn](https://www.linkedin.com/in/h%C3%BCseyin-tunay-%C3%A7elik-4506522a4) ·
[h.tunaycelik@gmail.com](mailto:h.tunaycelik@gmail.com)
