# 🎨 Artwork Analyzer AI Agent — Technical Specification (v1)

## 🧭 Overview

**Artwork Analyzer AI Agent** is an open-source web application designed to analyze **PNG and PDF** artwork files for printing. It extracts key file metrics (resolution, DPI, size, ICC, and colors), rates print quality, and integrates an **AI assistant** capable of explaining results and answering print-preparation questions.

It’s purpose-built for **DTF and printing workflows**, deployable entirely on **Cloudflare Pages + Workers** (zero-cost), and fully extensible for color correction, upscaling, transparency repair, and halftone simulation in future releases.

---

## 🚀 Key Features

### 1. File Upload & Print Quality Analysis (PNG + PDF)
Extracts and displays:
- File type, file size, and pixel dimensions
- Aspect ratio, bit depth, alpha/transparency flag
- ICC profile detection and name (if embedded)
- DPI detection (PNG `pHYs` chunk) or computed sizes if absent
- Recommended **max print sizes** for 300 and 150 DPI
- Auto-quality rating: **Optimal**, **Good**, or **Poor**
- Fixed DTF guidelines:
  - “Keep text ≥2.5 mm x-height; hairlines ≥0.5 mm.”
  - “Avoid semi-transparent layers; use solid colors for best adhesion.”

### 2. Color Extraction & Palette Generation
- Extracts dominant RGB/HEX colors and frequency (%)
- Full RGB list grouped by similarity
- Downloadable **palette.csv** and **palette.json**
- v2-ready hooks for `.ASE` and `.SVG` export

### 3. AI Agent Integration
- Answers questions about file quality, print sizes, and color accuracy
- Uses Claude 3.5 or GPT-4o (switchable in admin panel)
- Merges file analysis data + optional RAG documents for accurate context
- Configurable **system prompt** and personality in admin dashboard

### 4. Admin Dashboard
- Edit provider (OpenAI/Anthropic)
- Update model, system prompt, and API keys
- Upload or manage RAG documents (`.md` / `.txt`)
- Re-embed or delete documents
- View and test AI prompt configuration

### 5. Knowledge Base (RAG)
Optional but supported from v1:
- Upload print-knowledge docs (e.g., `dtf_printing.md`, `icc_profiles.md`)
- Stored in Cloudflare **D1** or **KV**
- Chunked and embedded for semantic retrieval
- Injected into prompts before each AI query

---

## 🧩 Architecture & Data Flow

```
Frontend (React + Vite + Tailwind)
 ├─ Local file analyzers (PNG, PDF, Colors)
 ├─ Display Quality + Palette report
 └─ Sends report + user query to /api/ai/chat

Cloudflare Worker (Hono)
 ├─ Loads provider + system prompt (KV)
 ├─ Retrieves RAG context (D1)
 ├─ Combines report + context → builds prompt
 ├─ Sends request to Claude/OpenAI
 └─ Returns chat reply to frontend

Storage
 ├─ KV → Config & secrets
 ├─ D1 → Docs & embeddings
 └─ R2 (optional) → file cache/export store
```

---

## 🧠 Data Models

### QualityReport
```ts
{
  fileType: "png" | "pdf",
  fileSizeMB: number,
  pixels?: { w: number, h: number },
  dpi?: number | null,
  hasICC: boolean,
  iccProfile?: string,
  bitDepth?: number,
  hasAlpha?: boolean,
  recommendedSizes: {
    at300dpi: { w_in: number, h_in: number, w_cm: number, h_cm: number },
    at150dpi: { w_in: number, h_in: number, w_cm: number, h_cm: number }
  },
  aspectRatio: string,
  rating: "Optimal" | "Good" | "Poor" | "VectorPDF",
  notes: string[]
}
```

### ColorReport
```ts
{
  top: Array<{ rgb:[number,number,number], hex:string, percent:number }>,
  allGrouped: Array<{ rgb:[number,number,number], hex:string, count:number }>,
  downloads: { csvUrl: string, jsonUrl: string }
}
```

### DocChunk
```ts
{
  id: string,
  appId: string,
  text: string,
  embedding: number[],
  source: string
}
```

---

## ⚙️ Technology Stack

| Layer | Tool | Function |
|-------|------|-----------|
| Frontend | React (Vite) | Client app + UI |
| Styling | Tailwind CSS | Styling |
| PDF Parser | `pdfjs-dist` | Extract page size, render thumbnails |
| PNG Parser | `pngjs`, `UPNG.js` | Read metadata, ICC, alpha |
| Color Extraction | `node-vibrant` | Dominant palette detection |
| Backend Framework | Hono (Cloudflare Worker) | API endpoints |
| AI Models | Claude 3.5 / GPT-4o | Conversational agent |
| Vector DB | Cloudflare D1 | Doc embeddings (RAG) |
| KV Store | Cloudflare KV | Config, prompts, API keys |
| Storage | Cloudflare R2 (optional) | File cache or exports |
| Embedding Model | `all-MiniLM-L6-v2` | Local/offline vectorization |
| Hosting | Cloudflare Pages + Workers | Zero-cost deployment |

---

## 🧮 Key Calculations

### DPI Conversion
```ts
dpi = pixels / inches;
inches = pixels / dpi;
cm = inches * 2.54;
```

### Recommended Print Sizes
```ts
const at300dpi = { w_in: w/300, h_in: h/300 };
const at150dpi = { w_in: w/150, h_in: h/150 };
```

### Quality Rating
```ts
if (dpi >= 300) "Optimal";
else if (dpi >= 150) "Good";
else "Poor";
```

### ICC Detection
- Check PNG `iCCP` chunk
- Decode → extract profile name (e.g., “Adobe RGB (1998)”)

---

## 🧰 Example System Prompt

```
You are a print production specialist.
Never invent DPI values; report “not embedded” if missing.
Always include both 300 DPI and 150 DPI print size calculations.
If file is a vector PDF, explain DPI irrelevance.
Warn if text < 2.5 mm or lines < 0.5 mm.
Advise avoiding semi-transparent layers in DTF prints.
Be concise, clear, and friendly.
```

---

## 🧪 Testing & Validation

### Unit Tests
- PNG metadata extraction accuracy
- PDF page size detection
- Color extraction consistency
- Worker endpoints schema validation

### Integration Tests
- PNG & PDF uploads produce correct metrics
- AI Agent responds using uploaded docs (RAG)
- Admin edits prompt + provider successfully

### Manual QA
- Compare size & DPI values to Photoshop
- Verify color palettes visually
- Confirm AI accuracy on DTF questions

---

## 📦 Deployment Steps

### Frontend (Cloudflare Pages)
```bash
npm run build
npx wrangler pages publish ./dist
```

### Worker (API)
```bash
wrangler deploy src/worker.ts
```

### Environment Bindings
`wrangler.toml` example:
```toml
[[kv_namespaces]]
binding = "APP_CONFIG"
id = "kv_namespace_id"

[[d1_databases]]
binding = "DOCS_DB"
database_name = "artwork_ai_db"
database_id = "d1_database_id"
```

---

## 📂 Repository Structure

```
/src
  /frontend
    /components
    /pages
    /analyzers
  /worker
    /api
    /utils
  /shared
    types.ts
    constants.ts

/docs
  dtf_basics.md
  icc_profiles.md

/public
  sample.png
  sample.pdf

wrangler.toml
package.json
README.md
```

---

## 🔁 Future Extensions (v2+)

| Feature | Description |
|----------|-------------|
| Palette export | `.ASE`, `.SVG` palette file output |
| ICC Gamut Mapping | Compare colors to DTF ICC range |
| AI Upscaling | Real-ESRGAN integration |
| Thin Line Detection | Edge width analysis via OpenCV |
| Transparency Correction | Smart alpha fix via RMBG-1.4 |
| Halftone Simulation | CMYK dot preview |
| Full History | Supabase/Postgres storage of results |

---

## ✅ Summary

**Artwork Analyzer AI Agent (v1)** delivers:  
- PNG/PDF resolution and print-quality analysis  
- Color palette extraction and export  
- Configurable AI assistant (Claude / OpenAI)  
- Optional RAG knowledge base  
- 100% open-source, Cloudflare-native stack  
- Zero hosting cost

Built for scalability, transparency, and DTF production optimization.

---
