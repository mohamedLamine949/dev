const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

async function main() {
    const connectionString = process.env.DATABASE_URL;
    const pool = new Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });
    try {
        const employers = await prisma.employer.findMany();
        const users = await prisma.user.findMany({ select: { id: true, firstName: true, role: true, phone: true } });
        const members = await prisma.employerMember.findMany();

        console.log('--- DB STATE ---');
        console.log('TOTAL EMPLOYERS:', employers.length);
        console.log(JSON.stringify(employers, null, 2));

        console.log('TOTAL RECRUITERS:', users.filter(u => u.role === 'RECRUITER').length);
        console.log(JSON.stringify(users.filter(u => u.role === 'RECRUITER'), null, 2));

        console.log('TOTAL MEMBERSHIPS:', members.length);
        console.log(JSON.stringify(members, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
