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
    console.log('Processing Mishnas using optimized bulk operations...\n');
    
    try {
      let updatedCount = 0;
      let alreadyMarkedCount = 0;
      let errorCount = 0;
      let skippedCount = 0;
      let processedCount = 0;
      
      const BATCH_SIZE = 50; // Process in batches
      let batch = [];

      // Use cursor for streaming
      const cursor = this.mishnaModel.find().cursor();

      for await (const mishna of cursor) {
        processedCount++;
        
        try {
          // Check if the Mishna has lines
          if (!mishna.lines || mishna.lines.length === 0) {
            skippedCount++;
            continue;
          }

          // Get the first line
          const firstLine = mishna.lines[0];

          // Check if the first line has sublines
          if (!firstLine.sublines || firstLine.sublines.length === 0) {
            skippedCount++;
            continue;
          }

          // Get the first subline
          const firstSubline = firstLine.sublines[0];

          // Check if it's already marked as Sugia
          if (firstSubline.sugiaName && firstSubline.sugiaName.trim() !== '') {
            alreadyMarkedCount++;
            continue;
          }

          // Mark it as Sugia with "--"
          firstSubline.sugiaName = '--';
          mishna.markModified('lines');
          
          // Add to batch
          batch.push(mishna);
          
          // When batch is full, save all at once
          if (batch.length >= BATCH_SIZE) {
            await Promise.all(batch.map(m => m.save()));
            updatedCount += batch.length;
            batch = [];
            
            console.log(`Progress: ${processedCount} processed - Updated: ${updatedCount}, Already marked: ${alreadyMarkedCount}, Skipped: ${skippedCount}`);
            
            // Small pause between batches to let server breathe
            await new Promise(resolve => setTimeout(resolve, 100));
          }

        } catch (error) {
          console.error(`✗ Error processing Mishna ${mishna.tractate}/${mishna.chapter}/${mishna.mishna}:`, error.message);
          errorCount++;
        }
      }
      
      // Save remaining batch
      if (batch.length > 0) {
        await Promise.all(batch.map(m => m.save()));
        updatedCount += batch.length;
        console.log(`Progress: ${processedCount} processed - Updated: ${updatedCount}, Already marked: ${alreadyMarkedCount}, Skipped: ${skippedCount}`);
      }

      console.log('\n=== Final Summary ===');
      console.log(`Total Mishnas processed: ${processedCount}`);
      console.log(`Updated: ${updatedCount}`);
      console.log(`Already marked: ${alreadyMarkedCount}`);
      console.log(`Skipped (no lines/sublines): ${skippedCount}`);
      console.log(`Errors: ${errorCount}`);
      console.log('✓ Done!');

    } catch (error) {
      console.error('Fatal error:', error);
      throw error;
    }
  }
}
