import { Module } from '@nestjs/common';
import { CsvModule } from 'nest-csv-parser';
import { ImportService } from './import.service';
import { PagesModule } from '../pages/pages.module';

@Module({
  imports: [PagesModule, CsvModule],
  providers: [ImportService],
})
export class ImportModule {}
