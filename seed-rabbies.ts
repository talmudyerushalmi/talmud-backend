/**
 * Seed script for the 'rabbies' collection.
 * Run with: npx ts-node seed-rabbies.ts
 * Or directly with mongosh using the commands at the bottom of this file.
 *
 * MongoDB shell commands (run in mongosh after connecting):
 *
 *   use talmud
 *   db.rabbies.insertMany([ ... ])
 *
 * See below for the full data.
 */

import * as mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.join(__dirname, '.env') });

const MONGO_URI = process.env.MONGO_URI || process.env.DB_CONNECTION || 'mongodb://localhost:27017/talmud';

const rabbies = [
  {
    name: 'רבי עקיבא',
    description: 'תנא מהדור השלישי. תלמידו של רבי יהושע ורבי אליעזר. הניח יסודות להלכה ולמדרש.',
  },
  {
    name: 'רבי מאיר',
    description: 'תנא מהדור הרביעי. תלמידו המובהק של רבי עקיבא. ידוע בחדות שכלו ובמשלותיו.',
  },
  {
    name: 'רבי יהודה הנשיא',
    description: 'עורך המשנה. נשיא הסנהדרין. כונה "רבינו הקדוש".',
  },
  {
    name: 'רב',
    description: 'אמורא בבלי מהדור הראשון. ייסד ישיבה בסורא. תלמידו של רבי יהודה הנשיא.',
  },
  {
    name: 'שמואל',
    description: 'אמורא בבלי מהדור הראשון. ראש ישיבת נהרדעא. בקי בתורה ובאסטרונומיה.',
  },
  {
    name: 'רבי יוחנן',
    description: 'אמורא ארץ-ישראלי מהדור השני. עורך התלמוד הירושלמי. ראש ישיבת טבריה.',
  },
  {
    name: 'ריש לקיש',
    description: 'אמורא ארץ-ישראלי מהדור השני. חברוּתא של רבי יוחנן. ידוע בחריפות ובעצמאות.',
  },
  {
    name: 'רב נחמן',
    description: 'אמורא בבלי מהדור השלישי. דיין מומחה לדיני ממונות. חתנו של ריש גלותא.',
  },
  {
    name: 'רבא',
    description: 'אמורא בבלי מהדור הרביעי. ראש ישיבת מחוזא. ידוע בוויכוחיו עם אביי.',
  },
  {
    name: 'אביי',
    description: 'אמורא בבלי מהדור הרביעי. ראש ישיבת פומבדיתא. וויכוחיו עם רבא מרכזיים בתלמוד.',
  },
  {
    name: 'רב אשי',
    description: 'אמורא בבלי מהדור השישי. ראש ישיבת סורא. החל בעריכת התלמוד הבבלי.',
  },
  {
    name: 'רבינא',
    description: 'אמורא בבלי מהדור האחרון. סיים את עריכת התלמוד הבבלי יחד עם רב אשי.',
  },
];

async function seed() {
  await mongoose.connect(MONGO_URI);
  const db = mongoose.connection.db;
  const collection = db.collection('rabbies');

  const existing = await collection.countDocuments();
  if (existing > 0) {
    console.log(`Collection already has ${existing} documents. Skipping.`);
    process.exit(0);
  }

  const result = await collection.insertMany(rabbies);
  console.log(`Inserted ${result.insertedCount} rabbies.`);
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
