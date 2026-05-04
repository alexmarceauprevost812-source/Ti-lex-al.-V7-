import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey =
    req.headers["x-anthropic-key"] || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY manquante — configure-la dans le menu",
    });
  }

  const { query, max_results } = req.body || {};
  if (typeof query !== "string" || !query.trim()) {
    return res.status(400).json({ error: "query is required" });
  }

  const limit = Math.min(Math.max(parseInt(max_results, 10) || 5, 1), 10);
  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      system:
        "Tu es un moteur de recherche. Utilise web_search pour trouver des résultats pertinents et concis. Réponds en français.",
      tools: [
        {
          type: "web_search_20260209",
          name: "web_search",
          max_uses: 2,
        },
      ],
      messages: [
        {
          role: "user",
          content: `Recherche : ${query}\nDonne-moi les ${limit} meilleurs résultats avec titre, URL et un court résumé.`,
        },
      ],
    });

    const results = [];
    let summary = "";

    for (const block of response.content) {
      if (block.type === "text") {
        summary += block.text;
      }
      if (block.type === "web_search_tool_result" && Array.isArray(block.content)) {
        for (const item of block.content) {
          if (item.type === "web_search_result") {
            results.push({
              title: item.title || "",
              url: item.url || "",
              snippet: (item.encrypted_content || "").slice(0, 200),
              position: results.length + 1,
            });
            if (results.length >= limit) break;
          }
        }
      }
      if (results.length >= limit) break;
    }

    return res.status(200).json({
      query,
      results,
      summary: summary.trim(),
      model: response.model,
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(401).json({ error: "Clé API Anthropic invalide" });
    }
    if (err instanceof Anthropic.APIError) {
      return res.status(err.status || 500).json({ error: err.message });
    }
    console.error("Search error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
