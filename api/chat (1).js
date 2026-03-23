// api/chat.js — Vercel Serverless Function (CommonJS)
// Connecte TI-LEX-AL à OpenAI GPT-4o-mini

module.exports = async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Vérifier que la clé API est configurée
  if (!process.env.OPENAI_API_KEY) {
    console.error('OPENAI_API_KEY manquante dans les variables d\'environnement Vercel');
    return res.status(500).json({ error: 'Clé API non configurée côté serveur' });
  }

  try {
    const { message, agent, history } = req.body || {};

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    // System prompt dynamique selon l'agent
    var systemPrompt = buildSystemPrompt(agent);

    // Construire les messages avec historique
    var messages = [
      { role: 'system', content: systemPrompt },
    ];

    if (history && Array.isArray(history)) {
      history.slice(-10).forEach(function(msg) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: String(msg.content).slice(0, 2000),
          });
        }
      });
    }

    messages.push({ role: 'user', content: String(message).slice(0, 3000) });

    // Appel OpenAI
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.9,
      }),
    });

    if (!response.ok) {
      var errBody = await response.text();
      console.error('OpenAI error ' + response.status + ':', errBody);
      return res.status(502).json({ error: 'Erreur OpenAI ' + response.status });
    }

    var data = await response.json();
    var reply = (data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '🤔 Hmm, pas de réponse...';

    return res.status(200).json({ reply: reply });

  } catch (err) {
    console.error('Server error:', err);
    return res.status(500).json({ error: 'Erreur serveur interne' });
  }
};

function buildSystemPrompt(agent) {
  var base = 'Tu es TI-LEX-AL, une IA assistante ultra-charismatique créée par Alex. ' +
    'Tu parles en FRANÇAIS. Tu es drôle, énergique, motivant et un peu "street" dans ton style. ' +
    'Tu utilises des emojis (mais pas trop). Tu tutoies l\'utilisateur. ' +
    'Tu es compétent et tu donnes de VRAIES réponses utiles, pas juste du blabla. ' +
    'Si on te pose une question technique, tu réponds avec précision. ' +
    'Tes réponses sont concises mais complètes. Max 300 mots sauf si on te demande plus.';

  if (!agent) return base;

  if (agent.is_master) {
    return base + '\n\nTu es l\'agent MAÎTRE TI-LEX-AL. Tu sais TOUT faire: code, design, stratégie, recherche, éducation. ' +
      'Tu es le BOSS des agents. Ton style est confiant, drôle et ultra-efficace. ' +
      'Quand on te demande de coder, tu donnes du vrai code fonctionnel. ' +
      'Quand on te demande un plan, tu structures bien.';
  }

  var prompt = base;
  if (agent.name) prompt += '\n\nTon nom est "' + agent.name + '".';
  if (agent.personality) prompt += ' Ta personnalité: ' + agent.personality + '.';
  if (agent.specialty) prompt += ' Ta spécialité: ' + agent.specialty + '. Tu excelles dans ce domaine et tu le montres dans tes réponses.';

  return prompt;
}
