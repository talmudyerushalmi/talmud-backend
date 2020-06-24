import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Page } from './page.entity';
import { Chapter } from './chapter.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Page,
      Chapter
    ])
  ],
  controllers: [PagesController],
  providers: [PagesService]
})
export class PagesModule {}
