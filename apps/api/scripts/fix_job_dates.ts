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

async function fix() {
    console.log('🚀 Fixing missing publishedAt dates...');
    const result = await prisma.job.updateMany({
        where: {
            status: 'PUBLISHED',
            publishedAt: null
        },
        data: {
            publishedAt: new Date()
        }
    });
    console.log(`✅ Success! Updated ${result.count} job records.`);
    
    await prisma.$disconnect();
    await pool.end();
}

fix().catch(console.error);
