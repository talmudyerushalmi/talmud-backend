#!/usr/bin/env node

/**
 * Converts Amud_Daf_mapping.csv to JSON format
 * 
 * Input CSV columns: char_pos, word_pos, file_line, origin, word_after, word_before, 
 *                    line, mikta, halacha, chapter, masechet_he, amud, daf
 * 
 * Output JSON structure:
 * {
 *   "ברכות": {        // masechet_he (tractate name in Hebrew)
 *     "ב": {          // daf (page number as Hebrew letter)
 *       "א": {        // amud (side: א or ב)
 *         "chapter": "001",
 *         "halacha": "001",
 *         "line": "01",
 *         "word_pos": 1
 *       }
 *     }
 *   }
 * }
 */

const fs = require('fs');
const path = require('path');

// File paths
const CSV_FILE = path.join(__dirname, 'Amud_Daf_mapping.csv');
const OUTPUT_FILE = path.join(__dirname, '../../talmud-frontend/src/data/amud_daf_mapping.json');

/**
 * Parse CSV line, handling quoted fields with commas
 */
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
      current += char;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  // Add the last field
  result.push(current.trim());
  
  return result;
}

/**
 * Remove surrounding quotes from a string if present
 */
function unquote(str) {
  if (str.startsWith('"') && str.endsWith('"')) {
    return str.slice(1, -1);
  }
  return str;
}

/**
 * Convert CSV to JSON
 */
function convertCSVToJSON() {
  console.log('Reading CSV file...');
  
  // Read CSV file
  const csvContent = fs.readFileSync(CSV_FILE, 'utf-8');
  const lines = csvContent.split('\n').filter(line => line.trim());
  
  console.log(`Found ${lines.length} lines (including header)`);
  
  // Parse header
  const header = parseCSVLine(lines[0]);
  console.log('CSV columns:', header);
  
  // Build the mapping object
  const mapping = {};
  
  // Process each data row
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i]);
    
    // Skip if not enough columns
    if (values.length < 13) {
      console.warn(`Skipping line ${i + 1}: insufficient columns`);
      continue;
    }
    
    // Extract relevant fields (based on header order)
    const wordPos = parseInt(values[1]) || 0;
    const line = unquote(values[6]);
    const halacha = unquote(values[8]);
    const chapter = unquote(values[9]);
    const masechtHe = unquote(values[10]);
    const amud = unquote(values[11]);
    const daf = unquote(values[12]);
    
    // Initialize nested structure if needed
    if (!mapping[masechtHe]) {
      mapping[masechtHe] = {};
    }
    
    if (!mapping[masechtHe][daf]) {
      mapping[masechtHe][daf] = {};
    }
    
    // Only store the first occurrence of each daf/amud combination
    // (this represents the starting point of that amud)
    if (!mapping[masechtHe][daf][amud]) {
      mapping[masechtHe][daf][amud] = {
        chapter,
        halacha,
        line,
        word_pos: wordPos
      };
    }
  }
  
  // Create output directory if it doesn't exist
  const outputDir = path.dirname(OUTPUT_FILE);
  if (!fs.existsSync(outputDir)) {
    console.log(`Creating directory: ${outputDir}`);
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  // Write JSON file
  console.log(`Writing JSON to: ${OUTPUT_FILE}`);
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(mapping, null, 2), 'utf-8');
  
  // Print statistics
  const tractateCount = Object.keys(mapping).length;
  let dafCount = 0;
  let amudCount = 0;
  
  for (const tractate in mapping) {
    const dafim = Object.keys(mapping[tractate]).length;
    dafCount += dafim;
    
    for (const daf in mapping[tractate]) {
      amudCount += Object.keys(mapping[tractate][daf]).length;
    }
  }
  
  console.log('\n✓ Conversion complete!');
  console.log(`  Tractates: ${tractateCount}`);
  console.log(`  Dafim: ${dafCount}`);
  console.log(`  Amudim: ${amudCount}`);
  console.log(`\nOutput file: ${OUTPUT_FILE}`);
  
  // Print sample of the data
  console.log('\nSample mapping (first tractate):');
  const firstTractate = Object.keys(mapping)[0];
  console.log(`\n${firstTractate}:`);
  const sampleDafim = Object.keys(mapping[firstTractate]).slice(0, 3);
  for (const daf of sampleDafim) {
    console.log(`  Daf ${daf}:`);
    for (const amud in mapping[firstTractate][daf]) {
      const data = mapping[firstTractate][daf][amud];
      console.log(`    Amud ${amud}: Chapter ${data.chapter}, Halacha ${data.halacha}, Line ${data.line}, Word ${data.word_pos}`);
    }
  }
}

// Run the conversion
try {
  convertCSVToJSON();
} catch (error) {
  console.error('Error during conversion:', error);
  process.exit(1);
}

