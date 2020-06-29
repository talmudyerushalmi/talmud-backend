import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PagesModule } from './pages/pages.module';
import { MongooseModule } from '@nestjs/mongoose';
import { ImportModule } from './import/import.module';

@Module({
  imports: [
    MongooseModule.forRoot('mongodb://localhost:27017/talmud?authSource=admin',
      {
        "user": "root",
        "pass": "root",
        useNewUrlParser: true}),
    PagesModule,
    ImportModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
