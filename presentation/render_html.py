"""
Render the deck built by build_deck.py to an HTML mirror at the same geometry,
so slide layout can be inspected in a browser (LibreOffice is unusable here).

Usage: python3 render_html.py  ->  preview.html
"""
import os
import build_deck  # building the deck is a side effect of the import
import pptxlite

HERE = os.path.dirname(os.path.abspath(__file__))
DPI = 96


def px(v):
    return round(v * DPI, 2)


def css_color(c):
    return '#' + c if c else 'transparent'


ALIGN = {'l': 'left', 'ctr': 'center', 'r': 'right', 'just': 'justify'}
VALIGN = {'t': 'flex-start', 'middle': 'center', 'b': 'flex-end'}


def render_text(it, extra=''):
    size = it.get('size', 18)
    color = it.get('color', '000000')
    align = ALIGN.get(it.get('align', 'l'), 'left')
    valign = VALIGN.get(it.get('valign', 't'), 'flex-start')
    ls = it.get('line_spacing') or 1.0
    margin = it.get('margin')
    pad = px(margin) if margin is not None else 7.2  # OOXML default lIns 0.1"
    weight = '700' if it.get('bold') else '400'
    style = 'italic' if it.get('italic') else 'normal'
    sa = it.get('space_after') or 0
    lines = str(it['text']).split('\n')
    body = ''.join(
        f'<p style="margin:0 0 {px(sa / 72)}px 0">{l or "&nbsp;"}</p>' for l in lines)
    return (
        f'<div class="tx" style="left:{px(it["x"])}px;top:{px(it["y"])}px;'
        f'width:{px(it["w"])}px;height:{px(it["h"])}px;padding:{pad}px;'
        f'font-size:{px(size / 72)}px;color:{css_color(color)};text-align:{align};'
        f'justify-content:{valign};line-height:{ls};font-weight:{weight};'
        f'font-style:{style};{extra}">{body}</div>')


def main():
    deck = getattr(build_deck, 'd', None)
    if deck is None:
        raise SystemExit('build_deck.py must expose `d`')
    W, H = deck.w, deck.h
    out = ['<meta charset="utf-8"><title>deck preview</title>', '''<style>
body{background:#333;margin:0;padding:24px;font-family:"Malgun Gothic","Noto Sans KR",sans-serif}
.slide{position:relative;overflow:hidden;margin:0 auto 28px;box-shadow:0 4px 18px #0008}
.sh{position:absolute;box-sizing:border-box;display:flex;flex-direction:column}
.tx{position:absolute;box-sizing:border-box;display:flex;flex-direction:column;
    overflow:visible;white-space:pre-wrap;word-break:break-word}
.num{position:absolute;left:-22px;top:0;color:#fff;font-size:13px}
img{position:absolute;object-fit:fill}
</style>''']
    for i, s in enumerate(deck.slides, 1):
        bg = '#FFFFFF'
        for it in s.items:
            if it['kind'] == 'bg':
                bg = css_color(it['color'])
        out.append(f'<div class="slide" style="width:{px(W)}px;height:{px(H)}px;'
                   f'background:{bg}"><div class="num">{i}</div>')
        for it in s.items:
            k = it['kind']
            if k == 'bg':
                continue
            if k == 'image':
                p = it['path'] if os.path.isabs(it['path']) else os.path.join(HERE, it['path'])
                out.append(f'<img src="file://{p}" style="left:{px(it["x"])}px;'
                           f'top:{px(it["y"])}px;width:{px(it["w"])}px;height:{px(it["h"])}px">')
            elif k == 'shape':
                r = it.get('radius')
                br = f'border-radius:{px(r)}px;' if r else ''
                if it.get('prst') == 'ellipse':
                    br = 'border-radius:50%;'
                bd = (f'border:{it.get("line_w",1)}px solid {css_color(it["line"])};'
                      if it.get('line') else '')
                sh = 'box-shadow:0 3px 12px rgba(15,42,67,.14);' if it.get('shadow') else ''
                out.append(f'<div class="sh" style="left:{px(it["x"])}px;top:{px(it["y"])}px;'
                           f'width:{px(it["w"])}px;height:{px(it["h"])}px;'
                           f'background:{css_color(it.get("fill"))};{br}{bd}{sh}"></div>')
                if it.get('text') is not None:
                    out.append(render_text(it))
            elif k == 'text':
                out.append(render_text(it))
        out.append('</div>')
    path = os.path.join(HERE, 'preview.html')
    with open(path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(out))
    print('WROTE', path, len(deck.slides), 'slides')


if __name__ == '__main__':
    main()
