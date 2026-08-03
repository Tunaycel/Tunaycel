# Hüseyin Tunay Çelik

Software Developer · Full-Stack · Cloud · AI-Driven Automation · Wrocław, Poland

[LinkedIn](https://www.linkedin.com/in/h%C3%BCseyin-tunay-%C3%A7elik-4506522a4) ·
[h.tunaycelik@gmail.com](mailto:h.tunaycelik@gmail.com) ·
[Portfolio](https://github.com/Tunaycel/portfolio)

---

## About

Generalist software developer. I work across the whole stack — frontend, backend, mobile,
cloud, data and DevSecOps — and I pick the layer the problem lives on rather than the one
I'm most comfortable in.

I use AI functionally, not as a chatbot: agentic coding workflows, RAG pipelines, LLM
integrations and automations are part of how I build. What I ship is reviewed and cut down
before it reaches a branch — across the projects below that has meant more deleted lines
than most features add.

- Final-year **B.Sc. Software Development**, WSB Merito University Wrocław — graduating
  February 2027
- Software engineering intern at **NEST2MOVE / Pro2Move**, March – September 2026
- **Oracle Cloud Infrastructure 2025 Certified Foundations Associate**
- Thesis: *Automated Incident Response under Zero Trust Architecture — MTTR Reduction in
  Microsoft Azure IaaS* (Azure Sentinel · KQL · Logic Apps · NIST SP 800-207)

---

## By the numbers

| | |
|---|---|
| Merged pull requests across all projects | **98** |
| Into a production SaaS with auto-deploy on merge | **39** |
| Largest single contribution window | 69 commits, +16,579 / −10,057 lines in one quarter |
| Dead code removed in a single PR | ~2,300 lines |
| Automated tests written | 21 pytest cases (AI Producer Platform) |
| Stars across public repositories | 42 |

---

## Selected work

**EmlakPlus AI** — private repo · [case study](https://github.com/Tunaycel/emlakplus-ai-case-study)
`Next.js 16 · React 19 · Tailwind v4`

Real-estate CRM and marketing-automation SaaS. Frontend owner in a 3-person team:
39 merged PRs, 69 commits, +16,579 / −10,057 lines. Merges to `main` auto-deploy to the
pilot environment, so every PR had to be releasable.

Built the AI template studio end to end — photo upload, server-side slot detection,
compositing, social share — with a client-side canvas fallback so the flow survives a
compositor timeout. Verified with Playwright. One bug-sweep PR removed ~2,300 lines of dead
components and fixed what they were hiding: a hard-refresh logout caused by the auth context
clearing its token on any failed session check, three memory leaks, race conditions on three
route components, and skeleton-flash across nine pages.

**data-stock** — private repo · [case study](https://github.com/Tunaycel/data-stock-case-study)
`FastAPI · PostgreSQL · Expo`

Scan-based inventory system replacing spreadsheet stock tracking. I built the campaign and
discount pricing engine and the multi-warehouse foundation.

**[AI Producer Platform](https://github.com/Tunaycel/ai-producer-platform)**
`FastAPI · React 19 · Python DSP`

Vocal-first music production. 19 merged PRs, 5 endpoints, 21 pytest cases. Real signal
processing rather than a wrapper around a generation API: BPM via onset-strength beat
tracking and key via Krumhansl–Schmuckler chroma correlation (librosa), and a
highpass → shelf → presence → compressor → limiter mastering chain (Pedalboard). The README
states which parts are not integrated yet.

**[portfolio](https://github.com/Tunaycel/portfolio)** `Next.js 14 · React Three Fiber`

Cinematic WebGL portfolio. One scroll value drives a camera along a fixed rail through a
persistent 3D world; damping is exponential in frame delta, so motion is identical at 60 and
144 Hz. 135 kB first-load JS.

**[CVForge](https://github.com/Tunaycel/-CVForge)** `Python · AWS Elastic Beanstalk` — 10 stars

AI-powered CV builder with ATS scoring and PDF generation, deployed on Elastic Beanstalk.

**[globallife-ai](https://github.com/Tunaycel/globallife-ai)** `Next.js · TypeScript` — 12 stars

AI web application, Google OAuth through NextAuth.

**[ai-assistant-bot](https://github.com/Tunaycel/ai-assistant-bot)** `Streamlit · Gemini` — 9 stars

RAG document-analysis chatbot with multi-session history and SQLite-backed memory.

**[3d-solar-system-simulator](https://github.com/Tunaycel/3d-solar-system-simulator)** `Python · OpenGL` — 9 stars

Real-time 3D solar system simulation.

---

## Stack

**Languages** — Python · TypeScript · JavaScript · SQL · Bash

**Frontend & mobile** — React 19 · Next.js · React Native · Expo · Tailwind CSS · Three.js · Vite

**Backend & data** — FastAPI · PostgreSQL · Redis · Pandas · Jupyter · Streamlit

**AI & automation** — Claude · Gemini · RAG pipelines · agentic coding workflows · n8n

**Cloud & DevSecOps** — Azure (Sentinel, KQL) · AWS · Oracle Cloud · Linux · Docker ·
GitHub Actions · OWASP ZAP · Git

**Testing** — Playwright · Vitest · pytest

---

Open to software engineering opportunities.
