// Serverless text extractor. The browser uploads a file (PDF / DOCX / plain
// text) as base64; this function decodes it and returns the extracted plain
// text so the rest of the app can treat every upload the same way.
//
// PDF  -> pdf-parse        DOCX -> mammoth        .txt/.md/.json -> as-is
//
// No API key needed here — extraction is local to the function.

// pdf-parse's package entry runs debug code that reads a bundled test file
// when imported as a module; importing the lib file directly avoids that.
import pdfParse from "pdf-parse/lib/pdf-parse.js";
import mammoth from "mammoth";

// Vercel's default JSON body limit is ~4.5 MB; base64 inflates by ~33%, so
// raise the cap a little and let us reject oversized files with a clear error.
export const config = { api: { bodyParser: { sizeLimit: "12mb" } } };

const MAX_BYTES = 8 * 1024 * 1024; // 8 MB of decoded file content

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Use POST." });
    return;
  }

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const { filename = "", contentType = "", data = "" } = body;

    if (!data) {
      res.status(400).json({ error: "No file data received." });
      return;
    }

    // Accept either a raw base64 string or a data: URL.
    const base64 = data.includes(",") ? data.slice(data.indexOf(",") + 1) : data;
    const buffer = Buffer.from(base64, "base64");

    if (buffer.length === 0) {
      res.status(400).json({ error: "Uploaded file was empty or unreadable." });
      return;
    }
    if (buffer.length > MAX_BYTES) {
      res.status(413).json({ error: "File is too large. Keep uploads under 8 MB." });
      return;
    }

    const name = String(filename).toLowerCase();
    const isPdf = contentType.includes("pdf") || name.endsWith(".pdf");
    const isDocx =
      contentType.includes("officedocument.wordprocessingml") || name.endsWith(".docx");

    let text = "";
    if (isPdf) {
      const parsed = await pdfParse(buffer);
      text = parsed.text || "";
    } else if (isDocx) {
      const result = await mammoth.extractRawText({ buffer });
      text = result.value || "";
    } else {
      // Plain text / markdown / json — decode as UTF-8.
      text = buffer.toString("utf8");
    }

    // Tidy up extractor artefacts: drop form-feed/null chars, trailing
    // whitespace, and runs of blank lines.
    text = text
      .replace(/[\f\0]/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();

    if (!text) {
      res.status(422).json({
        error:
          "Couldn't extract any text. The file may be a scanned image (no text layer) — paste the text instead.",
      });
      return;
    }

    res.status(200).json({ text });
  } catch (err) {
    res.status(500).json({ error: "Extraction failed: " + String(err?.message || err) });
  }
}
