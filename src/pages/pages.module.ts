import { Module } from '@nestjs/common';
import { PagesController } from './pages.controller';
import { PagesService } from './pages.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Page , PageSchema } from './schemas/page.schema';
import { Tractate, TractateSchema } from './schemas/tractate.schema';
import { ConsoleModule } from 'nestjs-console';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Tractate.name, schema: TractateSchema },
      { name: Page.name, schema: PageSchema }

    ]),
    ConsoleModule
  ],
  controllers: [PagesController],
  providers: [PagesService]
})
export class PagesModule {}
