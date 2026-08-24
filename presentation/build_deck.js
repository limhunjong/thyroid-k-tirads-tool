const pptxgen = require('pptxgenjs');
const path = require('path');

const IMG = path.join(__dirname, 'img') + '/';
const pres = new pptxgen();
pres.layout = 'LAYOUT_WIDE';           // 13.3 x 7.5
const W = 13.3, H = 7.5;

// Palette lifted from the tool's own UI — the deck looks like the thing it describes
const INK   = '0F2A43';   // deep navy (dark slides)
const INK2  = '1B3A57';
const BLUE  = '0A84FF';   // the app's accent
const ORNG  = 'FF9F0A';   // the app's warning color
const RED   = 'FF453A';
const GREEN = '30D158';
const BG    = 'FFFFFF';
const SURF  = 'F2F4F7';
const MUTE  = '6B7A8C';

const KR = '맑은 고딕';

const shadow = () => ({ type: 'outer', color: '0F2A43', blur: 14, offset: 3, angle: 90, opacity: 0.13 });

function card(s, x, y, w, h, fill) {
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.1,
    fill: { color: fill || 'FFFFFF' }, line: { color: 'E3E8EE', width: 1 },
    shadow: shadow(),
  });
}

// slide title used on every light content slide
function title(s, txt, sub) {
  s.addText(txt, { x: 0.7, y: 0.42, w: 11.9, h: 0.75, fontFace: KR, fontSize: 33, bold: true, color: INK, margin: 0 });
  if (sub) s.addText(sub, { x: 0.72, y: 1.18, w: 11.9, h: 0.42, fontFace: KR, fontSize: 15, color: MUTE, margin: 0 });
}

// the quote block that carries the "I just said this" story
function quote(s, x, y, w, txt, h) {
  const hh = h || 1.15;
  s.addShape(pres.ShapeType.roundRect, {
    x, y, w, h: hh, rectRadius: 0.08,
    fill: { color: SURF }, line: { color: 'D9E1EA', width: 1 },
  });
  s.addText('나', { x: x + 0.28, y: y + 0.16, w: 0.55, h: 0.32, fontFace: KR, fontSize: 11,
    bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0,
    fill: { color: BLUE }, shape: pres.ShapeType.roundRect, rectRadius: 0.06 });
  s.addText(txt, { x: x + 0.95, y: y + 0.12, w: w - 1.25, h: hh - 0.24, fontFace: KR,
    fontSize: 15, color: INK, italic: true, valign: 'middle', margin: 0 });
}

function verBadge(s, x, y, txt, color) {
  s.addText(txt, { x, y, w: 1.25, h: 0.34, fontFace: 'Arial', fontSize: 12, bold: true,
    color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0,
    fill: { color: color || MUTE }, shape: pres.ShapeType.roundRect, rectRadius: 0.06 });
}

function sectionSlide(n, kicker, big, note) {
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addText(kicker, { x: 1.0, y: 2.35, w: 11, h: 0.45, fontFace: KR, fontSize: 17, color: BLUE, bold: true, margin: 0 });
  s.addText(big, { x: 1.0, y: 2.85, w: 11.3, h: 1.7, fontFace: KR, fontSize: 44, bold: true, color: 'FFFFFF', margin: 0 });
  s.addText(n, { x: 11.4, y: 0.5, w: 1.2, h: 0.5, fontFace: 'Arial', fontSize: 15, color: '5C7A99', align: 'right', margin: 0 });
  if (note) s.addNotes(note);
  return s;
}

/* ───────────────────────── 1. Title ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addText('말로 만든 임상 도구', {
    x: 0.9, y: 1.85, w: 11.5, h: 1.25, fontFace: KR, fontSize: 50, bold: true, color: 'FFFFFF', margin: 0 });
  s.addText('AI와 2개월, 110번을 고쳐 만든 갑상선 초음파 판독 도구', {
    x: 0.95, y: 3.15, w: 11.5, h: 0.6, fontFace: KR, fontSize: 20, color: 'A8C4DE', margin: 0 });

  const stats = [['110', '커밋'], ['99', '버전'], ['44', '자동 테스트'], ['1', '개의 파일']];
  stats.forEach((st, i) => {
    const x = 0.95 + i * 2.5;
    s.addText(st[0], { x, y: 4.35, w: 2.2, h: 0.75, fontFace: 'Arial', fontSize: 40, bold: true, color: BLUE, margin: 0 });
    s.addText(st[1], { x: x + 0.04, y: 5.08, w: 2.2, h: 0.4, fontFace: KR, fontSize: 13, color: '8FA9C2', margin: 0 });
  });

  s.addText('임훈종  ·  영상의학과  ·  분당서울대학교병원', {
    x: 0.95, y: 6.35, w: 11.5, h: 0.45, fontFace: KR, fontSize: 14, color: '7E9AB5', margin: 0 });
  s.addNotes('인사 + 한 줄 요약. "코드를 직접 타이핑한 적은 거의 없습니다. 대부분 말로 시켰습니다." (0:00–0:40)');
}

/* ───────────────────────── 2. 결과부터 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '먼저 결과물부터 보시겠습니다', '실제로 진료에 쓰려고 만든 갑상선 초음파 판독 도구입니다');
  s.addShape(pres.ShapeType.roundRect, { x: 0.7, y: 1.72, w: 11.9, h: 5.1, rectRadius: 0.1,
    fill: { color: SURF }, line: { color: 'E3E8EE', width: 1 }, shadow: shadow() });
  s.addImage({ path: IMG + 'v152_final.png', x: 0.85, y: 1.86, w: 11.6, h: 4.82,
    sizing: { type: 'contain', w: 11.6, h: 4.82 } });
  s.addNotes('완성 화면. 소견을 클릭하면 K-TIRADS 등급이 자동 계산되고 판독문이 실시간으로 만들어진다. 이걸 어떻게 만들었는지가 오늘 이야기. (0:40–1:40)');
}

/* ───────────────────────── 3. 왜 만들었나 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '시작은 불편함이었습니다', '거창한 계획이 아니라, 매일 반복되던 세 가지');
  const items = [
    ['01', '같은 문장을 매번 다시 친다', '"solid, hypoechoic, ..." 판독문 문장을\n환자마다 처음부터 타이핑', BLUE],
    ['02', '가이드라인을 눈으로 대조한다', 'K-TIRADS 등급과 생검 기준(크기)을\n매번 표와 맞춰 확인', ORNG],
    ['03', '연구 데이터를 또 입력한다', '판독이 끝나면 같은 내용을\n엑셀에 한 번 더 옮겨 적음', RED],
  ];
  items.forEach((it, i) => {
    const x = 0.7 + i * 4.05;
    card(s, x, 1.95, 3.75, 4.35);
    s.addText(it[0], { x: x + 0.35, y: 2.25, w: 1.2, h: 0.6, fontFace: 'Arial', fontSize: 30, bold: true, color: it[3], margin: 0 });
    s.addText(it[1], { x: x + 0.35, y: 3.0, w: 3.05, h: 0.95, fontFace: KR, fontSize: 17, bold: true, color: INK, margin: 0 });
    s.addText(it[2], { x: x + 0.35, y: 4.0, w: 3.05, h: 1.6, fontFace: KR, fontSize: 13, color: MUTE, margin: 0, lineSpacingMultiple: 1.3 });
  });
  s.addNotes('공감 유도 구간. 청중 대부분이 겪는 일이므로 짧게, 고개 끄덕이게만. (1:40–2:30)');
}

/* ───────────────────────── 4. 첫 결과물 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '첫 요청은 한 문장이었습니다', '그리고 이게 그 결과로 나온 첫 화면입니다');
  s.addImage({ path: IMG + 'v01_first.png', x: 0.7, y: 1.95, w: 8.0, h: 4.6,
    sizing: { type: 'contain', w: 8.0, h: 4.6 } });
  verBadge(s, 0.7, 6.65, 'ver 0.1', MUTE);

  card(s, 9.05, 1.95, 3.55, 4.6, SURF);
  s.addText('여기서 중요한 것', { x: 9.4, y: 2.25, w: 2.9, h: 0.4, fontFace: KR, fontSize: 13, bold: true, color: BLUE, margin: 0 });
  s.addText('완벽하지 않았습니다.\n하지만 "일단 돌아가는 것"이\n처음부터 나왔습니다.', {
    x: 9.4, y: 2.75, w: 2.9, h: 1.7, fontFace: KR, fontSize: 16, bold: true, color: INK, margin: 0, lineSpacingMultiple: 1.35 });
  s.addText('완성품을 한 번에 만드는 게 아니라,\n돌아가는 것을 먼저 만들고\n거기서부터 고쳐 나갑니다.', {
    x: 9.4, y: 4.6, w: 2.9, h: 1.7, fontFace: KR, fontSize: 13, color: MUTE, margin: 0, lineSpacingMultiple: 1.35 });
  s.addNotes('"목적이 있으면 일단 만들어진다"는 첫 번째 메시지. 화면이 이미 꽤 그럴듯하다는 점을 짚어줄 것. (2:30–3:30)');
}

/* ───────────────────────── 5. 설계 선택 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '"병원에서 설치 없이 쓰고 싶다"', '이 한마디에서 나온 설계 — 제가 정한 게 아니라 AI가 제안했습니다');
  const items = [
    ['설치가 필요 없습니다', '파일을 더블클릭하면 브라우저에서 바로 열립니다. 병원 PC에 프로그램을 깔 필요가 없습니다.', BLUE],
    ['인터넷이 필요 없습니다', '외부 서버와 통신하지 않습니다. 인터넷이 끊겨도 그대로 작동합니다.', GREEN],
    ['환자 정보가 나가지 않습니다', '입력한 내용은 그 PC 안에만 남습니다. 어디로도 전송되지 않습니다.', ORNG],
  ];
  items.forEach((it, i) => {
    const y = 1.95 + i * 1.62;
    card(s, 0.7, y, 11.9, 1.42);
    s.addShape(pres.ShapeType.roundRect, { x: 1.05, y: y + 0.34, w: 0.72, h: 0.72, rectRadius: 0.36, fill: { color: it[2] }, line: { color: it[2], width: 0 } });
    s.addText(String(i + 1), { x: 1.05, y: y + 0.34, w: 0.72, h: 0.72, fontFace: 'Arial', fontSize: 20, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0 });
    s.addText(it[0], { x: 2.05, y: y + 0.28, w: 9.9, h: 0.44, fontFace: KR, fontSize: 18, bold: true, color: INK, margin: 0 });
    s.addText(it[1], { x: 2.05, y: y + 0.76, w: 10.2, h: 0.46, fontFace: KR, fontSize: 13.5, color: MUTE, margin: 0 });
  });
  s.addText('→ 결과적으로 HTML 파일 한 개. 이메일로 보내면 그대로 실행됩니다.', {
    x: 0.75, y: 6.85, w: 11.9, h: 0.4, fontFace: KR, fontSize: 14, bold: true, color: BLUE, margin: 0 });
  s.addNotes('"뭘로 만들지"를 내가 몰라도 된다는 점이 핵심. 조건(병원, 설치 불가, 환자정보)만 말하면 방법은 AI가 고른다. (3:30–4:30)');
}

/* ───────────────────────── 6. 섹션 ───────────────────────── */
sectionSlide('PART 2',
  '여기서부터가 진짜입니다',
  '만드는 것보다\n고치는 과정이 90%였습니다',
  '전환 슬라이드. "한 번에 되는 일은 없었다"는 걸 강조하고 다음으로. (4:30–4:50)');

/* ───────────────────────── 7. 패턴 1 — 스크린샷 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '패턴 1 — 말로 안 되면 화면을 찍어 보냅니다', '"어디가 어떻게 이상한지" 설명하려 애쓰지 않았습니다');
  quote(s, 0.7, 1.9, 11.9, '이 표에서 좌우 구분이 잘 안 되는 것 같아. 입력할 때 헷갈려.  (+ 화면 캡처 첨부)');

  s.addText('BEFORE', { x: 0.7, y: 3.3, w: 5.6, h: 0.35, fontFace: 'Arial', fontSize: 12, bold: true, color: MUTE, margin: 0 });
  s.addImage({ path: IMG + 'p_col_before.png', x: 0.7, y: 3.68, w: 5.7, h: 1.85, sizing: { type: 'contain', w: 5.7, h: 1.85 } });
  s.addText('AFTER', { x: 6.9, y: 3.3, w: 5.6, h: 0.35, fontFace: 'Arial', fontSize: 12, bold: true, color: BLUE, margin: 0 });
  s.addImage({ path: IMG + 'p_col_after.png', x: 6.9, y: 3.68, w: 5.7, h: 1.85, sizing: { type: 'contain', w: 5.7, h: 1.85 } });

  s.addText('색 배지로 구분 · 그룹 사이 굵은 경계선 · 입력 중인 열 전체를 밝게 표시', {
    x: 0.75, y: 5.75, w: 11.9, h: 0.4, fontFace: KR, fontSize: 13.5, color: INK, margin: 0 });
  s.addText('스크린샷 한 장이 설명 열 문장보다 정확했습니다.', {
    x: 0.75, y: 6.35, w: 11.9, h: 0.45, fontFace: KR, fontSize: 16, bold: true, color: BLUE, margin: 0 });
  s.addNotes('스크린샷을 붙여넣는 것만으로 문제가 전달된다. 비개발자에게 가장 실용적인 팁. (4:50–5:50)');
}

/* ───────────────────────── 8. 패턴 2 — 근본 원인 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '패턴 2 — 같은 문제가 반복되면 "왜"를 묻습니다', '증상만 고치면 계속 되돌아옵니다');

  quote(s, 0.7, 1.9, 11.9, '글자가 위아래로 잘려. 왜 자꾸 이런 문제가 반복되지? 내가 4번 정도 언급한 것 같은데', 1.15);

  card(s, 0.7, 3.35, 5.75, 2.5, 'FFF4E5');
  s.addText('그 전까지', { x: 1.05, y: 3.6, w: 5.0, h: 0.4, fontFace: KR, fontSize: 13, bold: true, color: ORNG, margin: 0 });
  s.addText('"여기 잘려요" → 그 부분만 수정\n다음 화면에서 또 잘림 → 또 수정\n네 번 반복', {
    x: 1.05, y: 4.05, w: 5.05, h: 1.6, fontFace: KR, fontSize: 14.5, color: INK, margin: 0, lineSpacingMultiple: 1.45 });

  card(s, 6.85, 3.35, 5.75, 2.5, 'E8F6EC');
  s.addText('"왜 반복되냐"고 묻고 나서', { x: 7.2, y: 3.6, w: 5.0, h: 0.4, fontFace: KR, fontSize: 13, bold: true, color: '1B8B3A', margin: 0 });
  s.addText('원인은 한 곳이었습니다.\n글자 높이를 강제로 눌러버리는\n설정 한 줄 → 지우니 전부 해결', {
    x: 7.2, y: 4.05, w: 5.05, h: 1.6, fontFace: KR, fontSize: 14.5, color: INK, margin: 0, lineSpacingMultiple: 1.45 });

  s.addText('두 번 같은 일이 생기면, 고치라고 하지 말고 "왜 반복되는지"를 먼저 물어보세요.', {
    x: 0.75, y: 6.25, w: 11.9, h: 0.5, fontFace: KR, fontSize: 16, bold: true, color: BLUE, margin: 0 });
  s.addNotes('AI도 사람처럼 눈앞의 증상부터 고친다. 사용자가 "반복된다"고 알려주면 근본 원인을 찾는다. (5:50–6:50)');
}

/* ───────────────────────── 9. 패턴 3 — 롤백 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '패턴 3 — 마음에 안 들면 통째로 되돌립니다', '실험이 실패해도 잃는 게 없습니다');

  const steps = [
    ['ver 0.90', '기존 상태', MUTE],
    ['ver 0.95', '새 기능 시도', BLUE],
    ['ver 1.01', '점점 복잡해짐', ORNG],
    ['ver 0.90', '통째로 되돌림', GREEN],
  ];
  steps.forEach((st, i) => {
    const x = 0.7 + i * 3.15;
    card(s, x, 2.5, 2.75, 1.75);
    s.addText(st[0], { x: x + 0.2, y: 2.78, w: 2.35, h: 0.42, fontFace: 'Arial', fontSize: 16, bold: true, color: st[2], margin: 0, align: 'center' });
    s.addText(st[1], { x: x + 0.2, y: 3.3, w: 2.35, h: 0.6, fontFace: KR, fontSize: 13, color: MUTE, margin: 0, align: 'center' });
    if (i < 3) s.addText('→', { x: x + 2.78, y: 3.05, w: 0.35, h: 0.5, fontFace: 'Arial', fontSize: 20, color: 'B8C4D0', align: 'center', margin: 0 });
  });

  quote(s, 0.7, 4.6, 11.9, '그냥 version 0.90으로 롤백해줘');

  s.addText('되돌릴 수 있다는 걸 알면, 과감하게 시도해볼 수 있습니다. 모든 버전이 남아 있습니다.', {
    x: 0.75, y: 6.1, w: 11.9, h: 0.5, fontFace: KR, fontSize: 16, bold: true, color: BLUE, margin: 0 });
  s.addText('실제로 이 도구는 99개 버전이 전부 보관되어 있고, 어느 시점으로든 돌아갈 수 있습니다.', {
    x: 0.75, y: 6.6, w: 11.9, h: 0.4, fontFace: KR, fontSize: 13, color: MUTE, margin: 0 });
  s.addNotes('"망치면 어떡하지"가 가장 큰 진입장벽인데, 되돌리기가 자유롭다는 점을 반드시 알려줄 것. (6:50–7:40)');
}

/* ───────────────────────── 10. 패턴 4 — 버리기 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '패턴 4 — 만들어 놓은 것도 버립니다', '기능을 늘리다 보니 도구가 무거워졌습니다');

  s.addText('BEFORE — 탭 6개', { x: 0.7, y: 1.95, w: 11.9, h: 0.35, fontFace: KR, fontSize: 12.5, bold: true, color: MUTE, margin: 0 });
  s.addImage({ path: IMG + 'p_tabs_before.png', x: 0.7, y: 2.35, w: 11.9, h: 0.55, sizing: { type: 'contain', w: 11.9, h: 0.55 } });

  quote(s, 0.7, 3.15, 11.9, '너무 복잡하게 가지 않을래. 세 가지만 남기고 나머지는 삭제해줘. 먼저 완성도를 높일래');

  s.addText('AFTER — 탭 3개', { x: 0.7, y: 4.55, w: 11.9, h: 0.35, fontFace: KR, fontSize: 12.5, bold: true, color: BLUE, margin: 0 });
  s.addImage({ path: IMG + 'p_tabs_after.png', x: 0.7, y: 4.95, w: 11.9, h: 0.55, sizing: { type: 'contain', w: 11.9, h: 0.55 } });

  card(s, 0.7, 5.75, 11.9, 1.1, SURF);
  s.addText('코드 2,300줄이 한 번에 삭제됐습니다.', { x: 1.05, y: 5.98, w: 11.2, h: 0.42, fontFace: KR, fontSize: 16, bold: true, color: INK, margin: 0 });
  s.addText('아깝지 않았습니다. 만드는 데 든 시간보다, 안 쓰는 기능이 계속 걸리적거리는 비용이 더 컸습니다.', { x: 1.05, y: 6.4, w: 11.2, h: 0.4, fontFace: KR, fontSize: 13, color: MUTE, margin: 0 });
  s.addNotes('사람이 직접 짰다면 아까워서 못 버렸을 것. AI가 만든 것은 버리기 쉽고, 필요하면 다시 만들면 된다. (7:40–8:40)');
}

/* ───────────────────────── 11. 패턴 5 — 도메인 지식 (핵심) ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '패턴 5 — AI가 절대 못 잡아내는 것', '이 슬라이드가 오늘 발표에서 가장 중요합니다');

  quote(s, 0.7, 1.85, 11.9, '아무것도 입력 안 하면 정상 판독문이 나가잖아. 실수로 누락한 걸 정상으로 오인할 여지가 있어', 1.1);

  s.addText('BEFORE — 빈 화면에서 생성한 판독문', { x: 0.7, y: 3.2, w: 5.7, h: 0.35, fontFace: KR, fontSize: 12.5, bold: true, color: RED, margin: 0 });
  s.addImage({ path: IMG + 'p_safety_before.png', x: 0.7, y: 3.6, w: 5.7, h: 2.7, sizing: { type: 'contain', w: 5.7, h: 2.7 } });

  s.addText('AFTER — 같은 상황', { x: 6.9, y: 3.2, w: 5.7, h: 0.35, fontFace: KR, fontSize: 12.5, bold: true, color: GREEN, margin: 0 });
  s.addImage({ path: IMG + 'p_safety_after.png', x: 6.9, y: 3.6, w: 5.7, h: 2.7, sizing: { type: 'contain', w: 5.7, h: 2.7 } });

  s.addText('"정상"과 "확인하지 않음"은 다릅니다 — 이건 의사만 알 수 있습니다.', {
    x: 0.75, y: 6.5, w: 11.9, h: 0.5, fontFace: KR, fontSize: 17, bold: true, color: BLUE, margin: 0 });
  s.addNotes('★ 핵심 슬라이드. 천천히. AI는 코드를 잘 짜지만 "이 동작이 임상적으로 위험한가"는 판단하지 못한다. 도메인 전문가가 방향을 잡아야 하는 이유. (8:40–10:10)');
}

/* ───────────────────────── 12. 패턴 6 — AI가 반대할 때 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '패턴 6 — AI가 그냥 따르지 않을 때도 있습니다', '시키는 대로만 하는 도구가 아니었습니다');

  quote(s, 0.7, 1.95, 11.9, '아무것도 입력 안 하면 어차피 정상인데, 이 버튼 굳이 있을 필요가 있을까?');

  card(s, 0.7, 3.4, 11.9, 2.15, SURF);
  s.addText('AI의 답', { x: 1.05, y: 3.65, w: 2.0, h: 0.35, fontFace: KR, fontSize: 12, bold: true, color: MUTE, margin: 0 });
  s.addText('"삭제하기 전에 확인해봤더니, 그 버튼은 실제로 하는 일이 있습니다.\n켜면 판독문에 \'Normal thyroid\'가 명시되고, 아래 입력이 잠깁니다.\n안 켜면 그 문구가 안 들어갑니다. — 유지를 권합니다."', {
    x: 1.05, y: 4.05, w: 11.2, h: 1.35, fontFace: KR, fontSize: 15, color: INK, margin: 0, lineSpacingMultiple: 1.4 });

  s.addText('결과적으로 제가 몰랐던 동작을 알게 됐고, 그 다음에 "그래도 없애자"고 결정했습니다.', {
    x: 0.75, y: 5.85, w: 11.9, h: 0.45, fontFace: KR, fontSize: 15, color: INK, margin: 0 });
  s.addText('근거를 들어 반대해주는 편이, 무조건 따르는 것보다 안전합니다.', {
    x: 0.75, y: 6.4, w: 11.9, h: 0.45, fontFace: KR, fontSize: 16, bold: true, color: BLUE, margin: 0 });
  s.addNotes('결정권은 끝까지 사람에게 있다. 다만 결정 전에 근거를 받을 수 있다는 점이 중요. (10:10–11:00)');
}

/* ───────────────────────── 13. 패턴 7 — 검사 시키기 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '패턴 7 — 스스로 검사하라고 시킵니다', '제가 발견하지 못한 문제를 찾아냈습니다');

  quote(s, 0.7, 1.95, 11.9, '다른 버그 있는지 자세히 확인해줘');

  const found = [
    ['치명적', '새로고침하면 입력한 내용이 전부 사라짐', '판독 도중 새로고침 한 번이면 처음부터 다시 입력해야 하는 상태였습니다.', RED],
    ['보통', '접어둔 결절을 클릭하면 내용이 안 보임', '', ORNG],
    ['보통', '복사한 결절이 접힌 채로 생성됨', '', ORNG],
    ['사소', '알림 창의 되돌리기 버튼이 사라짐', '', MUTE],
  ];
  let y = 3.4;
  found.forEach((f) => {
    const h = f[2] ? 1.15 : 0.62;
    card(s, 0.7, y, 11.9, h, f[3] === RED ? 'FFF0EF' : 'FFFFFF');
    s.addText(f[0], { x: 1.0, y: y + 0.15, w: 0.95, h: 0.32, fontFace: KR, fontSize: 10.5, bold: true,
      color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0,
      fill: { color: f[3] }, shape: pres.ShapeType.roundRect, rectRadius: 0.05 });
    s.addText(f[1], { x: 2.15, y: y + 0.12, w: 10.1, h: 0.4, fontFace: KR, fontSize: 15, bold: f[3] === RED, color: INK, margin: 0 });
    if (f[2]) s.addText(f[2], { x: 2.15, y: y + 0.56, w: 10.1, h: 0.45, fontFace: KR, fontSize: 13, color: MUTE, margin: 0 });
    y += h + 0.16;
  });

  s.addText('"고쳐줘"만 하지 말고, 가끔 "문제 없는지 봐줘"라고 시켜보세요.', {
    x: 0.75, y: 6.72, w: 11.9, h: 0.45, fontFace: KR, fontSize: 16, bold: true, color: BLUE, margin: 0 });
  s.addNotes('사용자가 모르는 버그가 쌓인다. 주기적으로 감사를 시키는 것이 실제로 효과가 있었다. (11:00–12:00)');
}

/* ───────────────────────── 14. 패턴 8 — 자료 던지기 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '패턴 8 — 가지고 있는 자료를 그냥 던집니다', '연구용 엑셀 양식을 첨부하고 한 문장만 덧붙였습니다');

  quote(s, 0.7, 1.9, 7.4, '이런 데이터셋이 형성되게끔 하고 싶어  (+ 연구용 엑셀 파일 첨부)', 1.25);

  card(s, 0.7, 3.4, 7.4, 3.3, SURF);
  s.addText('AI가 스스로 한 일', { x: 1.05, y: 3.62, w: 6.7, h: 0.38, fontFace: KR, fontSize: 12.5, bold: true, color: BLUE, margin: 0 });
  const did = [
    '엑셀 58개 열의 의미와 코딩 규칙을 읽어냄',
    '숨어 있던 셀 메모(1=Solid, 2=…)까지 해석',
    '기존 입력 항목과 대조해 빠진 항목을 찾아냄',
    '부족한 입력칸을 새로 만들고 코드 번호로 변환',
    '환자를 넘길 때 결절 1개당 1행씩 자동 저장',
  ];
  did.forEach((d, i) => {
    s.addText('·', { x: 1.05, y: 4.08 + i * 0.5, w: 0.2, h: 0.4, fontFace: 'Arial', fontSize: 15, bold: true, color: BLUE, margin: 0 });
    s.addText(d, { x: 1.3, y: 4.08 + i * 0.5, w: 6.55, h: 0.42, fontFace: KR, fontSize: 13.5, color: INK, margin: 0 });
  });

  s.addText('새로 생긴 입력 항목', { x: 8.55, y: 1.9, w: 4.1, h: 0.35, fontFace: KR, fontSize: 12.5, bold: true, color: MUTE, margin: 0 });
  s.addImage({ path: IMG + 'p_research.png', x: 8.55, y: 2.3, w: 4.05, h: 4.4, sizing: { type: 'contain', w: 4.05, h: 4.4 } });

  s.addText('양식을 설명하지 않았습니다. 파일만 줬습니다.', {
    x: 0.75, y: 6.85, w: 7.4, h: 0.42, fontFace: KR, fontSize: 15, bold: true, color: BLUE, margin: 0 });
  s.addNotes('가진 자료(엑셀, 논문, 사진)를 그냥 첨부하면 된다. 정리해서 설명할 필요가 없다는 점이 놀라운 부분. (12:00–13:10)');
}

/* ───────────────────────── 15. 숫자 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addText('2개월 동안 일어난 일', { x: 0.8, y: 0.75, w: 11.7, h: 0.8, fontFace: KR, fontSize: 33, bold: true, color: 'FFFFFF', margin: 0 });
  s.addText('2026년 6월 6일 → 8월 7일', { x: 0.82, y: 1.55, w: 11.7, h: 0.42, fontFace: KR, fontSize: 15, color: '8FA9C2', margin: 0 });

  const nums = [
    ['110', '번의 수정', '기능 추가, 버그 수정, 디자인 변경'],
    ['99', '개의 버전', '전부 보관 — 언제든 되돌리기 가능'],
    ['44', '개의 자동 검사', '고칠 때마다 자동으로 전체 재검증'],
    ['7,968', '줄의 코드', '제가 직접 타이핑한 것은 거의 없음'],
  ];
  nums.forEach((n, i) => {
    const x = 0.8 + (i % 2) * 6.1;
    const y = 2.4 + Math.floor(i / 2) * 2.25;
    s.addShape(pres.ShapeType.roundRect, { x, y, w: 5.6, h: 1.95, rectRadius: 0.1, fill: { color: INK2 }, line: { color: '2C4E70', width: 1 } });
    s.addText(n[0], { x: x + 0.45, y: y + 0.28, w: 2.6, h: 0.9, fontFace: 'Arial', fontSize: 42, bold: true, color: BLUE, margin: 0 });
    s.addText(n[1], { x: x + 0.5, y: y + 1.15, w: 2.6, h: 0.42, fontFace: KR, fontSize: 15, bold: true, color: 'FFFFFF', margin: 0 });
    s.addText(n[2], { x: x + 3.05, y: y + 0.55, w: 2.35, h: 1.0, fontFace: KR, fontSize: 11.5, color: '8FA9C2', margin: 0, lineSpacingMultiple: 1.3 });
  });
  s.addNotes('숫자로 규모를 보여주되, "이걸 다 제가 짠 게 아니다"를 강조. (13:10–14:00)');
}

/* ───────────────────────── 16. 자동 테스트 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '고치면 다른 데가 망가지는 문제', '수정이 쌓이면서 생긴 가장 큰 골칫거리였습니다');

  card(s, 0.7, 2.0, 5.75, 2.1, 'FFF4E5');
  s.addText('문제', { x: 1.05, y: 2.25, w: 5.0, h: 0.38, fontFace: KR, fontSize: 13, bold: true, color: ORNG, margin: 0 });
  s.addText('A를 고쳤더니 B가 깨짐.\nB를 고쳤더니 C가 깨짐.\n매번 손으로 다 확인할 수 없음.', {
    x: 1.05, y: 2.68, w: 5.05, h: 1.3, fontFace: KR, fontSize: 14.5, color: INK, margin: 0, lineSpacingMultiple: 1.4 });

  card(s, 6.85, 2.0, 5.75, 2.1, 'E8F6EC');
  s.addText('해결', { x: 7.2, y: 2.25, w: 5.0, h: 0.38, fontFace: KR, fontSize: 13, bold: true, color: '1B8B3A', margin: 0 });
  s.addText('"검사 항목을 만들어 둬"라고 시킴.\n이제 고칠 때마다 44개가\n자동으로 전부 확인됩니다.', {
    x: 7.2, y: 2.68, w: 5.05, h: 1.3, fontFace: KR, fontSize: 14.5, color: INK, margin: 0, lineSpacingMultiple: 1.4 });

  s.addShape(pres.ShapeType.roundRect, { x: 0.7, y: 4.4, w: 11.9, h: 1.85, rectRadius: 0.1, fill: { color: '10231A' }, line: { color: '1E3A2C', width: 1 } });
  s.addText('✓ 빈 화면에서 정상 판독문이 나가지 않는가\n✓ K-TIRADS 등급이 크기·소견에 맞게 계산되는가\n✓ 새로고침해도 입력 내용이 남아 있는가                                          44 passed, 0 failed', {
    x: 1.05, y: 4.65, w: 11.2, h: 1.35, fontFace: 'Courier New', fontSize: 13, color: '5EE08A', margin: 0, lineSpacingMultiple: 1.45 });

  s.addText('사람이 매번 확인할 수 없는 것을, 기계가 매번 확인합니다.', {
    x: 0.75, y: 6.5, w: 11.9, h: 0.45, fontFace: KR, fontSize: 16, bold: true, color: BLUE, margin: 0 });
  s.addNotes('의료 도구라서 특히 중요한 부분. "검사 항목을 만들어달라"는 요청도 말로 하면 된다. (14:00–15:00)');
}

/* ───────────────────────── 17. 최종 기능 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '지금은 이런 일을 합니다', '2개월간의 수정이 쌓인 결과');

  const shots = [
    ['p_diagram.png', '목 부위를 클릭해서 입력', '표를 찾지 않고 그림에서 바로 선택'],
    ['p_keytips.png', 'Alt 키로 단축키 표시', '외울 필요 없이 눌러서 확인'],
  ];
  shots.forEach((sh, i) => {
    const x = 0.7 + i * 6.1;
    card(s, x, 1.95, 5.75, 2.55);
    s.addImage({ path: IMG + sh[0], x: x + 0.18, y: 2.12, w: 5.4, h: 1.55, sizing: { type: 'contain', w: 5.4, h: 1.55 } });
    s.addText(sh[1], { x: x + 0.35, y: 3.75, w: 5.1, h: 0.36, fontFace: KR, fontSize: 14.5, bold: true, color: INK, margin: 0 });
    s.addText(sh[2], { x: x + 0.35, y: 4.11, w: 5.1, h: 0.34, fontFace: KR, fontSize: 12, color: MUTE, margin: 0 });
  });

  const feats = [
    ['K-TIRADS 등급 자동 계산', '소견을 고르면 등급과 악성도가 바로 표시'],
    ['생검 기준 자동 대조', '크기와 등급을 비교해 생검 적응증 판정'],
    ['추적 간격 제안', '역치 미달이면 권장 추적 간격을 제시'],
    ['연구 데이터 자동 저장', '환자를 넘기면 엑셀 파일에 자동 누적'],
  ];
  feats.forEach((f, i) => {
    const x = 0.7 + (i % 2) * 6.1;
    const y = 4.75 + Math.floor(i / 2) * 1.15;
    card(s, x, y, 5.75, 1.0, SURF);
    s.addText(f[0], { x: x + 0.35, y: y + 0.14, w: 5.1, h: 0.36, fontFace: KR, fontSize: 14, bold: true, color: INK, margin: 0 });
    s.addText(f[1], { x: x + 0.35, y: y + 0.52, w: 5.1, h: 0.34, fontFace: KR, fontSize: 11.5, color: MUTE, margin: 0 });
  });
  s.addNotes('기능 나열은 빠르게. 하나하나 설명하지 말고 "이 정도까지 왔다"만. (15:00–16:00)');
}

/* ───────────────────────── 18. 실전 팁 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: BG };
  title(s, '내일 바로 해보실 수 있는 다섯 가지', '');

  const tips = [
    ['화면을 캡처해서 붙여넣으세요', '"어디가 이상한지" 설명하는 것보다 빠르고 정확합니다.'],
    ['같은 문제가 두 번이면 "왜"를 물으세요', '증상만 고치면 계속 되돌아옵니다.'],
    ['과감하게 시도하세요', '마음에 안 들면 통째로 되돌릴 수 있습니다.'],
    ['큰 작업은 계획서를 먼저 받으세요', '"바로 하지 말고 어떻게 할 건지 먼저 알려줘"'],
    ['가끔 "문제 없는지 봐줘"라고 시키세요', '제가 못 본 치명적 버그가 그렇게 발견됐습니다.'],
  ];
  tips.forEach((t, i) => {
    const y = 1.55 + i * 1.11;
    card(s, 0.7, y, 11.9, 0.95);
    s.addShape(pres.ShapeType.roundRect, { x: 1.02, y: y + 0.19, w: 0.58, h: 0.58, rectRadius: 0.29, fill: { color: BLUE }, line: { color: BLUE, width: 0 } });
    s.addText(String(i + 1), { x: 1.02, y: y + 0.19, w: 0.58, h: 0.58, fontFace: 'Arial', fontSize: 16, bold: true, color: 'FFFFFF', align: 'center', valign: 'middle', margin: 0 });
    s.addText(t[0], { x: 1.9, y: y + 0.13, w: 10.4, h: 0.4, fontFace: KR, fontSize: 16, bold: true, color: INK, margin: 0 });
    s.addText(t[1], { x: 1.9, y: y + 0.53, w: 10.4, h: 0.34, fontFace: KR, fontSize: 12.5, color: MUTE, margin: 0 });
  });
  s.addNotes('실행 가능한 조언으로 마무리 준비. 청중이 메모할 시간을 조금 줄 것. (16:00–17:20)');
}

/* ───────────────────────── 19. 한계 + 마무리 ───────────────────────── */
{
  const s = pres.addSlide();
  s.background = { color: INK };
  s.addText('다만, 분명한 한계가 있습니다', { x: 0.8, y: 0.7, w: 11.7, h: 0.8, fontFace: KR, fontSize: 32, bold: true, color: 'FFFFFF', margin: 0 });

  const limits = [
    ['AI는 임상적 타당성을 판단하지 못합니다', '가이드라인 해석, 안전한 동작 설계는 결국 의사가 정해야 했습니다.'],
    ['"돌아간다"와 "믿을 수 있다"는 다릅니다', '치명적 버그는 제가 물어봤을 때 비로소 발견됐습니다.'],
    ['이 도구도 아직 검증 단계입니다', '실제 진료에 쓰기 전에 판독문과 등급 판정을 검증해야 합니다.'],
  ];
  limits.forEach((l, i) => {
    const y = 1.75 + i * 1.32;
    s.addShape(pres.ShapeType.roundRect, { x: 0.8, y, w: 11.7, h: 1.12, rectRadius: 0.09, fill: { color: INK2 }, line: { color: '2C4E70', width: 1 } });
    s.addText(l[0], { x: 1.2, y: y + 0.16, w: 11.0, h: 0.42, fontFace: KR, fontSize: 16.5, bold: true, color: ORNG, margin: 0 });
    s.addText(l[1], { x: 1.2, y: y + 0.6, w: 11.0, h: 0.38, fontFace: KR, fontSize: 13, color: 'A8C4DE', margin: 0 });
  });

  s.addText('그럼에도, 시작하는 데는 아이디어 하나면 충분했습니다.', {
    x: 0.8, y: 5.95, w: 11.7, h: 0.55, fontFace: KR, fontSize: 22, bold: true, color: 'FFFFFF', margin: 0 });
  s.addText('감사합니다.', { x: 0.82, y: 6.6, w: 11.7, h: 0.5, fontFace: KR, fontSize: 16, color: BLUE, margin: 0 });
  s.addNotes('정직하게 한계를 인정하는 것이 신뢰를 준다. 마지막 문장으로 마무리하고 질의응답. (17:20–20:00)');
}

pres.writeFile({ fileName: path.join(__dirname, 'KTIRADS_vibecoding.pptx') })
  .then(f => console.log('WROTE', f));
