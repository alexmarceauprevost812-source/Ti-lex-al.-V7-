# 🚀 TI-LEX-AL — Guide de déploiement Vercel

## Structure des fichiers à avoir dans ton dépôt GitHub

```
ton-repo/
├── index.html          ← ton frontend (déjà fait)
├── vercel.json         ← config Vercel (nouveau)
├── .gitignore          ← (nouveau)
├── .env.example        ← template variables (nouveau, à ne PAS renommer en .env)
└── api/
    ├── chat.js         ← endpoint IA (nouveau)
    └── search.js       ← endpoint recherche (nouveau)
```

---

## Étape 1 — Mettre les fichiers sur GitHub

1. Va sur https://github.com et crée un nouveau dépôt (ex: `tilex-al`)
2. Sur ton ordinateur, copie tous les fichiers ci-dessus dans un dossier
3. Dans le terminal :
   ```bash
   cd ton-dossier
   git init
   git add .
   git commit -m "🚀 Initial deploy TI-LEX-AL"
   git branch -M main
   git remote add origin https://github.com/TON_USER/tilex-al.git
   git push -u origin main
   ```

---

## Étape 2 — Déployer sur Vercel

1. Va sur https://vercel.com et connecte-toi avec GitHub
2. Clique **"Add New Project"**
3. Sélectionne ton dépôt `tilex-al`
4. **Framework Preset** : sélectionne **"Other"**
5. Clique **Deploy** 🎉

---

## Étape 3 — Ajouter les variables d'environnement

Dans ton projet Vercel :
1. Va dans **Settings → Environment Variables**
2. Ajoute ces variables :

| Nom | Valeur | Requis |
|-----|--------|--------|
| `OPENAI_API_KEY` | `sk-...` | ✅ Oui |
| `SERPER_API_KEY` | `...` | ❌ Optionnel |

3. Clique **Save** puis **Redeploy**

---

## Étape 4 — Obtenir une clé OpenAI

1. Va sur https://platform.openai.com/api-keys
2. Crée une clé API
3. Ajoute des crédits (~5$ suffit pour commencer)
4. Colle la clé dans Vercel

---

## Étape 5 — (Optionnel) Google Search réelle

1. Va sur https://serper.dev
2. Crée un compte gratuit (2500 recherches/mois incluses)
3. Copie ta clé API
4. Ajoute `SERPER_API_KEY` dans Vercel

---

## Résultat final

Ton app sera live sur : `https://tilex-al-XXXX.vercel.app`

Tu peux aussi connecter un **domaine personnalisé** dans Vercel → Settings → Domains.

---

## En cas de problème

- **Erreur 500 sur /api/chat** → vérifie que `OPENAI_API_KEY` est bien configurée
- **Chat en mode hors-ligne** → l'API key est absente ou invalide
- **Recherche simulée** → normal sans `SERPER_API_KEY`
- **Logs** → Vercel Dashboard → ton projet → **Functions** → voir les logs en temps réel
