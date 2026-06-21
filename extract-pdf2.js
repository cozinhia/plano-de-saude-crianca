const fs = require('fs');
const path = require('path');

async function extract(file) {
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const data = new Uint8Array(fs.readFileSync(file));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  let all = '';
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it) => it.str).join(' ');
    all += `\n--- PAGE ${i} ---\n${text}\n`;
  }
  const out = path.join('c:/Matos', '_ocr_' + path.basename(file, '.pdf') + '.txt');
  fs.writeFileSync(out, all);
  console.log(file, 'pages', doc.numPages, 'chars', all.trim().length, '->', out);
}

(async () => {
  for (const f of ['c:/Matos/select.pdf', 'c:/Matos/hapvida.pdf']) {
    await extract(f);
  }
})();