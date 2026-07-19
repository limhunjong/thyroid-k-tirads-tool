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

test('K-TIRADS rationale and not-gradable warning render in the card header', async page => {
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
  assert(r.hdr2.includes('solid') && r.hdr2.includes('punctate echogenic foci'),
    'missing rationale: ' + r.hdr2.slice(0, 160));
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
  const r = await page.evaluate(() => {
    state.nodules.left.push(defaultNodule());
    state.nodules.left[0].composition = 'Solid';
    state.confirmNormalLymph = true;
    doNewPatient();
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
