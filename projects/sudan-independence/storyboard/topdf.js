const { chromium } = require('playwright');
(async () => {
  const dir = process.argv[2], out = process.argv[3];
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.emulateMedia({ reducedMotion: 'reduce', colorScheme: 'dark' });
  await p.goto('file://' + dir + '/index.html', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: `
    @page { size: A4 landscape; margin: 10mm; }
    html,body{ -webkit-print-color-adjust: exact; print-color-adjust: exact; background:#0a1524 !important }
    .scene,.tr,.legend div,.vfx{ break-inside: avoid; page-break-inside: avoid; }
    #animatic{ break-before: page; } #vfx-map{ break-before: page; } .anim-grid{ grid-template-columns:1fr 1fr !important; gap:18px !important } .static-pair img{aspect-ratio:16/9} header{padding-block:28px 20px} .scene{padding-block:18px 4px; gap:12px; break-before: page} #s01{break-before:auto} .frames{gap:8px} figcaption{font-size:12px} footer{break-before:avoid}
    figure img{ transition:none !important; transform:none !important }
  `});
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: out, format: 'A4', landscape: true, printBackground: true, scale: 1.35, margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' } });
  await b.close();
})();
