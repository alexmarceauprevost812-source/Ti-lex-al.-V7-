module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    var query = req.body.query;
    var max_results = req.body.max_results;

    if (!query || typeof query !== "string" || query.trim().length === 0) {
      return res.status(400).json({ error: "Query vide" });
    }

    if (query.length > 500) {
      return res.status(400).json({ error: "Query trop longue (max 500 chars)" });
    }

    var TAVILY_KEY = process.env.TAVILY_API_KEY;

    if (!TAVILY_KEY) {
      return res.status(200).json({
        results: generateFallback(query.trim()),
        source: "fallback"
      });
    }

    var response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: TAVILY_KEY,
        query: query.trim(),
        max_results: Math.min(parseInt(max_results) || 5, 10),
        include_answer: true
      })
    });

    if (!response.ok) {
      throw new Error("Tavily error: " + response.status);
    }

    var data = await response.json();

    return res.status(200).json({
      results: (data.results || []).map(function(r) {
        return {
          title: r.title || "",
          url: r.url || "",
          snippet: r.content || r.snippet || ""
        };
      }),
      answer: data.answer || null,
      source: "tavily"
    });
  } catch (err) {
    console.error("Search API error:", err.message);
    var q = (req.body && req.body.query) || "recherche";
    return res.status(200).json({
      results: generateFallback(q),
      source: "fallback"
    });
  }
};

function generateFallback(query) {
  return [
    { title: "Wikipedia - " + query, url: "https://fr.wikipedia.org", snippet: "Information complète sur " + query + "..." },
    { title: "Reddit Discussion - " + query, url: "https://reddit.com", snippet: "La communauté parle de " + query + "..." },
    { title: "Blog Tech - " + query, url: "https://techblog.com", snippet: "Analyse détaillée: " + query + "..." },
    { title: "News - " + query, url: "https://news.google.com", snippet: "Dernières actualités sur " + query + "..." }
  ];
}
