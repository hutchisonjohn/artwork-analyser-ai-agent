# Artwork Analyzer AI Agent — Build Plan (v1)

## Goal
Deliver the complete Artwork Analyzer AI Agent v1 as specified in Artwork_Analyser_AI_Agent.md, with a production-ready foundation hosted on Cloudflare Pages + Workers, including:
- PNG/PDF artwork analysis and print-quality reporting
- Color palette extraction with CSV/JSON downloads
- Configurable AI assistant (Claude 3.5 or GPT-4o) that consumes the analysis output
- Knowledge-base (RAG) support via Cloudflare KV/D1 + Workers AI embeddings
- Admin dashboard to manage AI settings, documents, and prompts

## Tech Stack
| Layer | Choice | Notes |
| --- | --- | --- |
| Frontend | React (Vite) + Tailwind CSS + shadcn/ui | SPA served via Cloudflare Pages |
| File Parsing | Canvas APIs + pdfjs-dist | Client-side analyzers extract PNG metadata and PDF geometry |
| Color Extraction | In-browser canvas quantisation | Buckets RGB values, generates dominant palette & exports |
| Backend | Cloudflare Worker (Hono) | REST endpoints for AI chat, admin actions, document ingestion |
| AI Providers | Claude 3.5 (Workers AI) / GPT-4o (future) | Provider adapters hide implementation details |
| Config / Secrets | Cloudflare KV + XOR/b64 | API keys encrypted with optional APP_SECRET_KEY binding |
| Knowledge Base | Cloudflare D1 | Stores document chunks + embeddings (JSON) |
| Embedding Model | Cloudflare Workers AI embeddings | Default 	ext-embedding-3-large, overridable via admin UI |
| Deployment | Cloudflare Pages (frontend) + Workers (API) | Wrangler, D1 migrations, optional CI |

## Repository Structure
`
Artwork Analyser AI Agent/
├─ src/
│  ├─ frontend/
│  │  ├─ analyzers/
│  │  ├─ components/
│  │  ├─ lib/
│  │  └─ types/
│  ├─ worker/
│  │  ├─ migrations/
│  │  ├─ services/
│  │  ├─ routes.ts
│  │  └─ config.ts
│  └─ shared/
│     └─ types.ts
├─ public/
├─ docs/
├─ wrangler.toml
├─ package.json
└─ BUILD_PLAN.md
`

## Implementation Status
1. **Bootstrap & Tooling** — ✅ Vite + Tailwind + shadcn, shared types, workspace scripts
2. **File Analysis Pipeline** — ✅ PNG/PDF analyzers, DPI math, rating rules
3. **Color Palette Extraction** — ✅ Canvas quantiser, palette downloads
4. **AI API & Provider Layer** — ✅ /api/ai/chat with Claude (Workers AI)
5. **RAG Integration** — ✅ Document ingestion, Workers AI embeddings, cosine similarity retrieval
6. **Admin Dashboard** — ✅ Configuration form, API key masking, document manager, prompt tester
7. **UI Polish** — ✅ Analyzer dashboard, palette cards, assistant panel, loading/error states
8. **Testing & QA** — 🔄 Manual testing in progress (future automation planned)
9. **Deployment** — 🔄 Wrangler + D1 migrations in place; automate CI/deploy next
10. **Future Enhancements** — see below

## Next Actions
- Add authentication/authorization around admin endpoints (e.g. Cloudflare Access or signed token) — ✅ Bearer token support via `ADMIN_TOKEN`
- Replace embedding fallback logic with graceful Workers AI error handling & caching
- Enhance document uploads with additional metadata previews and progress feedback — ✅ Progress bar and validation added
- Integrate automated tests (unit + Miniflare integration) and CI pipeline — ✅ Vitest suites for frontend + worker and GitHub Actions CI workflow
- Optimize PDF worker bundle via code splitting/background loading

## Future Enhancements (v2+)
| Feature | Description |
|----------|-------------|
| Palette export | .ASE, .SVG palette file output |
| ICC gamut comparison | Warn when colours fall outside configured ICC profile |
| AI upscaling | Integrate Real-ESRGAN or similar |
| Thin line detection | Edge width analysis via WASM/OpenCV |
| Transparency correction | Smart alpha repair via RMBG-1.4 |
| Halftone simulation | CMYK dot preview tooling |
| Session history | Persist analyses & chat transcripts (Supabase/Postgres) |

## Notes & Decisions
- Analyzers are modular and can move into Web Workers if performance requires it.
- Workers AI embeddings remove the need to bundle ONNX models; abstraction allows swapping providers later.
- API keys in KV are XOR/b64 encoded with APP_SECRET_KEY; admin UI leaves field blank to keep existing values.
- D1 schema lives in src/worker/migrations/001_init.sql; apply via wrangler d1 migrations apply when provisioning.
- Logging/telemetry to be added once auth is in place.

---
Plan last updated: 2025-11-09
