# -*- coding: utf-8 -*-
"""Builds the vibe-coding talk deck (20 min, non-developer clinical audience)."""
import os
from pptxlite import Deck

HERE = os.path.dirname(os.path.abspath(__file__))
IMG = os.path.join(HERE, 'img') + os.sep

# Palette lifted from the tool's own UI — the deck looks like the thing it describes
INK, INK2 = '0F2A43', '1B3A57'
BLUE, ORNG, RED, GREEN = '0A84FF', 'FF9F0A', 'FF453A', '30D158'
BG, SURF, MUTE = 'FFFFFF', 'F2F4F7', '6B7A8C'
LINE = 'E3E8EE'
MONO = 'Consolas'

d = Deck()


def card(s, x, y, w, h, fill=BG, shadow=True):
    s.shape('roundRect', x, y, w, h, fill=fill, line=LINE, radius=0.035, shadow=shadow)


def title(s, t, sub=None):
    s.text(t, 0.7, 0.40, 11.9, 0.8, size=31, color=INK, bold=True, margin=0)
    if sub:
        s.text(sub, 0.72, 1.20, 11.9, 0.45, size=14.5, color=MUTE, margin=0)


def quote(s, x, y, w, txt, h=1.15):
    s.shape('roundRect', x, y, w, h, fill=SURF, line='D9E1EA', radius=0.05)
    s.shape('roundRect', x + 0.28, y + (h - 0.34) / 2, 0.5, 0.34, fill=BLUE, radius=0.12,
            text='나', size=10.5, color='FFFFFF', bold=True, align='ctr', valign='middle', margin=0.02)
    s.text(txt, x + 0.95, y + 0.1, w - 1.25, h - 0.2, size=14.5, color=INK,
           italic=True, valign='middle', margin=0, line_spacing=1.3)


def kicker(s, txt, y=6.55, color=BLUE, size=15.5):
    s.text(txt, 0.75, y, 11.9, 0.5, size=size, color=color, bold=True, margin=0)


# ═══════════════ 1. Title ═══════════════
s = d.add_slide(); s.background(INK)
s.text('말로 만든 임상 도구', 0.9, 1.75, 11.5, 1.3, size=48, color='FFFFFF', bold=True, margin=0)
s.text('AI와 2개월, 110번을 고쳐 만든 갑상선 초음파 판독 도구',
       0.95, 3.10, 11.5, 0.6, size=19, color='A8C4DE', margin=0)
for i, (num, lab) in enumerate([('110', '번의 수정'), ('99', '개의 버전'),
                                ('44', '개의 자동 검사'), ('1', '개의 파일')]):
    x = 0.95 + i * 2.6
    s.text(num, x, 4.35, 2.3, 0.8, size=38, color=BLUE, bold=True, margin=0)
    s.text(lab, x + 0.05, 5.12, 2.3, 0.42, size=12.5, color='8FA9C2', margin=0)
s.text('임훈종  ·  영상의학과  ·  분당서울대학교병원',
       0.95, 6.35, 11.5, 0.45, size=13.5, color='7E9AB5', margin=0)
s.note('인사 + 한 줄 요약. "코드를 직접 타이핑한 적은 거의 없습니다. 대부분 말로 시켰습니다."\n(0:00–0:40)')

# ═══════════════ 2. 결과부터 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '먼저 결과물부터 보시겠습니다', '실제 진료에 쓰려고 만든 갑상선 초음파 판독 도구입니다')
s.shape('roundRect', 0.7, 1.72, 11.9, 5.15, fill=SURF, line=LINE, radius=0.03, shadow=True)
s.image(IMG + 'v152_final.png', 0.85, 1.86, 11.6, 4.87)
s.note('완성 화면. 소견을 클릭하면 K-TIRADS 등급이 자동 계산되고 판독문이 실시간으로 만들어진다.\n이걸 어떻게 만들었는지가 오늘 이야기. (0:40–1:40)')

# ═══════════════ 3. 왜 만들었나 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '시작은 불편함이었습니다', '거창한 계획이 아니라, 매일 반복되던 세 가지')
items = [
    ('01', '같은 문장을 매번 다시 친다',
     '"solid, hypoechoic, ..."\n판독문 문장을 환자마다\n처음부터 타이핑', BLUE),
    ('02', '가이드라인을 눈으로 대조',
     'K-TIRADS 등급과\n생검 기준(크기)을\n매번 표와 맞춰 확인', ORNG),
    ('03', '연구 데이터를 또 입력한다',
     '판독이 끝나면 같은 내용을\n엑셀에 한 번 더\n옮겨 적음', RED),
]
for i, (n, h, body, col) in enumerate(items):
    x = 0.7 + i * 4.05
    card(s, x, 1.95, 3.75, 3.10)
    s.text(n, x + 0.38, 2.22, 1.3, 0.62, size=29, color=col, bold=True, margin=0)
    s.text(h, x + 0.38, 2.92, 3.0, 0.6, size=16.5, color=INK, bold=True, margin=0, line_spacing=1.25)
    s.text(body, x + 0.38, 3.62, 3.0, 1.75, size=13, color=MUTE, margin=0, line_spacing=1.4)
s.note('공감 유도 구간. 청중 대부분이 겪는 일이므로 짧게, 고개 끄덕이게만. (1:40–2:30)')

# ═══════════════ 4. 첫 결과물 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '첫 요청은 한 문장이었습니다', '그리고 이게 그 결과로 나온 첫 화면입니다')
s.image(IMG + 'v01_first.png', 0.7, 1.95, 8.0, 4.55)
s.shape('roundRect', 0.7, 6.6, 1.15, 0.36, fill=MUTE, radius=0.12,
        text='ver 0.1', size=11.5, color='FFFFFF', bold=True, align='ctr', valign='middle', margin=0.02)
card(s, 9.05, 1.95, 3.55, 4.55, SURF)
s.text('여기서 중요한 것', 9.4, 2.25, 2.9, 0.4, size=12.5, color=BLUE, bold=True, margin=0)
s.text('완벽하지 않았습니다.\n하지만 "일단 돌아가는 것"이\n처음부터 나왔습니다.',
       9.4, 2.72, 2.9, 1.7, size=15.5, color=INK, bold=True, margin=0, line_spacing=1.35)
s.text('완성품을 한 번에 만드는 게\n아니라, 돌아가는 것을 먼저\n만들고 거기서부터\n고쳐 나갑니다.',
       9.4, 4.55, 2.9, 1.8, size=12.5, color=MUTE, margin=0, line_spacing=1.35)
s.note('"목적이 있으면 일단 만들어진다"는 첫 번째 메시지.\n화면이 이미 꽤 그럴듯하다는 점을 짚어줄 것. (2:30–3:30)')

# ═══════════════ 5. 설계 선택 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '"병원에서 설치 없이 쓰고 싶다"', '이 한마디에서 나온 설계 — 제가 정한 게 아니라 AI가 제안했습니다')
rows = [
    ('설치가 필요 없습니다', '파일을 더블클릭하면 브라우저에서 바로 열립니다. 병원 PC에 프로그램을 깔 필요가 없습니다.', BLUE),
    ('인터넷이 필요 없습니다', '외부 서버와 통신하지 않습니다. 인터넷이 끊겨도 그대로 작동합니다.', GREEN),
    ('환자 정보가 나가지 않습니다', '입력한 내용은 그 PC 안에만 남습니다. 어디로도 전송되지 않습니다.', ORNG),
]
for i, (h, body, col) in enumerate(rows):
    y = 1.95 + i * 1.6
    card(s, 0.7, y, 11.9, 1.4)
    s.shape('ellipse', 1.05, y + 0.34, 0.72, 0.72, fill=col,
            text=str(i + 1), size=19, color='FFFFFF', bold=True, align='ctr', valign='middle', margin=0)
    s.text(h, 2.05, y + 0.26, 9.9, 0.45, size=17.5, color=INK, bold=True, margin=0)
    s.text(body, 2.05, y + 0.76, 10.2, 0.48, size=13, color=MUTE, margin=0)
kicker(s, '→ 결과적으로 HTML 파일 한 개. 이메일로 보내면 그대로 실행됩니다.', y=6.9, size=14)
s.note('"뭘로 만들지"를 내가 몰라도 된다는 점이 핵심.\n조건(병원, 설치 불가, 환자정보)만 말하면 방법은 AI가 고른다. (3:30–4:30)')

# ═══════════════ 6. 섹션 ═══════════════
s = d.add_slide(); s.background(INK)
s.text('PART 2', 1.0, 2.30, 11, 0.45, size=16, color=BLUE, bold=True, margin=0)
s.text('여기서부터가 진짜입니다', 1.0, 2.80, 11.3, 0.9, size=42, color='FFFFFF', bold=True, margin=0)
s.text('만드는 것보다 고치는 과정이 90%였습니다',
       1.0, 3.85, 11.3, 0.7, size=25, color='A8C4DE', margin=0)
s.note('전환 슬라이드. "한 번에 되는 일은 없었다"를 강조하고 넘어간다. (4:30–4:50)')

# ═══════════════ 7. 패턴 1 — 스크린샷 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '패턴 1 — 말로 안 되면 화면을 찍어 보냅니다', '"어디가 어떻게 이상한지" 설명하려 애쓰지 않았습니다')
quote(s, 0.7, 1.85, 11.9, '이 표에서 좌우 구분이 잘 안 되는 것 같아. 입력할 때 헷갈려.   (+ 화면 캡처 첨부)')
s.text('BEFORE', 0.7, 3.22, 5.6, 0.35, size=11.5, color=MUTE, bold=True, margin=0, font=MONO)
s.image(IMG + 'p_col_before.png', 0.7, 3.60, 5.7, 1.585)
s.text('AFTER', 6.9, 3.22, 5.6, 0.35, size=11.5, color=BLUE, bold=True, margin=0, font=MONO)
s.image(IMG + 'p_col_after.png', 6.9, 3.60, 5.7, 1.110)
s.text('색 배지로 구분  ·  그룹 사이 굵은 경계선  ·  입력 중인 열 전체를 밝게 표시',
       0.75, 5.70, 11.9, 0.42, size=13, color=INK, margin=0)
kicker(s, '스크린샷 한 장이 설명 열 문장보다 정확했습니다.', y=6.30)
s.note('스크린샷을 붙여넣는 것만으로 문제가 전달된다. 비개발자에게 가장 실용적인 팁. (4:50–5:50)')

# ═══════════════ 8. 패턴 2 — 근본 원인 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '패턴 2 — 같은 문제가 반복되면 "왜"를 묻습니다', '증상만 고치면 계속 되돌아옵니다')
quote(s, 0.7, 1.90, 11.9,
      '글자가 위아래로 잘려. 왜 자꾸 이런 문제가 반복되지? 내가 4번 정도 언급한 것 같은데')
card(s, 0.7, 3.35, 5.75, 2.55, 'FFF4E5')
s.text('그 전까지', 1.05, 3.60, 5.0, 0.4, size=12.5, color='C77700', bold=True, margin=0)
s.text('"여기 잘려요" → 그 부분만 수정\n다음 화면에서 또 잘림 → 또 수정\n네 번 반복',
       1.05, 4.05, 5.05, 1.7, size=14, color=INK, margin=0, line_spacing=1.5)
card(s, 6.85, 3.35, 5.75, 2.55, 'E8F6EC')
s.text('"왜 반복되냐"고 묻고 나서', 7.2, 3.60, 5.0, 0.4, size=12.5, color='157F33', bold=True, margin=0)
s.text('원인은 한 곳이었습니다.\n글자 높이를 강제로 눌러버리는\n설정 한 줄 → 지우니 전부 해결',
       7.2, 4.05, 5.05, 1.7, size=14, color=INK, margin=0, line_spacing=1.5)
kicker(s, '두 번 같은 일이 생기면, 고치라고 하지 말고 "왜 반복되는지"를 먼저 물어보세요.', y=6.25)
s.note('AI도 사람처럼 눈앞의 증상부터 고친다. 사용자가 "반복된다"고 알려주면 근본 원인을 찾는다.\n(5:50–6:50)')

# ═══════════════ 9. 패턴 3 — 롤백 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '패턴 3 — 마음에 안 들면 통째로 되돌립니다', '실험이 실패해도 잃는 게 없습니다')
steps = [('ver 0.90', '기존 상태', MUTE), ('ver 0.95', '새 기능 시도', BLUE),
         ('ver 1.01', '점점 복잡해짐', ORNG), ('ver 0.90', '통째로 되돌림', GREEN)]
for i, (v, lab, col) in enumerate(steps):
    x = 0.7 + i * 3.15
    card(s, x, 2.45, 2.75, 1.8)
    s.text(v, x + 0.18, 2.75, 2.4, 0.45, size=15.5, color=col, bold=True, align='ctr', margin=0, font=MONO)
    s.text(lab, x + 0.18, 3.30, 2.4, 0.6, size=12.5, color=MUTE, align='ctr', margin=0)
    if i < 3:
        s.text('→', x + 2.78, 3.02, 0.35, 0.5, size=19, color='B8C4D0', align='ctr', margin=0)
quote(s, 0.7, 4.60, 11.9, '그냥 version 0.90으로 롤백해줘')
kicker(s, '되돌릴 수 있다는 걸 알면, 과감하게 시도해볼 수 있습니다.', y=6.10)
s.text('실제로 이 도구는 99개 버전이 전부 보관되어 있고, 어느 시점으로든 돌아갈 수 있습니다.',
       0.75, 6.62, 11.9, 0.42, size=12.5, color=MUTE, margin=0)
s.note('"망치면 어떡하지"가 가장 큰 진입장벽인데, 되돌리기가 자유롭다는 점을 반드시 알려줄 것.\n(6:50–7:40)')

# ═══════════════ 10. 패턴 4 — 버리기 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '패턴 4 — 만들어 놓은 것도 버립니다', '기능을 늘리다 보니 도구가 무거워졌습니다')
s.text('BEFORE — 탭 6개', 0.7, 1.92, 11.9, 0.35, size=12, color=MUTE, bold=True, margin=0, font=MONO)
s.image(IMG + 'p_tabs_before.png', 0.7, 2.32, 11.9, 0.58)
quote(s, 0.7, 3.12, 11.9, '너무 복잡하게 가지 않을래. 세 가지만 남기고 나머지는 삭제해줘. 먼저 완성도를 높일래')
s.text('AFTER — 탭 3개', 0.7, 4.52, 11.9, 0.35, size=12, color=BLUE, bold=True, margin=0, font=MONO)
s.image(IMG + 'p_tabs_after.png', 0.7, 4.92, 11.9, 0.58)
card(s, 0.7, 5.75, 11.9, 1.15, SURF)
s.text('코드 2,300줄이 한 번에 삭제됐습니다.', 1.05, 5.97, 11.2, 0.45, size=15.5, color=INK, bold=True, margin=0)
s.text('아깝지 않았습니다. 만드는 데 든 시간보다, 안 쓰는 기능이 계속 걸리적거리는 비용이 더 컸습니다.',
       1.05, 6.42, 11.2, 0.42, size=12.5, color=MUTE, margin=0)
s.note('사람이 직접 짰다면 아까워서 못 버렸을 것.\nAI가 만든 것은 버리기 쉽고, 필요하면 다시 만들면 된다. (7:40–8:40)')

# ═══════════════ 11. 패턴 5 — 도메인 지식 (핵심) ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '패턴 5 — AI가 절대 못 잡아내는 것', '이 슬라이드가 오늘 발표에서 가장 중요합니다')
quote(s, 0.7, 1.82, 11.9,
      '아무것도 입력 안 하면 정상 판독문이 나가잖아. 실수로 누락한 걸 정상으로 오인할 여지가 있어')
s.text('BEFORE — 빈 화면에서 생성한 판독문', 0.7, 3.15, 5.7, 0.35, size=12, color=RED, bold=True, margin=0)
s.image(IMG + 'p_safety_before.png', 0.7, 3.55, 5.7, 2.75)
s.text('AFTER — 같은 상황', 6.9, 3.15, 5.7, 0.35, size=12, color='157F33', bold=True, margin=0)
s.image(IMG + 'p_safety_after.png', 6.9, 3.55, 5.7, 2.75)
kicker(s, '"정상"과 "확인하지 않음"은 다릅니다 — 이건 의사만 알 수 있습니다.', y=6.50, size=16.5)
s.note('★ 핵심 슬라이드. 천천히.\nAI는 코드를 잘 짜지만 "이 동작이 임상적으로 위험한가"는 판단하지 못한다.\n도메인 전문가가 방향을 잡아야 하는 이유. (8:40–10:10)')

# ═══════════════ 12. 패턴 6 — AI가 반대할 때 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '패턴 6 — AI가 그냥 따르지 않을 때도 있습니다', '시키는 대로만 하는 도구가 아니었습니다')
quote(s, 0.7, 1.95, 11.9, '아무것도 입력 안 하면 어차피 정상인데, 이 버튼 굳이 있을 필요가 있을까?')
card(s, 0.7, 3.40, 11.9, 2.25, SURF)
s.text('AI의 답', 1.05, 3.65, 2.0, 0.36, size=12, color=MUTE, bold=True, margin=0)
s.text('"삭제하기 전에 확인해봤더니, 그 버튼은 실제로 하는 일이 있습니다.\n'
       '켜면 판독문에 \'Normal thyroid\'가 명시되고, 아래 입력이 잠깁니다.\n'
       '안 켜면 그 문구가 안 들어갑니다.  —  유지를 권합니다."',
       1.05, 4.05, 11.2, 1.45, size=14.5, color=INK, margin=0, line_spacing=1.45)
s.text('결과적으로 제가 몰랐던 동작을 알게 됐고, 그 다음에 "그래도 없애자"고 결정했습니다.',
       0.75, 5.85, 11.9, 0.45, size=14.5, color=INK, margin=0)
kicker(s, '근거를 들어 반대해주는 편이, 무조건 따르는 것보다 안전합니다.', y=6.40)
s.note('결정권은 끝까지 사람에게 있다. 다만 결정 전에 근거를 받을 수 있다는 점이 중요. (10:10–11:00)')

# ═══════════════ 13. 패턴 7 — 검사 시키기 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '패턴 7 — 스스로 검사하라고 시킵니다', '제가 발견하지 못한 문제를 찾아냈습니다')
quote(s, 0.7, 1.92, 11.9, '다른 버그 있는지 자세히 확인해줘', h=0.95)
found = [
    ('치명적', '새로고침하면 입력한 내용이 전부 사라짐',
     '판독 도중 새로고침 한 번이면 처음부터 다시 입력해야 하는 상태였습니다.', RED),
    ('보통', '접어둔 결절을 클릭하면 내용이 안 보임', '', ORNG),
    ('보통', '복사한 결절이 접힌 채로 생성됨', '', ORNG),
    ('사소', '알림 창의 되돌리기 버튼이 사라짐', '', MUTE),
]
y = 3.20
for sev, head, body, col in found:
    h = 1.12 if body else 0.6
    card(s, 0.7, y, 11.9, h, 'FFF0EF' if col == RED else BG)
    s.shape('roundRect', 1.0, y + 0.14, 0.9, 0.32, fill=col, radius=0.1,
            text=sev, size=10, color='FFFFFF', bold=True, align='ctr', valign='middle', margin=0.02)
    s.text(head, 2.1, y + 0.10, 10.1, 0.4, size=14.5, color=INK, bold=(col == RED), margin=0)
    if body:
        s.text(body, 2.1, y + 0.54, 10.1, 0.45, size=12.5, color=MUTE, margin=0)
    y += h + 0.15
kicker(s, '"고쳐줘"만 하지 말고, 가끔 "문제 없는지 봐줘"라고 시켜보세요.', y=6.72)
s.note('사용자가 모르는 버그가 쌓인다. 주기적으로 감사를 시키는 것이 실제로 효과가 있었다.\n(11:00–12:00)')

# ═══════════════ 14. 패턴 8 — 자료 던지기 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '패턴 8 — 가지고 있는 자료를 그냥 던집니다', '연구용 엑셀 양식을 첨부하고 한 문장만 덧붙였습니다')
quote(s, 0.7, 1.88, 7.4, '이런 데이터셋이 형성되게끔 하고 싶어\n(+ 연구용 엑셀 파일 첨부)', h=1.25)
card(s, 0.7, 3.35, 7.4, 3.35, SURF)
s.text('AI가 스스로 한 일', 1.05, 3.58, 6.7, 0.38, size=12.5, color=BLUE, bold=True, margin=0)
did = ['엑셀 58개 열의 의미와 코딩 규칙을 읽어냄',
       '숨어 있던 셀 메모(1=Solid, 2=…)까지 해석',
       '기존 입력 항목과 대조해 빠진 항목을 찾아냄',
       '부족한 입력칸을 새로 만들고 코드 번호로 변환',
       '환자를 넘길 때 결절 1개당 1행씩 자동 저장']
for i, t in enumerate(did):
    s.text('·', 1.05, 4.04 + i * 0.5, 0.2, 0.4, size=15, color=BLUE, bold=True, margin=0)
    s.text(t, 1.3, 4.04 + i * 0.5, 6.6, 0.44, size=13, color=INK, margin=0)
s.text('새로 생긴 입력 항목', 8.55, 1.88, 4.1, 0.35, size=12, color=MUTE, bold=True, margin=0)
s.image(IMG + 'p_research.png', 8.55, 2.28, 4.05, 4.42)
kicker(s, '양식을 설명하지 않았습니다. 파일만 줬습니다.', y=6.85, size=14.5)
s.note('가진 자료(엑셀, 논문, 사진)를 그냥 첨부하면 된다.\n정리해서 설명할 필요가 없다는 점이 놀라운 부분. (12:00–13:10)')

# ═══════════════ 15. 숫자 ═══════════════
s = d.add_slide(); s.background(INK)
s.text('2개월 동안 일어난 일', 0.8, 0.72, 11.7, 0.85, size=31, color='FFFFFF', bold=True, margin=0)
s.text('2026년 6월 6일  →  8월 7일', 0.82, 1.55, 11.7, 0.45, size=14.5, color='8FA9C2', margin=0)
nums = [('110', '번의 수정', '기능 추가, 버그 수정,\n디자인 변경'),
        ('99', '개의 버전', '전부 보관 —\n언제든 되돌리기 가능'),
        ('44', '개의 자동 검사', '고칠 때마다 자동으로\n전체 재검증'),
        ('7,968', '줄의 코드', '제가 직접 타이핑한 것은\n거의 없음')]
for i, (n, lab, desc) in enumerate(nums):
    x = 0.8 + (i % 2) * 6.1
    y = 2.35 + (i // 2) * 2.3
    s.shape('roundRect', x, y, 5.6, 2.0, fill=INK2, line='2C4E70', radius=0.035)
    s.text(n, x + 0.45, y + 0.28, 2.6, 0.95, size=40, color=BLUE, bold=True, margin=0)
    s.text(lab, x + 0.5, y + 1.20, 2.6, 0.45, size=14.5, color='FFFFFF', bold=True, margin=0)
    s.text(desc, x + 3.05, y + 0.52, 2.35, 1.1, size=11.5, color='8FA9C2', margin=0, line_spacing=1.35)
s.note('숫자로 규모를 보여주되, "이걸 다 제가 짠 게 아니다"를 강조. (13:10–14:00)')

# ═══════════════ 16. 자동 테스트 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '고치면 다른 데가 망가지는 문제', '수정이 쌓이면서 생긴 가장 큰 골칫거리였습니다')
card(s, 0.7, 2.0, 5.75, 2.15, 'FFF4E5')
s.text('문제', 1.05, 2.25, 5.0, 0.4, size=12.5, color='C77700', bold=True, margin=0)
s.text('A를 고쳤더니 B가 깨짐.\nB를 고쳤더니 C가 깨짐.\n매번 손으로 다 확인할 수 없음.',
       1.05, 2.68, 5.05, 1.4, size=14, color=INK, margin=0, line_spacing=1.45)
card(s, 6.85, 2.0, 5.75, 2.15, 'E8F6EC')
s.text('해결', 7.2, 2.25, 5.0, 0.4, size=12.5, color='157F33', bold=True, margin=0)
s.text('"검사 항목을 만들어 둬"라고 시킴.\n이제 고칠 때마다 44개가\n자동으로 전부 확인됩니다.',
       7.2, 2.68, 5.05, 1.4, size=14, color=INK, margin=0, line_spacing=1.45)
s.shape('roundRect', 0.7, 4.45, 11.9, 1.85, fill='10231A', line='1E3A2C', radius=0.03)
s.text('✓  빈 화면에서 정상 판독문이 나가지 않는가\n'
       '✓  K-TIRADS 등급이 크기·소견에 맞게 계산되는가\n'
       '✓  새로고침해도 입력 내용이 남아 있는가',
       1.05, 4.68, 8.0, 1.4, size=12.5, color='5EE08A', margin=0, line_spacing=1.5, font=MONO)
s.text('44 passed\n0 failed', 9.6, 4.85, 2.6, 1.0, size=17, color='5EE08A',
       bold=True, align='ctr', margin=0, line_spacing=1.3, font=MONO)
kicker(s, '사람이 매번 확인할 수 없는 것을, 기계가 매번 확인합니다.', y=6.50)
s.note('의료 도구라서 특히 중요한 부분. "검사 항목을 만들어달라"는 요청도 말로 하면 된다.\n(14:00–15:00)')

# ═══════════════ 17. 최종 기능 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '지금은 이런 일을 합니다', '2개월간의 수정이 쌓인 결과')
shots = [('p_diagram.png', '목 부위를 클릭해서 입력', '표를 찾지 않고 그림에서 바로 선택'),
         ('p_keytips.png', 'Alt 키를 누르면 단축키 표시', '외울 필요 없이 눌러서 확인')]
for i, (f, h, sub) in enumerate(shots):
    x = 0.7 + i * 6.1
    card(s, x, 1.95, 5.75, 2.6)
    s.image(IMG + f, x + 0.18, 2.12, 5.4, 1.55)
    s.text(h, x + 0.35, 3.78, 5.1, 0.38, size=14, color=INK, bold=True, margin=0)
    s.text(sub, x + 0.35, 4.16, 5.1, 0.34, size=11.5, color=MUTE, margin=0)
feats = [('K-TIRADS 등급 자동 계산', '소견을 고르면 등급과 악성도가 바로 표시'),
         ('생검 기준 자동 대조', '크기와 등급을 비교해 생검 적응증 판정'),
         ('추적 간격 제안', '역치 미달이면 권장 추적 간격을 제시'),
         ('연구 데이터 자동 저장', '환자를 넘기면 엑셀 파일에 자동 누적')]
for i, (h, sub) in enumerate(feats):
    x = 0.7 + (i % 2) * 6.1
    y = 4.78 + (i // 2) * 1.13
    card(s, x, y, 5.75, 1.0, SURF, shadow=False)
    s.text(h, x + 0.35, y + 0.13, 5.1, 0.38, size=13.5, color=INK, bold=True, margin=0)
    s.text(sub, x + 0.35, y + 0.53, 5.1, 0.34, size=11.5, color=MUTE, margin=0)
s.note('기능 나열은 빠르게. 하나하나 설명하지 말고 "이 정도까지 왔다"만. (15:00–16:00)')

# ═══════════════ 18. 실전 팁 ═══════════════
s = d.add_slide(); s.background(BG)
title(s, '내일 바로 해보실 수 있는 다섯 가지')
tips = [('화면을 캡처해서 붙여넣으세요', '"어디가 이상한지" 설명하는 것보다 빠르고 정확합니다.'),
        ('같은 문제가 두 번이면 "왜"를 물으세요', '증상만 고치면 계속 되돌아옵니다.'),
        ('과감하게 시도하세요', '마음에 안 들면 통째로 되돌릴 수 있습니다.'),
        ('큰 작업은 계획서를 먼저 받으세요', '"바로 하지 말고 어떻게 할 건지 먼저 알려줘"'),
        ('가끔 "문제 없는지 봐줘"라고 시키세요', '제가 못 본 치명적 버그가 그렇게 발견됐습니다.')]
for i, (h, sub) in enumerate(tips):
    y = 1.55 + i * 1.12
    card(s, 0.7, y, 11.9, 0.96)
    s.shape('ellipse', 1.02, y + 0.19, 0.58, 0.58, fill=BLUE,
            text=str(i + 1), size=15.5, color='FFFFFF', bold=True, align='ctr', valign='middle', margin=0)
    s.text(h, 1.92, y + 0.12, 10.4, 0.4, size=15.5, color=INK, bold=True, margin=0)
    s.text(sub, 1.92, y + 0.53, 10.4, 0.35, size=12, color=MUTE, margin=0)
s.note('실행 가능한 조언으로 마무리 준비. 청중이 메모할 시간을 조금 줄 것. (16:00–17:20)')

# ═══════════════ 19. 한계 + 마무리 ═══════════════
s = d.add_slide(); s.background(INK)
s.text('다만, 분명한 한계가 있습니다', 0.8, 0.70, 11.7, 0.85, size=30, color='FFFFFF', bold=True, margin=0)
limits = [('AI는 임상적 타당성을 판단하지 못합니다',
           '가이드라인 해석, 안전한 동작 설계는 결국 의사가 정해야 했습니다.'),
          ('"돌아간다"와 "믿을 수 있다"는 다릅니다',
           '치명적 버그는 제가 물어봤을 때 비로소 발견됐습니다.'),
          ('이 도구도 아직 검증 단계입니다',
           '실제 진료에 쓰기 전에 판독문과 등급 판정을 검증해야 합니다.')]
for i, (h, sub) in enumerate(limits):
    y = 1.80 + i * 1.32
    s.shape('roundRect', 0.8, y, 11.7, 1.14, fill=INK2, line='2C4E70', radius=0.035)
    s.text(h, 1.2, y + 0.16, 11.0, 0.44, size=16, color=ORNG, bold=True, margin=0)
    s.text(sub, 1.2, y + 0.62, 11.0, 0.4, size=12.5, color='A8C4DE', margin=0)
s.text('그럼에도, 시작하는 데는 아이디어 하나면 충분했습니다.',
       0.8, 6.00, 11.7, 0.6, size=21, color='FFFFFF', bold=True, margin=0)
s.text('감사합니다.', 0.82, 6.68, 11.7, 0.5, size=15, color=BLUE, margin=0)
s.note('정직하게 한계를 인정하는 것이 신뢰를 준다. 마지막 문장으로 마무리하고 질의응답.\n(17:20–20:00)')

out = d.save(os.path.join(HERE, 'KTIRADS_vibecoding.pptx'))
print('WROTE', out, len(d.slides), 'slides')
