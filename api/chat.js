import Anthropic from "@anthropic-ai/sdk";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-4-5";
const MAX_TOKENS = parseInt(process.env.ANTHROPIC_MAX_TOKENS || "1024", 10);

const BASE_SYSTEM_PROMPT = `Tu es TI-LEX-AL, un assistant IA chaleureux, drôle et créatif qui parle français.

Style de réponse :
- Réponds de manière concise (2-4 phrases sauf si la question demande un développement).
- Utilise un ton naturel, amical et un peu joueur — sans tomber dans l'emoji-spam.
- Évite les préambules du type "Bien sûr !" ou "Voici...". Va directement à la réponse.
- Si la question est ambiguë, pose une courte question de clarification au lieu d'inventer.
- Tu peux utiliser des emojis avec parcimonie (1-2 max par réponse) quand c'est pertinent.

Contexte : tu es intégré dans l'application TI-LEX-AL, un espace de discussion ludique où l'utilisateur peut interagir avec différents agents IA personnalisés.`;

function buildSystem(agent) {
  const base = {
    type: "text",
    text: BASE_SYSTEM_PROMPT,
    cache_control: { type: "ephemeral" },
  };

  if (!agent || !agent.name) return [base];

  const parts = [`Tu incarnes l'agent "${agent.name}".`];
  if (agent.personality) parts.push(`Personnalité : ${agent.personality}`);
  if (agent.specialty) parts.push(`Spécialité : ${agent.specialty}`);
  if (agent.is_master) {
    parts.push("Tu es l'agent maître — assume un ton confiant et structurant.");
  }

  return [base, { type: "text", text: parts.join("\n") }];
}

function normalizeHistory(history) {
  if (!Array.isArray(history)) return [];
  const out = [];
  for (const msg of history) {
    if (!msg || typeof msg.content !== "string") continue;
    if (msg.role !== "user" && msg.role !== "assistant") continue;
    if (!msg.content.trim()) continue;
    out.push({ role: msg.role, content: msg.content });
  }
  return out;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const apiKey =
    req.headers["x-anthropic-key"] || process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: "ANTHROPIC_API_KEY manquante — configure-la dans Paramètres > Mode Déploiement",
    });
  }

  const { message, agent, history } = req.body || {};
  if (typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "message is required" });
  }

  const messages = normalizeHistory(history);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    messages.push({ role: "user", content: message });
  } else if (messages[messages.length - 1].content !== message) {
    messages.push({ role: "user", content: message });
  }

  const client = new Anthropic({ apiKey });

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: buildSystem(agent),
      messages,
    });

    const reply = response.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    return res.status(200).json({
      reply: reply || "🤔 Hmm, pas de réponse...",
      usage: response.usage,
      model: response.model,
    });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(401).json({ error: "Invalid ANTHROPIC_API_KEY" });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res.status(429).json({ error: "Rate limit exceeded — retry later" });
    }
    if (err instanceof Anthropic.APIError) {
      return res.status(err.status || 500).json({ error: err.message });
    }
    console.error("Anthropic error:", err);
    return res.status(500).json({ error: "Internal error" });
  }
}
