import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            let val = match[2].trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (!process.env[match[1]]) process.env[match[1]] = val;
        }
    }
}

// Commande pour lancer le script depuis la racine "apps/api" :
// npx ts-node scripts/import-scraped-jobs.ts jobs.json

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

interface ScrapedJob {
    title: string;
    company: string;
    description: string;
    applyUrl: string;
    location: string;
    workType?: string; // e.g. "Full-time", "Contract"
}

async function main() {
    const filePath = process.argv[2];
    if (!filePath) {
        console.error('❌ Veuillez fournir le chemin vers le fichier .json contenant les offres scrappées.');
        console.error('Exemple: npx ts-node scripts/import-scraped-jobs.ts ./mes-offres.json');
        process.exit(1);
    }

    const absolutePath = path.resolve(process.cwd(), filePath);
    if (!fs.existsSync(absolutePath)) {
        console.error(`❌ Fichier introuvable: ${absolutePath}`);
        process.exit(1);
    }

    const rawData = fs.readFileSync(absolutePath, 'utf8');
    const jobs: ScrapedJob[] = JSON.parse(rawData);

    console.log(`🚀 Analyse de ${jobs.length} offres scrappées...`);

    let imported = 0;

    for (const job of jobs) {
        try {
            // Conversion et formatage par défaut pour correspondre au schéma
            // Vous pouvez ajuster cette logique selon la structure de votre fichier de scraping
            await prisma.job.create({
                data: {
                    title: job.title.trim(),
                    isExternal: true, // Très important
                    externalCompany: job.company.trim(),
                    externalApplyUrl: job.applyUrl,
                    
                    // Champs obligatoires remplis par défaut/heuristique
                    type: job.workType?.toUpperCase() === 'CONTRACT' ? 'CDD' : 'CDI',
                    sector: 'Non Spécifié', // À améliorer selon les mots-clés de la description
                    regions: job.location || 'Mali',
                    educationLevel: 'Non Spécifié',
                    experienceLevel: 'Non Spécifié',
                    description: job.description.trim(),
                    requirements: 'Voir la description sur le site d\'origine',
                    
                    // La date limite est par défaut dans 30 jours pour les offres scrappées
                    deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), 
                    status: 'PUBLISHED', // Publier directement
                    publishedAt: new Date(), // Important for sorting
                }
            });
            imported++;
            process.stdout.write('✅');
        } catch (e) {
            console.error(`\n❌ Erreur lors de l'import de l'offre "${job.title}":`, e);
        }
    }

    console.log(`\n🎉 Importation terminée ! ${imported}/${jobs.length} offres importées avec succès.`);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
