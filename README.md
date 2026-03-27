# 🇲🇱 MaliEmploi - Plateforme d'Emploi Moderne

MaliEmploi est une plateforme de recrutement innovante dédiée au marché malien, offrant une expérience fluide pour les candidats et les recruteurs.

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

3. **Configuration de la Base de Données (Supabase)**
   Pour que le projet fonctionne, vous devez créer une instance de base de données PostgreSQL. Nous recommandons **Supabase** car c'est gratuit et rapide à mettre en place :
   - Créez un compte sur [supabase.com](https://supabase.com).
   - Créez un nouveau projet (ex: "MaliEmploi").
   - Allez dans **Project Settings > Database** et récupérez votre **Connection String** (format URI).
   - **Important** : Remplacez le tag `[YOUR-PASSWORD]` par le mot de passe que vous avez défini lors de la création du projet.
   - Assurez-vous d'utiliser le mode "Direct connection" (port 5432).

4. **Configuration de l'environnement**
   - Copiez `apps/api/.env.example` vers `apps/api/.env`.
   - Remplacez la valeur de `DATABASE_URL` par votre chaîne de connexion Supabase.
   - Copiez `apps/web/.env.example` vers `apps/web/.env.local`.
   - Copiez `apps/admin/.env.example` vers `apps/admin/.env.local`.

5. **Appliquer le schéma à la base de données**
   Depuis la racine :
   ```bash
   cd apps/api
   npx prisma db push
   cd ../..
   ```

## 🏎️ Lancer le projet en développement

À la racine du projet (lance tout en un terminal) :
```bash
pnpm dev
```

L'application sera disponible sur :
- **Frontend (Candidat/Recruteur)** : [http://localhost:3000](http://localhost:3000)
- **API (Backend)** : [http://localhost:3001/api](http://localhost:3001/api)
- **Panneau Admin** : [http://localhost:3002](http://localhost:3002)

### Identifiants Admin (Base)
- **Email** : `admin@maliemploi.ml`
- **Mot de passe** : `Admin123!`

## ✨ Nouveau Design
Nous avons récemment implémenté une charte graphique moderne en "Black & White" avec des accents tricolores Maliens. Le design se veut premium, dynamique et épuré.

## 👥 Collaboration
1. Créez une branche pour votre fonctionnalité : `git checkout -b suite-v1`
2. Commitez vos changements : `git commit -m 'feat: ajout de ...'`
3. Pushez vers votre branche : `git push origin suite-v1`
4. Ouvrez une Pull Request.
