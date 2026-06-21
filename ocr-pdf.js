const fs = require('fs');
const path = require('path');
const { pdf } = require('pdf-to-img');
const Tesseract = require('tesseract.js');

async function ocrPdf(file) {
  const base = path.basename(file, '.pdf');
  const out = path.join('c:/Matos', `_ocr_${base}.txt`);
  let all = '';
  let pageNum = 0;

  for await (const image of await pdf(file, { scale: 2 })) {
    pageNum++;
    process.stdout.write(`OCR ${base} page ${pageNum}...\n`);
    const { data: { text } } = await Tesseract.recognize(image, 'por');
    all += `\n--- PÁGINA ${pageNum} ---\n${text}\n`;
  }

  fs.writeFileSync(out, all);
  console.log('Saved', out, 'chars', all.length);
}

(async () => {
  await ocrPdf('c:/Matos/select.pdf');
  await ocrPdf('c:/Matos/hapvida.pdf');
})();