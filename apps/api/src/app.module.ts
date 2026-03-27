import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';

import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { JobsModule } from './jobs/jobs.module';
import { ProfileModule } from './profile/profile.module';
import { ApplicationsModule } from './applications/applications.module';
import { AdminModule } from './admin/admin.module';
import { EmployerModule } from './employers/employer.module';
import { DocumentsModule } from './documents/documents.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SavedJobsModule } from './saved-jobs/saved-jobs.module';
import { AlertsModule } from './alerts/alerts.module';
import { TalentModule } from './talents/talent.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),

    PrismaModule,
    AuthModule,
    UsersModule,
    JobsModule,
    ProfileModule,
    ApplicationsModule,
    AdminModule,
    EmployerModule,
    DocumentsModule,
    NotificationsModule,
    SavedJobsModule,
    AlertsModule,
    TalentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule { }