import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { Pool } from 'pg'

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
    constructor() {
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
        super({ adapter });
    }

    async onModuleInit() {
        await this.$connect()
    }
}