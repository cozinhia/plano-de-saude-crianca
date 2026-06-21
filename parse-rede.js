/**
 * Parse OCR rede credenciada from _ocr_select.txt and _ocr_hapvida.txt
 * Outputs structured JSON for landing page accordions.
 */
const fs = require('fs');
const path = require('path');

const REGION_MARKERS = [
  'São Paulo - Centro',
  'São Paulo - Zona Sul',
  'São Paulo - Zona Oeste',
  'São Paulo - Zona Leste',
  'São Paulo - Zona Norte',
  'Grande SP',
  'ABCD',
  'Alto Tietê',
  'Campinas e Região',
  'Sorocaba e Região',
  'Vale do Paraíba',
  'Interior',
  'Baixada Santista',
  'Laboratórios',
];

function normalizeCats(raw) {
  if (!raw || raw === '-' || raw === "'" || raw === '"' || raw === 'É' || raw === 'O' || raw === 'o' || raw === ' ' || raw === 'nos' || raw === 'Do' || raw === 'DD' || raw === 'W' || raw === 'ó' || raw === 'y' || raw === '4' || raw === 'n' || raw === 'á' || raw === 'as' || raw === '=' || raw === 'i' || raw === 'Ú' || raw === 'mo' || raw === 'já' || raw === 'ses' || raw === 'nes' || raw === '2antos' || raw === 'TAN' || raw === 'PA?' || raw === 'ps?' || raw === 'Ps' || raw === 'os' || raw === 'Ps' || raw === 'PA ,' || raw === "PA ,") {
    return null;
  }
  let s = raw
    .replace(/\./g, ',')
    .replace(/\//g, ',')
    .replace(/'/g, '')
    .replace(/"/g, '')
    .replace(/º/g, '')
    .replace(/'/g, '')
    .replace(/H'/g, 'H')
    .replace(/H'/g, 'H')
    .replace(/H'/g, 'H')
    .replace(/PS'/g, 'PS')
    .replace(/H'/g, 'H')
    .replace(/HPS'/g, 'H,PS')
    .replace(/HPSº/g, 'H,PS')
    .replace(/HPS'/g, 'H,PS')
    .replace(/H'MPS'/g, 'H,M,PS')
    .replace(/H\.PS'/g, 'H,PS')
    .replace(/H\.PS'/g, 'H,PS')
    .replace(/H\.PSº/g, 'H,PS')
    .replace(/H,PSº/g, 'H,PS')
    .replace(/H,PS'/g, 'H,PS')
    .replace(/HMPS'/g, 'H,M,PS')
    .replace(/HMPSA/g, 'H,M,PSA')
    .replace(/HM PSA/g, 'H,M,PSA')
    .replace(/HM PSA/g, 'H,M,PSA')
    .replace(/HPSA/g, 'H,PSA')
    .replace(/HPSAPSP/g, 'H,PSA,PSP')
    .replace(/H,PSAPSP/g, 'H,PSA,PSP')
    .replace(/H\.PSA\.PSP/g, 'H,PSA,PSP')
    .replace(/H,\.PSA\.PSP/g, 'H,PSA,PSP')
    .replace(/H,PSA,PSP\./g, 'H,PSA,PSP')
    .replace(/H,PSA\/PSP/g, 'H,PSA,PSP')
    .replace(/H,PSA PSP/g, 'H,PSA,PSP')
    .replace(/HM PSA PSP/g, 'H,M,PSA,PSP')
    .replace(/HM PSA\.PSP/g, 'H,M,PSA,PSP')
    .replace(/H\.M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/H\.M,PSA,PSP\./g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP\./g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/H,M,PSA,PSP/g, 'H,M,PSA,PSP')
    .replace(/HPSA HPSA/g, 'H,PSA')
    .replace(/AVB/g, 'AMB')
    .replace(/ANB/g, 'AMB')
    .replace(/LM/g, 'LAB')
    .replace(/MPS/g, 'M,PS')
    .replace(/MPS!/g, 'M,PS')
    .replace(/mPs/g, 'M,PS')
    .replace(/MPs/g, 'M,PS')
    .replace(/nPs/g, 'H,PS')
    .replace(/HPsP/g, 'H,PSP')
    .replace(/HPs'/g, 'H,PS')
    .replace(/HPS'/g, 'H,PS')
    .replace(/HPS/g, 'H,PS')
    .replace(/H,PS'/g, 'H,PS')
    .replace(/H,PSº/g, 'H,PS')
    .replace(/H,PS'/g, 'H,PS')
    .replace(/PSº/g, 'PS')
    .replace(/PSA H/g, 'PSA')
    .trim();

  if (!s || s === '-' || /^[\s.,]+$/.test(s)) return null;
  // Normalize comma spacing
  s = s.split(',').map((p) => p.trim()).filter(Boolean).join(', ');
  return s;
}

function isRegionLine(line) {
  const t = line.replace(/^O\s+/, '').replace(/^Ø\s+/, '').trim();
  return REGION_MARKERS.some((r) => t === r || t.startsWith(r));
}

function getRegion(line) {
  return line.replace(/^O\s+/, '').replace(/^Ø\s+/, '').trim();
}

function parseRedeSection(text, planHeaders) {
  const lines = text.split('\n');
  let inRede = false;
  let currentRegion = null;
  const regions = {};
  let pendingName = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (line.includes('Rede Credenciada')) {
      inRede = true;
      continue;
    }
    if (!inRede) continue;
    if (line.startsWith('Legenda:') || line.startsWith('Informativo Referencial')) {
      inRede = false;
      pendingName = null;
      continue;
    }
    if (line.includes('Principais hospitais')) continue;
    if (planHeaders.some((h) => line.includes(h) && line.length < 120)) continue;

    if (isRegionLine(line)) {
      currentRegion = getRegion(line);
      if (!regions[currentRegion]) regions[currentRegion] = [];
      pendingName = null;
      continue;
    }

    if (!currentRegion) continue;

    // Try to match: Name + 4 plan columns
    const catPattern = /([A-Z][A-Za-z0-9,.\/'\sºPSALMBH]+?)\s+([-\w.,/'"ÉO\sº]+?)\s+([-\w.,/'"ÉO\sº]+?)\s+([-\w.,/'"ÉO\sº]+?)$/;
    const m = line.match(catPattern);
    if (m) {
      const name = m[1].trim();
      const plans = [m[2], m[3], m[4], m[5]].map(normalizeCats);
      if (name.length > 2) {
        regions[currentRegion].push({ name, plans });
      }
      pendingName = null;
      continue;
    }

    // Location-only line (neighborhood) - skip or attach
    if (line.length < 40 && !line.match(/[A-Z]{2,}/)) continue;

    // Multi-line hospital name continuation
    if (pendingName) {
      const fullLine = pendingName + ' ' + line;
      const m2 = fullLine.match(catPattern);
      if (m2) {
        regions[currentRegion].push({
          name: m2[1].trim(),
          plans: [m2[2], m2[3], m2[4], m2[5]].map(normalizeCats),
        });
        pendingName = null;
      } else {
        pendingName = fullLine;
      }
      continue;
    }

    // Might be start of multi-line entry
    if (!line.match(/\s[-\w.,/'"ÉOº]{3,}\s[-\w.,/'"ÉOº]/)) {
      pendingName = line;
    }
  }

  return regions;
}

function extractRedePages(text) {
  const pages = text.split(/--- PÁGINA \d+ ---/);
  return pages.filter((p) => p.includes('Rede Credenciada')).join('\n');
}

const selectText = fs.readFileSync(path.join(__dirname, '_ocr_select.txt'), 'utf8');
const hapvidaText = fs.readFileSync(path.join(__dirname, '_ocr_hapvida.txt'), 'utf8');

const selectRede = parseRedeSection(extractRedePages(selectText), [
  'Select SP 100',
  'Select Premium SP 110',
]);
const hapvidaRede = parseRedeSection(extractRedePages(hapvidaText), [
  'Smart UP',
  'Nosso Médico RMSP',
  'Smart UP 50+',
]);

fs.writeFileSync(path.join(__dirname, 'rede-select.json'), JSON.stringify(selectRede, null, 2));
fs.writeFileSync(path.join(__dirname, 'rede-hapvida.json'), JSON.stringify(hapvidaRede, null, 2));

console.log('Select regions:', Object.keys(selectRede).length);
Object.entries(selectRede).forEach(([k, v]) => console.log(`  ${k}: ${v.length}`));
console.log('Hapvida regions:', Object.keys(hapvidaRede).length);
Object.entries(hapvidaRede).forEach(([k, v]) => console.log(`  ${k}: ${v.length}`));