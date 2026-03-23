// api/health.js — Test si tout fonctionne
// Visite ton-site.vercel.app/api/health pour vérifier

module.exports = function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json({
    status: 'ok',
    message: 'TI-LEX-AL backend is ALIVE! 🔥',
    time: new Date().toISOString(),
    env: {
      OPENAI_API_KEY: process.env.OPENAI_API_KEY ? '✅ Configurée' : '❌ MANQUANTE',
      SERPER_API_KEY: process.env.SERPER_API_KEY ? '✅ Configurée' : '❌ MANQUANTE'
    }
  });
};
