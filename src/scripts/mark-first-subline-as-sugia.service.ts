import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Mishna } from '../pages/schemas/mishna.schema';

@Console()
@Injectable()
export class MarkFirstSublineAsSugiaService {
  constructor(
    @InjectModel(Mishna.name) private mishnaModel: Model<Mishna>,
  ) {}

  @Command({
    command: 'scripts:markFirstSublineAsSugia',
    description: 'Mark the first subline of each Mishna as Sugia if not already marked',
  })
  async markFirstSublineAsSugia(): Promise<void> {
    console.log('Starting to mark first sublines as Sugia...');
    
    try {
      // Find all Mishnas in the database
      const allMishnas = await this.mishnaModel.find().exec();
      console.log(`Found ${allMishnas.length} Mishnas to process`);

      let updatedCount = 0;
      let alreadyMarkedCount = 0;
      let errorCount = 0;

      for (const mishna of allMishnas) {
        try {
          // Check if the Mishna has lines
          if (!mishna.lines || mishna.lines.length === 0) {
            console.log(`Mishna ${mishna.tractate}/${mishna.chapter}/${mishna.mishna} has no lines, skipping...`);
            continue;
          }

          // Get the first line
          const firstLine = mishna.lines[0];

          // Check if the first line has sublines
          if (!firstLine.sublines || firstLine.sublines.length === 0) {
            console.log(`Mishna ${mishna.tractate}/${mishna.chapter}/${mishna.mishna} has no sublines in first line, skipping...`);
            continue;
          }

          // Get the first subline
          const firstSubline = firstLine.sublines[0];

          // Check if it's already marked as Sugia
          if (firstSubline.sugiaName && firstSubline.sugiaName.trim() !== '') {
            console.log(`Mishna ${mishna.tractate}/${mishna.chapter}/${mishna.mishna}: First subline already marked as Sugia (${firstSubline.sugiaName})`);
            alreadyMarkedCount++;
            continue;
          }

          // Mark it as Sugia with "--"
          firstSubline.sugiaName = '--';
          
          // Mark the document as modified (important for nested properties)
          mishna.markModified('lines');

          // Save the Mishna
          await mishna.save();
          
          console.log(`✓ Mishna ${mishna.tractate}/${mishna.chapter}/${mishna.mishna}: Marked first subline as Sugia`);
          updatedCount++;

        } catch (error) {
          console.error(`✗ Error processing Mishna ${mishna.tractate}/${mishna.chapter}/${mishna.mishna}:`, error.message);
          errorCount++;
        }
      }

      console.log('\n=== Summary ===');
      console.log(`Total Mishnas processed: ${allMishnas.length}`);
      console.log(`Updated: ${updatedCount}`);
      console.log(`Already marked: ${alreadyMarkedCount}`);
      console.log(`Errors: ${errorCount}`);
      console.log('Done!');

    } catch (error) {
      console.error('Fatal error:', error);
      throw error;
    }
  }
}
