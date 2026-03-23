// api/search.js — Vercel Serverless Function
// Proxy recherche web via Serper.dev (ZERO dependencies)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.SERPER_API_KEY) {
    return res.status(500).json({ error: 'SERPER_API_KEY manquante' });
  }

  try {
    var body = req.body || {};
    var query = body.query;
    var maxResults = body.max_results || 5;

    if (!query) return res.status(400).json({ error: 'Query requise' });

    var response = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': process.env.SERPER_API_KEY
      },
      body: JSON.stringify({ q: query, gl: 'fr', hl: 'fr', num: Math.min(maxResults, 10) })
    });

    if (!response.ok) {
      return res.status(502).json({ error: 'Serper error ' + response.status });
    }

    var data = await response.json();
    var results = (data.organic || []).slice(0, maxResults).map(function(item, i) {
      return {
        title: item.title || 'Sans titre',
        url: item.link || '',
        snippet: item.snippet || '',
        position: i + 1
      };
    });

    return res.status(200).json({ results: results });

  } catch (err) {
    console.error('Search error:', err.message || err);
    return res.status(500).json({ error: 'Erreur recherche' });
  }
};
