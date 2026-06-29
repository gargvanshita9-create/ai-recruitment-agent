// Serverless proxy for the xAI (Grok) Chat Completions API.
// Runs on Vercel / Netlify / Cloudflare. The browser calls THIS function
// (same origin, so no CORS), and the function adds the secret key and
// forwards the request to xAI. The key never reaches the browser.
//
// Required environment variable: XAI_API_KEY  (your xai-... key)

export default async function handler(req, res) {
  // Allow same-origin POSTs only; reject everything else cleanly.
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }

  const apiKey = process.env.XAI_API_KEY;
  if (!apiKey) {
    res.status(500).json({
      error:
        "Server is missing XAI_API_KEY. Add it in your hosting dashboard's environment variables and redeploy.",
    });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const {
      messages,
      model = "grok-4.3",
      temperature = 0.3,
      max_tokens = 4000,
      reasoning_effort = "low",
    } = body;

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ error: "A non-empty 'messages' array is required." });
      return;
    }

    const upstream = await fetch("https://api.x.ai/v1/chat/completions", {
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
        reasoning_effort,
      }),
    });

    const data = await upstream.json();

    if (!upstream.ok) {
      const detail =
        (data && (data.error?.message || data.error || data.message)) ||
        `xAI returned ${upstream.status}`;
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
