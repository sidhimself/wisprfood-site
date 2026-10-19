"""Build the translated landing pages from index.html (English master).
Usage: python3 _i18n/build.py          (run from the repo root)
Translations live in _i18n/<lang>.json, keyed by the exact English text.
Jekyll ignores folders starting with "_", so this folder is not published."""
import html, json, os, re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SITE = 'https://wisprfood.com'
LANGS = {  # code: (og locale, apple badge locale)
    'es': ('es_ES', 'es-es'), 'fr': ('fr_FR', 'fr-fr'), 'de': ('de_DE', 'de-de'),
    'da': ('da_DK', 'da-dk'), 'pl': ('pl_PL', 'pl-pl'),
}
ALL = ['en'] + list(LANGS)
BRANDS = {'WisprFood', 'App Store', 'Google Play', 'ALDI', 'Walmart', 'Aldi', 'Lidl', 'Tesco', 'Carrefour',
          'Pollo al chilindrón', 'Cacio e pepe', 'Chorizo', '© 2026 Kesitics Studios · WisprFood', 'FAQ'}

def url_for(code): return SITE + ('/' if code == 'en' else f'/{code}/')

def hreflang_block():
    lines = [f'<link rel="alternate" hreflang="{c}" href="{url_for(c)}">' for c in ALL]
    lines.append(f'<link rel="alternate" hreflang="x-default" href="{url_for("en")}">')
    return '\n'.join(lines)

def ensure_hreflang(h):
    h = re.sub(r'(<link rel="alternate" hreflang="[^"]+" href="[^"]+">\n)+', '', h)
    # always rebuilt from scratch, so running the build twice is safe
    return h.replace('<link rel="canonical"', hreflang_block() + '\n<link rel="canonical"', 1)

def translate_page(src, code, T):
    missing = set()
    def tr(s):
        k = html.unescape(s)
        if k in T: return T[k]
        if k.strip() and re.search('[A-Za-z]', k) and k not in BRANDS: missing.add(k)
        return k
    head, body = src.split('<body>', 1)

    # --- body: text nodes and a few attributes
    def text_node(m):
        raw = m.group(1)
        s = raw.strip()
        if not s: return m.group(0)
        lead = raw[:len(raw) - len(raw.lstrip())]; trail = raw[len(raw.rstrip()):]
        return '>' + lead + html.escape(tr(s), quote=False) + trail + '<'
    parts = re.split(r'(<script\b.*?</script>|<style\b.*?</style>)', body, flags=re.S)
    for i in range(0, len(parts), 2):
        p = re.sub(r'>([^<>]+)<', text_node, parts[i])
        p = re.sub(r'\b(alt|aria-label|title)="([^"]*)"',
                   lambda m: f'{m.group(1)}="{html.escape(tr(m.group(2))) if m.group(2).strip() else ""}"', p)
        parts[i] = p
    body = ''.join(parts)
    loc, apple = LANGS[code]
    body = body.replace('/download-on-the-app-store/black/en-us', f'/download-on-the-app-store/black/{apple}')
    body = body.replace('/intl/en_us/badges/static/images/badges/en_badge_web_generic.png',
                        f'/intl/{code}/badges/static/images/badges/{code}_badge_web_generic.png')
    body = body.replace('<span class="lang-code">EN</span>', f'<span class="lang-code">{code.upper()}</span>')
    body = body.replace(' aria-current="true">English<', '>English<')
    body = re.sub(rf'(hreflang="{code}" lang="{code}")>', r'\1 aria-current="true">', body)

    # --- head
    head = head.replace('<html lang="en">', f'<html lang="{code}">')
    head = re.sub(r'<title>(.*?)</title>', lambda m: f'<title>{html.escape(tr(m.group(1)), quote=False)}</title>', head)
    for attr in ('name="description"', 'property="og:title"', 'property="og:description"', 'property="og:image:alt"',
                 'name="twitter:title"', 'name="twitter:description"'):
        head = re.sub(rf'(<meta {attr} content=")(.*?)(">)', lambda m: m.group(1) + html.escape(tr(m.group(2))) + m.group(3), head)
    head = head.replace(f'<link rel="canonical" href="{SITE}/">', f'<link rel="canonical" href="{url_for(code)}">')
    head = head.replace(f'<meta property="og:url" content="{SITE}/">', f'<meta property="og:url" content="{url_for(code)}">')
    head = head.replace('<meta property="og:locale" content="en_US">', f'<meta property="og:locale" content="{loc}">')

    # --- structured data
    m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', head, re.S)
    data = json.loads(m.group(2))
    for g in data['@graph']:
        if g['@type'] == 'MobileApplication':
            g['description'] = tr(g['description'])
        if g['@type'] == 'FAQPage':
            g['@id'] = url_for(code) + '#faq'
            g['inLanguage'] = code
            for q in g['mainEntity']:
                q['name'] = tr(q['name'])
                a = q['acceptedAnswer']['text']
                if a.startswith('You sign in with Apple or Google'):
                    key = next(k for k in T if k.startswith('You sign in with Apple or Google'))
                    q['acceptedAnswer']['text'] = f"{T[key]} {T['privacy policy']}."
                else:
                    q['acceptedAnswer']['text'] = tr(a)
    head = head[:m.start(2)] + '\n' + json.dumps(data, indent=2, ensure_ascii=False) + '\n' + head[m.end(2):]
    return head + '<body>' + body, missing

def write_sitemap():
    p = os.path.join(ROOT, 'sitemap.xml')
    s = open(p).read()
    alts = ''.join(f'<xhtml:link rel="alternate" hreflang="{c}" href="{url_for(c)}"/>' for c in ALL)
    s = re.sub(r'\s*<url><loc>https://wisprfood.com/(es|fr|de|da|pl)/</loc>.*?</url>', '', s, flags=re.S)
    s = s.replace('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
                  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">')
    s = s.replace('xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xhtml="http://www.w3.org/1999/xhtml"', 'xmlns:xhtml="http://www.w3.org/1999/xhtml"')
    s = re.sub(r'(<url><loc>https://wisprfood.com/</loc>)(<lastmod>[^<]*</lastmod>)?(<xhtml:link[^>]*/>)*', lambda m: m.group(1) + (m.group(2) or '') + alts, s)
    extra = ''.join(f'\n  <url><loc>{url_for(c)}</loc>{alts}</url>' for c in LANGS)
    s = s.replace('</urlset>', extra + '\n</urlset>')
    open(p, 'w').write(s)

if __name__ == '__main__':
    src_path = os.path.join(ROOT, 'index.html')
    src = ensure_hreflang(open(src_path).read())
    open(src_path, 'w').write(src)
    for code in LANGS:
        T = json.load(open(os.path.join(ROOT, '_i18n', f'{code}.json')))
        out, missing = translate_page(src, code, T)
        os.makedirs(os.path.join(ROOT, code), exist_ok=True)
        open(os.path.join(ROOT, code, 'index.html'), 'w').write(out)
        print(code, 'written;', 'untranslated:', sorted(missing) if missing else 'none')
    write_sitemap()
