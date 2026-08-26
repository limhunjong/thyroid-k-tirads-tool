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
const fs = require('fs');
const zlib = require('zlib');

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


// Minimal zip reader for asserting on what the page produced.
function unzip(buf) {
  let eocd = -1;
  for (let i = buf.length - 22; i >= 0; i--) if (buf.readUInt32LE(i) === 0x06054b50) { eocd = i; break; }
  if (eocd < 0) throw new Error('output is not a zip');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  const out = {};
  for (let i = 0; i < count; i++) {
    if (buf.readUInt32LE(p) !== 0x02014b50) throw new Error('bad central directory at entry ' + i);
    const method = buf.readUInt16LE(p + 10);
    const crc = buf.readUInt32LE(p + 16);
    const compSize = buf.readUInt32LE(p + 20);
    const nameLen = buf.readUInt16LE(p + 28);
    const extraLen = buf.readUInt16LE(p + 30);
    const cmtLen = buf.readUInt16LE(p + 32);
    const local = buf.readUInt32LE(p + 42);
    const name = buf.slice(p + 46, p + 46 + nameLen).toString('utf8');
    const dataStart = local + 30 + buf.readUInt16LE(local + 26) + buf.readUInt16LE(local + 28);
    const raw = buf.slice(dataStart, dataStart + compSize);
    const data = method === 8 ? zlib.inflateRawSync(raw) : raw;
    if (zlib.crc32 && zlib.crc32(data) !== crc) throw new Error('crc mismatch for ' + name);
    out[name] = data;
    p += 46 + nameLen + extraLen + cmtLen;
  }
  return out;
}

// ---------------------------------------------------------------- tests --

test('untouched study is NOT normal: placeholders shown and validation blocks', async page => {
  const r = await page.evaluate(() => ({ txt: buildReportText(), errs: validateReport() }));
  assert(!r.txt.includes('Normal thyroid'), 'unconfirmed empty study must not read as normal');
  assert(r.txt.includes('[Not assessed'), 'missing not-assessed placeholder');
  assert(r.errs.some(e => e.includes('Normal parenchyma')), 'missing parenchyma validation error');
  assert(r.errs.some(e => e.includes('No thyroid nodule')), 'missing nodule validation error');
  assert(r.errs.some(e => e.includes('No abnormal lymph node')), 'missing LN validation error');
});

test('explicitly confirmed empty study reports normal wording and passes validation', async page => {
  const r = await page.evaluate(() => {
    state.confirmNormalParenchyma = true;
    state.confirmNoNodule = true;
    state.confirmNormalLymph = true;
    return { txt: buildReportText(), errs: validateReport() };
  });
  assert(r.txt.includes('Normal thyroid'), 'missing "Normal thyroid" after confirmation');
  assert(r.txt.includes('No abnormal cervical lymph node') || r.txt.includes('Normal cervical lymph node'),
    'missing normal LN wording after confirmation');
  assert(r.errs.length === 0, 'confirmed study should pass validation: ' + JSON.stringify(r.errs));
});

test('Normal Study button confirms all chips at once, only while study is empty', async page => {
  const r = await page.evaluate(() => {
    const out = {};
    toggleNormalStudy();
    out.allOn = state.confirmNormalParenchyma && state.confirmNoNodule && state.confirmNormalLymph;
    out.reportNormal = buildReportText().includes('Normal thyroid');
    out.btnActive = document.getElementById('normalStudyBtn').classList.contains('active');
    toggleNormalStudy();   // toggles back off
    out.allOff = !state.confirmNormalParenchyma && !state.confirmNoNodule && !state.confirmNormalLymph;
    // with findings the button must be disabled and a no-op
    state.nodules.right.push(defaultNodule());
    saveState();
    out.btnDisabled = document.getElementById('normalStudyBtn').disabled;
    toggleNormalStudy();
    out.stillOff = !state.confirmNormalParenchyma;
    return out;
  });
  assert(r.allOn, 'one click should confirm all three');
  assert(r.reportNormal, 'report should read normal after one-click confirm');
  assert(r.btnActive, 'button should show active state');
  assert(r.allOff, 'second click should unconfirm all three');
  assert(r.btnDisabled, 'button must be disabled once findings exist');
  assert(r.stillOff, 'disabled button must be a no-op');
});

test('entering findings auto-clears and disables the confirmation chip', async page => {
  const r = await page.evaluate(() => {
    state.confirmNoNodule = true;
    state.nodules.right.push(defaultNodule());
    saveState();               // triggers refreshConfirmChips
    renderAll();
    return {
      cleared: state.confirmNoNodule === false,
      disabled: document.getElementById('confirmNoNodule').disabled,
    };
  });
  assert(r.cleared, 'confirm flag should auto-clear when a nodule exists');
  assert(r.disabled, 'chip should be disabled when a nodule exists');
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

test('growth: 2015 ATA rule — >=20% & >=2mm in >=2 diameters, OR >=50% volume', async page => {
  const r = await page.evaluate(() => {
    const n = defaultNodule();
    n.diamUnit = 'mm';
    const at = (ap, t, l, pap, pt, pl) => {
      n.diamAP = ap; n.diamT = t; n.diamL = l;
      n.prevAP = pap; n.prevT = pt; n.prevL = pl;
      return calcSizeChangeInfo(n);
    };
    return {
      // AP +3 (33%), T +2 (25%) -> two diameters qualify
      twoDims: at('12','10','8','9','8','7.5'),
      // only AP qualifies and the volume is well under +50%
      oneDim: at('12','9','7.9','9','9','7.9'),
      // every diameter is up only 15% and 1.5 mm, so the length rule fails,
      // but 1.15^3 puts the volume up ~52%
      volumeOnly: at('11.5','11.5','11.5','10','10','10'),
      // mirror image: shrinkage
      shrink: at('9','8','7.5','12','10','8'),
    };
  });
  assert(r.twoDims.sig === true && r.twoDims.auto === 'Increased',
    'two qualifying diameters must read as growth: ' + JSON.stringify(r.twoDims));
  assert(r.oneDim.sig === false && r.oneDim.auto === 'Stable',
    'one diameter alone is not growth: ' + JSON.stringify(r.oneDim));
  assert(r.volumeOnly.volPct >= 50 && r.volumeOnly.auto === 'Increased',
    'the volume limb must stand on its own: ' + JSON.stringify(r.volumeOnly));
  assert(r.shrink.auto === 'Decreased', 'the mirror rule must call shrinkage: ' + JSON.stringify(r.shrink));
});

test('interval change fills itself in, and a reader\'s own pick is never overwritten', async page => {
  const r = await page.evaluate(() => {
    const n = defaultNodule();
    n.diamUnit = 'mm'; n.sizeChangeFU = true;
    n.prevAP = '9'; n.prevT = '8'; n.prevL = '7.5';
    n.diamAP = '12'; n.diamT = '10'; n.diamL = '8';
    state.nodules.right.push(n);
    updateNodule('right', 0, n);
    const auto = n.sizeChangeType;

    // the reader disagrees
    n.sizeChangeType = 'Stable'; n.sizeChangeManual = true;
    updateNodule('right', 0, n);
    const afterManual = n.sizeChangeType;

    // and the measurement changes again — their call still stands
    n.diamAP = '20';
    updateNodule('right', 0, n);
    const afterRemeasure = n.sizeChangeType;

    // clearing the pick hands control back to the calculation
    n.sizeChangeType = ''; n.sizeChangeManual = false;
    updateNodule('right', 0, n);
    const backToAuto = n.sizeChangeType;

    // an initial study has nothing to compare against
    const m = defaultNodule();
    m.sizeChangeInitial = true; m.diamAP = '12';
    updateNodule('right', 0, m);
    return { auto, afterManual, afterRemeasure, backToAuto, initial: m.sizeChangeType };
  });
  assert(r.auto === 'Increased', 'measurements alone should decide: ' + r.auto);
  assert(r.afterManual === 'Stable', 'a manual pick must survive the next update: ' + r.afterManual);
  assert(r.afterRemeasure === 'Stable', 'remeasuring must not overwrite the reader: ' + r.afterRemeasure);
  assert(r.backToAuto === 'Increased', 'clearing the pick should hand control back: ' + r.backToAuto);
  assert(r.initial === '', 'an initial study has no interval change: ' + r.initial);
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
  assert(r.indet.join(',') === 'hilum,hilarvasc', 'indeterminate features: ' + r.indet);
  assert(r.susp.length === 4, 'suspicious column should list the 4 suspicious-class features');
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

test('current LN biopsy reports procedure only — no pathology result', async page => {
  const txt = await page.evaluate(() => {
    const c = getLN(1);
    c.level_3 = true; c.ldValue = '1.5'; c.biopsy = true; c.fna_3 = true; c.cnb_3 = true;
    setLN(1, c);
    return buildReportText();
  });
  assert(txt.includes('LN FNA: Right lateral (suspicious) level 3'),
    'current FNA line missing: ' + (txt.match(/LN FNA[^\n]*/) || ['(none)'])[0]);
  const fnaLine = (txt.match(/LN FNA[^\n]*/) || [''])[0];
  assert(!fnaLine.includes('—') && !/carcinoma|benign|washout/i.test(fnaLine),
    'current biopsy line must not carry a result: ' + fnaLine);
});

test('previous LN biopsy with date and results appears in the clinical section', async page => {
  const txt = await page.evaluate(() => {
    const c = getLN(1);
    c.prevBiopsies = [{ year:'2024', month:'03', day:'15',
      fna:true, fnaLevels:[3], fnaResult:'Metastatic carcinoma', tgWashout:'850',
      cnb:true, cnbLevels:[3], cnbResult:'Metastatic papillary carcinoma' }];
    setLN(1, c);
    return buildReportText();
  });
  assert(txt.includes('Previous LN FNA (Right lateral level 3) [2024/03/15]: metastatic carcinoma, Tg washout 850 ng/mL.'),
    'prev FNA line missing: ' + (txt.match(/Previous LN FNA[^\n]*/) || ['(none)'])[0]);
  assert(txt.includes('Previous LN CNB (Right lateral level 3) [2024/03/15]: Metastatic papillary carcinoma.'),
    'prev CNB line missing');
  const header = txt.indexOf('Findings:');
  assert(txt.indexOf('Previous LN FNA') < header, 'prev biopsy must appear before Findings');
});

test('a previous LN biopsy alone makes the LN study non-normal', async page => {
  const r = await page.evaluate(() => {
    const c = getLN(0);
    c.prevBiopsies = [{ year:'2023', month:'01', day:'10', fna:true, fnaLevels:[2], fnaResult:'Benign', tgWashout:'', cnb:false, cnbLevels:[], cnbResult:'' }];
    setLN(0, c);
    return isLymphStudyEmpty();
  });
  assert(r === false, 'LN study with prior biopsy history must not count as empty/normal');
});

test('nodule card orders US features before Size Change and Biopsy', async page => {
  const order = await page.evaluate(() => {
    state.nodules.right.push(defaultNodule());
    renderNoduleCol('right');
    const labels = [...document.querySelectorAll('#nodules-right table tbody td.nodule-label-cell, #nodules-right table tbody td')]
      .map(td => td.textContent.trim());
    const find = s => labels.findIndex(l => l.startsWith(s));
    return { orient: find('Orientation'), ete: find('Extrathyroidal'), sc: find('Size Change'), comment: find('Comment') };
  });
  assert(order.orient >= 0 && order.sc >= 0, 'rows not found: ' + JSON.stringify(order));
  assert(order.orient < order.sc, 'Orientation must come before Size Change');
  assert(order.ete < order.sc, 'ETE must come before Size Change');
  assert(order.sc < order.comment, 'Size Change must come before Comment');
});

test('not-gradable warning renders in the card header until graded', async page => {
  const r = await page.evaluate(() => {
    state.nodules.right.push(defaultNodule());
    const n = state.nodules.right[0];
    n.locationUpper = true; n.diamAP = '12';
    renderNoduleCol('right');
    const hdr1 = document.querySelector('#nodules-right table thead').textContent;
    n.composition = 'Solid'; n.echogenicity = 'Marked hypo'; n.calcification_micro = true;
    renderNoduleCol('right');
    const hdr2 = document.querySelector('#nodules-right table thead').textContent;
    return { hdr1, hdr2, errs: (() => { n.composition=''; n.echogenicity=''; return validateReport(); })() };
  });
  assert(r.hdr1.includes('not gradable'), 'missing not-gradable warning: ' + r.hdr1.slice(0, 120));
  assert(r.hdr2.includes('K-TIRADS 5'), 'missing computed grade once gradable: ' + r.hdr2.slice(0, 160));
  assert(r.errs.some(e => e.includes('K-TIRADS not gradable')), 'missing ungradable validation error');
});

test('location detail (posterior/medial) appears in report location text', async page => {
  const txt = await page.evaluate(() => {
    const n = defaultNodule();
    n.locationMiddle = true; n.locationPost = true; n.locationMedial = true;
    return getLocationText(n, 'right');
  });
  assert(txt === 'Middle, posterior medial aspect', 'unexpected location text: ' + txt);
});

test('Duplicate menu copies a nodule to any lobe (location cleared on lobe-type change)', async page => {
  const r = await page.evaluate(() => {
    state.nodules.right.push(defaultNodule());
    const n = state.nodules.right[0];
    n.composition = 'Solid'; n.echogenicity = 'Iso'; n.diamAP = '9';
    n.locationUpper = true; n.diagramX = 50; n.diagramY = 60;
    renderNoduleCol('right');
    [...document.querySelectorAll('#nodules-right .dup-nodule-btn')].find(b => b.textContent.includes('Duplicate')).click();
    const menu = document.getElementById('dup-menu');
    const items = [...menu.querySelectorAll('button')].map(b => b.textContent);
    [...menu.querySelectorAll('button')].find(b => b.textContent.includes('Left')).click();
    const toLeft = state.nodules.left[state.nodules.left.length - 1];
    [...document.querySelectorAll('#nodules-right .dup-nodule-btn')].find(b => b.textContent.includes('Duplicate')).click();
    [...document.getElementById('dup-menu').querySelectorAll('button')]
      .find(b => b.textContent.includes('Isthmus')).click();
    const toIsthmus = state.nodules.isthmus[state.nodules.isthmus.length - 1];
    return { items, leftComp: toLeft.composition, leftLoc: toLeft.locationUpper,
             leftNoDiagram: toLeft.diagramX === undefined,
             isthmusLocCleared: !toIsthmus.locationUpper };
  });
  assert(r.items.length === 3, 'menu should offer all three lobes');
  assert(r.leftComp === 'Solid' && r.leftLoc === true, 'lobe-to-lobe copy keeps fields and location');
  assert(r.leftNoDiagram, 'copy must not carry the diagram marker');
  assert(r.isthmusLocCleared, 'lobe-to-isthmus copy must clear location fields');
});

test('missing required fields highlight live and clear when filled', async page => {
  const r = await page.evaluate(() => {
    state.nodules.right.push(defaultNodule());
    const n = state.nodules.right[0];
    n.composition = 'Solid';        // content, but no location/diameter/echogenicity
    renderNoduleCol('right');
    const before = [...document.querySelectorAll('#nodules-right .req-missing')].map(e => e.textContent.trim());
    n.locationUpper = true; n.diamAP = '12'; n.echogenicity = 'Iso';
    renderNoduleCol('right');
    const after = document.querySelectorAll('#nodules-right .req-missing').length;
    state.nodules.left.push(defaultNodule());
    renderNoduleCol('left');
    const emptyNoise = document.querySelectorAll('#nodules-left .req-missing').length;
    return { before, after, emptyNoise };
  });
  assert(r.before.some(x => x.startsWith('Location')), 'Location should be flagged');
  assert(r.before.some(x => x.startsWith('Diameter')), 'Diameter should be flagged');
  assert(r.before.some(x => x.startsWith('Echogenicity')), 'Echogenicity should be flagged');
  assert(r.after === 0, 'flags should clear once filled');
  assert(r.emptyNoise === 0, 'an untouched nodule must not be flagged');
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

test('below-threshold nodules get a follow-up interval badge and FU suggest chip', async page => {
  const r = await page.evaluate(() => {
    state.nodules.right.push(defaultNodule());
    const n = state.nodules.right[0];
    n.locationUpper = true;
    n.composition = 'Solid'; n.echogenicity = 'Marked hypo'; n.calcification_micro = true; // K5
    n.diamAP = '8'; n.diamUnit = 'mm';
    renderNoduleCol('right');
    const bi = getBiopsyIndication(n, false);
    const chips = [...document.querySelectorAll('#nodules-right .preset-strip')].map(s => s.textContent);
    const fuChip = [...document.querySelectorAll('#nodules-right .preset-chip')].find(b => b.textContent.startsWith('FU'));
    fuChip.click();
    return { badge: bi.text, fu: bi.fu, rec: state.nodules.right[0].recommendation,
             intervals: { k4: getFollowUpInterval('[K-TIRADS 4]'), k3: getFollowUpInterval('[K-TIRADS 3]'), k2: getFollowUpInterval('[K-TIRADS 2]') } };
  });
  assert(r.badge.includes('FU 6–12 months'), 'K5 below-threshold badge missing FU interval: ' + r.badge);
  assert(r.rec === 'Follow-up US in 6–12 months is recommended.', 'FU chip fill wrong: ' + r.rec);
  assert(r.intervals.k4 === '12 months' && r.intervals.k3 === '12–24 months' && r.intervals.k2 === '24 months',
    'interval table wrong: ' + JSON.stringify(r.intervals));
});

test('thyroid lobe volumes: live badges and report size line with totals', async page => {
  const r = await page.evaluate(() => {
    const setIn = (id, v) => { const el = document.getElementById(id); el.value = v; el.dispatchEvent(new Event('input')); };
    // default unit is now mm — pick cm explicitly for this case
    ['sizeRightUnit','sizeLeftUnit'].forEach(id => { const s = document.getElementById(id); s.value = 'cm'; s.dispatchEvent(new Event('change')); });
    setIn('sizeRightAP','4.5'); setIn('sizeRightT','1.5'); setIn('sizeRightL','1.6');
    setIn('sizeLeftAP','4.2'); setIn('sizeLeftT','1.4'); setIn('sizeLeftL','1.5');
    state.confirmNormalParenchyma = true; state.confirmNoNodule = true; state.confirmNormalLymph = true;
    const txt = buildReportText();
    return {
      badge: document.getElementById('volRight').textContent,
      total: document.getElementById('volTotal').textContent,
      line: (txt.split('\n').find(l => l.includes('Thyroid size:')) || '').trim(),
      normalKept: txt.includes('Normal thyroid'),
    };
  });
  assert(r.badge === 'Vol 5.7 mL', 'right lobe badge wrong: ' + r.badge);
  assert(r.total.includes('10.3 mL'), 'total volume wrong: ' + r.total);
  assert(r.line.includes('right lobe 4.5×1.5×1.6 cm (5.7 mL)') && r.line.includes('total 10.3 mL'),
    'report size line wrong: ' + r.line);
  assert(r.normalKept, 'size measurements must not suppress normal wording');
});

test('date combo inputs: keyboard entry, 8-digit smart split, pad and clamp', async page => {
  await page.click('#compYear');
  await page.keyboard.type('20240315');
  const r1 = await page.evaluate(() => ({ y: state.compYear, m: state.compMonth, d: state.compDay }));
  assert(r1.y === '2024' && r1.m === '03' && r1.d === '15',
    '8-digit smart split failed: ' + JSON.stringify(r1));
  const r2 = await page.evaluate(() => {
    const el = document.getElementById('compMonth');
    el.value = '3'; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('blur'));
    const pad = state.compMonth;
    el.value = '44'; el.dispatchEvent(new Event('input')); el.dispatchEvent(new Event('blur'));
    const clamp = state.compMonth;
    const yEl = document.getElementById('compYear');
    yEl.value = 'ab2024'; yEl.dispatchEvent(new Event('input'));
    return { pad, clamp, sanitized: yEl.value };
  });
  assert(r2.pad === '03', 'single digit should pad to 03: ' + r2.pad);
  assert(r2.clamp === '12', 'month over 12 should clamp: ' + r2.clamp);
  assert(r2.sanitized === '2024', 'non-digits should be stripped: ' + r2.sanitized);
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

test('new patient clears everything including confirmations (back to not-assessed)', async page => {
  const r = await page.evaluate(async () => {
    state.nodules.left.push(defaultNodule());
    state.nodules.left[0].composition = 'Solid';
    state.confirmNormalLymph = true;
    await doNewPatient();   // async: archives the study before clearing
    return { txt: buildReportText(), confirms: [state.confirmNormalParenchyma, state.confirmNoNodule, state.confirmNormalLymph] };
  });
  assert(!r.txt.includes('Normal thyroid'), 'new patient must not auto-report normal');
  assert(r.txt.includes('[Not assessed'), 'new patient should return to not-assessed state');
  assert(r.confirms.every(c => !c), 'confirmation chips must reset for a new patient');
});


test('user presets: add/remove persists in localStorage and applies to textarea', async page => {
  const r = await page.evaluate(() => {
    loadPresets();
    const base = getPresets('clinInd').length;
    addPresetItem('clinInd', 'My custom phrase');
    const stored = JSON.parse(localStorage.getItem('thyroidTool_presets_v1')).clinInd.includes('My custom phrase');
    const chips = [...document.querySelectorAll('#strip-clinInd .preset-chip')].map(b => b.textContent);
    removePresetItem('clinInd', getPresets('clinInd').length - 1);
    return { base, afterAdd: chips.includes('My custom phrase'), stored,
             afterRemove: getPresets('clinInd').length === base };
  });
  assert(r.afterAdd, 'new preset chip should render');
  assert(r.stored, 'preset should persist in localStorage');
  assert(r.afterRemove, 'remove should restore original count');
});

test('preset chips toggle on/off: click adds text and highlights, click again removes it', async page => {
  const r = await page.evaluate(() => {
    const ta = document.getElementById('clinIndText');
    ta.value = '';
    renderStaticPresetStrips();
    const chip = [...document.querySelectorAll('#strip-clinInd .preset-chip')]
      .find(b => b.textContent === 'Palpable mass');
    chip.click();
    const afterFirst = { text: ta.value, active: chip.classList.contains('active') };
    chip.click();
    const afterSecond = { text: ta.value, active: chip.classList.contains('active') };
    return { afterFirst, afterSecond };
  });
  assert(r.afterFirst.text === 'Palpable mass', 'first click should insert the phrase: ' + r.afterFirst.text);
  assert(r.afterFirst.active === true, 'chip should be highlighted active after first click');
  assert(r.afterSecond.text === '', 'second click should remove the phrase: ' + r.afterSecond.text);
  assert(r.afterSecond.active === false, 'chip should lose active state after second click');
});

test('preset chip toggle removes only its own text, leaving the rest intact', async page => {
  const r = await page.evaluate(() => {
    const ta = document.getElementById('clinIndText');
    ta.value = '';
    renderStaticPresetStrips();
    const chips = [...document.querySelectorAll('#strip-clinInd .preset-chip')];
    const mass = chips.find(b => b.textContent === 'Palpable mass');
    const screening = chips.find(b => b.textContent === 'Screening');
    mass.click();
    screening.click();
    const afterBoth = ta.value;
    mass.click(); // remove first one
    const afterRemoveFirst = ta.value;
    return { afterBoth, afterRemoveFirst };
  });
  assert(r.afterBoth === 'Palpable mass, Screening', 'both phrases should be joined: ' + r.afterBoth);
  assert(r.afterRemoveFirst === 'Screening', 'removing the first phrase should leave the second intact: ' + r.afterRemoveFirst);
});

test('extrathyroidal chips insert an editable report sentence, caret on first blank, appended per line', async page => {
  const r = await page.evaluate(() => {
    switchTab('extra');
    const ta = document.getElementById('extraLesion');
    ta.value = '';
    renderStaticPresetStrips();
    const labels = [...document.querySelectorAll('#strip-extra .preset-chip')].map(b => b.textContent);
    const para = [...document.querySelectorAll('#strip-extra .preset-chip')].find(b => b.textContent === 'Parathyroid lesion');
    para.click();
    const afterFirst = { value: ta.value, caret: ta.selectionStart };
    const sal = [...document.querySelectorAll('#strip-extra .preset-chip')].find(b => b.textContent === 'Salivary gland lesion');
    sal.click();
    const afterSecond = ta.value;
    // second click on the (still verbatim) parathyroid chip removes it
    [...document.querySelectorAll('#strip-extra .preset-chip')].find(b => b.textContent === 'Parathyroid lesion').click();
    const afterToggleOff = ta.value;
    switchTab('thyroid');
    return { labels, afterFirst, afterSecond, afterToggleOff, state: state.extraLesion };
  });
  assert(r.labels.includes('Parathyroid lesion') && !r.labels.some(l => l.includes('feeding')),
    'chips should show short labels, not the full sentence: ' + JSON.stringify(r.labels));
  assert(/suspected parathyroid lesion\.$/.test(r.afterFirst.value), 'full sentence should be inserted: ' + r.afterFirst.value);
  assert(r.afterFirst.caret === 6, 'caret should sit in the first blank (after "About "): ' + r.afterFirst.caret);
  assert(r.afterSecond.split('\n').length === 2, 'second chip should append on a new line: ' + JSON.stringify(r.afterSecond));
  assert(!/parathyroid/.test(r.afterToggleOff) && /salivary/.test(r.afterToggleOff),
    'clicking the parathyroid chip again should remove only its sentence: ' + JSON.stringify(r.afterToggleOff));
  assert(r.state === r.afterToggleOff, 'state.extraLesion should stay in sync');
});

test('validation errors carry jump anchors and render as clickable items', async page => {
  const r = await page.evaluate(() => {
    const errs = validateReportDetailed();
    renderErrorList(errs);
    const items = document.querySelectorAll('#errorContent .err-jump').length;
    jumpToError(errs[0]);
    return { n: errs.length, allAnchored: errs.every(e => e.tab && e.anchor), items };
  });
  assert(r.n >= 3, 'expected the three not-assessed errors');
  assert(r.allAnchored, 'every error needs tab + anchor');
  assert(r.items === r.n, 'error list items should be clickable divs');
});

test('LN neck diagram toggles levels per selected class', async page => {
  const r = await page.evaluate(() => {
    switchTab('lymph'); renderLymphTable();
    const boxes = document.querySelectorAll('#ln-diagram .lnd-box').length;
    const press = () => {
      document.querySelector('#ln-diagram .lnd-box').dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      document.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    };
    lnDiagClass = 'indet'; renderLnDiagram();
    press();
    const indetOn = getLN(0).level_1 === true;
    lnDiagClass = 'susp'; renderLnDiagram();
    press();
    const suspOn = getLN(1).level_1 === true;
    lnDiagClass = 'indet';
    switchTab('thyroid');
    return { boxes, indetOn, suspOn };
  });
  assert(r.boxes === 14, 'expected 14 level boxes (5+2+2+5): ' + r.boxes);
  assert(r.indetOn && r.suspOn, 'clicks should toggle the level in the selected class column');
});

test('nodule card collapses to header summary and expands back', async page => {
  const r = await page.evaluate(() => {
    state.nodules.right.push(defaultNodule());
    renderNoduleCol('right');
    const find = txt => [...document.querySelectorAll('#nodules-right .dup-nodule-btn')].find(b => b.textContent.includes(txt));
    find('Collapse').click();
    const collapsed = !document.querySelector('#nodules-right table tbody');
    find('Expand').click();
    const expanded = !!document.querySelector('#nodules-right table tbody');
    return { collapsed, expanded };
  });
  assert(r.collapsed, 'collapse should remove the body');
  assert(r.expanded, 'expand should restore the body');
});

test('report dialog is editable plain text', async page => {
  const attr = await page.$eval('#reportContent', el => el.getAttribute('contenteditable'));
  assert(attr === 'plaintext-only', 'report dialog should be contenteditable plaintext-only');
});


test('saved session survives a page reload (init must not overwrite storage before load)', async page => {
  await page.evaluate(() => {
    state.clinHistory = 'SURVIVE-ME';
    state.nodules.right.push(defaultNodule());
    state.nodules.right[0].composition = 'Solid';
    saveState();
  });
  await page.reload({ waitUntil: 'load' });
  await page.waitForTimeout(400);
  const r = await page.evaluate(() => ({
    hist: state.clinHistory,
    nods: state.nodules.right.length,
    stored: JSON.parse(localStorage.getItem('thyroidTool_v5')).clinHistory,
  }));
  assert(r.hist === 'SURVIVE-ME' && r.stored === 'SURVIVE-ME', 'state lost on reload: ' + JSON.stringify(r));
  assert(r.nods === 1, 'nodule lost on reload');
});


test('KeyTips: Alt shows badges, Alt+combo runs actions, context-aware', async page => {
  await page.keyboard.down('Alt');
  await page.waitForTimeout(120);
  const badges = await page.evaluate(() => [...document.querySelectorAll('.keytip')].map(b => b.textContent));
  await page.keyboard.up('Alt');
  await page.waitForTimeout(80);
  const sticky = await page.evaluate(() => !!document.getElementById('keytips'));
  assert(badges.includes('Alt+R') && badges.includes('Alt+M'), 'badges missing: ' + badges);
  // while the study is untouched the per-section gates are hidden, so their
  // shortcuts are hidden with them — Alt+M (Normal Study) is the one control
  assert(!badges.includes('Alt+P'), 'a hidden gate must not advertise a shortcut: ' + badges);
  assert(sticky, 'pure Alt tap must keep badges (sticky mode)');
  await page.keyboard.press('Escape');
  await page.waitForTimeout(60);
  const gone = await page.evaluate(() => !document.getElementById('keytips'));
  assert(gone, 'Escape must dismiss sticky badges');

  // a finding brings the gates back, shortcuts included
  await page.evaluate(() => { state.nodules.right.push(defaultNodule()); saveState(); renderAll(); });
  await page.keyboard.down('Alt');
  await page.waitForTimeout(120);
  const badges2 = await page.evaluate(() => [...document.querySelectorAll('.keytip')].map(b => b.textContent));
  await page.keyboard.up('Alt');
  await page.keyboard.press('Escape');
  assert(badges2.includes('Alt+P'), 'Alt+P must come back once a finding exists: ' + badges2);

  await page.keyboard.press('Alt+Digit2');
  await page.waitForTimeout(100);
  const tab = await page.evaluate(() => state.activeTab);
  assert(tab === 'lymph', 'Alt+2 should switch to lymph: ' + tab);
  await page.keyboard.press('Alt+KeyL');
  await page.waitForTimeout(80);
  const lnConfirm = await page.evaluate(() => state.confirmNormalLymph === true);
  assert(lnConfirm, 'Alt+L should toggle the LN confirm chip');
  await page.keyboard.press('Alt+Digit1');
  await page.waitForTimeout(80);
});

test('exam date defaults to today and refills after resets', async page => {
  const r = await page.evaluate(() => {
    defaultExamDateToToday();
    const n = new Date();
    const today = state.examYear === String(n.getFullYear()) &&
                  state.examMonth === String(n.getMonth() + 1).padStart(2, '0') &&
                  state.examDay === String(n.getDate()).padStart(2, '0');
    resetThyroid();
    const afterReset = state.examYear !== '' && state.examMonth !== '';
    return { today, afterReset };
  });
  assert(r.today, 'exam date should default to today');
  assert(r.afterReset, 'exam date should refill after Reset Thyroid');
});


test('LN column highlight lights the hovered column across both tables', async page => {
  const r = await page.evaluate(() => {
    switchTab('lymph'); renderLymphTable();
    const rows = [...document.getElementById('lnTableBody').rows].filter(r => r.cells.length > 2);
    const nl = rows.find(r => r.cells[0].textContent.trim() === 'Neck Level');
    nl.cells[3].dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    const hi = {
      main: document.querySelectorAll('#lnTable td.col-hi').length,
      bx: document.querySelectorAll('#lnBiopsyTable td.col-hi').length,
      th: document.querySelectorAll('#lnTable thead th.col-hi').length,
    };
    document.getElementById('lnTable').dispatchEvent(new MouseEvent('mouseleave'));
    const cleared = document.querySelectorAll('.col-hi').length === 0;
    switchTab('thyroid');
    return { ...hi, cleared };
  });
  assert(r.main > 0 && r.bx > 0, 'both tables should highlight the column: ' + JSON.stringify(r));
  assert(r.th === 1, 'class header should highlight');
  assert(r.cleared, 'highlight should clear on mouseleave');
});


test('hotkey trap fixed: Esc closes a dialog even with an input focused; Alt+M works after', async page => {
  await page.click('#clinHistory');
  await page.keyboard.press('Alt+KeyA');
  await page.waitForTimeout(100);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(80);
  const closed = await page.evaluate(() => !document.getElementById('confirmDialog').classList.contains('show'));
  assert(closed, 'Escape must close the dialog while an input is focused');
  // Alt+M (Normal Study) is the shortcut that applies to an untouched study;
  // the per-section gates are hidden until a finding exists.
  await page.keyboard.press('Alt+KeyM');
  await page.waitForTimeout(100);
  const p = await page.evaluate(() => state.confirmNormalParenchyma);
  assert(p === true, 'Alt+M must work after the dialog is dismissed');
  await page.keyboard.press('Alt+KeyM');
  await page.waitForTimeout(60);
});


test('research coding: Min.Cystic grades as solid; spongiform 3-state; echo N/A hidden from report', async page => {
  const r = await page.evaluate(() => {
    const n = defaultNodule();
    n.composition = 'Min.Cystic'; n.echogenicity = 'Mild hypo'; n.calcification_micro = true;
    const k5 = getKTIRADS(n, false);
    n.calcification_micro = false; n.composition = 'P.Solid'; n.echogenicity = 'Iso';
    n.spongiform = '\u226590%'; const k2 = getKTIRADS(n, false);
    n.spongiform = '50\u201390%'; const partial = getKTIRADS(n, false);
    state.nodules.right.push(defaultNodule());
    const m = state.nodules.right[0];
    m.locationUpper = true; m.diamAP = '12'; m.composition = 'Cystic'; m.echogenicity = 'N/A (cyst/calcified)';
    const txt = buildReportText();
    return { k5, k2, partial, cystGrade: getKTIRADS(m, false), leaked: txt.includes('N/A (cyst/calcified)') };
  });
  assert(r.k5.includes('5'), 'Min.Cystic + hypo + PEF must grade K-TIRADS 5: ' + r.k5);
  assert(r.k2.includes('2'), 'spongiform >=90% must grade K-TIRADS 2: ' + r.k2);
  assert(!r.partial.includes('2'), 'spongiform 50-90% must NOT grade K-TIRADS 2: ' + r.partial);
  assert(r.cystGrade.includes('2'), 'cystic + N/A echo should still grade K-2');
  assert(!r.leaked, 'N/A echogenicity label must not appear in the report');
});

test('patient demographics and coded risk factors persist; None is exclusive; none leak into report', async page => {
  const r = await page.evaluate(() => {
    state.patientName = '\ud64d\uae38\ub3d9'; state.patientAge = '58'; state.patientSex = 'F';
    state.risk.fhx = true; state.risk.fhxCount = '2'; state.risk.pet = true;
    renderRiskFactorRow();
    // click None -> everything else clears
    const chips = [...document.querySelectorAll('#riskFactorRow .inline-check-label')];
    chips.find(l => l.textContent.trim() === 'None').querySelector('input').click();
    const cleared = !state.risk.fhx && !state.risk.pet && state.risk.none && state.risk.fhxCount === '';
    state.confirmNormalParenchyma = true; state.confirmNoNodule = true; state.confirmNormalLymph = true;
    const txt = buildReportText();
    return { cleared, leaked: /\ud64d\uae38\ub3d9|PET uptake|FHx/.test(txt) };
  });
  assert(r.cleared, 'None must clear all other risk factors');
  assert(!r.leaked, 'patient name / risk factors must not appear in the report');
});

test('nodule research fields and OP record persist and never appear in the report', async page => {
  const r = await page.evaluate(() => {
    state.nodules.right.push(defaultNodule());
    const n = state.nodules.right[0];
    n.locationUpper = true; n.diamAP = '14'; n.composition = 'Solid'; n.echogenicity = 'Iso';
    n.rs = { halo2: true, mvi: '2', mviPattern: '3', satellite: true, trabecular: true };
    n.opDone = true; n.opWhoDx = 'Papillary thyroid carcinoma'; n.opFinalCat = '3'; n.opReport = 'full path text';
    n.prevBiopsies = [{ year:'2024', month:'01', day:'10', fna:true, fnaPathDx:'VI (Malignant)', fnaReport:'FNA full text', cnb:false, cnbPathDx:'', cnbReport:'' }];
    saveState();
    const reloaded = JSON.parse(localStorage.getItem('thyroidTool_v5')).nodules.right[0];
    const txt = buildReportText();
    return {
      rsKept: reloaded.rs && reloaded.rs.mvi === '2' && reloaded.rs.satellite === true,
      opKept: reloaded.opDone && reloaded.opWhoDx === 'Papillary thyroid carcinoma' && reloaded.opFinalCat === '3',
      bxRepKept: reloaded.prevBiopsies[0].fnaReport === 'FNA full text',
      leaked: /Papillary thyroid carcinoma|full path text|FNA full text|satellite|spoke wheel/i.test(txt),
    };
  });
  assert(r.rsKept, 'research fields must persist through save/load');
  assert(r.opKept, 'OP record must persist');
  assert(r.bxRepKept, 'prev-biopsy full path report must persist');
  assert(!r.leaked, 'research/OP/path-report data must never leak into the report');
});


test('research CSV: 58 columns, coded values, oldest-first FNA slots, CSV escaping', async page => {
  const r = await page.evaluate(() => {
    state.examYear='2025'; state.examMonth='11'; state.examDay='01';
    state.patientId='4321'; state.patientName='홍길동'; state.patientAge='28'; state.patientSex='M';
    state.risk.fhx = true; state.risk.fhxCount = '2';
    state.nodules.right.push(defaultNodule());
    const n = state.nodules.right[0];
    Object.assign(n, {
      locationUpper: true, diamAP:'23', diamT:'18', diamL:'15', diamUnit:'mm',
      composition:'Solid', echogenicity:'Mild hypo', margin:'Smooth', orientation:'Parallel',
      calcification_micro: true, vascularity_peri: true, vascularity_mild: true,
      rs: { mixedEcho:'Iso/hyper', pef1:true, pef2:true, ct3:true, halo2:true, mvi:'3', mviPattern:'2', satellite:true },
      opDone:true, opYear:'2026', opMonth:'02', opDay:'03', opWhoDx:'PTC', opFinalCat:'3', opReport:'op path',
    });
    n.prevBiopsies = [
      { year:'2025', month:'11', day:'01', fna:true, fnaPathDx:'II (Benign)', fnaReport:'benign', cnb:false, cnbPathDx:'', cnbReport:'' },
      { year:'2024', month:'03', day:'15', fna:true, fnaPathDx:'VI (Malignant)', fnaReport:'has "quote", and\nnewline', cnb:false, cnbPathDx:'', cnbReport:'' },
    ];
    state.nodules.isthmus.push(defaultNodule());
    state.nodules.isthmus[0].composition = 'Cystic';
    const rows = buildResearchRows();
    return { headerLen: RESEARCH_HEADERS.length, lens: rows.map(x => x.length), r0: rows[0], r1: rows[1],
             line0: csvLine(rows[0]) };
  });
  assert(r.headerLen === 58, 'header must have 58 columns: ' + r.headerLen);
  assert(r.lens.every(l => l === 58), 'every row must have 58 cells: ' + r.lens);
  const g = (col) => { // A=0 ... BF=57
    let n = 0; for (const ch of col) n = n * 26 + (ch.charCodeAt(0) - 64);
    return r.r0[n - 1];
  };
  assert(g('A') === '20251101', 'exam date: ' + g('A'));
  assert(g('F') === '0', 'male must code 0: ' + g('F'));
  assert(g('G') === 'R1', 'site number: ' + g('G'));
  assert(g('H') === '23', 'size in mm: ' + g('H'));
  assert(g('I') === '1(2명)', 'risk code with family count: ' + g('I'));
  assert(g('K') === '1' && g('M') === '2' && g('N') === '3', 'composition/echo/mixed codes');
  assert(g('Q') === '12', 'PEF multi-code: ' + g('Q'));
  assert(g('U') === '2', 'halo >=50% -> 2: ' + g('U'));
  assert(g('W') === '12', 'CDUS multi-code: ' + g('W'));
  assert(g('AF') === '1', 'satellite flag: ' + g('AF'));
  assert(g('AI') === '20240315' && g('AJ') === '6', 'FNA1 must be the oldest: ' + g('AI') + '/' + g('AJ'));
  assert(g('AM') === '20251101' && g('AN') === '2', 'FNA2 must be the newer one');
  assert(g('BC') === '20260203' && g('BF') === '3', 'OP date/category');
  assert(r.r1[6] === 'IS1', 'isthmus site label: ' + r.r1[6]);
  assert(r.line0.includes('"has ""quote"", and'), 'CSV must escape quotes: ' + r.line0.slice(0, 60));
});

test('research CSV: New Patient appends rows to the connected folder without repeating the header', async page => {
  const r = await page.evaluate(async () => {
    let fileText = '';
    const fakeFile = { get size() { return new TextEncoder().encode(fileText).length; }, text: async () => fileText };
    const fakeHandle = {
      name: 'MockFolder',
      queryPermission: async () => 'granted',
      requestPermission: async () => 'granted',
      getFileHandle: async () => ({
        getFile: async () => fakeFile,
        createWritable: async () => ({
          write: async (op) => {
            const enc = new TextEncoder();
            const cur = enc.encode(fileText), add = enc.encode(op.data);
            const merged = new Uint8Array(Math.max(cur.length, op.position) + add.length);
            merged.set(cur, 0); merged.set(add, op.position);
            fileText = new TextDecoder('utf-8', { ignoreBOM: true }).decode(merged);
          },
          close: async () => {},
        }),
      }),
    };
    const origIdbGet = window.idbGet;
    window.idbGet = async (k) => (k === 'researchDir' ? fakeHandle : null);

    state.patientId = 'P001'; state.patientName = 'A';
    state.nodules.right.push(defaultNodule());
    await doNewPatient();
    const afterFirst = fileText.trim().split('\r\n').length;
    const hadBom = fileText.charCodeAt(0) === 0xFEFF;

    state.patientId = 'P002'; state.patientName = 'B';
    state.nodules.right.push(defaultNodule());
    state.nodules.left.push(defaultNodule());
    await doNewPatient();
    const lines = fileText.trim().split('\r\n');

    const lenBefore = fileText.length;
    await doNewPatient();               // empty form must not write
    const emptyWrote = fileText.length !== lenBefore;

    window.idbGet = origIdbGet;
    return { afterFirst, hadBom, total: lines.length,
             headers: lines.filter(l => l.includes('US EXAM DATE')).length,
             ids: lines.slice(1).map(l => l.split(',')[2]),
             emptyWrote, logged: researchLogCount() };
  });
  assert(r.hadBom, 'file must start with a UTF-8 BOM so Excel reads Korean correctly');
  assert(r.afterFirst === 2, 'first save: header + 1 row, got ' + r.afterFirst);
  assert(r.total === 4, 'second save appends 2 more rows, got ' + r.total);
  assert(r.headers === 1, 'header must be written exactly once, got ' + r.headers);
  assert(r.ids.join(',') === 'P001,P002,P002', 'row order/ids wrong: ' + r.ids);
  assert(!r.emptyWrote, 'an empty form must not append a row');
  assert(r.logged === 3, 'localStorage backup must mirror the rows: ' + r.logged);
});

// ---- prior report import (ver1.53) ----

const PRIOR_SAMPLE = [
  'CLINICAL INFORMATION:',
  '1. 2022-05-13 Lt Thyroid lobectomy, isthmectomy and Rt tumorectomy',
  '   Cellular adenomatoid nodule, Lt. 5.5cm, Rt. 2.2cm, isthmus. 2.9cm',
  '',
  'COMPARISON: 2025-02-18 USG',
  '',
  'FINDINGS:',
  '1. s/p Left thyroidectomy and isthmectomy.',
  '- No remarkable finding in the op. bed.',
  '2. Right thyroid gland.',
  '- R1: mid, 1.7x1.2x2.5 -> 1.5x1.6x2.4 -> 2.3x1.6x3.1 -> 1.93x1.30x2.69 cm (slightly decreased in size), predominantly cystic nodule with intracystic echogenic foci (comet tail artifact), low suspicion (K-TIRADS Category 3), probably benign.',
  '- R2: lower, 1.59x1.12x1.60 cm, predominantly solid nodule without suspicious feature, low suspicion (K-TIRADS Category 3)',
  '- Several benign looking cysts and nodules, less than 1.0 cm.',
  '3. No abnormal lymph node in the both neck.',
  '- No significant lymph node enlargement.',
  '- No suspicious lymph node.',
].join('\n');

test('prior report: sample parses into two right nodules with previous sizes in mm', async page => {
  const r = await page.evaluate(sample => {
    const p = parsePriorReport(sample);
    applyPriorReport(p, { axisOrder: 'LTA' });
    const [n1, n2] = state.nodules.right;
    return {
      parsedCount: p.nodules.length,
      labels: p.nodules.map(n => n.label),
      comp: [state.compYear, state.compMonth, state.compDay, state.compType, state.compNoPrior],
      right: state.nodules.right.length,
      leftIsth: state.nodules.left.length + state.nodules.isthmus.length,
      n1: n1 && { L: n1.prevL, T: n1.prevT, AP: n1.prevAP, comp: n1.composition,
                  comet: n1.cometTailArtifact, mid: n1.locationMiddle, fu: n1.sizeChangeFU },
      n2: n2 && { L: n2.prevL, T: n2.prevT, AP: n2.prevAP, comp: n2.composition, low: n2.locationLower },
      history: p.nodules[0].history.length,
    };
  }, PRIOR_SAMPLE);
  assert(r.parsedCount === 2, 'expected 2 nodules, got ' + r.parsedCount);
  assert(r.labels.join(',') === 'R1,R2', 'labels wrong: ' + r.labels);
  assert(r.right === 2 && r.leftIsth === 0, 'nodules landed in the wrong lobe');
  assert(r.comp.join('|') === '2025|02|18|US|false', 'comparison date wrong: ' + r.comp.join('|'));
  // last size of the chain only, cm -> mm, read as L x T x AP
  assert(r.n1.L === '19.3' && r.n1.T === '13' && r.n1.AP === '26.9',
    'R1 previous size wrong: ' + JSON.stringify(r.n1));
  assert(r.history === 3, 'earlier sizes should be kept out of the import: ' + r.history);
  assert(r.n1.comp === 'P.Cystic' && r.n1.comet === 'Yes' && r.n1.mid === true,
    'R1 morphology wrong: ' + JSON.stringify(r.n1));
  assert(r.n1.fu === true, 'imported nodule must be marked as follow-up so Prev size shows');
  assert(r.n2.L === '15.9' && r.n2.T === '11.2' && r.n2.AP === '16',
    'R2 previous size wrong: ' + JSON.stringify(r.n2));
  assert(r.n2.comp === 'P.Solid' && r.n2.low === true, 'R2 morphology wrong: ' + JSON.stringify(r.n2));
});

test('prior report: today\'s diameters stay empty and validation still blocks', async page => {
  const r = await page.evaluate(sample => {
    applyPriorReport(parsePriorReport(sample), { axisOrder: 'LTA' });
    saveState(); renderAll();
    const n = state.nodules.right[0];
    return {
      diam: [n.diamAP, n.diamT, n.diamL, n.maxSize].join('|'),
      sizeChangeType: n.sizeChangeType,
      errs: validateReport(),
      txt: buildReportText(),
    };
  }, PRIOR_SAMPLE);
  assert(r.diam === '|||', "today's diameters must stay empty, got " + r.diam);
  assert(r.sizeChangeType === '', 'interval change is today\'s call, not the old report\'s');
  assert(r.errs.length > 0, 'a nodule without a measured size must still fail validation');
  assert(!r.txt.includes('19.3'), 'the previous size must not be reported as this study\'s size');
});

test('prior report: normal-study confirmations are never set by an import', async page => {
  const r = await page.evaluate(sample => {
    applyPriorReport(parsePriorReport(sample), { axisOrder: 'LTA' });
    saveState(); renderAll();
    return {
      par: state.confirmNormalParenchyma, nod: state.confirmNoNodule, ln: state.confirmNormalLymph,
      normalTxt: buildReportText().includes('No abnormal cervical lymph node'),
    };
  }, PRIOR_SAMPLE);
  assert(!r.par && !r.nod && !r.ln,
    'an old report saying "no abnormal lymph node" must not confirm today\'s study');
  assert(!r.normalTxt, 'imported wording must not produce a normal lymph node report');
});

test('prior report: outside-hospital wording and axis order option', async page => {
  const r = await page.evaluate(() => {
    const txt = [
      'Right lobe',
      '  Rt. mid portion 1.2 x 0.8 x 1.5 cm, solid, markedly hypoechoic, taller than wide,',
      '  spiculated margin with microcalcifications.',
      'Left thyroid gland',
      '  L1 upper, 8.0x6.0x7.0 mm, isoechoic, smooth margin, no microcalcification.',
    ].join('\n');
    const p = parsePriorReport(txt);
    applyPriorReport(p, { axisOrder: 'ATL' });
    const rt = state.nodules.right[0], lt = state.nodules.left[0];
    return {
      counts: [state.nodules.right.length, state.nodules.left.length],
      rt: { AP: rt.prevAP, T: rt.prevT, L: rt.prevL, comp: rt.composition, echo: rt.echogenicity,
            ori: rt.orientation, margin: rt.margin, micro: rt.calcification_micro, mid: rt.locationMiddle },
      lt: { AP: lt.prevAP, T: lt.prevT, L: lt.prevL, echo: lt.echogenicity, margin: lt.margin,
            micro: lt.calcification_micro, up: lt.locationUpper },
    };
  });
  assert(r.counts.join(',') === '1,1', 'one nodule per lobe expected, got ' + r.counts);
  assert(r.rt.AP === '12' && r.rt.T === '8' && r.rt.L === '15',
    'AP x T x L order not honoured: ' + JSON.stringify(r.rt));
  assert(r.rt.comp === 'Solid' && r.rt.echo === 'Marked hypo', 'rt composition/echo: ' + JSON.stringify(r.rt));
  assert(r.rt.ori === 'Nonparallel (taller-than-wide)' && r.rt.margin === 'Irregular (spiculated/microlobulated)',
    'rt orientation/margin: ' + JSON.stringify(r.rt));
  assert(r.rt.micro === true && r.rt.mid === true, 'rt calcification/location: ' + JSON.stringify(r.rt));
  // mm stays mm; "no microcalcification" must not set the flag
  assert(r.lt.AP === '8' && r.lt.T === '6' && r.lt.L === '7', 'mm sizes converted twice: ' + JSON.stringify(r.lt));
  assert(r.lt.echo === 'Iso' && r.lt.margin === 'Smooth' && r.lt.up === true, 'lt fields: ' + JSON.stringify(r.lt));
  assert(r.lt.micro === false, 'negated feature must not be imported: ' + JSON.stringify(r.lt));
});

test('prior report: unrecognised lines are surfaced, not dropped', async page => {
  const r = await page.evaluate(sample => {
    const p = parsePriorReport(sample);
    return { unmapped: p.unmapped, empty: parsePriorReport('').nodules.length };
  }, PRIOR_SAMPLE);
  assert(r.empty === 0, 'empty text must parse to nothing');
  assert(r.unmapped.some(l => /s\/p Left thyroidectomy/.test(l)), 'surgical history line must be surfaced');
  assert(r.unmapped.some(l => /No abnormal lymph node/.test(l)), 'lymph node line must be surfaced');
  assert(!r.unmapped.some(l => /^FINDINGS:?$/i.test(l)), 'pure section headers should not be listed');
});

test('version string is single-sourced: tab title, button and download name agree', async page => {
  const r = await page.evaluate(() => {
    initDownloadBtn();
    return {
      v: APP_VERSION,
      title: document.title,
      btnTitle: document.getElementById('downloadVersionBtn').title,
      // the snapshot files in the repo are Thyroid_KTIRADS_verX.YYYY.html
      filename: 'Thyroid_KTIRADS_' + APP_VERSION + '.html',
    };
  });
  assert(/^ver\d+\.\d{4}$/.test(r.v), 'version must read verX.YYYY, got ' + r.v);
  assert(r.title.endsWith(r.v), 'tab title is on a different version: ' + r.title);
  assert(r.btnTitle.includes(r.v), 'download button tooltip is stale: ' + r.btnTitle);
  assert(r.filename === 'Thyroid_KTIRADS_' + r.v + '.html',
    'download name must match the snapshot file naming: ' + r.filename);
});

test('normal-report gates look like gates: pending is dashed, confirmed is filled', async page => {
  const r = await page.evaluate(() => {
    const ids = ['confirmNormalParenchyma', 'confirmNoNodule', 'confirmNormalLymph'];
    const chips = ids.map(id => document.getElementById(id).parentElement);
    const pending = chips.map(c => getComputedStyle(c).borderTopStyle);
    ids.forEach(id => { state[id] = true; });
    refreshConfirmChips();
    const confirmed = chips.map(c => getComputedStyle(c).borderTopStyle);
    return {
      klass: chips.map(c => c.className),
      pending, confirmed,
      notes: document.querySelectorAll('.confirm-note').length,
      // hidden while Normal Study covers the whole study, back once it does not
      hiddenWhenEmpty: (() => {
        state.nodules.right.length = 0; state.confirmNoNodule = false;
        refreshConfirmChips();
        return [...document.querySelectorAll('.confirm-bar')].every(b => b.classList.contains('is-hidden'));
      })(),
      shownWithFindings: (() => {
        state.nodules.right.push(defaultNodule());
        refreshConfirmChips();
        const shown = [...document.querySelectorAll('.confirm-bar')].every(b => !b.classList.contains('is-hidden'));
        state.nodules.right.length = 0;
        refreshConfirmChips();
        return shown;
      })(),
      // caption stacked above the chip row, in both action bars
      captionAbove: [...document.querySelectorAll('.confirm-bar')].map(bar => {
        const note = bar.querySelector('.confirm-note').getBoundingClientRect();
        const chips = bar.querySelector('.confirm-chips').getBoundingClientRect();
        return note.bottom <= chips.top + 1;
      }),
      // the risk-factor chips share the Quick-chip type scale
      risk: (() => { const l = document.querySelector('.risk-group label'); const s = getComputedStyle(l);
                     return [s.fontSize, s.fontWeight]; })(),
      quick: (() => { const c = document.querySelector('#strip-clinInd .preset-chip'); const s = getComputedStyle(c);
                      return [s.fontSize, s.fontWeight]; })(),
    };
  });
  assert(r.klass.every(c => c.includes('confirm-chip')),
    'the three gates must carry their own class, got ' + JSON.stringify(r.klass));
  assert(r.pending.every(b => b === 'dashed'), 'unconfirmed gate must read as outstanding: ' + r.pending);
  assert(r.confirmed.every(b => b === 'solid'), 'confirmed gate must read as settled: ' + r.confirmed);
  assert(r.notes === 2, 'both action bars need the "required" caption, got ' + r.notes);
  assert(r.hiddenWhenEmpty, 'an untouched study shows only Normal Study, not a second copy of it');
  assert(r.shownWithFindings, 'the gates must come back as soon as a finding exists');
  assert(r.captionAbove.every(Boolean),
    'the caption must sit above its chips, not beside them: ' + JSON.stringify(r.captionAbove));
  assert(r.risk.join() === r.quick.join(),
    'risk chips and quick chips must share a type scale: ' + r.risk + ' vs ' + r.quick);
});

test('risk factor wording spells out what the chip and its count mean', async page => {
  const r = await page.evaluate(() => {
    state.risk.fhx = true;
    renderRiskFactorRow();
    const labels = RISK_FACTORS.map(f => f.label);
    const unit = document.querySelector('#riskFactorRow .fhx-count-unit');
    const input = document.querySelector('#riskFactorRow .fhx-count input');
    return {
      labels,
      unitText: unit ? unit.textContent : null,
      unitVisible: unit ? unit.getBoundingClientRect().width > 0 : false,
      inputTitle: input ? input.title : null,
    };
  });
  assert(r.labels.includes('FHx. thyroid cancer'), 'FHx. needs its period: ' + r.labels);
  assert(r.labels.includes('Neck RT Hx.'), 'Hx. abbreviations must be punctuated alike: ' + r.labels);
  assert(r.labels.includes('Hemithyroidectomy for cancer'),
    'the hemithyroidectomy chip must say why it was done: ' + r.labels);
  assert(!r.labels.some(l => /\(ca\)/.test(l)), 'the opaque "(ca)" wording should be gone: ' + r.labels);
  assert(r.unitText === 'affected relatives' && r.unitVisible,
    'the count needs its unit on screen, not only in a tooltip: ' + r.unitText);
  assert(/thyroid cancer/i.test(r.inputTitle || ''), 'count tooltip should still spell it out: ' + r.inputTitle);
});

test('xlsx append: rows land in the sheet and the rest of the workbook survives', async page => {
  const fixturePath = path.resolve(__dirname, 'fixtures', 'research_fixture.xlsx');
  const before = unzip(fs.readFileSync(fixturePath));
  const b64 = fs.readFileSync(fixturePath).toString('base64');

  const res = await page.evaluate(async (input) => {
    const bin = atob(input);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const out = await xlsxAppend(bytes, [
      ['20260826', '5', '9001', 'Kim', 'R1', 'a & b <c>'],
      ['20260826', '5', '9001', 'Kim', 'R2', ''],
    ]);
    let s = '';
    const chunk = 0x8000;
    for (let i = 0; i < out.bytes.length; i += chunk) s += String.fromCharCode.apply(null, out.bytes.subarray(i, i + chunk));
    return { b64: btoa(s), sheet: out.sheet, addedAt: out.addedAt };
  }, b64);

  const after = unzip(Buffer.from(res.b64, 'base64'));
  assert(res.sheet === 'xl/worksheets/sheet1.xml', 'wrong worksheet resolved: ' + res.sheet);
  assert(res.addedAt === 3, 'rows must start after the last existing row, got ' + res.addedAt);

  // every part of the package is still there, and only the sheet changed
  const names = Object.keys(before).sort();
  assert(Object.keys(after).sort().join('|') === names.join('|'),
    'zip entries lost: ' + Object.keys(after).sort().join(','));
  const changed = names.filter(n => !before[n].equals(after[n]));
  assert(changed.join(',') === 'xl/worksheets/sheet1.xml',
    'only the worksheet may change, but these did: ' + changed.join(','));

  const xml = after['xl/worksheets/sheet1.xml'].toString('utf8');
  assert(xml.includes('<row r="3"') && xml.includes('<row r="4"'), 'appended rows missing');
  assert(/<c r="A3"><v>20260826<\/v><\/c>/.test(xml), 'a numeric value must stay numeric: ' + xml.slice(0, 400));
  assert(/<c r="E3"[^>]*t="inlineStr"><is><t[^>]*>R1</.test(xml), 'text value must be an inline string');
  assert(xml.includes('a &amp; b &lt;c&gt;'), 'XML special characters must be escaped');
  assert(!xml.includes('<c r="F4"'), 'an empty value should not emit a cell');
  assert(xml.includes('dimension ref="A1:F4"'), 'dimension should follow the new last row');

  // the hand-entered cell and the comment the user left are untouched
  assert(xml.includes('kept by hand') || after['xl/sharedStrings.xml'],
    'existing hand-entered data must survive');
  assert(after['xl/comments/comment1.xml'].toString('utf8').includes('20251020'),
    'cell comments must survive the round trip');
});

test('research workbook: rows go into the chosen .xlsx, previous version kept as backup', async page => {
  const fixturePath = path.resolve(__dirname, 'fixtures', 'research_fixture.xlsx');
  const original = fs.readFileSync(fixturePath);

  const out = await page.evaluate(async (input) => {
    const bin = atob(input);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);

    const written = {};
    const makeHandle = (name, initial) => ({
      async getFile() { return new File([initial], name); },
      async createWritable() {
        const chunks = [];
        return {
          async write(d) { chunks.push(d); },
          async close() { written[name] = new Uint8Array(await new Blob(chunks).arrayBuffer()); },
        };
      },
    });
    const dir = {
      name: 'research',
      async queryPermission() { return 'granted'; },
      async requestPermission() { return 'granted'; },
      async *values() {
        yield { kind: 'file', name: 'study.xlsx' };
        yield { kind: 'file', name: '~$study.xlsx' };      // Excel lock file
        yield { kind: 'file', name: 'study_backup.xlsx' }; // ours
        yield { kind: 'directory', name: 'old' };
      },
      async getFileHandle(name, opts) {
        if (name === 'study.xlsx') return makeHandle(name, bytes);
        if (opts && opts.create) return makeHandle(name, new Uint8Array());
        throw new Error('missing ' + name);
      },
    };

    const origIdbGet = window.idbGet;
    window.idbGet = async key => (key === 'researchDir' ? dir : null);
    const listed = await listFolderXlsx(dir);

    const noTarget = await appendResearchRowsXlsx([['20260826', '5', '9001', 'Kim', 'R1', 'x']]);
    setXlsxTargetName('study.xlsx');
    const res = await appendResearchRowsXlsx([['20260826', '5', '9001', 'Kim', 'R1', 'x']]);
    const wrongWidth = await appendResearchRowsXlsx([['only', 'two']]);

    window.idbGet = origIdbGet;
    setXlsxTargetName('');

    const b64 = u => {
      let s = ''; const c = 0x8000;
      for (let i = 0; i < u.length; i += c) s += String.fromCharCode.apply(null, u.subarray(i, i + c));
      return btoa(s);
    };
    return {
      listed, noTarget, res, wrongWidth,
      book: b64(written['study.xlsx']),
      backup: written['study_backup.xlsx'] ? b64(written['study_backup.xlsx']) : null,
    };
  }, original.toString('base64'));

  assert(out.listed.join(',') === 'study.xlsx',
    'the picker must skip Excel lock files and our own backups: ' + out.listed);
  assert(out.noTarget.ok === false && out.noTarget.reason === 'no-file',
    'with no workbook chosen the save must fall through to the CSV, got ' + JSON.stringify(out.noTarget));
  assert(out.res.ok && out.res.file === 'study.xlsx' && out.res.at === 3,
    'append result wrong: ' + JSON.stringify(out.res));
  assert(out.wrongWidth.ok === false && /header columns/.test(out.wrongWidth.reason),
    'a row of the wrong width must be refused, not poured into the sheet: ' + JSON.stringify(out.wrongWidth));

  const book = unzip(Buffer.from(out.book, 'base64'));
  const xml = book['xl/worksheets/sheet1.xml'].toString('utf8');
  assert(xml.includes('<row r="3"'), 'the new row is missing from the saved workbook');
  assert(/<c r="E3"[^>]*t="inlineStr"><is><t[^>]*>R1</.test(xml), 'row values wrong: ' + xml.slice(-500));

  assert(out.backup !== null, 'the previous version must be kept as a backup');
  assert(Buffer.from(out.backup, 'base64').equals(original),
    'the backup must be the file exactly as it was before the write');
});

// The type scale drifted to 20 sizes and 21 radii before ver2.0006 because
// nothing stopped a raw px value from being added. These budgets may shrink
// as the remaining odd values are folded into the scale — never grow.
const RAW_FONT_SIZE_BUDGET = 3;
const RAW_RADIUS_BUDGET = 6;

test('design tokens: sizes and radii come from the scale, raw values only shrink', async () => {
  const html = fs.readFileSync(path.resolve(__dirname, '..', 'index.html'), 'utf8');
  const raw = (prop, tokenPrefix) => {
    const out = [];
    const re = new RegExp(prop + '\\s*:\\s*([^;}"\']+)', 'g');
    let m;
    while ((m = re.exec(html))) {
      const v = m[1].trim().replace(' !important', '');
      if (!v.startsWith('var(' + tokenPrefix)) out.push(v);
    }
    return out;
  };
  const sizes = raw('font-size', '--font-');
  // heights are a per-breakpoint ladder now: --control-min-h and --h-chip
  // (the lookbehind keeps line-height out of it)
  const heights = raw('(?<![\\w-])(?:min-height|height)', '')
    .filter(v => /^\d+(\.\d+)?px$/.test(v));
  const radii = raw('border-radius', '--r-');

  assert(sizes.length <= RAW_FONT_SIZE_BUDGET,
    'a raw font-size was added — use the --font-* scale. Budget ' + RAW_FONT_SIZE_BUDGET +
    ', found ' + sizes.length + ': ' + [...new Set(sizes)].join(', '));
  assert(radii.length <= RAW_RADIUS_BUDGET,
    'a raw border-radius was added — use the --r-* scale. Budget ' + RAW_RADIUS_BUDGET +
    ', found ' + radii.length + ': ' + [...new Set(radii)].join(', '));

  assert(heights.length <= 54,
    'a raw height was added — controls follow --control-min-h, chips --h-chip. Budget 54, found ' +
    heights.length + ': ' + [...new Set(heights)].join(', '));

  assert(!html.includes('--font-base'), '--font-base duplicated --font-xl and is gone; do not bring it back');
  assert(!html.includes('ui-monospace'), 'there is one monospace stack now: var(--font-mono)');

  // the scale itself must stay complete and ordered
  const scale = ['--font-2xs: 11px', '--font-xs: 12px', '--font-sm: 13px', '--font-md: 14px',
                 '--font-lg: 15px', '--font-xl: 16px', '--font-2xl: 17px'];
  scale.forEach(step => assert(html.includes(step), 'missing type scale step: ' + step));
  assert(html.includes('--font-xl: 16px'),
    'inputs must stay 16px or mobile browsers zoom the page on focus');
});

test('chips share one weight: every option label is 600, selected 700', async page => {
  const r = await page.evaluate(() => {
    const nod = defaultNodule();
    nod.rsExpanded = true;
    nod.locationMiddle = true;         // one selected chip to check the 700 step
    state.nodules.right.push(nod);
    saveState();
    renderAll();
    const labels = [...document.querySelectorAll(
      '.radio-group label, .check-group label, .inline-check-label, .confirm-chip, .preset-chip')]
      .filter(el => el.offsetHeight > 0);
    const light = labels
      .filter(el => Number(getComputedStyle(el).fontWeight) < 600)
      .map(el => (el.className || el.parentElement.className) + ':' + el.textContent.trim().slice(0, 18));
    const selected = labels.filter(el => el.querySelector('input:checked'));
    return {
      total: labels.length,
      light,
      selectedWeights: [...new Set(selected.map(el => getComputedStyle(el).fontWeight))],
    };
  });
  assert(r.total > 20, 'expected the nodule card to render its chips, got ' + r.total);
  assert(r.light.length === 0,
    'these chips inherit a lighter weight than the rest: ' + r.light.join(' | '));
  assert(r.selectedWeights.every(w => Number(w) >= 600),
    'a selected chip must not get lighter: ' + r.selectedWeights.join(','));
});

test('prior report: the whole size chain is kept, not just the last measurement', async page => {
  const r = await page.evaluate(sample => {
    applyPriorReport(parsePriorReport(sample), { axisOrder: 'LTA' });
    saveState(); renderAll();
    const n = state.nodules.right[0];
    // today's measurement, so the report prints a full chain
    n.diamAP = '28'; n.diamT = '15'; n.diamL = '21'; n.sizeChangeType = 'Decreased';
    saveState();
    return {
      history: n.sizeHistory,
      prev: [n.prevAP, n.prevT, n.prevL],
      r2history: state.nodules.right[1].sizeHistory,
      line: buildReportText().split('\n').find(l => /R1:/.test(l)) || '',
      persists: (() => {
        renderAll();
        const again = state.nodules.right[0];
        return JSON.stringify(again.sizeHistory);
      })(),
    };
  }, PRIOR_SAMPLE);

  // chain was 1.7x1.2x2.5 -> 1.5x1.6x2.4 -> 2.3x1.6x3.1 -> 1.93x1.30x2.69 cm, read L x T x AP
  assert(r.history.length === 3, 'the three earlier measurements must survive: ' + JSON.stringify(r.history));
  assert(r.history[0].join(',') === '25,12,17', 'oldest entry wrong (stored AP,T,L): ' + r.history[0]);
  assert(r.history[2].join(',') === '31,16,23', 'newest earlier entry wrong: ' + r.history[2]);
  assert(r.prev.join(',') === '26.9,13,19.3', 'the last chain value still belongs in Prev: ' + r.prev);
  assert(r.r2history.length === 0, 'a single-size nodule must not invent history: ' + JSON.stringify(r.r2history));

  assert(/25×12×17 → 24×16×15 → 31×16×23 → 26.9×13×19.3 → 28×15×21 mm/.test(r.line),
    'the report should read as one chain: ' + r.line);
  assert(r.persists === JSON.stringify(r.history), 'history must survive a re-render: ' + r.persists);
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
