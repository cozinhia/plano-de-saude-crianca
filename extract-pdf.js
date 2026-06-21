const fs = require('fs');
const { PDFParse } = require('pdf-parse');

const files = [
  'c:/Matos/rede select.pdf',
  'c:/Matos/rede hapvida.pdf',
];

(async () => {
  for (const f of files) {
    try {
      const parser = new PDFParse({ data: fs.readFileSync(f) });
      const data = await parser.getText();
      const name = f.split(/[/\\]/).pop().replace(/\.pdf/i, '').replace(/[^\w\-]+/g, '_');
      const out = `c:/Matos/_pdf_${name}.txt`;
      fs.writeFileSync(out, data.text);
      console.log(name, 'pages', data.total, 'chars', data.text.length, '->', out);
      await parser.destroy();
    } catch (e) {
      console.log('ERR', f, e.message);
    }
  }
})();