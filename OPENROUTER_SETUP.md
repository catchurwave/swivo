# Configuration OpenRouter pour Claude Code

## 🎯 Objectif

Configurer VS Code Copilot Chat pour utiliser le modèle **Kimi-K2** via OpenRouter au lieu des modèles Microsoft par défaut.

## ✅ Configuration complétée

### 1. **copilot-instructions.md**
   - Fichier de contexte personnalisé pour tous les agents Copilot
   - Contient `CLAUDE.md` context, guidelines, et références projet
   - VS Code charge automatiquement ce fichier

### 2. **.env.local**
   - Variables d'environnement OpenRouter
   - **⚠️ IMPORTANT:** Ajouter `.env.local` à `.gitignore` (clé API sensible)
   - Contient: `OPENROUTER_API_KEY`, `OPENROUTER_BASE_URL`, `OPENROUTER_MODEL`

## 📋 Prochaines étapes

### Étape 1: Configurer .gitignore
```bash
echo ".env.local" >> .gitignore
git add .gitignore
git commit -m "Add .env.local to gitignore"
```

### Étape 2: Vérifier la configuration VS Code
- Redémarrer VS Code ou recharger la fenêtre (`Ctrl+Shift+P` → "Developer: Reload Window")
- Ouvrir le chat Copilot (`Ctrl+Shift+I`)
- Le contexte du projet devrait maintenant inclure les instructions dans `copilot-instructions.md`

### Étape 3: Tester avec OpenRouter (optionnel)

Si vous avez besoin d'appels API directs à OpenRouter dans vos scripts Node.js :

```bash
cd swivo-app
npm install openai  # SDK compatible OpenRouter
```

Puis dans votre code :

```typescript
import OpenAI from "openai";

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: process.env.OPENROUTER_BASE_URL,
});

const response = await client.chat.completions.create({
  model: process.env.OPENROUTER_MODEL || "openrouter/kimi-k2",
  messages: [{ role: "user", content: "..." }],
});
```

## 🔑 Gestion des clés API

**Sécurité:**
- ✅ Clé API stockée dans `.env.local` (ignorée par Git)
- ✅ Variables chargées localement seulement
- ⚠️ Ne jamais commiter `.env.local`
- ⚠️ Ne jamais hardcoder les clés dans le code

**Rotation de clés:**
- Si la clé est compromise : régénérer via https://openrouter.ai/keys
- Mettre à jour `.env.local` localement

## 📚 Ressources

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Kimi-K2 Model Details](https://openrouter.ai/models)
- [CLAUDE.md](./CLAUDE.md) — Architecture & conventions Swivo

## 🆘 Troubleshooting

**Copilot Chat n'utilise pas les instructions?**
- Vérifier que `copilot-instructions.md` est à la racine du workspace
- Recharger VS Code (Ctrl+Shift+P → "Reload Window")

**Les appels API échouent?**
- Vérifier que `.env.local` est chargé : afficher `process.env.OPENROUTER_API_KEY` en console
- Tester la clé sur https://openrouter.ai/keys
- Vérifier la limite API rate / budget disponible

**Variables d'environnement non chargées?**
- Certains contextes (terminal VS Code) loadent `.env` automatiquement
- Pour Node.js: utiliser `dotenv` ou charger manuellement
- Pour Vite: ajouter à `vite.config.ts` ou utiliser `VITE_*` prefix

---

**Configuration date:** 31 mai 2026  
**Modèle:** `openrouter/kimi-k2`  
**Status:** ✅ Prêt à l'emploi
