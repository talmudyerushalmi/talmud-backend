import { Injectable } from '@nestjs/common';
import { Command, Console } from 'nestjs-console';
import { MishnaRepository } from '../pages/mishna.repository';
import { DafAmudMappingRepository } from '../pages/daf-amud-mapping.repository';
import { CsvParser } from 'nest-csv-parser';
import * as fs from 'fs';
import * as path from 'path';

class DafAmudCsvRow {
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
    private dafAmudMappingRepo: DafAmudMappingRepository,
  ) {}

  /**
   * Import Daf/Amud mappings from CSV file
   * This command:
   * 1. Updates each Mishna document with daf and amud fields
   * 2. Populates the daf_amud_mappings collection for frontend lookups
   * 
   * Usage: ts-node -r tsconfig-paths/register src/console.ts import:dafAmud
   */
  @Command({
    command: 'import:dafAmud',
    description: 'Import Daf/Amud mappings from CSV and populate DB',
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

    // Populate DafAmud mapping collection (system lines for frontend lookups)
    await this.populateDafAmudMappings(rows);

    console.log('\n========================================');
    console.log('✅ DAF/AMUD IMPORT COMPLETE');
    console.log('========================================');
  }

  /**
   * Populate the daf_amud_mappings collection for frontend lookups
   * This maps system lines to daf/amud for navigation purposes
   */
  private async populateDafAmudMappings(rows: DafAmudCsvRow[]) {
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('Populating DafAmud Mapping Collection');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    // Clear existing mappings
    console.log('🗑️  Clearing existing daf_amud_mappings collection...');
    await this.dafAmudMappingRepo.deleteAll();
    console.log('✅ Collection cleared\n');

    // Prepare mappings for bulk insert
    const mappings = rows.map((row) => ({
      tractate: row.masechet_he,
      daf: row.daf,
      amud: row.amud,
      chapter: row.chapter,
      halacha: row.halacha,
      system_line: row.system_line,
    }));

    console.log(`📝 Inserting ${mappings.length} mappings...\n`);

    // Insert in batches to avoid memory issues
    const batchSize = 1000;
    let inserted = 0;

    for (let i = 0; i < mappings.length; i += batchSize) {
      const batch = mappings.slice(i, i + batchSize);
      await this.dafAmudMappingRepo.insertMany(batch);
      inserted += batch.length;
      
      if (i % (batchSize * 5) === 0 && i > 0) {
        console.log(`Progress: ${inserted}/${mappings.length} mappings inserted`);
      }
    }

    console.log(`\n✅ DafAmud Mapping Population Complete!\n`);
    
    const totalCount = await this.dafAmudMappingRepo.count();
    console.log(`📊 Total mappings in collection: ${totalCount}`);

    // Verify with sample lookups
    console.log('\n📋 Verification - Sample lookups:');
    
    // Test 1: Lookup by daf/amud
    const sample1 = await this.dafAmudMappingRepo.findByDafAmud('ברכות', 'ב', 'א');
    if (sample1) {
      console.log(
        `  ✅ ברכות דף ב עמוד א → Chapter: ${sample1.chapter}, ` +
        `Halacha: ${sample1.halacha}, Line: ${sample1.system_line}`,
      );
    }

    // Test 2: Get all Dafs for ברכות
    const dafsInBerachot = await this.dafAmudMappingRepo.getAllDafsForTractate('ברכות');
    console.log(`  ✅ ברכות has ${dafsInBerachot.length} Dafs`);

    // Test 3: Get Amudim for a specific Daf
    const amudimsInDafBet = await this.dafAmudMappingRepo.getAmudimsForDaf('ברכות', 'ב');
    console.log(`  ✅ ברכות דף ב has ${amudimsInDafBet.length} Amudim: [${amudimsInDafBet.join(', ')}]`);
  }
}
