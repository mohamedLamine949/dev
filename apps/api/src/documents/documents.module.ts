import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { DocumentsController } from './documents.controller';

@Module({
    imports: [MulterModule.register({})],
    controllers: [DocumentsController],
})
export class DocumentsModule { }
