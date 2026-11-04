const { chromium } = require('playwright');
(async () => {
  const [dir, out] = process.argv.slice(2);
  const b = await chromium.launch();
  const p = await b.newPage({ viewport: { width: 1280, height: 900 } });
  await p.goto('file://' + dir + '/client2.html', { waitUntil: 'networkidle' });
  await p.addStyleTag({ content: `
    html,body{ -webkit-print-color-adjust:exact; print-color-adjust:exact; background:#14181d !important }
    .cover{ min-height:auto; padding-block:120px 60px; break-after:page }
    .act{ break-before:page; padding-block:200px 0; text-align:center; border:0 }
    .act + .scene{ break-before:page }
    .scene{ break-before:page; break-inside:avoid; border-top:0; padding-block:6px 0 }
    .act ~ .scene:not(.act + .scene){ }
    .frames{ grid-template-columns:2fr 1fr !important; grid-template-rows:auto auto; gap:10px } .frames figure:first-child{ grid-row:span 2 } .frames figure:first-child img{ height:100%; aspect-ratio:auto } .vo{font-size:21px} .notes{font-size:15px}
    footer{ break-before:avoid }` });
  await p.evaluate(() => document.fonts.ready);
  await p.pdf({ path: out, format:'A4', landscape:true, printBackground:true, scale:1.0, margin:{top:'10mm',bottom:'8mm',left:'10mm',right:'10mm'} });
  await b.close();
})();
