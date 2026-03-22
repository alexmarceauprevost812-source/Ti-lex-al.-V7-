module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    var query = req.body.query;
    var max_results = req.body.max_results;

    if (!query || typeof query !== "string") {
      return res.status(400).json({ error: "Query vide" });
    }

    var TAVILY_KEY = process.env.TAVILY_API_KEY;

    if (!TAVILY_KEY) {
      return res.status(200).json({ results: generateFallback(query), source: "fallback" });
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

    var data = await response.json();
    return res.status(200).json({
      results: (data.results || []).map(function(r) {
        return { title: r.title || "", url: r.url || "", snippet: r.content || "" };
      }),
      source: "tavily"
    });
  } catch (err) {
    return res.status(200).json({ results: generateFallback(req.body.query || "recherche"), source: "fallback" });
  }
};

function generateFallback(q) {
  return [
    { title: "Wikipedia - " + q, url: "https://fr.wikipedia.org", snippet: "Info sur " + q },
    { title: "Reddit - " + q, url: "https://reddit.com", snippet: "Discussion sur " + q },
    { title: "News - " + q, url: "https://news.google.com", snippet: "Actualites sur " + q }
  ];
}
