"""Structural integrity check for a .pptx (no third-party deps)."""
import sys, zipfile, posixpath
from xml.dom import minidom

REL_NS = 'http://schemas.openxmlformats.org/package/2006/relationships'

def check(path):
    z = zipfile.ZipFile(path)
    names = set(z.namelist())
    errs, warns = [], []

    # 1. content types cover every part
    ct = minidom.parseString(z.read('[Content_Types].xml'))
    defaults = {d.getAttribute('Extension').lower() for d in ct.getElementsByTagName('Default')}
    overrides = {o.getAttribute('PartName').lstrip('/') for o in ct.getElementsByTagName('Override')}
    for n in names:
        if n == '[Content_Types].xml':
            continue
        ext = n.rsplit('.', 1)[-1].lower()
        if n not in overrides and ext not in defaults:
            errs.append(f'no content type for part: {n}')
    for o in overrides:
        if o not in names:
            errs.append(f'content-type override points at a missing part: {o}')

    # 2. every relationship target exists; every r:id used is declared
    for n in sorted(names):
        if not n.endswith('.rels'):
            continue
        base = posixpath.dirname(posixpath.dirname(n))
        doc = minidom.parseString(z.read(n))
        ids = set()
        for r in doc.getElementsByTagNameNS(REL_NS, 'Relationship'):
            rid, tgt = r.getAttribute('Id'), r.getAttribute('Target')
            ids.add(rid)
            if r.getAttribute('TargetMode') == 'External':
                continue
            resolved = posixpath.normpath(posixpath.join(base, tgt)) if not tgt.startswith('/') else tgt.lstrip('/')
            if resolved not in names:
                errs.append(f'{n}: target missing -> {tgt} (resolved {resolved})')
        # the part this .rels belongs to
        owner = posixpath.join(base, posixpath.basename(n)[:-5]) if base else posixpath.basename(n)[:-5]
        owner = owner.replace('/_rels', '')
        src = posixpath.join(posixpath.dirname(posixpath.dirname(n)), posixpath.basename(n)[:-5])
        if src in names:
            raw = z.read(src).decode('utf-8', 'ignore')
            import re
            used = set(re.findall(r'r:(?:id|embed|link)="([^"]+)"', raw))
            for u in used - ids:
                errs.append(f'{src}: uses {u} but its .rels does not declare it')

    # 3. required parts
    need = ['ppt/presentation.xml', 'ppt/_rels/presentation.xml.rels',
            '_rels/.rels', 'ppt/slideMasters/slideMaster1.xml', 'ppt/theme/theme1.xml']
    for p in need:
        if p not in names:
            errs.append(f'missing required part: {p}')

    # 4. presentation child order (ECMA-376 CT_Presentation)
    pres = minidom.parseString(z.read('ppt/presentation.xml')).documentElement
    order = ['sldMasterIdLst', 'notesMasterIdLst', 'handoutMasterIdLst', 'sldIdLst',
             'sldSz', 'notesSz', 'smartTags', 'embeddedFontLst', 'custShowLst',
             'photoAlbum', 'custDataLst', 'kinsoku', 'defaultTextStyle',
             'modifyVerifier', 'extLst']
    seen = [c.localName for c in pres.childNodes if c.nodeType == 1]
    idx = [order.index(t) for t in seen if t in order]
    if idx != sorted(idx):
        errs.append(f'presentation.xml children out of schema order: {seen}')

    # 5. slide count consistency
    sld_ids = pres.getElementsByTagName('p:sldId')
    n_slides = len([n for n in names if n.startswith('ppt/slides/slide')])
    if len(sld_ids) != n_slides:
        errs.append(f'sldIdLst has {len(sld_ids)} entries but {n_slides} slide parts exist')

    print(f'parts: {len(names)}   slides: {n_slides}')
    print(f'errors: {len(errs)}')
    for e in errs[:25]:
        print('  ✗', e)
    for w in warns[:10]:
        print('  !', w)
    return len(errs)

sys.exit(1 if check(sys.argv[1]) else 0)
