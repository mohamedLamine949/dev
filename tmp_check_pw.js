
const bcrypt = require('bcrypt');
const hash = '$2b$10$FCkx/CYfxLy5UryTEkAJxetBrtCDLRWhyvw.eItLlDmHWzuCl.EmG';
const passwords = ['admin123', 'Admin123', 'Admin123!', 'password', 'malilink'];

async function check() {
    for (const p of passwords) {
        const match = await bcrypt.compare(p, hash);
        if (match) {
            console.log(`MATCH FOUND: ${p}`);
            return;
        }
    }
    console.log('NO MATCH FOUND');
}

check();
