// 🔥 TI-LEX-AL — Backend API /api/chat
// Serverless function Vercel → GPT-4o-mini

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

  const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
  if (!OPENAI_API_KEY) {
    return res.status(500).json({ error: '❌ Clé OpenAI manquante! Ajoute OPENAI_API_KEY dans les variables Vercel.' });
  }

  try {
    const { message, agent, history } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // 🤖 System prompt basé sur l'agent actif
    let systemPrompt = `Tu es TI-LEX-AL, un assistant IA ultra-intelligent, drôle et street.
Tu réponds TOUJOURS en français avec un style fun, énergique et un peu gangster.
Tu utilises des emojis 🔥💪😎.
Tu es le BOSS absolu de l'IA.
Tu peux coder, rechercher, créer, analyser — tu fais TOUT.
Si on te pose une question de code, tu donnes du code propre et commenté.
Sois concis mais percutant. Max 300 mots par réponse.`;

    if (agent && !agent.is_master) {
      systemPrompt = `Tu es ${agent.name || 'Agent AL'}, un agent IA personnalisé créé sur la plateforme TI-LEX-AL.
Personnalité: ${agent.personality || 'Fun & Créatif'}
Spécialité: ${agent.specialty || 'Général'}
Tu réponds TOUJOURS en français avec style et énergie!
Sois concis mais percutant. Max 300 mots par réponse.`;
    }

    // 📝 Construire les messages pour OpenAI
    const messages = [{ role: 'system', content: systemPrompt }];

    // Ajouter l'historique (max 10 messages)
    if (history && Array.isArray(history)) {
      for (const h of history.slice(-10)) {
        if (h.role && h.content) {
          messages.push({ role: h.role, content: h.content });
        }
      }
    }

    // Ajouter le message actuel
    messages.push({ role: 'user', content: message });

    // 🚀 Appel GPT-4o-mini
    const openaiRes = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages,
        max_tokens: 1000,
        temperature: 0.8
      })
    });

    if (!openaiRes.ok) {
      const errData = await openaiRes.json().catch(() => ({}));
      console.error('OpenAI error:', errData);
      return res.status(502).json({
        error: errData?.error?.message || `OpenAI erreur ${openaiRes.status}`
      });
    }

    const data = await openaiRes.json();
    const reply = data.choices?.[0]?.message?.content || '🤔 Pas de réponse...';

    return res.status(200).json({ reply });

  } catch (err) {
    console.error('❌ Server error:', err);
    return res.status(500).json({ error: 'Erreur serveur: ' + err.message });
  }
}
