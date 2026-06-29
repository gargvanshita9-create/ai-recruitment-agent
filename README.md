# AI Recruitment Agent — eTeam

A standalone recruitment tool with four tools: **Screen CV**, **Score & Rank**,
**Interview Questions**, and **Shortlist Email**. It runs on the Groq API
(OpenAI-compatible).

> **Groq, not Grok.** This uses **Groq** (console.groq.com, keys start `gsk_`),
> the fast inference host — *not* xAI's **Grok** (console.x.ai, keys start
> `xai-`). They sound identical but are different providers.

## How it's built (and why)

```
  Browser (index.html)  ──►  /api/groq  (serverless function)  ──►  api.groq.com
   no key here                holds GROQ_API_KEY here              llama-3.3-70b
```

The page **never** contains your API key. The browser calls your own
`/api/groq` function (same domain, so no CORS errors), and that function adds
the secret key and forwards the request to Groq. This is the only way to run a
key-based LLM app safely from a browser — a key pasted into client-side HTML
can be read by anyone who opens the page.

## Files

- `index.html` — the whole front-end (no build step)
- `api/groq.js` — serverless proxy that holds your Groq key
- `api/extract.js` — serverless text extractor for PDF / DOCX / text uploads
- `package.json` — declares the extractor's dependencies (`pdf-parse`, `mammoth`)

> The front-end has no dependencies. The two serverless functions need the
> npm packages above; Vercel installs them automatically from `package.json`
> on deploy. Run `npm install` first if you use `vercel dev` locally.

---

## Free deployment — Vercel (recommended, ~3 minutes)

Vercel's free Hobby tier serves the static page and the `/api/groq` function
together, with no card required.

### Option A — deploy from GitHub (easiest)
1. Push this folder to a new GitHub repo.
2. Go to **vercel.com** → sign in with GitHub → **Add New → Project** → import the repo.
3. Framework preset: **Other**. Leave build settings empty. Click **Deploy**.
4. Open **Settings → Environment Variables** and add:
   - Name: `GROQ_API_KEY`
   - Value: your `gsk_...` key from **console.groq.com → API Keys**
5. Go to **Deployments → ⋯ → Redeploy** so the key takes effect. Done.

### Option B — deploy from your machine (CLI)
```bash
npm i -g vercel
cd ai-recruitment-agent
vercel                       # follow prompts, accept defaults
vercel env add GROQ_API_KEY  # paste your key when asked
vercel --prod                # redeploy with the key
```

### Run locally first
```bash
npm i -g vercel
cd ai-recruitment-agent
npm install                  # installs pdf-parse + mammoth for /api/extract
echo "GROQ_API_KEY=gsk-your-key" > .env.local   # or use a .env file
vercel dev                   # opens http://localhost:3000 with the functions running
```
> Opening `index.html` directly with a double-click will **not** work — there's
> no server to run `/api/groq`. Use `vercel dev` or deploy.

---

## Other free hosts

- **Cloudflare Pages** (very generous free tier) and **Netlify** also work, but
  their function path differs from Vercel's `/api/`. To use them, move the
  handler into that host's functions folder (Cloudflare: `functions/api/groq.js`
  with `onRequestPost`; Netlify: `netlify/functions/groq.js`) and point the
  frontend's `fetch("/api/groq")` at the matching path. Vercel needs none of
  this, which is why it's the recommended path.
- **GitHub Pages / plain static hosts won't work** on their own — they can't run
  the serverless function, so the key would have nowhere safe to live.

---

## Getting a Groq key

1. Sign up at **console.groq.com** (free, self-serve).
2. **API Keys → Create API Key**, copy the `gsk_...` string.
3. Groq has a generous free tier — plenty for testing this app.

## Cost & model

- Default model: **`llama-3.3-70b-versatile`** (fast and capable on Groq's free tier).
- Change the model or limits in `api/groq.js` — any Groq-hosted model id works
  (e.g. `llama-3.1-8b-instant` for speed, `openai/gpt-oss-120b` for more depth).

## Uploads (PDF / DOCX)

The **Screen CV** tab accepts file uploads for both the job description and the
candidate CV. Files are sent to `/api/extract`, which pulls out the plain text
(`pdf-parse` for PDF, `mammoth` for DOCX) and fills the text box — you can edit
it before screening. Scanned/image-only PDFs have no text layer to extract, so
paste those instead. Uploads are capped at 8 MB.

## Customising

- **Job descriptions:** none are bundled with the app — paste or upload a JD
  each time. History persists in the browser via `localStorage`.
- **Prompts:** each tool's prompt lives in its `run…()` function in `index.html`.
- **Extraction limits/formats:** see `api/extract.js`.
