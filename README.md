# 🇲🇱 MaliLink - Plateforme d'Emploi Moderne

MaliLink est une plateforme de recrutement innovante dédiée au marché malien, offrant une expérience fluide pour les candidats et les recruteurs.

## 🚀 Architecture

Le projet est un monorepo géré avec **pnpm** et **Turborepo** :

- `apps/web` : Application frontend (Next.js 15, Tailwind CSS, Lucide Icons)
- `apps/api` : Backend API (NestJS, Prisma, PostgreSQL/Supabase)
- `apps/admin` : Panneau d'administration (Vite, React)
- `packages/shared-types` : Types TypeScript partagés entre frontend et backend

## 🛠️ Installation

### Prérequis

- Node.js 18+
- pnpm 8+
- PostgreSQL (ou instance Supabase)

### Étapes

1. **Cloner le projet**
   ```bash
   git clone https://github.com/mohamedLamine949/dev.git
   cd malilink
   ```

2. **Installer les dépendances**
   ```bash
   pnpm install
   ```

3. **Configuration de l'environnement**
   - Copiez `apps/api/.env.example` vers `apps/api/.env` et remplissez votre `DATABASE_URL`.
   - Copiez `apps/web/.env.example` vers `apps/web/.env.local` (déjà configuré par défaut pour le dev local).

4. **Lancer la base de données (si locale)**
   Si vous utilisez le `docker-compose.yml` fourni :
   ```bash
   docker-compose up -d
   ```

5. **Appliquer les migrations Prisma**
   ```bash
   cd apps/api
   npx prisma migrate dev
   ```

## 🏎️ Lancer le projet en développement

À la racine du projet :
```bash
pnpm dev
```

L'application sera disponible sur :
- Frontend : [http://localhost:3000](http://localhost:3000)
- API : [http://localhost:3001](http://localhost:3001)

## ✨ Nouveau Design
Nous avons récemment implémenté une charte graphique moderne en "Black & White" avec des accents tricolores Maliens. Le design se veut premium, dynamique et épuré.

## 👥 Collaboration
1. Créez une branche pour votre fonctionnalité : `git checkout -b feature/ma-feature`
2. Commitez vos changements : `git commit -m 'feat: ajout de ...'`
3. Pushez vers votre branche : `git push origin feature/ma-feature`
4. Ouvrez une Pull Request.
