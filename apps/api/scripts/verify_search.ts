import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

// Manual env loader
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const lines = fs.readFileSync(envPath, 'utf8').split('\n');
    for (const line of lines) {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match) {
            let val = match[1].trim();
            if (val === 'DATABASE_URL') {
                process.env.DATABASE_URL = match[2].trim().replace(/^"(.*)"$/, '$1');
            }
        }
    }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function verify() {
    console.log('--- Verifying Search ---');
    const keyword = 'Assistant';
    const jobs = await prisma.job.findMany({
        where: {
            status: 'PUBLISHED',
            deadline: { gte: new Date() },
            OR: [
                { title: { contains: keyword, mode: 'insensitive' } },
                { description: { contains: keyword, mode: 'insensitive' } },
                { externalCompany: { contains: keyword, mode: 'insensitive' } }
            ]
        },
        take: 5
    });
    console.log(`Found ${jobs.length} jobs for keyword "${keyword}"`);
    jobs.forEach(j => console.log(`- ${j.title} (${j.externalCompany})`));

    const allPublished = await prisma.job.count({ where: { status: 'PUBLISHED', deadline: { gte: new Date() } } });
    console.log(`Total valid published jobs: ${allPublished}`);

    await prisma.$disconnect();
    await pool.end();
}

verify().catch(console.error);
