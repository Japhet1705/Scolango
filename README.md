# 🎓 Scolango — Système d'Information Scolaire

Scolango est un ERP scolaire complet pour les établissements d'Afrique subsaharienne francophone. Il couvre la gestion académique, administrative et financière avec un assistant IA intégré (Gemini).

## ✨ Fonctionnalités

| Module | Description |
|---|---|
| 🎓 Gestion des élèves | Inscription, transfert, abandons, cartes scolaires |
| 📊 Notes & Bulletins | Saisie, moyennes pondérées, bulletins PDF générés côté serveur |
| 📅 Emploi du temps | Planification des créneaux par classe |
| ✅ Présences | Appel quotidien, suivi des absences |
| 💰 Comptabilité | Paiements, reçus, soldes, rapports financiers |
| 🤖 Assistant IA | Gemini 2.0 Flash pour appréciations et aide pédagogique |
| 🔐 Multi-rôles | Admin, Directeur, Secrétaire, Enseignant, Comptable, Parent, Élève |
| 📋 Audit log | Traçabilité complète de toutes les actions |

## 🚀 Démarrage rapide (développement)

```bash
# 1. Cloner et installer
git clone <repo>
cd scolango
npm install

# 2. Configurer l'environnement
cp .env.example .env.local
# Éditer .env.local avec vos clés

# 3. Démarrer (sans BDD : mode localStorage)
npm run dev

# 4. Ou avec PostgreSQL :
docker compose up postgres -d
npx prisma migrate dev --name init
npm run dev
```

Accéder à http://localhost:3000

En mode démo, utilisez le mot de passe **`demo1234`** avec n'importe quel profil.

## 🛠 Stack technique

- **Frontend** : React 19 + TypeScript + Tailwind CSS 4 + Vite
- **Backend** : Express.js + TypeScript
- **Base de données** : PostgreSQL 16 + Prisma ORM
- **IA** : Google Gemini 2.0 Flash
- **PDF** : Puppeteer (génération côté serveur)
- **Sécurité** : Helmet + CORS + Rate limiting + Zod
- **Tests** : Vitest

## 📦 Déploiement

Voir le guide complet dans [DEPLOIEMENT.md](./DEPLOIEMENT.md).

Options supportées :
- 🐳 Docker Compose (VPS Ubuntu/Debian)
- ☁️ Railway / Render (cloud, zero-config)
- 🖥 Installation manuelle sur VPS

## 🔑 Variables d'environnement

| Variable | Obligatoire | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | URL PostgreSQL |
| `GEMINI_API_KEY` | ✅ | Clé Google AI Studio |
| `JWT_SECRET` | ✅ | Secret sessions (64+ chars) |
| `DEMO_MODE` | — | `true` en dev, `false` en prod |
| `NODE_ENV` | — | `development` ou `production` |
| `PORT` | — | Port (défaut: 3000) |

## 🧪 Tests

```bash
npm test          # Tests unitaires
npm run lint      # Vérification TypeScript
```

## 📄 Licence

Propriétaire — Tous droits réservés © 2026 Scolango

