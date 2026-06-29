// Serverless proxy for the Groq Chat Completions API (OpenAI-compatible).
// Runs on Vercel / Netlify / Cloudflare. The browser calls THIS function
// (same origin, so no CORS), and the function adds the secret key and
// forwards the request to Groq. The key never reaches the browser.
//
// Required environment variable: GROQ_API_KEY  (your gsk_... key from
// console.groq.com)

export default async function handler(req, res) {
  // Allow same-origin POSTs only; reject everything else cleanly.
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "Server is missing GROQ_API_KEY. Add it in your hosting dashboard's environment variables (or .env locally) and redeploy.",
    });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const {
      messages,
      model = "llama-3.3-70b-versatile",
      temperature = 0.4,
      max_tokens = 4000,
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "A non-empty 'messages' array is required." });
      return;
    }

    const upstream = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const detail =
        (data && (data.error?.message || data.error || data.message)) ||
        `Groq returned ${upstream.status}`;
      res.status(upstream.status).json({ error: detail });
      return;
    }

    res.status(200).json({
      text: data?.choices?.[0]?.message?.content ?? "",
      usage: data?.usage ?? null,
    });
  } catch (err) {
    res.status(500).json({ error: String(err?.message || err) });
  }
}
