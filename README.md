# Shortlist — AI Recruitment Agent (Grok)

A standalone recruitment tool with four tools: **Screen CV**, **Score & Rank**,
**Interview Questions**, and **Shortlist Email**. It runs on the Grok (xAI) API.

## How it's built (and why)

```
  Browser (index.html)  ──►  /api/grok  (serverless function)  ──►  api.x.ai
   no key here                holds XAI_API_KEY here              Grok 4.3
```

The page **never** contains your API key. The browser calls your own
`/api/grok` function (same domain, so no CORS errors), and that function adds
the secret key and forwards the request to xAI. This is the only way to run a
key-based LLM app safely from a browser — a key pasted into client-side HTML
can be read by anyone who opens the page.

## Files

- `index.html` — the whole app (no build step, no dependencies)
- `api/grok.js` — serverless proxy that holds your Grok key

---

## Free deployment — Vercel (recommended, ~3 minutes)

Vercel's free Hobby tier serves the static page and the `/api/grok` function
together, with no card required.

### Option A — deploy from GitHub (easiest)
1. Push this folder to a new GitHub repo.
2. Go to **vercel.com** → sign in with GitHub → **Add New → Project** → import the repo.
3. Framework preset: **Other**. Leave build settings empty. Click **Deploy**.
4. Open **Settings → Environment Variables** and add:
   - Name: `XAI_API_KEY`
   - Value: your `xai-...` key from **console.x.ai → API Keys**
5. Go to **Deployments → ⋯ → Redeploy** so the key takes effect. Done.

### Option B — deploy from your machine (CLI)
```bash
npm i -g vercel
cd recruit-agent
vercel                       # follow prompts, accept defaults
vercel env add XAI_API_KEY   # paste your key when asked
vercel --prod                # redeploy with the key
```

### Run locally first
```bash
npm i -g vercel
cd recruit-agent
vercel env add XAI_API_KEY   # or create a .env file with XAI_API_KEY=xai-...
vercel dev                   # opens http://localhost:3000 with the function running
```
> Opening `index.html` directly with a double-click will **not** work — there's
> no server to run `/api/grok`. Use `vercel dev` or deploy.

---

## Other free hosts

- **Cloudflare Pages** (very generous free tier) and **Netlify** also work, but
  their function path differs from Vercel's `/api/`. To use them, move the
  handler into that host's functions folder (Cloudflare: `functions/api/grok.js`
  with `onRequestPost`; Netlify: `netlify/functions/grok.js`) and point the
  frontend's `fetch("/api/grok")` at the matching path. Vercel needs none of
  this, which is why it's the recommended path.
- **GitHub Pages / plain static hosts won't work** on their own — they can't run
  the serverless function, so the key would have nowhere safe to live.

---

## Getting a Grok key

1. Sign up at **console.x.ai** (no X Premium needed; ~3 min, self-serve).
2. New accounts get **$25 in promotional credits** (expires after 30 days).
3. **API Keys → Create API Key**, copy the `xai-...` string.

## Cost & model

- Default model: **`grok-4.3`** with `reasoning_effort: "low"` for speed/cost.
- Change the model or limits in `api/grok.js`. Each screening is a small number
  of tokens — well within trial credits while you test.

## Customising

- **Saved JDs:** edit the `DEFAULT_JDS` object near the top of the script in
  `index.html`. History and any custom JDs persist in the browser via
  `localStorage` (fine here — this is a real site, not a chat artifact).
- **Prompts:** each tool's prompt lives in its `run…()` function.
