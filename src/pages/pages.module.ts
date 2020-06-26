import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Page , PageSchema } from './schemas/page.schema';
import { Tractate, TractateSchema } from './schemas/tractate.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tractate.name, schema: TractateSchema },
      { name: Page.name, schema: PageSchema }

    ])
  ],
  controllers: [PagesController],
  providers: [PagesService]
})
export class PagesModule {}
