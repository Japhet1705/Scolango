# 🚀 Guide de déploiement Scolango — VPS/Cloud

## Prérequis

| Outil | Version minimum |
|---|---|
| Node.js | 20+ |
| PostgreSQL | 15+ |
| Docker | 24+ (optionnel) |

---

## Option A — Déploiement Docker (recommandé)

### 1. Configurer l'environnement

```bash
cp .env.example .env.local
nano .env.local   # Remplir toutes les valeurs
```

Variables obligatoires dans `.env.local` :

```env
DATABASE_URL="postgresql://scolango:MOT_DE_PASSE@localhost:5432/scolango_db"
GEMINI_API_KEY="votre_clé_gemini"
JWT_SECRET="chaîne_aléatoire_64_chars_minimum"
POSTGRES_PASSWORD="mot_de_passe_postgres_fort"
DEMO_MODE="false"
APP_URL="https://votre-domaine.com"
```

Générer un JWT_SECRET sécurisé :
```bash
openssl rand -base64 64
```

### 2. Lancer avec Docker Compose

```bash
docker compose up -d --build

# Vérifier les logs
docker compose logs -f app
```

### 3. Appliquer les migrations Prisma

```bash
docker compose exec app npx prisma migrate deploy
```

### 4. Créer le premier compte administrateur

```bash
docker compose exec app node -e "
const bcrypt = require('bcryptjs');
const hash = bcrypt.hashSync('VotreMotDePasseAdmin', 12);
console.log('passwordHash:', hash);
"
# Puis insérer dans la BDD via prisma studio ou SQL direct
```

---

## Option B — Déploiement manuel sur VPS Ubuntu

### 1. Installer les dépendances système

```bash
# Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# PostgreSQL 16
sudo apt-get install -y postgresql postgresql-contrib

# Chromium pour Puppeteer
sudo apt-get install -y chromium-browser libgbm-dev \
  libx11-xcb1 libxss1 libasound2 libatk-bridge2.0-0
```

### 2. Créer la base de données

```bash
sudo -u postgres psql << SQL
  CREATE USER scolango WITH PASSWORD 'votre_mot_de_passe';
  CREATE DATABASE scolango_db OWNER scolango;
  GRANT ALL PRIVILEGES ON DATABASE scolango_db TO scolango;
SQL
```

### 3. Installer et builder l'application

```bash
git clone https://votre-repo/scolango.git /opt/scolango
cd /opt/scolango
npm ci
npm run build
npx prisma migrate deploy
```

### 4. Démarrer avec PM2

```bash
npm install -g pm2

pm2 start dist/server.cjs --name scolango \
  --env production \
  --max-memory-restart 512M

pm2 startup    # Démarrer au reboot
pm2 save
```

---

## Option C — Railway / Render (le plus simple)

### Railway

1. Créer un projet sur [railway.app](https://railway.app)
2. Ajouter un service PostgreSQL
3. Connecter votre dépôt GitHub
4. Définir les variables d'environnement dans l'interface
5. Railway détecte le `Dockerfile` automatiquement

### Render

1. Créer un "Web Service" sur [render.com](https://render.com)
2. Sélectionner "Docker"
3. Ajouter un service PostgreSQL
4. Configurer les variables d'environnement
5. Déployer

> ⚠️ **Note Puppeteer sur Render** : Render n'inclut pas Chromium dans son image Docker standard. Remplacer dans `Dockerfile` par `@sparticuz/chromium` :
> ```bash
> npm install puppeteer-core @sparticuz/chromium
> ```
> Et dans `pdfGenerator.ts`, remplacer le launch par :
> ```ts
> import chromium from '@sparticuz/chromium';
> const browser = await puppeteer.launch({
>   args: chromium.args,
>   executablePath: await chromium.executablePath(),
>   headless: chromium.headless,
> });
> ```

---

## Configuration Nginx (proxy inverse)

```nginx
server {
    listen 80;
    server_name votre-domaine.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name votre-domaine.com;

    ssl_certificate     /etc/letsencrypt/live/votre-domaine.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/votre-domaine.com/privkey.pem;

    # Taille max upload (logos, imports)
    client_max_body_size 10M;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Installer le certificat SSL :
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d votre-domaine.com
```

---

## Checklist avant mise en production

- [ ] `DEMO_MODE=false` dans `.env.local`
- [ ] `JWT_SECRET` de 64+ caractères aléatoires
- [ ] `NODE_ENV=production`
- [ ] Mot de passe PostgreSQL fort
- [ ] Certificat SSL actif (HTTPS)
- [ ] Sauvegardes automatiques PostgreSQL configurées
- [ ] Compte admin créé via l'API (pas via quick-login)
- [ ] Clé Gemini API valide testée via `/api/health`

---

## Sauvegardes PostgreSQL automatiques

```bash
# Crontab : sauvegarde quotidienne à 2h du matin
crontab -e

# Ajouter :
0 2 * * * pg_dump -U scolango scolango_db > /opt/backups/scolango_$(date +\%Y\%m\%d).sql

# Garder seulement les 30 derniers jours
0 3 * * * find /opt/backups -name "scolango_*.sql" -mtime +30 -delete
```

---

## Monitoring

```bash
# Vérifier l'état de l'application
curl https://votre-domaine.com/api/health

# Logs en temps réel
pm2 logs scolango
# ou
docker compose logs -f app
```
