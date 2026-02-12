import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { MishnaRepository } from '../pages/mishna.repository';
import { CsvParser } from 'nest-csv-parser';
import * as fs from 'fs';
import * as path from 'path';

class MishnaDafAmudCsvRow {
  tractate_id: string;
  tractate_heb: string;
  chapter: string;
  mishna: string;
  daf: string;
  amud: string;
}

@Console()
@Injectable()
export class ImportMishnaDafAmudService {
  constructor(
    private readonly csvParser: CsvParser,
    private mishnaRepo: MishnaRepository,
  ) {}

  /**
   * Import complete Mishna-to-Daf/Amud mapping
   * This populates ALL Mishna documents with daf and amud fields
   * Uses mishna_to_daf_mapping.csv which has one row per Mishna (not per line)
   * 
   * Usage: ts-node -r tsconfig-paths/register src/console.ts import:mishnaDafAmud
   */
  @Command({
    command: 'import:mishnaDafAmud',
    description: 'Import complete Mishna to Daf/Amud mapping from CSV',
  })
  async importMishnaDafAmud() {
    console.log('========================================');
    console.log('📊 MISHNA DAF/AMUD IMPORT PROCESS');
    console.log('========================================\n');

    const csvPath = path.join(
      __dirname,
      '../../Amud_Daf_mapping/mishna_to_daf_mapping.csv',
    );

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`);
      return;
    }

    console.log(`📄 Reading CSV file: ${csvPath}\n`);

    const stream = fs.createReadStream(csvPath);
    const parsedData = await this.csvParser.parse(
      stream,
      MishnaDafAmudCsvRow,
      null,
      null,
      { separator: ',' },
    );

    const rows = parsedData.list;
    console.log(`✅ Loaded ${rows.length} rows from CSV\n`);

    await this.updateAllMishnas(rows);

    console.log('\n========================================');
    console.log('✅ MISHNA DAF/AMUD IMPORT COMPLETE');
    console.log('========================================');
  }

  private async updateAllMishnas(rows: MishnaDafAmudCsvRow[]) {
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Updating ALL Mishna Documents');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    console.log(`📝 Processing ${rows.length} Mishnas\n`);

    let successCount = 0;
    let notFoundCount = 0;
    let errorCount = 0;
    const notFoundDocs: string[] = [];

    let progress = 0;
    for (const row of rows) {
      progress++;

      if (progress % 100 === 0) {
        console.log(
          `Progress: ${progress}/${rows.length} ` +
          `(✅ ${successCount} updated, ❌ ${notFoundCount} not found, ⚠️  ${errorCount} errors)`,
        );
      }

      // CSV already has English tractate names with underscores
      const tractate = row.tractate_id;
      const chapter = row.chapter;
      const mishna = row.mishna;
      const daf = row.daf;
      const amud = row.amud;

      try {
        const mishnaDoc = await this.mishnaRepo
          .find(tractate, chapter, mishna)
          .exec();

        if (!mishnaDoc) {
          notFoundCount++;
          notFoundDocs.push(`${tractate}:${chapter}:${mishna}`);
          continue;
        }

        // Update the mishna with daf and amud
        mishnaDoc.daf = daf;
        mishnaDoc.amud = amud;
        await mishnaDoc.save();

        successCount++;
      } catch (error) {
        errorCount++;
        console.error(`Error updating ${tractate}:${chapter}:${mishna}:`, error.message);
      }
    }

    console.log(`\n✅ Mishna Update Complete!\n`);
    console.log('Statistics:');
    console.log(`  Total processed: ${rows.length}`);
    console.log(`  ✅ Successfully updated: ${successCount}`);
    console.log(`  ❌ Documents not found in DB: ${notFoundCount}`);
    console.log(`  ⚠️  Errors: ${errorCount}`);

    if (notFoundDocs.length > 0 && notFoundDocs.length <= 10) {
      console.log(`\n❌ Documents not found in DB:`);
      notFoundDocs.forEach((doc) => console.log(`  ${doc}`));
    } else if (notFoundDocs.length > 10) {
      console.log(`\n❌ First 10 documents not found in DB:`);
      notFoundDocs.slice(0, 10).forEach((doc) => console.log(`  ${doc}`));
    }

    console.log('\n📋 Verification - Sample updated Mishnas:');
    const samples = await this.mishnaRepo.getAll().limit(5).exec();

    for (const sample of samples) {
      console.log(
        `  ${sample.tractate}:${sample.chapter}:${sample.mishna} → ` +
        `daf: ${sample.daf || 'null'}, amud: ${sample.amud || 'null'}`,
      );
    }
  }
}
