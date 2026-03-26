// 🔍 TI-LEX-AL — Backend API /api/search
// Recherche web simulée (pas de clé API externe nécessaire)
// Tu peux remplacer par Google Custom Search ou SerpAPI plus tard!

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { query, max_results } = req.body;

    if (!query) {
      return res.status(400).json({ error: 'Query requis' });
    }

    const limit = Math.min(max_results || 5, 10);

    // 🛡️ Pour l'instant: résultats simulés réalistes
    // TODO: Intégrer Google Custom Search API ou SerpAPI
    const templates = [
      { domain: 'wikipedia.org', prefix: 'Wikipedia — ' },
      { domain: 'reddit.com', prefix: 'Reddit Discussion — ' },
      { domain: 'stackoverflow.com', prefix: 'Stack Overflow — ' },
      { domain: 'medium.com', prefix: 'Article Medium — ' },
      { domain: 'github.com', prefix: 'GitHub — ' },
      { domain: 'docs.google.com', prefix: 'Documentation — ' },
      { domain: 'youtube.com', prefix: 'Vidéo YouTube — ' },
      { domain: 'dev.to', prefix: 'Dev.to — ' }
    ];

    const results = [];
    for (let i = 0; i < limit && i < templates.length; i++) {
      results.push({
        title: templates[i].prefix + query,
        url: `https://${templates[i].domain}/search?q=${encodeURIComponent(query)}`,
        snippet: `Résultats pertinents sur "${query}" — Informations complètes et détaillées disponibles...`,
        position: i + 1
      });
    }

    return res.status(200).json({ results });

  } catch (err) {
    console.error('❌ Search error:', err);
    return res.status(500).json({ error: 'Erreur recherche: ' + err.message });
  }
}
