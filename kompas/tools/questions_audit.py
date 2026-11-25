#!/usr/bin/env python3
"""Kompas Liceum questions audit (backlog Q1a, v2.9). Read-only: counts worlds, activity cards, situations, strengths and
directions per field, so the balance can be discussed before Q1 changes any card.
Usage (repo root): python3 kompas/tools/questions_audit.py
The field of each item is set by hand below (FIELD_*); 'ogólne' = style or skill that fits every field."""
import json
from pathlib import Path

K = Path(__file__).resolve().parents[1]
q = json.loads((K / 'liceum/data/questions.json').read_text())
cards = json.loads((K / 'liceum/data/opportunities.json').read_text())
strengths = json.loads((K / 'core/strengths.json').read_text())

FIELDS = ['nauki ścisłe/IT', 'języki', 'ekonomia i biznes', 'socjologia i psychologia', 'prawo i media', 'sztuka',
          'sport', 'opieka i zdrowie', 'praca rękami', 'ogólne']
S, L, E, P, M, A, SP, C, H, G = FIELDS
FIELD_WORLD = {'tech': S, 'natura': S, 'jezyki': L, 'biznes': E, 'ludzie': P, 'spoleczenstwo': M, 'sport': SP, 'budowa': H, 'sztuka': A, 'mechanika': H, 'transport': E,
              'mundurowe': SP, 'turystyka': L, 'rolnictwo': S}
FIELD_ACT = {'a1': S, 'a2': H, 'a3': S, 'a4': S, 'a5': S, 'a6': C, 'a7': S, 'a8': S, 'a9': P, 'a10': G, 'a11': S, 'a12': A,
             'a13': S, 'a14': S, 'a15': S, 'a16': C, 'a17': S, 'a18': G, 'a19': S, 'a20': H, 'a21': E, 'a22': G,
             'b1': L, 'b2': L, 'b3': L, 'b4': E, 'b5': E, 'b6': E, 'b7': H, 'b8': H, 'b9': H, 'b10': SP, 'b11': SP, 'b12': SP,
             'b13': P, 'b14': P, 'b15': P, 'b16': M, 'b17': M, 'b18': M,
             'c1': A, 'c2': A, 'c3': A, 'c4': A, 'c5': A, 'h1': C, 'h2': C, 'l1': M, 'l2': M, 'm1': M, 'm2': M,  # v2.10
             'k1': H, 'k2': H, 'k3': H, 't1': E, 't2': E, 't3': E,  # v2.11
             'u1': SP, 'u2': SP, 'u3': SP, 'g1': L, 'g2': H, 'g3': E,  # v2.12 (mundurowe in sport, turystyka in języki)
             'r1': H, 'r2': S, 'r3': H}  # v2.13 (rolnictwo: hands-on work and food science)
FIELD_STR = {'wytrwalosc': G, 'spokoj': G, 'logika': S, 'tlumaczenie': P, 'empatia': P, 'dokladnosc': G, 'ciekawosc': G,
             'zespol': G, 'dyscyplina': G, 'kondycja': SP, 'jezyki': L, 'szybka_nauka': G, 'organizowanie': E,
             'pomyslowosc': G, 'odpowiedzialnosc': G, 'rysunek': A, 'przekonywanie': E, 'orientacja': H, 'oko': A}
FIELD_CARD = {'programowanie': S, 'cyber': S, 'dane-ai': S, 'elektronika': S, 'fizyka': S, 'chemia': S, 'srodowisko': S,
              'biologia': S, 'zdrowie': C, 'jezyki': L, 'biznes': E, 'ludzie': P, 'spoleczenstwo': M, 'prawo': M, 'media': M,
              'sport': SP, 'budowa': H, 'sztuka': A, 'mechanika': H, 'transport': E,
              'mundurowe': SP, 'turystyka': L, 'rolnictwo': S}

def count(items, key, table):
    c = {f: 0 for f in FIELDS}
    for x in items:
        if x[key] not in table: raise SystemExit(f'not classified: {x[key]}')
        c[table[x[key]]] += 1
    return c

acts = q['activities']
rows = {
    'światy': count(q['worlds'], 'id', FIELD_WORLD),
    'czynności (wszystkie)': count(acts, 'id', FIELD_ACT),
    'czynności: wspólny rdzeń': count([a for a in acts if not a.get('worlds')], 'id', FIELD_ACT),
    'sytuacje': {f: (len(q['situations']) if f == G else 0) for f in FIELDS},  # they measure work style, not field
    'mocne strony': count(strengths, 'id', FIELD_STR),
    'kierunki': count(cards, 'id', FIELD_CARD),
}
print('| | ' + ' | '.join(FIELDS) + ' | razem |')
print('|---' * (len(FIELDS) + 2) + '|')
for name, c in rows.items():
    print(f'| {name} | ' + ' | '.join(str(c[f]) for f in FIELDS) + f' | {sum(c.values())} |')
per_world = {w['id']: sum(1 for a in acts if w['id'] in (a.get('worlds') or [])) for w in q['worlds']}
print('\nczynności na świat:', ', '.join(f'{k} {v}' for k, v in per_world.items()))
