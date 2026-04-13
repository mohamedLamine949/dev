const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
    let poolConfig = {};
    if (process.env.DATABASE_URL) {
        const url = new URL(process.env.DATABASE_URL);
        poolConfig = {
            user: url.username,
            password: decodeURIComponent(url.password),
            host: url.hostname,
            port: parseInt(url.port || '5432'),
            database: url.pathname.slice(1)
        };
    }
    const pool = new Pool(poolConfig);
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const employers = await prisma.employer.findMany();
        const users = await prisma.user.findMany({ select: { id: true, firstName: true, role: true, phone: true } });
        const members = await prisma.employerMember.findMany();

        console.log('--- DB STATE ---');
        console.log('TOTAL EMPLOYERS:', employers.length);
        console.log('TOTAL RECRUITERS:', users.filter(u => u.role === 'RECRUITER').length);
        console.log('TOTAL MEMBERSHIPS:', members.length);
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
