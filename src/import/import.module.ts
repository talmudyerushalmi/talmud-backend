import { Module } from '@nestjs/common';
import { ImportService } from './import.service';
import { PagesModule } from '../pages/pages.module';

@Module({
  imports: [PagesModule],
  providers: [ImportService],
})
export class ImportModule {}
