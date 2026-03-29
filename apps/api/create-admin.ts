import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    const adminEmail = 'admin@malitravail.ml';
    const adminPhone = '70000000';
    const password = 'AdminPassword123!';

    const existing = await prisma.user.findFirst({
        where: { OR: [{ email: adminEmail }, { phone: adminPhone }] }
    });

    if (existing) {
        console.log('Admin already exists:', existing.email || existing.phone);
        if (existing.role !== 'ADMIN') {
            await prisma.user.update({
                where: { id: existing.id },
                data: { role: 'ADMIN' }
            });
            console.log('Updated role to ADMIN');
        }
    } else {
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);
        await prisma.user.create({
            data: {
                email: adminEmail,
                phone: adminPhone,
                passwordHash,
                firstName: 'Admin',
                lastName: 'MaliTravail',
                country: 'Mali',
                role: 'ADMIN'
            }
        });
        console.log('Admin created:');
        console.log('Email:', adminEmail);
        console.log('Phone:', adminPhone);
        console.log('Password:', password);
    }
}

main().catch(console.error).finally(() => prisma.$disconnect());
