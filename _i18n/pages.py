"""Build the site's own pages (How it works, Features, Pricing, FAQ) in every
language from sections of index.html, so Google sees real pages it can show
as links under the main result. Run after build.py, from the repo root:
    python3 _i18n/pages.py
Page texts (titles, descriptions, page heads) live in PAGE_T below; the
sections reuse the homepage's translations in _i18n/<lang>.json."""
import html, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from build import LANGS, ALL, SITE, translate_page

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

PAGES = [
    # slug, <title>, description, chip, h1 (plain, accent), lead, sections
    ('how-it-works', 'How It Works · WisprFood Meal Planner',
     "Tell WisprFood who's eating, where you shop and your budget. It plans every meal, prices it at your supermarket and writes one grocery list.",
     'How it works', ('Your week, planned', 'in two minutes.'),
     "Answer a few questions about your table, your shop and your budget. WisprFood plans every meal, prices it at your supermarket and writes one grocery list.",
     ['how', 'features', 'budget']),
    ('features', 'Features · WisprFood Meal Planner',
     'Compare supermarket prices, 165 cook-tested recipes for every diet, one grocery list sorted by aisle, and a fridge scan for using up what you have.',
     'Features', ('Everything your week', 'needs.'),
     'Prices from your own supermarket, recipes for everyone at the table, one grocery list and a few smart extras.',
     ['shops', 'recipes', 'grocery-list', 'fridge']),
    ('pricing', 'Pricing · WisprFood Meal Planner',
     'Try WisprFood free, no card needed. Then unlock your whole week monthly, or pay once for life. Cancel any time.',
     'Pricing', ('Simple pricing.', 'Try it free first.'),
     'See your week with one meal open for free. Unlock everything monthly, or pay once and keep it for life.',
     ['pricing', 'reviews']),
    ('faq', 'FAQ · WisprFood Meal Planner',
     'Answers about WisprFood: how prices are worked out, which supermarkets are covered, diets and allergies, the app, and how to cancel.',
     'FAQ', ('Questions about', 'WisprFood.'),
     'How prices are worked out, which shops are covered, diets and allergies, and how to cancel.',
     ['faq']),
]

# es, fr, de, da, pl
PAGE_T = {
 'How It Works · WisprFood Meal Planner': ('Cómo funciona · WisprFood, planificador de menús', 'Comment ça marche · WisprFood, planificateur de repas', 'So funktioniert es · WisprFood Essensplaner', 'Sådan virker det · WisprFood madplan', 'Jak to działa · WisprFood, planer posiłków'),
 "Tell WisprFood who's eating, where you shop and your budget. It plans every meal, prices it at your supermarket and writes one grocery list.": (
   'Dile a WisprFood quién come, dónde compras y tu presupuesto. Planifica cada comida, le pone el precio de tu súper y te escribe una sola lista de la compra.',
   'Dis à WisprFood qui mange, où tu fais tes courses et ton budget. Il planifie chaque repas, le chiffre aux prix de ton supermarché et écrit une seule liste de courses.',
   'Sag WisprFood, wer mitisst, wo du einkaufst und wie viel du ausgeben willst. Es plant jede Mahlzeit, berechnet sie zu den Preisen deines Markts und schreibt eine Einkaufsliste.',
   'Fortæl WisprFood, hvem der spiser med, hvor du handler, og dit budget. Den planlægger hvert måltid, prissætter det i dit supermarked og skriver én indkøbsliste.',
   'Powiedz WisprFood, kto je, gdzie robisz zakupy i jaki masz budżet. Zaplanuje każdy posiłek, wyceni go w twoim sklepie i napisze jedną listę zakupów.'),
 'How it works': ('Cómo funciona', 'Comment ça marche', 'So funktioniert es', 'Sådan virker det', 'Jak to działa'),
 'Your week, planned': ('Tu semana, planificada', 'Ta semaine, planifiée', 'Deine Woche, geplant', 'Din uge, planlagt', 'Twój tydzień, zaplanowany'),
 'in two minutes.': ('en dos minutos.', 'en deux minutes.', 'in zwei Minuten.', 'på to minutter.', 'w dwie minuty.'),
 'Answer a few questions about your table, your shop and your budget. WisprFood plans every meal, prices it at your supermarket and writes one grocery list.': (
   'Responde unas preguntas sobre tu mesa, tu súper y tu presupuesto. WisprFood planifica cada comida, le pone el precio de tu supermercado y escribe una sola lista de la compra.',
   'Réponds à quelques questions sur ta tablée, ton magasin et ton budget. WisprFood planifie chaque repas, le chiffre aux prix de ton supermarché et écrit une seule liste de courses.',
   'Beantworte ein paar Fragen zu deinem Tisch, deinem Markt und deinem Budget. WisprFood plant jede Mahlzeit, berechnet sie zu den Preisen deines Supermarkts und schreibt eine Einkaufsliste.',
   'Svar på et par spørgsmål om dit bord, din butik og dit budget. WisprFood planlægger hvert måltid, prissætter det i dit supermarked og skriver én indkøbsliste.',
   'Odpowiedz na kilka pytań o twój stół, sklep i budżet. WisprFood zaplanuje każdy posiłek, wyceni go w twoim supermarkecie i napisze jedną listę zakupów.'),
 'Features · WisprFood Meal Planner': ('Funciones · WisprFood, planificador de menús', 'Fonctionnalités · WisprFood, planificateur de repas', 'Funktionen · WisprFood Essensplaner', 'Funktioner · WisprFood madplan', 'Funkcje · WisprFood, planer posiłków'),
 'Compare supermarket prices, 165 cook-tested recipes for every diet, one grocery list sorted by aisle, and a fridge scan for using up what you have.': (
   'Compara precios de supermercados, 165 recetas probadas para cada dieta, una lista de la compra por pasillos y un escáner de nevera para aprovechar lo que tienes.',
   'Compare les prix des supermarchés, 165 recettes testées pour chaque régime, une liste de courses par rayon et un scan du frigo pour utiliser ce que tu as.',
   'Vergleiche Supermarktpreise, 165 erprobte Rezepte für jede Ernährung, eine Einkaufsliste nach Gängen und ein Kühlschrank-Scan, um Reste zu verwerten.',
   'Sammenlign supermarkedspriser, 165 afprøvede opskrifter til enhver kost, én indkøbsliste sorteret efter gang og en køleskabsscanning, så du bruger det, du har.',
   'Porównuj ceny supermarketów, 165 sprawdzonych przepisów na każdą dietę, jedną listę zakupów według alejek i skan lodówki, żeby wykorzystać to, co masz.'),
 'Features': ('Funciones', 'Fonctionnalités', 'Funktionen', 'Funktioner', 'Funkcje'),
 'Everything your week': ('Todo lo que tu semana', 'Tout ce dont ta semaine', 'Alles, was deine Woche', 'Alt, hvad din uge', 'Wszystko, czego twój tydzień'),
 'needs.': ('necesita.', 'a besoin.', 'braucht.', 'har brug for.', 'potrzebuje.'),
 'Prices from your own supermarket, recipes for everyone at the table, one grocery list and a few smart extras.': (
   'Precios de tu propio supermercado, recetas para todos en la mesa, una sola lista de la compra y algunos extras útiles.',
   'Les prix de ton propre supermarché, des recettes pour toute la tablée, une seule liste de courses et quelques extras malins.',
   'Preise aus deinem eigenen Supermarkt, Rezepte für alle am Tisch, eine Einkaufsliste und ein paar clevere Extras.',
   'Priser fra dit eget supermarked, opskrifter til alle ved bordet, én indkøbsliste og et par smarte ekstra funktioner.',
   'Ceny z twojego supermarketu, przepisy dla wszystkich przy stole, jedna lista zakupów i kilka sprytnych dodatków.'),
 'Pricing · WisprFood Meal Planner': ('Precios · WisprFood, planificador de menús', 'Tarifs · WisprFood, planificateur de repas', 'Preise · WisprFood Essensplaner', 'Priser · WisprFood madplan', 'Cennik · WisprFood, planer posiłków'),
 'Try WisprFood free, no card needed. Then unlock your whole week monthly, or pay once for life. Cancel any time.': (
   'Prueba WisprFood gratis, sin tarjeta. Después desbloquea toda tu semana cada mes o paga una sola vez para siempre. Cancela cuando quieras.',
   'Essaie WisprFood gratuitement, sans carte. Ensuite, débloque toute ta semaine au mois ou paie une fois pour toujours. Résiliable à tout moment.',
   'Probier WisprFood kostenlos, ohne Karte. Dann schalte deine ganze Woche monatlich frei oder zahl einmal für immer. Jederzeit kündbar.',
   'Prøv WisprFood gratis uden kort. Lås derefter hele ugen op månedligt, eller betal én gang for altid. Opsig når som helst.',
   'Wypróbuj WisprFood za darmo, bez karty. Potem odblokuj cały tydzień co miesiąc albo zapłać raz na zawsze. Anuluj w każdej chwili.'),
 'Pricing': ('Precios', 'Tarifs', 'Preise', 'Priser', 'Cennik'),
 'Simple pricing.': ('Precios sencillos.', 'Des prix simples.', 'Einfache Preise.', 'Enkle priser.', 'Proste ceny.'),
 'Try it free first.': ('Pruébalo gratis primero.', 'Essaie d’abord gratuitement.', 'Erst gratis testen.', 'Prøv gratis først.', 'Najpierw wypróbuj za darmo.'),
 'See your week with one meal open for free. Unlock everything monthly, or pay once and keep it for life.': (
   'Ve tu semana con una comida abierta gratis. Desbloquéalo todo cada mes, o paga una vez y es tuyo para siempre.',
   'Vois ta semaine avec un repas ouvert gratuitement. Débloque tout au mois, ou paie une fois et garde-le pour toujours.',
   'Sieh deine Woche gratis mit einem offenen Gericht. Schalte alles monatlich frei oder zahl einmal und behalte es für immer.',
   'Se din uge gratis med ét måltid åbent. Lås alt op månedligt, eller betal én gang og behold det for altid.',
   'Zobacz tydzień za darmo z jednym otwartym posiłkiem. Odblokuj wszystko co miesiąc albo zapłać raz i miej na zawsze.'),
 'FAQ · WisprFood Meal Planner': ('Preguntas frecuentes · WisprFood', 'FAQ · WisprFood, planificateur de repas', 'FAQ · WisprFood Essensplaner', 'FAQ · WisprFood madplan', 'FAQ · WisprFood, planer posiłków'),
 'Answers about WisprFood: how prices are worked out, which supermarkets are covered, diets and allergies, the app, and how to cancel.': (
   'Respuestas sobre WisprFood: cómo se calculan los precios, qué supermercados cubre, dietas y alergias, la app y cómo cancelar.',
   'Les réponses sur WisprFood : comment les prix sont calculés, quels supermarchés sont couverts, régimes et allergies, l’app et la résiliation.',
   'Antworten zu WisprFood: wie die Preise berechnet werden, welche Supermärkte dabei sind, Ernährung und Allergien, die App und das Kündigen.',
   'Svar om WisprFood: hvordan priserne beregnes, hvilke supermarkeder der er med, kost og allergier, appen, og hvordan du opsiger.',
   'Odpowiedzi o WisprFood: jak liczymy ceny, które supermarkety obejmujemy, diety i alergie, aplikacja i jak anulować.'),
 'Questions about': ('Preguntas sobre', 'Questions sur', 'Fragen zu', 'Spørgsmål om', 'Pytania o'),
 'WisprFood.': ('WisprFood.', 'WisprFood.', 'WisprFood.', 'WisprFood.', 'WisprFood.'),
 'How prices are worked out, which shops are covered, diets and allergies, and how to cancel.': (
   'Cómo se calculan los precios, qué súper están incluidos, dietas y alergias, y cómo cancelar.',
   'Comment les prix sont calculés, quels magasins sont couverts, régimes et allergies, et comment résilier.',
   'Wie die Preise berechnet werden, welche Märkte dabei sind, Ernährung und Allergien und wie du kündigst.',
   'Hvordan priserne beregnes, hvilke butikker der er med, kost og allergier, og hvordan du opsiger.',
   'Jak liczymy ceny, które sklepy obejmujemy, diety i alergie oraz jak anulować.'),
 # Homepage head (new copy, 9 Nov)
 'WisprFood: Meal Planner Priced at Your Supermarket': ('WisprFood: planificador de menús con los precios de tu súper', 'WisprFood : planificateur de repas aux prix de ton supermarché', 'WisprFood: Essensplaner mit den Preisen deines Supermarkts', 'WisprFood: madplan med priser fra dit supermarked', 'WisprFood: planer posiłków z cenami z twojego sklepu'),
 'Plan a whole week of dinners in two minutes, priced at your own supermarket. One grocery list, every meal within budget. Free to try, no card needed.': (
   'Planifica las cenas de toda la semana en dos minutos, con los precios de tu supermercado. Una sola lista de la compra y cada comida dentro del presupuesto. Gratis para probar, sin tarjeta.',
   'Planifie les dîners de toute ta semaine en deux minutes, aux prix de ton supermarché. Une seule liste de courses, chaque repas dans ton budget. Gratuit à l’essai, sans carte.',
   'Plane die Abendessen der ganzen Woche in zwei Minuten, zu den Preisen deines Supermarkts. Eine Einkaufsliste, jede Mahlzeit im Budget. Gratis testen, ohne Karte.',
   'Planlæg hele ugens aftensmad på to minutter med priser fra dit eget supermarked. Én indkøbsliste, hvert måltid inden for budgettet. Gratis at prøve, intet kort.',
   'Zaplanuj kolacje na cały tydzień w dwie minuty, z cenami z twojego supermarketu. Jedna lista zakupów, każdy posiłek w budżecie. Za darmo na próbę, bez karty.'),
 'Support': ('Ayuda', 'Aide', 'Hilfe', 'Hjælp', 'Pomoc'),
}

def page_url(code, slug): return SITE + ('' if code == 'en' else f'/{code}') + f'/{slug}'

def section(src, sid):
    m = re.search(rf'<section class="[^"]*" id="{sid}"[^>]*>.*?\n</section>\n', src, re.S)
    assert m, sid
    return m.group(0)

def build_english(src, slug, title, desc, chip, h1, lead, sections):
    head, body = src.split('<body>', 1)
    head = re.sub(r'<title>.*?</title>', f'<title>{html.escape(title, quote=False)}</title>', head)
    for attr in ('name="description"', 'property="og:description"', 'name="twitter:description"'):
        head = re.sub(rf'(<meta {attr} content=")(.*?)(">)', lambda m: m.group(1) + html.escape(desc) + m.group(3), head)
    for attr in ('property="og:title"', 'name="twitter:title"'):
        head = re.sub(rf'(<meta {attr} content=")(.*?)(">)', lambda m: m.group(1) + html.escape(title) + m.group(3), head)
    head = re.sub(r'(<link rel="alternate" hreflang="[^"]+" href="[^"]+">\n)+', '', head)
    alts = '\n'.join(f'<link rel="alternate" hreflang="{c}" href="{page_url(c, slug)}">' for c in ALL) + f'\n<link rel="alternate" hreflang="x-default" href="{page_url("en", slug)}">\n'
    head = head.replace(f'<link rel="canonical" href="{SITE}/">', alts + f'<link rel="canonical" href="{page_url("en", slug)}">')
    head = head.replace(f'<meta property="og:url" content="{SITE}/">', f'<meta property="og:url" content="{page_url("en", slug)}">')
    # Structured data: a breadcrumb, the page itself, and the FAQ on the FAQ page.
    m = re.search(r'(<script type="application/ld\+json">)(.*?)(</script>)', head, re.S)
    data = json.loads(m.group(2))
    graph = [{'@type': 'WebPage', '@id': page_url('en', slug), 'name': title, 'description': desc, 'isPartOf': {'@id': f'{SITE}/#website'}},
             {'@type': 'BreadcrumbList', 'itemListElement': [
                 {'@type': 'ListItem', 'position': 1, 'name': 'WisprFood', 'item': f'{SITE}/'},
                 {'@type': 'ListItem', 'position': 2, 'name': chip, 'item': page_url('en', slug)}]}]
    if 'faq' in sections:
        graph += [g for g in data['@graph'] if g['@type'] == 'FAQPage']
    data['@graph'] = graph
    head = head[:m.start(2)] + '\n' + json.dumps(data, indent=2, ensure_ascii=False) + '\n' + head[m.end(2):]

    top, rest = body.split('<main id="main">', 1)
    foot = rest[rest.index('</main>'):]
    top = top.replace(f'<a href="/{slug}">', f'<a href="/{slug}" aria-current="page">')
    hero = (f'\n<section class="hero page-hero">\n  <div class="wrap hero-copy">\n    <p class="chip">{html.escape(chip)}</p>\n'
            f'    <h1><span>{html.escape(h1[0])}</span> <em>{html.escape(h1[1])}</em></h1>\n'
            f'    <p class="lead">{html.escape(lead)}</p>\n'
            f'    <div class="cta-row"><a class="btn btn-lg" href="/app/">Plan my week <svg class="ic"><use href="#i-arrow"/></svg></a></div>\n'
            f'  </div>\n</section>\n')
    main = '<main id="main">\n' + hero + ''.join(section(src, s) for s in sections) + section(src, 'download')
    return head + '<body>' + top + main + foot

def localize(page, code, slug):
    """Links and URLs for the translated copy of a page."""
    page = page.replace(f'<link rel="canonical" href="{page_url("en", slug)}">', f'<link rel="canonical" href="{page_url(code, slug)}">')
    page = page.replace(f'<meta property="og:url" content="{page_url("en", slug)}">', f'<meta property="og:url" content="{page_url(code, slug)}">')
    page = page.replace(f'"@id": "{page_url("en", slug)}"', f'"@id": "{page_url(code, slug)}"').replace(f'"item": "{page_url("en", slug)}"', f'"item": "{page_url(code, slug)}"')
    for p in PAGES:
        page = page.replace(f'href="/{p[0]}"', f'href="/{code}/{p[0]}"')
    for s in ('support', 'privacy', 'terms'):
        page = page.replace(f'href="/{s}"', f'href="/{s}"')  # legal and support stay in English
    page = re.sub(r'"@id": "https://wisprfood.com/(?:\w\w/)?#faq"', f'"@id": "{page_url(code, slug)}#faq"', page)
    return page

def lang_menu(page, slug):
    """The language menu points at this same page in each language."""
    for c in ALL:
        target = f'/{slug}' if c == 'en' else f'/{c}/{slug}'
        page = re.sub(rf'href="[^"]*" hreflang="{c}" lang="{c}"', f'href="{target}" hreflang="{c}" lang="{c}"', page)
    return page

def write_sitemap():
    p = os.path.join(ROOT, 'sitemap.xml')
    s = open(p).read()
    for slug, *_ in PAGES:
        s = re.sub(rf'\s*<url><loc>https://wisprfood.com/(?:\w\w/)?{slug}</loc>.*?</url>', '', s, flags=re.S)
    extra = ''
    for slug, *_ in PAGES:
        alts = ''.join(f'<xhtml:link rel="alternate" hreflang="{c}" href="{page_url(c, slug)}"/>' for c in ALL)
        for c in ALL:
            extra += f'\n  <url><loc>{page_url(c, slug)}</loc><lastmod>2026-11-09</lastmod>{alts}</url>'
    s = s.replace('</urlset>', extra + '\n</urlset>')
    open(p, 'w').write(s)

if __name__ == '__main__':
    src = open(os.path.join(ROOT, 'index.html')).read()
    for n, code in enumerate(LANGS):
        jp = os.path.join(ROOT, '_i18n', f'{code}.json')
        T = json.load(open(jp))
        for k, v in PAGE_T.items(): T[k] = v[n]
        json.dump(T, open(jp, 'w'), ensure_ascii=False, indent=1, sort_keys=True)
    for slug, title, desc, chip, h1, lead, secs in PAGES:
        en = lang_menu(build_english(src, slug, title, desc, chip, h1, lead, secs), slug)
        open(os.path.join(ROOT, f'{slug}.html'), 'w').write(en)
        for code in LANGS:
            T = json.load(open(os.path.join(ROOT, '_i18n', f'{code}.json')))
            out, missing = translate_page(en, code, T)
            out = lang_menu(localize(out, code, slug), slug)
            for en_text in (title, desc, chip):  # the page's own name in its structured data
                out = out.replace(json.dumps(en_text, ensure_ascii=False), json.dumps(T.get(en_text, en_text), ensure_ascii=False))
            open(os.path.join(ROOT, code, f'{slug}.html'), 'w').write(out)
            print(slug, code, 'untranslated:', sorted(missing) if missing else 'none')
    # The translated homepages link to the translated pages.
    for code in LANGS:
        hp = os.path.join(ROOT, code, 'index.html')
        h = open(hp).read()
        for slug, *_ in PAGES:
            h = h.replace(f'href="/{slug}"', f'href="/{code}/{slug}"')
        open(hp, 'w').write(h)
    write_sitemap()
