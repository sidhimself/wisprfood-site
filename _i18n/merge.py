"""Writes _i18n/<lang>.json for the landing page: the strings in
landing_strings.py first, then earlier site translations, then the app's
own catalogs (dish names, reviews, weekdays) from the web app's public/i18n.
Usage: python3 _i18n/merge.py KEYS.json OLD_DIR APP_I18N_DIR"""
import glob, json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from landing_strings import T, SAME
keys_path, old_dir, app_dir = sys.argv[1:4]
keys = json.load(open(keys_path))
LANGS = ['es', 'fr', 'de', 'da', 'pl']
src = open(os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'index.html')).read()
prices = sorted(set(re.findall(r'\$\d+\.\d\d', src)))
for n, lang in enumerate(LANGS):
    old = json.load(open(os.path.join(old_dir, f'{lang}.json')))
    app = {}
    for f in glob.glob(os.path.join(app_dir, f'*.{lang}.json')):
        app.update({k: v for k, v in json.load(open(f)).items() if isinstance(v, str)})
    out, missing = {}, []
    for k in keys:
        if k in T: out[k] = T[k][n]
        elif k in SAME: out[k] = k
        elif k in old: out[k] = old[k]
        elif k in app: out[k] = app[k]
        else: missing.append(k)
    for p in prices:
        out[p] = p[1:].replace('.', ',') + ' €'
    json.dump(out, open(os.path.join(os.path.dirname(__file__), f'{lang}.json'), 'w'), ensure_ascii=False, indent=1, sort_keys=True)
    print(lang, len(out), 'missing:', missing)
