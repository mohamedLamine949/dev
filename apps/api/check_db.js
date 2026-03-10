const { PrismaClient } = require('@prisma/client');

async function main() {
    const prisma = new PrismaClient();
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
