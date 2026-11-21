"""Coverage radar: which of 17 study fields the two Kompas apps address (0-4). Run: python3 kompas/tools/coverage_radar.py
New offers need an entry in the mapping below (or a `field` key, see backlog CW1)."""
import json,glob,re,collections
import sys,pathlib
R=str(pathlib.Path(__file__).resolve().parent.parent)+'/'
AX=[('MED','Medycyna i zdrowie'),('PSY','Psychologia i nauki społeczne'),('EDU','Pedagogika i edukacja'),('INF','Informatyka, dane, AI'),
('ENG','Inżynieria i technika'),('BUD','Budownictwo i architektura'),('SCI','Nauki ścisłe'),('BIO','Przyroda i środowisko'),
('ECO','Ekonomia i biznes'),('LAW','Prawo i administracja'),('LNG','Języki i filologie'),('HUM','Historia, filozofia, kultura'),
('MEDIA','Media i komunikacja'),('ART','Sztuka i design'),('SPO','Sport'),('SEC','Bezpieczeństwo i obronność'),('TUR','Turystyka i usługi')]
# --- Studia
off=json.load(open(R+'studia/data/db/pl/krakow/offers.json'))
S={}
def put(ids,ax):
    for i in ids.split(): S[i]=ax
put('ujcm-lekarski ujcm-pielegniarstwo ujcm-ratownictwo ujcm-poloznictwo ujcm-zdrowie-publiczne ujcm-fizjoterapia ujcm-farmacja ujcm-analityka ujcm-elektroradiologia ujcm-lekarsko-dentystyczny awf-fizjoterapia uafm-fizjoterapia uafm-lekarski uafm-pielegniarstwo uafm-ratownictwo ksm-technik-farmaceutyczny ksm-elektroradiolog ksm-dentystyczny ksm-higienistka ksm-asystentka','MED')
put('uj-psychologia uken-psychologia uj-europeistyka uek-stosunki','PSY')
put('uj-logopedia uken-logopedia uken-pedagogika uj-polonistyka-nauczycielska uken-pedagogika-przedszkolna uken-pedagogika-specjalna','EDU')
put('agh-informatyka agh-cyber agh-iiad pk-informatyka uek-informatyka-stosowana uken-cyber uj-informatyka uj-informatyka-analityczna','INF')
put('agh-automatyka agh-energetyka agh-elektrotechnika agh-inz-biomed pk-energetyka pk-transport pk-automatyka','ENG')
put('pk-architektura pk-budownictwo agh-budownictwo uek-gospodarka-przestrzenna','BUD')
put('agh-fizyka-medyczna agh-fizyka-techniczna','SCI')
put('ug-oceanografia','BIO')
put('prz-lotnictwo pk-mibm agh-mibm uek-zip uek-jakosc','ENG')
put('uek-turystyka','TUR')
put('uj-historia-sztuki','HUM')
put('ur-biotechnologia ur-woda pk-inz-srodowiska agh-iios','BIO')
put('uek-finanse uek-marketing uek-zarzadzanie uek-msg uken-ekonomia uek-gbs uek-przedsiebiorczosc uek-innowacje-biznes agh-ekonometria','ECO')
put('zse1-administracja uj-prawo uj-administracja uek-prawo uek-administracja','LAW')
put('uj-filologia-angielska uj-filologia-germanska uj-filologia-ukrainska uken-filologia-angielska uj-jpks','LNG')
put('uj-dziennikarstwo ignatianum-dziennikarstwo uken-pr uj-film-nowe-media agh-gry agh-informatyka-spoleczna agh-kulturoznawstwo','MEDIA')
put('asp-architektura-wnetrz asp-wzornictwo uken-design uken-komunikacja-wizualna','ART')
put('awf-wf awf-sport','SPO')
put('uken-bezpieczenstwo uj-bezpieczenstwo sapsp-pozarnictwo','SEC')
for o in off:
    if o.get('field'): S[o['id']]=o['field']
miss=[o['id'] for o in off if o['id'] not in S]; assert not miss,miss
sc=collections.Counter(S[o['id']] for o in off)
# own Studia cards by axis
S_card={'MED':['medycyna','pielegniarstwo','rehabilitacja','farmacja','zywienie'],'PSY':['psychologia','ue','ukraina','spoleczenstwo'],'EDU':['mowa','edukacja'],'INF':['software','cyber','dane-medyczne'],
'ENG':['energetyka','atom','automatyka','inz-biomed','lotnictwo','mechanika'],'BUD':['architektura','geografia'],'SCI':['laboratorium','nauka'],'BIO':['woda','morze','weterynaria'],'ECO':['finanse','handel','logistyka'],'LAW':['prawo'],'LNG':['jezyki'],'HUM':['historia-sztuki','historia'],
'MEDIA':['media','media-cyfrowe'],'ART':['projektowanie','sztuka-scena'],'SPO':['sport'],'SEC':['sluzby','obronnosc'],'TUR':['turystyka']}
# --- Liceum
cardax={'biologia':['MED'],'chemia':['SCI'],'fizyka':['SCI'],'dane-ai':['INF','SCI'],'programowanie':['INF'],'cyber':['INF'],'elektronika':['ENG'],'srodowisko':['BIO'],
'jezyki':['LNG'],'biznes':['ECO'],'budowa':['BUD'],'sport':['SPO'],'ludzie':['PSY','EDU'],'spoleczenstwo':['HUM']}
techmap=[('analityk','SCI'),('aran','ART'),('krajobraz','BIO'),('automatyk','ENG'),('awionik','ENG'),('budownictwa','BUD'),('cyberbezp','INF'),('ekonomista','ECO'),('portów','ECO'),
('elektromob','ENG'),('elektronik','ENG'),('elektryk','ENG'),('geodeta','BUD'),('geolog','BIO'),('nieruchom','ECO'),('handlowiec','ECO'),('hotel','TUR'),('informatyk','INF'),('logistyk','ECO'),
('mechanik','ENG'),('mechatronik','ENG'),('ochrony środ','BIO'),('turystyki','TUR'),('pojazd','ENG'),('programista','INF'),('rachunk','ECO'),('reklamy','MEDIA'),('renowac','BUD'),('robotyk','ENG'),
('drewna','ENG'),('kosmet','SCI'),('teleinf','INF'),('odnawialnej','ENG'),('żywienia','TUR')]
extra=[('mundur|wojsk|policj|bezpiecze','SEC'),('turystycz|hotel','TUR'),('artystycz|architekt|wnętrz','ART'),('medialn','MEDIA'),('prawn|prawo','LAW'),('lingwistyczn|medialn','MEDIA') if False else ('medialn','MEDIA'),('pedagog|psycholog','EDU'),
('humanistycz|hist-|pol-hist|hist-pol|łac','HUM'),('medycz|prozdrowot|promocja zdrowia','MED'),('game dev','INF')]
# Liceum (CW1, v2.10): every direction has `field` (list of codes, first = main field) and every class has `fields`.
# `python3 kompas/tools/coverage_radar.py --fill` writes `fields` for classes that have none, from the rules below.
LOPP=json.load(open(R+'liceum/data/opportunities.json'))
dirfield={o['id']:o.get('field') or cardax.get(o['id'],[]) for o in LOPP}
def class_fields(s,c):
    axs=[]
    def add(a):
        if a not in axs: axs.append(a)
    if s['type']=='technikum':
        lab=c['label'].lower(); m=[a for k,a in techmap if k in lab]; assert m,lab; add(m[0])
    else:
        for k in c['cards']:
            for a in cardax.get(k,dirfield.get(k,[])[:1]): add(a)
        for pat,a in extra:
            if re.search(pat,c['label'],re.I): add(a)
    return axs
FILL='--fill' in sys.argv
L=collections.Counter(); Lcls=0; Ltech=0; seen=collections.defaultdict(set); nofield=[]
for f in sorted(glob.glob(R+'liceum/data/db/pl/*/schools.json')):
    sch=json.load(open(f)); changed=False
    for s in sch:
        for c in s['classes']:
            Lcls+=1
            if s['type']=='technikum': Ltech+=1
            if 'fields' not in c:
                if FILL: c['fields']=class_fields(s,c); changed=True
                else: nofield.append(s['id']+' '+c['code'])
            axs=set(c.get('fields') or class_fields(s,c))
            for a in axs: L[a]+=1; seen[a].add(s['id'])
    if changed: open(f,'w').write(json.dumps(sch,ensure_ascii=False,indent=1)+'\n')
if nofield: print('classes without `fields` (run with --fill):',len(nofield))
L_card={k:[o for o,fs in dirfield.items() if k in fs] for k,_ in AX}
# 'shared' card (one card covers several axes) counts as partial
# a field is 'shared' when every direction that has it serves 3+ fields and has another main field
shared={k for k,_ in AX if L_card[k] and all(len(dirfield[o])>=3 and dirfield[o][0]!=k for o in L_card[k])}
sharedS=set()  # SCI got its own card 'nauka' in Studia 2.9
def level(n,cards,hi,is_shared=False):
    if n==0 and not cards: return 0
    if is_shared and cards: return 2 if n>0 else 2
    if not cards: return 1 if n>0 else 0
    if n>=hi: return 4
    if n>=3: return 3
    return 2
out=[]
for k,name in AX:
    sn=sc.get(k,0); ln=L.get(k,0)
    sl=level(sn,S_card[k],8,is_shared=(k in sharedS)); ll=level(ln,L_card[k],15,is_shared=(k in shared))
    out.append(dict(k=k,name=name,studia_n=sn,studia_cards=S_card[k],studia_level=sl,liceum_n=ln,liceum_cards=L_card[k],liceum_level=ll))
print(f'Kompas coverage radar. Studia: {len(off)} offers, {len(json.load(open(R+'studia/data/opportunities.json')))} cards. Liceum: {Lcls} classes (technikum {Ltech}), {len(json.load(open(R+'liceum/data/opportunities.json')))} directions.')
print('Level: 0 none | 1 data rows only, no own direction | 2 shared or thin direction | 3 own direction + 3 or more items | 4 own direction + 8+ programmes / 15+ classes')
print()
print('| Field | Studia items | Studia level | Liceum items | Liceum level |')
print('|---|---|---|---|---|')
for o in out: print(f"| {o['name']} | {o['studia_n']} | {o['studia_level']} | {o['liceum_n']} | {o['liceum_level']} |")
low=[o['name'] for o in out if min(o['studia_level'],o['liceum_level'])<3]
print()
print('Below level 3 in at least one app:',', '.join(low))
