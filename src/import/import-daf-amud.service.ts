import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { MishnaRepository } from '../pages/mishna.repository';
import { TractateRepository } from '../pages/tractate.repository';
import { CsvParser } from 'nest-csv-parser';
import * as fs from 'fs';
import * as path from 'path';

class DafAmudCsvRow {
  tractate_id: string;
  char_pos: string;
  word_pos: string;
  file_line: string;
  origin: string;
  word_after: string;
  word_before: string;
  line: string;
  mikta: string;
  halacha: string;
  chapter: string;
  masechet_he: string;
  amud: string;
  daf: string;
  system_line: string;
}

@Console()
@Injectable()
export class ImportDafAmudService {
  constructor(
    private readonly csvParser: CsvParser,
    private mishnaRepo: MishnaRepository,
    private tractateRepo: TractateRepository,
  ) {}

  /**
   * Import Daf/Amud mappings from CSV file
   * This command populates the Tractate documents with dafs array
   * 
   * Usage: ts-node -r tsconfig-paths/register src/console.ts import:dafAmud
   */
  @Command({
    command: 'import:dafAmud',
    description: 'Import Daf/Amud mappings from CSV and populate Tractate dafs',
  })
  async importDafAmud() {
    console.log('========================================');
    console.log('📊 DAF/AMUD IMPORT PROCESS');
    console.log('========================================\n');

    const csvPath = path.join(
      __dirname,
      '../../Amud_Daf_mapping/Amud_Daf_mapping_with_system_lines.csv',
    );

    if (!fs.existsSync(csvPath)) {
      console.error(`❌ CSV file not found: ${csvPath}`);
      return;
    }

    console.log(`📄 Reading CSV file: ${csvPath}\n`);

    // Parse CSV file
    const stream = fs.createReadStream(csvPath);
    const parsedData = await this.csvParser.parse(
      stream,
      DafAmudCsvRow,
      null,
      null,
      { separator: ',' },
    );

    const rows = parsedData.list;
    console.log(`✅ Loaded ${rows.length} rows from CSV\n`);

    // Populate Tractate dafs
    await this.populateTractateDafs(rows);

    console.log('\n========================================');
    console.log('✅ DAF/AMUD IMPORT COMPLETE');
    console.log('========================================');
  }

  /**
   * Populate the Tractate documents with dafs array
   * Groups CSV rows by tractate and daf, then updates each tractate
   */
  private async populateTractateDafs(rows: DafAmudCsvRow[]) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Populating Tractate Dafs');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Group rows by tractate, then by daf
    const tractateMap = new Map<string, Map<string, DafAmudCsvRow[]>>();
    
    for (const row of rows) {
      const tractateId = row.tractate_id;
      const daf = row.daf;
      
      if (!tractateMap.has(tractateId)) {
        tractateMap.set(tractateId, new Map());
      }
      
      const dafMap = tractateMap.get(tractateId);
      if (!dafMap.has(daf)) {
        dafMap.set(daf, []);
      }
      
      dafMap.get(daf).push(row);
    }

    console.log(`📊 Found ${tractateMap.size} tractates with Daf/Amud data\n`);

    // Update each tractate
    let updated = 0;
    for (const [tractateId, dafMap] of tractateMap.entries()) {
      const tractate = await this.tractateRepo.get(tractateId);
      
      if (!tractate) {
        console.log(`⚠️  Tractate not found: ${tractateId}`);
        continue;
      }

      // Build dafs array with nested amudim
      const dafs = [];
      for (const [dafId, amudRows] of dafMap.entries()) {
        const amudim = amudRows.map(row => ({
          amud: row.amud,
          chapter: row.chapter,
          halacha: row.halacha,
          system_line: row.system_line,
        }));

        dafs.push({
          id: dafId,
          amudim,
        });
      }

      // Update tractate
      tractate.dafs = dafs;
      await tractate.save();
      updated++;

      console.log(`✅ Updated ${tractateId}: ${dafs.length} dafs`);
    }

    console.log(`\n✅ Tractate Daf Population Complete!`);
    console.log(`📊 Updated ${updated} tractates`);

    // Verification
    console.log('\n📋 Verification - Sample lookup:');
    const sampleTractate = await this.tractateRepo.get('ברכות');
    if (sampleTractate && sampleTractate.dafs && sampleTractate.dafs.length > 0) {
      const firstDaf = sampleTractate.dafs[0];
      console.log(`  ✅ ברכות has ${sampleTractate.dafs.length} Dafs`);
      console.log(`  ✅ First Daf (${firstDaf.id}) has ${firstDaf.amudim.length} Amudim`);
    }
  }
}
