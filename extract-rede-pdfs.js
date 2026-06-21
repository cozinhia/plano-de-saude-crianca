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
  const base = path.basename(file, '.pdf').replace(/\s+/g, '-').toLowerCase();
  const out = path.join(__dirname, `_pdf_${base}.txt`);
  fs.writeFileSync(out, all);
  console.log(file, 'pages', doc.numPages, 'chars', all.trim().length, '->', out);
  return { out, all, pages: doc.numPages };
}

(async () => {
  for (const f of ['rede select.pdf', 'rede hapvida.pdf']) {
    const full = path.join(__dirname, f);
    if (!fs.existsSync(full)) {
      console.error('Missing', full);
      continue;
    }
    await extract(full);
  }
})();
