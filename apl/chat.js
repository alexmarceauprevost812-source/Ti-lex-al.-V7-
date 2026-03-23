// api/chat.js — Vercel Serverless Function
// Connecte TI-LEX-AL à OpenAI GPT-4o-mini (ZERO dependencies)

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.OPENAI_API_KEY) {
    return res.status(500).json({ error: 'OPENAI_API_KEY manquante dans Vercel env vars' });
  }

  try {
    var body = req.body || {};
    var message = body.message;
    var agent = body.agent || null;
    var history = body.history || [];

    if (!message) {
      return res.status(400).json({ error: 'Message requis' });
    }

    var systemPrompt = buildSystemPrompt(agent);
    var messages = [{ role: 'system', content: systemPrompt }];

    if (Array.isArray(history)) {
      history.slice(-10).forEach(function(msg) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({ role: msg.role, content: String(msg.content).slice(0, 2000) });
        }
      });
    }

    messages.push({ role: 'user', content: String(message).slice(0, 3000) });

    var response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + process.env.OPENAI_API_KEY
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 1024,
        temperature: 0.9
      })
    });

    if (!response.ok) {
      var errText = await response.text();
      console.error('OpenAI error:', response.status, errText);
      return res.status(502).json({ error: 'OpenAI error ' + response.status });
    }

    var data = await response.json();
    var reply = data.choices && data.choices[0] && data.choices[0].message
      ? data.choices[0].message.content
      : 'Pas de réponse...';

    return res.status(200).json({ reply: reply });

  } catch (err) {
    console.error('Chat error:', err.message || err);
    return res.status(500).json({ error: 'Erreur serveur: ' + (err.message || 'inconnue') });
  }
};

function buildSystemPrompt(agent) {
  var base = 'Tu es TI-LEX-AL, une IA assistante ultra-charismatique créée par Alex. ' +
    'Tu parles en FRANÇAIS. Tu es drôle, énergique, motivant et un peu street dans ton style. ' +
    'Tu utilises des emojis (mais pas trop). Tu tutoies. ' +
    'Tu es compétent et tu donnes de VRAIES réponses utiles. ' +
    'Si on te pose une question technique, tu réponds avec précision. ' +
    'Tes réponses sont concises mais complètes. Max 300 mots sauf si on demande plus.';

  if (!agent) return base;

  if (agent.is_master) {
    return base + ' Tu es l\'agent MAITRE TI-LEX-AL. Tu sais TOUT faire: code, design, stratégie, recherche, éducation. ' +
      'Tu es le BOSS des agents. Ton style est confiant, drôle et ultra-efficace. ' +
      'Quand on te demande de coder, tu donnes du vrai code fonctionnel.';
  }

  var prompt = base;
  if (agent.name) prompt += ' Ton nom est ' + agent.name + '.';
  if (agent.personality) prompt += ' Ta personnalité: ' + agent.personality + '.';
  if (agent.specialty) prompt += ' Ta spécialité: ' + agent.specialty + '.';
  return prompt;
}
