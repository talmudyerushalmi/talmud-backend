import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PagesModule } from './pages/pages.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ImportModule } from './import/import.module';
import { SettingsModule } from './settings/settings.module';
import * as config from 'config';
import { ConfigModule } from '@nestjs/config';

const dbConfig = config.get('db');
@Module({
  imports: [
    MongooseModule.forRoot(dbConfig.connection,
      {
        "user": dbConfig.user,
        "pass": dbConfig.password,}),
    PagesModule,
    ImportModule,
    SettingsModule,
    ConfigModule.forRoot({
      isGlobal: true,
    })
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
