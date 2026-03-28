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
            let val = match[2].trim();
            if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
            if (!process.env[match[1]]) process.env[match[1]] = val;
        }
    }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function check() {
    const countNull = await prisma.job.count({ 
        where: { 
            status: 'PUBLISHED',
            publishedAt: null 
        } 
    });
    console.log('Jobs with null publishedAt:', countNull);

    const jobs = await prisma.job.findMany({
        where: { isExternal: true },
        take: 5,
        select: { title: true, sector: true, isExternal: true, publishedAt: true }
    });
    console.log('Sample external jobs:', jobs);
    
    await prisma.$disconnect();
    await pool.end();
}

check().catch(console.error);
