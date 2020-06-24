import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { TypeOrmModule} from '@nestjs/typeorm';
import { Page } from './pages/page.entity';
import { PagesModule } from './pages/pages.module';
import { Chapter } from './pages/chapter.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'mongodb',
      //url: 'mongodb://root:root@localhost/talmud',
      port: 27017,
      host: 'localhost',
      database: 'talmud',
      username: "root",
      authSource: 'admin',
      password: "root",

      synchronize: true,
      useUnifiedTopology: true,
      entities: [
        Page, Chapter
      ]
    }),
    PagesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
