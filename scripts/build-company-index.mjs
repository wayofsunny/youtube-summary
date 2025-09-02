import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

// Config
const CSV_PATH = path.join(process.cwd(), 'src', 'data', 'companies.csv');
const OUT_PATH = path.join(process.cwd(), 'src', 'data', 'company_index_prefix3.json');
const MAX_PER_BUCKET = 500; // cap per 3-letter prefix bucket to keep file small

async function build() {
  console.log('[build-company-index] reading', CSV_PATH);
  const buckets = Object.create(null); // prefix -> string[] (original case)
  const seen = new Set();
  let count = 0;

  await new Promise((resolve, reject) => {
    fs.createReadStream(CSV_PATH)
      .pipe(csv())
      .on('data', (row) => {
        const name = row?.name ? String(row.name).trim() : '';
        if (!name || seen.has(name)) return;
        seen.add(name);
        const lower = name.toLowerCase();
        const p3 = lower.slice(0, 3);
        if (!p3) return;
        const arr = buckets[p3] || (buckets[p3] = []);
        if (arr.length < MAX_PER_BUCKET) arr.push(name);
        count++;
        if (count % 500000 === 0) console.log(`[build-company-index] processed ${count}`);
      })
      .on('end', () => resolve())
      .on('error', (e) => reject(e));
  });

  // Write pretty compact JSON
  console.log('[build-company-index] writing', OUT_PATH);
  await fs.promises.writeFile(OUT_PATH, JSON.stringify(buckets));
  console.log('[build-company-index] done. buckets:', Object.keys(buckets).length);
}

build().catch((e) => {
  console.error('[build-company-index] failed', e);
  process.exit(1);
});


