"""
Minimal OOXML .pptx writer — no third-party dependencies.

Only what this deck needs: 16:9 slides, solid backgrounds, rounded/plain
rectangles, ellipses, text boxes with per-paragraph runs, pictures, drop
shadows, and speaker notes.
"""
import os
import struct
import zipfile

EMU = 914400  # per inch


def emu(inches):
    return int(round(inches * EMU))


def esc(s):
    return (str(s).replace('&', '&amp;').replace('<', '&lt;').replace('>', '&gt;'))


def png_size(path):
    """Width/height straight from the PNG header (no Pillow available)."""
    with open(path, 'rb') as f:
        head = f.read(24)
    if head[:8] != b'\x89PNG\r\n\x1a\n':
        raise ValueError('not a PNG: ' + path)
    w, h = struct.unpack('>II', head[16:24])
    return w, h


class Slide:
    def __init__(self, deck):
        self.deck = deck
        self.bg = None
        self.shapes = []      # XML fragments
        self.pics = []        # (rid, path)
        self.items = []       # plain description of each element, for HTML QA preview
        self.notes = None
        self._id = 1

    def _next_id(self):
        self._id += 1
        return self._id

    # ---------- building blocks ----------
    def _shadow(self):
        return ('<a:effectLst><a:outerShdw blurRad="152400" dist="34925" dir="5400000" '
                'algn="t" rotWithShape="0"><a:srgbClr val="0F2A43"><a:alpha val="14000"/>'
                '</a:srgbClr></a:outerShdw></a:effectLst>')

    def _txbody(self, text, size, color, bold=False, italic=False, align='l',
                valign='t', line_spacing=None, margin=None, font='맑은 고딕',
                space_after=None):
        ins = ''
        if margin is not None:
            m = emu(margin)
            ins = f' lIns="{m}" tIns="{m}" rIns="{m}" bIns="{m}"'
        anchor = {'t': 't', 'middle': 'ctr', 'b': 'b'}.get(valign, 't')
        out = [f'<p:txBody><a:bodyPr wrap="square"{ins} anchor="{anchor}"><a:noAutofit/></a:bodyPr><a:lstStyle/>']
        for line in str(text).split('\n'):
            ppr = [f'<a:pPr algn="{align}"']
            ppr.append('>')
            inner = ''
            if line_spacing:
                inner += f'<a:lnSpc><a:spcPct val="{int(line_spacing * 100000)}"/></a:lnSpc>'
            if space_after:
                inner += f'<a:spcAft><a:spcPts val="{int(space_after * 100)}"/></a:spcAft>'
            para = ''.join(ppr) + inner + '</a:pPr>'
            b_attr = ' b="1"' if bold else ''
            i_attr = ' i="1"' if italic else ''
            rpr = (f'<a:rPr lang="ko-KR" altLang="en-US" sz="{int(size * 100)}"'
                   f'{b_attr}{i_attr} dirty="0">'
                   f'<a:solidFill><a:srgbClr val="{color}"/></a:solidFill>'
                   f'<a:latin typeface="{font}"/><a:ea typeface="{font}"/>'
                   f'<a:cs typeface="{font}"/></a:rPr>')
            if line == '':
                out.append(f'<a:p>{para}<a:endParaRPr lang="ko-KR" sz="{int(size * 100)}"/></a:p>')
            else:
                out.append(f'<a:p>{para}<a:r>{rpr}<a:t>{esc(line)}</a:t></a:r></a:p>')
        out.append('</p:txBody>')
        return ''.join(out)

    # ---------- public API ----------
    def background(self, color):
        self.bg = color
        self.items.append(dict(kind='bg', color=color))

    def shape(self, kind, x, y, w, h, fill=None, line=None, line_w=1,
              radius=None, shadow=False, text=None, **kw):
        sid = self._next_id()
        prst = {'rect': 'rect', 'roundRect': 'roundRect', 'ellipse': 'ellipse'}[kind]
        geom = f'<a:prstGeom prst="{prst}"><a:avLst>'
        if prst == 'roundRect' and radius is not None:
            geom += f'<a:gd name="adj" fmla="val {int(radius * 100000)}"/>'
        geom += '</a:avLst></a:prstGeom>'
        fill_xml = f'<a:solidFill><a:srgbClr val="{fill}"/></a:solidFill>' if fill else '<a:noFill/>'
        line_xml = (f'<a:ln w="{emu(line_w / 72.0)}"><a:solidFill><a:srgbClr val="{line}"/>'
                    f'</a:solidFill></a:ln>') if line else '<a:ln><a:noFill/></a:ln>'
        self.items.append(dict(kind='shape', prst=prst, x=x, y=y, w=w, h=h, fill=fill,
                               line=line, radius=radius, shadow=shadow, text=text, **kw))
        eff = self._shadow() if shadow else ''
        body = self._txbody(text, **kw) if text is not None else \
            '<p:txBody><a:bodyPr/><a:lstStyle/><a:p/></p:txBody>'
        self.shapes.append(
            f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="s{sid}"/><p:cNvSpPr/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/>'
            f'<a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>{geom}{fill_xml}{line_xml}{eff}</p:spPr>'
            f'{body}</p:sp>')

    def text(self, txt, x, y, w, h, **kw):
        self.items.append(dict(kind='text', x=x, y=y, w=w, h=h, text=txt, **kw))
        sid = self._next_id()
        body = self._txbody(txt, **kw)
        self.shapes.append(
            f'<p:sp><p:nvSpPr><p:cNvPr id="{sid}" name="t{sid}"/>'
            f'<p:cNvSpPr txBox="1"/><p:nvPr/></p:nvSpPr>'
            f'<p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/>'
            f'<a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
            f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom><a:noFill/></p:spPr>{body}</p:sp>')

    def image(self, path, x, y, w, h, contain=True):
        """Place an image, letterboxed into the w x h box when contain=True."""
        iw, ih = png_size(path)
        if contain:
            scale = min(w / iw, h / ih)
            dw, dh = iw * scale, ih * scale
            x += (w - dw) / 2
            y += (h - dh) / 2
            w, h = dw, dh
        self.items.append(dict(kind='image', path=path, x=x, y=y, w=w, h=h))
        rid = f'rId{100 + len(self.pics)}'
        self.pics.append((rid, path))
        sid = self._next_id()
        self.shapes.append(
            f'<p:pic><p:nvPicPr><p:cNvPr id="{sid}" name="p{sid}"/>'
            f'<p:cNvPicPr><a:picLocks noChangeAspect="1"/></p:cNvPicPr><p:nvPr/></p:nvPicPr>'
            f'<p:blipFill><a:blip r:embed="{rid}"/><a:stretch><a:fillRect/></a:stretch></p:blipFill>'
            f'<p:spPr><a:xfrm><a:off x="{emu(x)}" y="{emu(y)}"/>'
            f'<a:ext cx="{emu(w)}" cy="{emu(h)}"/></a:xfrm>'
            f'<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr></p:pic>')

    def note(self, txt):
        self.notes = txt

    # ---------- serialisation ----------
    def xml(self):
        bg = ''
        if self.bg:
            bg = (f'<p:bg><p:bgPr><a:solidFill><a:srgbClr val="{self.bg}"/></a:solidFill>'
                  f'<a:effectLst/></p:bgPr></p:bg>')
        return (
            '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
            '<p:sld xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
            'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
            'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
            f'<p:cSld>{bg}<p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/>'
            '<p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/>'
            '<a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
            + ''.join(self.shapes) +
            '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sld>')


class Deck:
    def __init__(self, width=13.333, height=7.5):
        self.w, self.h = width, height
        self.slides = []

    def add_slide(self):
        s = Slide(self)
        self.slides.append(s)
        return s

    # ---------- static parts ----------
    def _theme(self):
        dk = ('<a:dk1><a:sysClr val="windowText" lastClr="000000"/></a:dk1>'
              '<a:lt1><a:sysClr val="window" lastClr="FFFFFF"/></a:lt1>'
              '<a:dk2><a:srgbClr val="0F2A43"/></a:dk2><a:lt2><a:srgbClr val="F2F4F7"/></a:lt2>'
              '<a:accent1><a:srgbClr val="0A84FF"/></a:accent1><a:accent2><a:srgbClr val="FF9F0A"/></a:accent2>'
              '<a:accent3><a:srgbClr val="30D158"/></a:accent3><a:accent4><a:srgbClr val="FF453A"/></a:accent4>'
              '<a:accent5><a:srgbClr val="1B3A57"/></a:accent5><a:accent6><a:srgbClr val="6B7A8C"/></a:accent6>'
              '<a:hlink><a:srgbClr val="0A84FF"/></a:hlink>'
              '<a:folHlink><a:srgbClr val="6B7A8C"/></a:folHlink>')
        fill3 = ('<a:fillStyleLst>'
                 '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
                 '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
                 '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:fillStyleLst>')
        ln3 = ('<a:lnStyleLst>'
               '<a:ln w="6350"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
               '<a:ln w="12700"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
               '<a:ln w="19050"><a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:ln>'
               '</a:lnStyleLst>')
        ef3 = ('<a:effectStyleLst><a:effectStyle><a:effectLst/></a:effectStyle>'
               '<a:effectStyle><a:effectLst/></a:effectStyle>'
               '<a:effectStyle><a:effectLst/></a:effectStyle></a:effectStyleLst>')
        bg3 = ('<a:bgFillStyleLst>'
               '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
               '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill>'
               '<a:solidFill><a:schemeClr val="phClr"/></a:solidFill></a:bgFillStyleLst>')
        font = ('<a:majorFont><a:latin typeface="맑은 고딕"/><a:ea typeface="맑은 고딕"/>'
                '<a:cs typeface=""/></a:majorFont>'
                '<a:minorFont><a:latin typeface="맑은 고딕"/><a:ea typeface="맑은 고딕"/>'
                '<a:cs typeface=""/></a:minorFont>')
        return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<a:theme xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" name="Deck">'
                f'<a:themeElements><a:clrScheme name="Deck">{dk}</a:clrScheme>'
                f'<a:fontScheme name="Deck">{font}</a:fontScheme>'
                f'<a:fmtScheme name="Deck">{fill3}{ln3}{ef3}{bg3}</a:fmtScheme>'
                '</a:themeElements><a:objectDefaults/><a:extraClrSchemeLst/></a:theme>')

    def _empty_tree(self, tag):
        return ('<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/>'
                '<p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/>'
                '<a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm>'
                '</p:grpSpPr></p:spTree></p:cSld>')

    def _master(self):
        clrmap = ('<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" '
                  'accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" '
                  'accent6="accent6" hlink="hlink" folHlink="folHlink"/>')
        return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<p:sldMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
                'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
                + self._empty_tree('master') + clrmap +
                '<p:sldLayoutIdLst><p:sldLayoutId id="2147483649" r:id="rId1"/></p:sldLayoutIdLst>'
                '</p:sldMaster>')

    def _layout(self):
        return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<p:sldLayout xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
                'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main" '
                'type="blank" preserve="1">'
                + self._empty_tree('layout') +
                '<p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:sldLayout>')

    def _notes_master(self):
        clrmap = ('<p:clrMap bg1="lt1" tx1="dk1" bg2="lt2" tx2="dk2" accent1="accent1" '
                  'accent2="accent2" accent3="accent3" accent4="accent4" accent5="accent5" '
                  'accent6="accent6" hlink="hlink" folHlink="folHlink"/>')
        return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<p:notesMaster xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
                'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
                + self._empty_tree('notes') + clrmap + '</p:notesMaster>')

    def _notes_slide(self, text):
        paras = ''.join(
            f'<a:p><a:r><a:rPr lang="ko-KR" altLang="en-US" sz="1200" dirty="0">'
            f'<a:latin typeface="맑은 고딕"/><a:ea typeface="맑은 고딕"/></a:rPr>'
            f'<a:t>{esc(line)}</a:t></a:r></a:p>'
            for line in str(text).split('\n'))
        return ('<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                '<p:notes xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
                'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
                'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
                '<p:cSld><p:spTree><p:nvGrpSpPr><p:cNvPr id="1" name=""/><p:cNvGrpSpPr/>'
                '<p:nvPr/></p:nvGrpSpPr><p:grpSpPr><a:xfrm><a:off x="0" y="0"/>'
                '<a:ext cx="0" cy="0"/><a:chOff x="0" y="0"/><a:chExt cx="0" cy="0"/></a:xfrm></p:grpSpPr>'
                '<p:sp><p:nvSpPr><p:cNvPr id="2" name="Notes Placeholder"/>'
                '<p:cNvSpPr><a:spLocks noGrp="1"/></p:cNvSpPr>'
                '<p:nvPr><p:ph type="body" idx="1"/></p:nvPr></p:nvSpPr>'
                '<p:spPr><a:xfrm><a:off x="685800" y="4343400"/>'
                '<a:ext cx="5486400" cy="4114800"/></a:xfrm>'
                '<a:prstGeom prst="rect"><a:avLst/></a:prstGeom></p:spPr>'
                f'<p:txBody><a:bodyPr/><a:lstStyle/>{paras}</p:txBody></p:sp>'
                '</p:spTree></p:cSld><p:clrMapOvr><a:masterClrMapping/></p:clrMapOvr></p:notes>')

    def save(self, path):
        n = len(self.slides)
        media = {}          # abs path -> media filename
        z = zipfile.ZipFile(path, 'w', zipfile.ZIP_DEFLATED)

        # collect media
        for s in self.slides:
            for _, p in s.pics:
                if p not in media:
                    media[p] = f'image{len(media) + 1}{os.path.splitext(p)[1]}'

        # ---- [Content_Types].xml ----
        ov = [
            '<Override PartName="/ppt/presentation.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.presentation.main+xml"/>',
            '<Override PartName="/ppt/slideMasters/slideMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideMaster+xml"/>',
            '<Override PartName="/ppt/slideLayouts/slideLayout1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slideLayout+xml"/>',
            '<Override PartName="/ppt/notesMasters/notesMaster1.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesMaster+xml"/>',
            '<Override PartName="/ppt/theme/theme1.xml" ContentType="application/vnd.openxmlformats-officedocument.theme+xml"/>',
        ]
        for i in range(1, n + 1):
            ov.append(f'<Override PartName="/ppt/slides/slide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.slide+xml"/>')
            if self.slides[i - 1].notes:
                ov.append(f'<Override PartName="/ppt/notesSlides/notesSlide{i}.xml" ContentType="application/vnd.openxmlformats-officedocument.presentationml.notesSlide+xml"/>')
        z.writestr('[Content_Types].xml',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">'
                   '<Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>'
                   '<Default Extension="xml" ContentType="application/xml"/>'
                   '<Default Extension="png" ContentType="image/png"/>'
                   '<Default Extension="jpeg" ContentType="image/jpeg"/>'
                   + ''.join(ov) + '</Types>')

        # ---- package rels ----
        z.writestr('_rels/.rels',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="ppt/presentation.xml"/>'
                   '</Relationships>')

        # ---- presentation.xml (child order per ECMA-376) ----
        sld_ids = ''.join(
            f'<p:sldId id="{256 + i}" r:id="rId{10 + i}"/>' for i in range(n))
        z.writestr('ppt/presentation.xml',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<p:presentation xmlns:a="http://schemas.openxmlformats.org/drawingml/2006/main" '
                   'xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships" '
                   'xmlns:p="http://schemas.openxmlformats.org/presentationml/2006/main">'
                   '<p:sldMasterIdLst><p:sldMasterId id="2147483648" r:id="rId1"/></p:sldMasterIdLst>'
                   '<p:notesMasterIdLst><p:notesMasterId r:id="rId3"/></p:notesMasterIdLst>'
                   f'<p:sldIdLst>{sld_ids}</p:sldIdLst>'
                   f'<p:sldSz cx="{emu(self.w)}" cy="{emu(self.h)}"/>'
                   f'<p:notesSz cx="{emu(self.h)}" cy="{emu(self.w)}"/>'
                   '</p:presentation>')

        prels = ['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="slideMasters/slideMaster1.xml"/>',
                 '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="theme/theme1.xml"/>',
                 '<Relationship Id="rId3" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="notesMasters/notesMaster1.xml"/>']
        for i in range(n):
            prels.append(f'<Relationship Id="rId{10 + i}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="slides/slide{i + 1}.xml"/>')
        z.writestr('ppt/_rels/presentation.xml.rels',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   + ''.join(prels) + '</Relationships>')

        # ---- theme / master / layout / notes master ----
        z.writestr('ppt/theme/theme1.xml', self._theme())
        z.writestr('ppt/slideMasters/slideMaster1.xml', self._master())
        z.writestr('ppt/slideMasters/_rels/slideMaster1.xml.rels',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>'
                   '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
                   '</Relationships>')
        z.writestr('ppt/slideLayouts/slideLayout1.xml', self._layout())
        z.writestr('ppt/slideLayouts/_rels/slideLayout1.xml.rels',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideMaster" Target="../slideMasters/slideMaster1.xml"/>'
                   '</Relationships>')
        z.writestr('ppt/notesMasters/notesMaster1.xml', self._notes_master())
        z.writestr('ppt/notesMasters/_rels/notesMaster1.xml.rels',
                   '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                   '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                   '<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/theme" Target="../theme/theme1.xml"/>'
                   '</Relationships>')

        # ---- media ----
        for src, name in media.items():
            z.write(src, 'ppt/media/' + name)

        # ---- slides ----
        for i, s in enumerate(self.slides, 1):
            z.writestr(f'ppt/slides/slide{i}.xml', s.xml())
            rels = ['<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slideLayout" Target="../slideLayouts/slideLayout1.xml"/>']
            if s.notes:
                rels.append(f'<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesSlide" Target="../notesSlides/notesSlide{i}.xml"/>')
            for rid, p in s.pics:
                rels.append(f'<Relationship Id="{rid}" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/image" Target="../media/{media[p]}"/>')
            z.writestr(f'ppt/slides/_rels/slide{i}.xml.rels',
                       '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                       '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                       + ''.join(rels) + '</Relationships>')
            if s.notes:
                z.writestr(f'ppt/notesSlides/notesSlide{i}.xml', self._notes_slide(s.notes))
                z.writestr(f'ppt/notesSlides/_rels/notesSlide{i}.xml.rels',
                           '<?xml version="1.0" encoding="UTF-8" standalone="yes"?>'
                           '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">'
                           f'<Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/slide" Target="../slides/slide{i}.xml"/>'
                           '<Relationship Id="rId2" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/notesMaster" Target="../notesMasters/notesMaster1.xml"/>'
                           '</Relationships>')
        z.close()
        return path
