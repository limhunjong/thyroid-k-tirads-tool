// Regression tests for Thyroid K-TIRADS report tool.
//
// Run:  node tests/report.test.cjs
// Requires: playwright + a chromium binary. In environments with the
// PLAYWRIGHT_BROWSERS_PATH convention, common install locations are tried
// automatically; otherwise playwright's own chromium is used.
//
// Each test gets a fresh in-page state (localStorage cleared, defaultState
// restored). Tests exercise the real page in headless Chromium, so they
// cover the report generation logic, gating rules, and UI wiring together.

const path = require('path');

function resolvePlaywright() {
  const candidates = [
    'playwright',
    '/opt/node22/lib/node_modules/playwright',
  ];
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* next */ }
  }
  throw new Error('playwright not found — npm i -g playwright');
}

async function launch(chromium) {
  const bins = [
    process.env.CHROMIUM_BIN,
    '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
    '/opt/pw-browsers/chromium/chrome-linux/chrome',
  ].filter(Boolean);
  for (const executablePath of bins) {
    try { return await chromium.launch({ executablePath }); } catch (e) { /* next */ }
  }
  return await chromium.launch();
}

const tests = [];
function test(name, fn) { tests.push({ name, fn }); }

// ---------------------------------------------------------------- tests --

test('empty study auto-reports normal thyroid and normal lymph nodes', async page => {
  const txt = await page.evaluate(() => buildReportText());
  assert(txt.includes('Normal thyroid'), 'missing "Normal thyroid"');
  assert(txt.includes('No abnormal cervical lymph node') || txt.includes('Normal cervical lymph node'),
    'missing normal LN wording');
});

test('report header contains title and report date', async page => {
  const txt = await page.evaluate(() => buildReportText());
  assert(txt.startsWith('Thyroid ultrasonography (K-TIRADS 2021)\nReport date: '),
    'header missing or malformed: ' + txt.split('\n').slice(0, 2).join(' | '));
});

test('adding a nodule removes the normal-thyroid wording', async page => {
  const txt = await page.evaluate(() => {
    state.nodules.right.push(defaultNodule());
    const n = state.nodules.right[0];
    n.locationUpper = true; n.composition = 'Solid'; n.diamAP = '10';
    return buildReportText();
  });
  assert(!txt.split('\n').some(l => l.trim() === 'Normal thyroid'),
    'normal thyroid wording still present with a nodule');
});

test('follow-up size delta appears in the report finding line', async page => {
  const txt = await page.evaluate(() => {
    state.nodules.right.push(defaultNodule());
    const n = state.nodules.right[0];
    n.locationUpper = true; n.composition = 'Solid';
    n.diamAP = '12'; n.diamT = '10'; n.diamL = '8';
    n.sizeChangeFU = true; n.sizeChangeType = 'Increased';
    n.prevAP = '9'; n.prevT = '8'; n.prevL = '6';
    return buildReportText();
  });
  assert(/increased \(9×8×6 → 12×10×8 mm, \+3 mm \(\+33%\)\)/.test(txt),
    'delta line missing/incorrect: ' + (txt.match(/increased[^\n]*/) || ['(none)'])[0]);
});

test('calcSizeChangeInfo flags significant growth (>=20% & >=2mm in >=2 diameters)', async page => {
  const r = await page.evaluate(() => {
    const n = defaultNodule();
    n.diamAP = '12'; n.diamT = '10'; n.diamL = '8'; n.diamUnit = 'mm';
    n.prevAP = '9'; n.prevT = '8'; n.prevL = '7.5';
    const sig = calcSizeChangeInfo(n).sig;   // AP +3(33%), T +2(25%) → 2 diameters
    n.prevT = '9'; n.prevL = '7.9';
    const notSig = calcSizeChangeInfo(n).sig; // only AP qualifies
    return { sig, notSig };
  });
  assert(r.sig === true, 'expected significant growth flag');
  assert(r.notSig === false, 'expected NOT significant with only one qualifying diameter');
});

test('LN entry includes checked levels and per-level feature tags', async page => {
  const line = await page.evaluate(() => {
    const c = getLN(1);            // Right lateral, suspicious column
    c.level_2 = true; c.level_3 = true;
    c.feat_cystic = true;
    c.feat_calc = true; c.feat_calc_lv3 = true;
    setLN(1, c);
    const txt = buildReportText();
    return (txt.split('\n').find(l => l.includes('Suspicious lymph node')) || '').trim();
  });
  assert(line.includes('Right lateral level 2,3'), 'levels missing: ' + line);
  assert(line.includes('cystic change'), 'untagged feature missing: ' + line);
  assert(line.includes('calcification (level 3)'), 'tagged feature missing: ' + line);
});

test('indeterminate columns expose only non-suspicious features', async page => {
  const r = await page.evaluate(() => ({
    indet: lnFeaturesFor(0).map(f => f.key),
    susp: lnFeaturesFor(1).map(f => f.key),
  }));
  assert(r.indet.join(',') === 'hilum,round', 'indeterminate features: ' + r.indet);
  assert(r.susp.length === 6, 'suspicious column should list all 6 features');
});

test('LN biopsy is gated on imaging-diagnosis levels', async page => {
  const r = await page.evaluate(() => {
    renderAll(); switchTab('lymph');
    const rows = () => [...document.getElementById('lnBiopsyBody').rows];
    const bx = () => rows().find(r => r.cells[0].textContent.trim() === 'Biopsy').cells[1].querySelector('input');
    const before = bx().disabled;
    const c = getLN(0); c.level_1 = true; setLN(0, c); renderLymphTable();
    const after = bx().disabled;
    switchTab('thyroid');
    return { before, after };
  });
  assert(r.before === true, 'biopsy should be disabled with no level');
  assert(r.after === false, 'biopsy should enable once a level is checked');
});

test('validation flags Biopsy=Yes with no FNA/CNB level', async page => {
  const errs = await page.evaluate(() => {
    const c = getLN(1);
    c.level_2 = true; c.ldValue = '1.2'; c.biopsy = true;
    setLN(1, c);
    return validateReport();
  });
  assert(errs.some(e => e.includes('Biopsy is Yes but no FNA/CNB level')),
    'expected LN biopsy validation error, got: ' + JSON.stringify(errs));
});

test('LN FNA result and Tg washout appear in the biopsy report lines', async page => {
  const txt = await page.evaluate(() => {
    const c = getLN(1);
    c.level_3 = true; c.ldValue = '1.5'; c.biopsy = true; c.fna_3 = true;
    c.fnaResult = 'Metastatic carcinoma'; c.tgWashout = '850';
    c.cnb_3 = true; c.cnbResult = 'Metastatic papillary carcinoma';
    setLN(1, c);
    return buildReportText();
  });
  assert(txt.includes('LN FNA: Right lateral (suspicious) level 3 — metastatic carcinoma, Tg washout 850 ng/mL'),
    'FNA result line missing: ' + (txt.match(/LN FNA[^\n]*/) || ['(none)'])[0]);
  assert(txt.includes('LN CNB: Right lateral (suspicious) level 3 — Metastatic papillary carcinoma'),
    'CNB result line missing');
});

test('biopsy indication follows K-TIRADS size thresholds', async page => {
  const r = await page.evaluate(() => {
    const mk = (tiradsSetup, size) => {
      const n = defaultNodule();
      tiradsSetup(n);
      n.diamAP = String(size); n.diamUnit = 'mm';
      return getBiopsyIndication(n, false);
    };
    // Solid + marked hypo + microcalcification → K-TIRADS 5
    const k5 = n => { n.composition = 'Solid'; n.echogenicity = 'Marked hypo'; n.calcification_micro = true; };
    return {
      k5big: mk(k5, 12), k5small: mk(k5, 8),
    };
  });
  assert(r.k5big && r.k5big.indicated === true, 'K5 12mm should be indicated: ' + JSON.stringify(r.k5big));
  assert(r.k5small && r.k5small.indicated === false, 'K5 8mm should be below threshold');
});

test('undo restores state after a section reset', async page => {
  const r = await page.evaluate(() => {
    state.clinHistory = 'KEEP-ME'; saveState();
    pendingSectionReset = 'thyroid'; doSectionReset();
    const cleared = state.clinHistory === '';
    undoLastReset();
    return { cleared, restored: state.clinHistory === 'KEEP-ME' };
  });
  assert(r.cleared, 'reset did not clear');
  assert(r.restored, 'undo did not restore');
});

test('new patient clears everything and report returns to normal wording', async page => {
  const txt = await page.evaluate(() => {
    state.nodules.left.push(defaultNodule());
    state.nodules.left[0].composition = 'Solid';
    doNewPatient();
    return buildReportText();
  });
  assert(txt.includes('Normal thyroid'), 'new patient did not reset to normal report');
});

// ------------------------------------------------------------- runner --

function assert(cond, msg) { if (!cond) throw new Error(msg); }

(async () => {
  const { chromium } = resolvePlaywright();
  const browser = await launch(chromium);
  const page = await browser.newPage({ viewport: { width: 1500, height: 950 } });
  const pageErrors = [];
  page.on('pageerror', e => pageErrors.push(e.message));
  const indexPath = path.resolve(__dirname, '..', 'index.html');
  await page.goto('file://' + indexPath, { waitUntil: 'load' });
  await page.waitForTimeout(300);

  let pass = 0, fail = 0;
  for (const t of tests) {
    // fresh state per test
    await page.evaluate(() => {
      localStorage.clear();
      state = JSON.parse(JSON.stringify(defaultState));
      renderAll();
    });
    try {
      await t.fn(page);
      console.log('  ✓ ' + t.name);
      pass++;
    } catch (e) {
      console.log('  ✗ ' + t.name);
      console.log('      ' + e.message);
      fail++;
    }
  }
  if (pageErrors.length) {
    console.log('\nPage errors during run:');
    pageErrors.forEach(e => console.log('  ' + e));
    fail++;
  }
  console.log(`\n${pass} passed, ${fail} failed`);
  await browser.close();
  process.exit(fail ? 1 : 0);
})();
