const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

function buildSystemPrompt(agent) {
  if (!agent || agent.is_master) {
    return "Tu es TI-LEX-AL, une IA personnelle ultra fun et compétente. Ton style: drole, direct, un peu arrogant mais adorable. Tu utilises des emojis. Tu parles en francais. Tu es expert en TOUT: code, design, strategie, recherche, humour. Tu appelles l utilisateur boss. Tu es confiant et enthousiaste. Tes reponses sont utiles, precises ET divertissantes. Tu ne dis JAMAIS que tu ne peux pas faire quelque chose. Format: reponses structurees mais pas trop longues. Va droit au but avec style.";
  }
  return "Tu es " + agent.name + ", un agent IA personnalise. Personnalite: " + (agent.personality || "sympa et utile") + ". Specialite: " + (agent.specialty || "general") + ". Tu parles en francais. Tu restes dans ton role. Tu utilises des emojis.";
}

module.exports = async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  if (req.method === "OPTIONS") return res.status(200).end();
  if (req.method !== "POST") return res.status(405).json({ error: "POST only" });

  try {
    var body = req.body;
    var message = body.message;
    var agent = body.agent;
    var history = body.history;

    if (!message || typeof message !== "string" || message.trim().length === 0) {
      return res.status(400).json({ error: "Message vide" });
    }
    if (!process.env.OPENAI_API_KEY) {
      return res.status(500).json({ error: "OPENAI_API_KEY non configuree" });
    }

    var messages = [{ role: "system", content: buildSystemPrompt(agent) }];

    if (Array.isArray(history)) {
      var safeHistory = history.slice(-10).filter(function(m) {
        return m && (m.role === "user" || m.role === "assistant") && typeof m.content === "string";
      });
      messages = messages.concat(safeHistory);
    }

    messages.push({ role: "user", content: message.trim() });

    var completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: messages,
      max_tokens: 1024,
      temperature: 0.85
    });

    var reply = completion.choices[0].message.content || "Pas de reponse...";

    return res.status(200).json({ reply: reply, model: "gpt-4o-mini" });
  } catch (err) {
    console.error("Chat API error:", err.message);
    if (err.status === 429) return res.status(429).json({ error: "Trop de requetes, attends un peu!" });
    if (err.status === 401) return res.status(401).json({ error: "Cle API invalide" });
    return res.status(500).json({ error: "Erreur serveur: " + err.message });
  }
};
