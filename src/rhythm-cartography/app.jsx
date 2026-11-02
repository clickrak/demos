import React, { useState, useRef, useEffect, useMemo } from "react";

/* ============================================================
   RHYTHM CARTOGRAPHY — an interactive map of electronic music
   1973 → 2020s · tap a node · hear its groove
   ============================================================ */

const LANES = [
  { id: "pop", name: "Synth / Pop", color: "#FF7AC6" },
  { id: "house", name: "House", color: "#FFB03A" },
  { id: "techno", name: "Techno / Hard", color: "#FF4D4D" },
  { id: "trance", name: "Trance", color: "#B98BFF" },
  { id: "bass", name: "Breaks / Bass", color: "#3DE1AD" },
  { id: "head", name: "Ambient / Head", color: "#5BB8FF" },
];

/* pattern strings: 16 steps. kick/snare/hat/ohat use "1"=hit.
   bass: 0=rest 1=root 2=octave 3=fifth 4=minor third */
const G = [
  { id:"dub", name:"Dub", year:1973, lane:"head", j:-34, bpm:75, swing:0,
    desc:"Jamaican engineers remixed reggae into echo-drenched instrumentals. The blueprint for remixing, bass culture and the 'space' in all dance music.",
    track:["King Tubby","Dub Fi Gwan"], gear:"Roland Space Echo RE-201", demo:"echo",
    icon:"tape", delay:0.5, bass:"sub", root:55,
    p:["0000000010000000","0000000010000000","0010001000100010","0000000000000000","1000000000101000"], parents:[] },

  { id:"disco", name:"Disco (electronic)", year:1976, lane:"pop", j:20, bpm:118, swing:0,
    desc:"Giorgio Moroder put a sequencer under Donna Summer and invented the machine dancefloor. Four-on-the-floor starts here.",
    track:["Donna Summer","I Feel Love"], gear:"Moog Modular sequencer", demo:"moog",
    icon:"synth", delay:0, bass:"saw", root:82,
    p:["1000100010001000","0000100000001000","1010101010101010","0010001000100010","1212121212121212"], parents:[] },

  { id:"synthpop", name:"Synth-pop", year:1978, lane:"pop", j:-28, bpm:120, swing:0,
    desc:"Kraftwerk showed that machines could write pop songs. Cold, precise, melodic — the seed of almost everything below.",
    track:["Kraftwerk","The Model"], gear:"Vocoder + Minimoog", demo:"vocoder",
    icon:"synth", delay:0.12, bass:"square", root:65,
    p:["1000100010001000","0000100000001000","1010101010101010","0000000000000000","1010101010101010"], parents:[] },

  { id:"electro", name:"Electro", year:1982, lane:"bass", j:-30, bpm:108, swing:0,
    desc:"Hip-hop meets Kraftwerk: the TR-808 becomes a lead instrument. Robotic funk for breakdancers.",
    track:["Afrika Bambaataa","Planet Rock"], gear:"Roland TR-808", demo:"k808",
    icon:"drum", delay:0.15, bass:"sub", root:55,
    p:["1000001000010010","0000100000001000","1011101010111010","0000000000000010","1000000030000000"], parents:["synthpop","disco"] },

  { id:"house", name:"Chicago House", year:1984, lane:"house", j:0, bpm:120, swing:0,
    desc:"Disco rebuilt by DJs with drum machines in Chicago clubs. Kick on every beat, hats off-beat — the eternal template.",
    track:["Marshall Jefferson","Move Your Body"], gear:"Roland TR-909", demo:"k909",
    icon:"drum", delay:0.1, bass:"saw", root:65,
    p:["1000100010001000","0000100000001000","1111111111111111","0010001000100010","0010001000100010"], parents:["disco"] },

  { id:"detroit", name:"Detroit Techno", year:1985, lane:"techno", j:-26, bpm:128, swing:0,
    desc:"Futurist soul from Detroit: house's pulse with sci-fi strings and melancholy. 'Like Kraftwerk and George Clinton stuck in an elevator.'",
    track:["Derrick May","Strings of Life"], gear:"Juno-106 strings", demo:"strings",
    icon:"synth", delay:0.12, bass:"saw", root:73,
    p:["1000100010001000","0000000000000000","1111111111111111","0010001000100010","1000201000103000"], parents:["electro","synthpop"] },

  { id:"ebm", name:"EBM / Industrial", year:1984, lane:"techno", j:32, bpm:125, swing:0,
    desc:"Belgian and German body music: militant sequencer basslines and shouted vocals. The aggressive branch of the synth family.",
    track:["Front 242","Headhunter"], gear:"Korg MS-20", demo:"ms20",
    icon:"synth", delay:0, dist:0.3, bass:"square", root:55,
    p:["1000100010001000","0000100000001000","0010001000100010","0000000000000000","1110111011101110"], parents:["synthpop"] },

  { id:"acid", name:"Acid House", year:1987, lane:"house", j:-32, bpm:122, swing:0,
    desc:"A cheap, 'failed' bass machine — the TB-303 — misused until it squelched. Its liquid gurgle triggered the rave explosion.",
    track:["Phuture","Acid Tracks"], gear:"Roland TB-303", demo:"acid",
    icon:"acid", delay:0.15, bass:"acid", root:65,
    p:["1000100010001000","0000100000001000","1111111111111111","0010001000100010","1013204110132041"], parents:["house"] },

  { id:"ambient", name:"Ambient House", year:1989, lane:"head", j:0, bpm:100, swing:0,
    desc:"Chill-out rooms for tired ravers: beats slowed down, samples floating in reverb. Music to come down to.",
    track:["The Orb","Little Fluffy Clouds"], gear:"E-mu sampler + pads", demo:"pad",
    icon:"laptop", delay:0.4, bass:"sub", root:55,
    p:["1000000010000000","0000100000000000","0010001000100010","0000000000000010","1000000000003000"], parents:["house","dub"] },

  { id:"bbhc", name:"Breakbeat Hardcore", year:1991, lane:"bass", j:0, bpm:140, swing:0,
    desc:"UK ravers sped up hip-hop breakbeats, added piano stabs and cartoon samples. Chaotic, euphoric, and very fast very quickly.",
    track:["The Prodigy","Charly"], gear:"Akai S950 sampler", demo:"stab",
    icon:"sampler", delay:0.1, bass:"sub", root:55,
    p:["1001000000100100","0000100100001001","1010101010101010","0000000000000010","1000001010000010"], parents:["acid","electro"] },

  { id:"jungle", name:"Jungle", year:1993, lane:"bass", j:-34, bpm:160, swing:0,
    desc:"Chopped Amen breaks over dub bass weight — Caribbean soundsystem culture colliding with rave. Rhythmically the wildest music here.",
    track:["Shy FX","Original Nuttah"], gear:"The Amen break", demo:"amen",
    icon:"sampler", delay:0.25, bass:"sub", root:49,
    p:["1000000000100000","0000100100001010","1011101110111011","0000000000000000","1000000000001000"], parents:["bbhc","dub"] },

  { id:"dnb", name:"Drum & Bass", year:1995, lane:"bass", j:30, bpm:174, swing:0,
    desc:"Jungle streamlined: two-step drums at 174 BPM over growling Reese bass. Still evolving 30 years later.",
    track:["Goldie","Inner City Life"], gear:"Reese bass", demo:"reese",
    icon:"wave", delay:0.15, bass:"reese", root:49,
    p:["1000000000100000","0000100000001000","1010101010101010","0000000000000010","1000000110000000"], parents:["jungle"] },

  { id:"gabber", name:"Gabber / Hardcore", year:1992, lane:"techno", j:34, bpm:180, swing:0,
    desc:"Rotterdam's answer to everything: distort the kick drum until it's a melody. Speed and aggression as a lifestyle.",
    track:["Rotterdam Termination Source","Poing"], gear:"Distorted 909 kick", demo:"gabber",
    icon:"drum", delay:0, dist:0.85, bass:"square", root:55,
    p:["1000100010001000","0000000000000000","0010001000100010","0000000000000000","0000000000000000"], parents:["detroit","ebm"] },

  { id:"trance", name:"Trance", year:1993, lane:"trance", j:-15, bpm:138, swing:0,
    desc:"German techno stretched into long hypnotic builds and emotional breakdowns. The off-beat rolling bassline is its heartbeat.",
    track:["Energy 52","Café del Mar"], gear:"Roland JP-8000 supersaw", demo:"supersaw",
    icon:"synth", delay:0.2, bass:"saw", root:65,
    p:["1000100010001000","0000000000001000","1111111111111111","0010001000100010","0110011001100110"], parents:["detroit","acid"] },

  { id:"psy", name:"Psytrance", year:1997, lane:"trance", j:25, bpm:145, swing:0,
    desc:"Born on Goa beaches: trance made weirder, faster, more alien. The rolling triplet bass never stops.",
    track:["Astral Projection","Mahadeva"], gear:"Access Virus", demo:"psy",
    icon:"acid", delay:0.18, bass:"acid", root:55,
    p:["1000100010001000","0000000000000000","0010001000100010","0000000000000000","0111011101110111"], parents:["trance","acid"] },

  { id:"idm", name:"IDM", year:1992, lane:"head", j:32, bpm:120, swing:0,
    desc:"'Intelligent dance music' — rave rhythms taken home, bent and broken for headphone listening. Aphex Twin territory.",
    track:["Aphex Twin","Windowlicker"], gear:"Laptop + trackers", demo:"glitch",
    icon:"laptop", delay:0.25, bass:"square", root:58,
    p:["1000010010000100","0001100000011010","1011011010110110","0000000000000010","1000030000420000"], parents:["detroit","ambient"] },

  { id:"triphop", name:"Trip-Hop", year:1994, lane:"head", j:-30, bpm:85, swing:0.15,
    desc:"Bristol's slow-motion blend of hip-hop, dub and cinema noir. Heavy, moody, beautiful.",
    track:["Massive Attack","Teardrop"], gear:"Akai MPC + vinyl", demo:"vinyl",
    icon:"sampler", delay:0.35, bass:"sub", root:49,
    p:["1000000000100000","0000100000001000","1010101010101010","0000000000000000","1000000000030000"], parents:["dub","electro"] },

  { id:"bigbeat", name:"Big Beat", year:1996, lane:"bass", j:-58, bpm:130, swing:0,
    desc:"Rock energy + rave breaks + huge hooks. Chemical Brothers, Fatboy Slim — the sound of the late-90s festival main stage.",
    track:["The Chemical Brothers","Block Rockin' Beats"], gear:"Sampler + fuzz", demo:"stab",
    icon:"sampler", delay:0.1, dist:0.35, bass:"saw", root:55,
    p:["1001000010010000","0000100000001000","1010101010101010","0000000000000010","1000100110001000"], parents:["bbhc","house"] },

  { id:"french", name:"French House", year:1997, lane:"house", j:34, bpm:123, swing:0,
    desc:"Paris loops old disco records through a filter and adds sidechain 'pumping'. Daft Punk made robots romantic.",
    track:["Daft Punk","One More Time"], gear:"Filter + disco loops", demo:"filterdisco",
    icon:"wave", delay:0.1, bass:"saw", root:65,
    p:["1000100010001000","0000100000001000","1111111111111111","0010001000100010","1210001012100010"], parents:["house","disco"] },

  { id:"ukg", name:"UK Garage / 2-step", year:1997, lane:"bass", j:-6, bpm:132, swing:0.28,
    desc:"US garage house given a London swing: the kick skips beats, hats shuffle, basslines bounce. Grime and dubstep's parent.",
    track:["Artful Dodger","Re-Rewind"], gear:"Korg M1 organ bass", demo:"m1",
    icon:"synth", delay:0.12, bass:"square", root:65,
    p:["1000000000100100","0000100000001000","1010110010101100","0000001000000010","1002000010020000"], parents:["house","jungle"] },

  { id:"minimal", name:"Minimal Techno", year:1996, lane:"techno", j:0, bpm:128, swing:0,
    desc:"Techno reduced to its skeleton: what can you remove and still make people dance? Robert Hood proved: almost everything.",
    track:["Robert Hood","Minus"], gear:"Stripped 909", demo:"k909",
    icon:"drum", delay:0.18, bass:"sub", root:55,
    p:["1000100010001000","0000000000000000","0010001000100010","0000000000100000","1000000000000030"], parents:["detroit"] },

  { id:"grime", name:"Grime", year:2002, lane:"bass", j:-58, bpm:140, swing:0,
    desc:"East London teenagers making icy, square-wave beats on PCs and PlayStations for MCs to spit over. Raw UK energy.",
    track:["Wiley","Eskimo"], gear:"FL Studio square waves", demo:"grime",
    icon:"laptop", delay:0.1, bass:"square", root:58,
    p:["1000001000100000","0000000010000000","0010001000100010","0000000000000000","1010000400100030"], parents:["ukg","electro"] },

  { id:"dubstep", name:"Dubstep", year:2005, lane:"bass", j:6, bpm:140, swing:0,
    desc:"Garage slowed to half-time and filled with sub-bass and space — dub's echo chamber reborn in South London. Later: the wobble.",
    track:["Skream","Midnight Request Line"], gear:"Sub bass + LFO wobble", demo:"wobble",
    icon:"wave", delay:0.3, bass:"wobble", root:49,
    p:["1000000000100000","0000000010000000","0010001000101010","0000000000000000","1001001010010010"], parents:["ukg","dub"] },

  { id:"electrohouse", name:"Electro House", year:2005, lane:"house", j:-28, bpm:128, swing:0,
    desc:"House with distorted, shouting basslines — Justice and early Deadmau5. The bridge from clubs to stadium EDM.",
    track:["Deadmau5","Ghosts 'n' Stuff"], gear:"Sidechained saw bass", demo:"esaw",
    icon:"wave", delay:0.1, dist:0.4, bass:"saw", root:55,
    p:["1000100010001000","0000100000001000","1111111111111111","0010001000100010","0111011101110111"], parents:["house","ebm"] },

  { id:"synthwave", name:"Synthwave", year:2010, lane:"pop", j:0, bpm:100, swing:0,
    desc:"The 1980s that never existed: gated reverb snares, neon grids, VHS nostalgia. Synth-pop's retro-futurist grandchild.",
    track:["Kavinsky","Nightcall"], gear:"Juno-60 + gated reverb", demo:"gated",
    icon:"synth", delay:0.2, bass:"saw", root:55,
    p:["1000100010001000","0000100000001000","1010101010101010","0000000000000000","1111111111111111"], parents:["synthpop"] },

  { id:"bigroom", name:"Big Room EDM", year:2011, lane:"house", j:30, bpm:128, swing:0,
    desc:"Festival-sized: a giant kick, a giant lead, a giant drop, hands in the air. Electronic music's stadium-pop moment.",
    track:["Martin Garrix","Animals"], gear:"Sylenth1 lead", demo:"lead",
    icon:"synth", delay:0.15, bass:"saw", root:65,
    p:["1000100010001000","0000100000001000","0010001000100010","0010001000100010","1000100010001000"], parents:["electrohouse","trance"] },

  { id:"trap", name:"Trap (EDM)", year:2012, lane:"bass", j:34, bpm:140, swing:0,
    desc:"Southern hip-hop's 808s and hi-hat rolls crossed with rave drops. Half-time snare, sub-bass you feel in your chest.",
    track:["Baauer","Harlem Shake"], gear:"808 sub + hat rolls", demo:"k808",
    icon:"drum", delay:0.1, bass:"sub", root:46,
    p:["1000000100100000","0000000010000000","1010101011111010","0000000000000010","1000000000003000"], parents:["dubstep","electro"] },

  { id:"futurebass", name:"Future Bass", year:2014, lane:"bass", j:-32, bpm:150, swing:0,
    desc:"Trap's rhythm with big, warm, wobbling major chords instead of aggression. The 'kawaii' friendly face of bass music.",
    track:["Flume","Never Be Like You"], gear:"Serum chord stabs", demo:"chords",
    icon:"wave", delay:0.25, bass:"saw", root:65,
    p:["1000000000100000","0000000010000000","1010101010101010","0000001000000010","1000300010004000"], parents:["trap","dubstep"] },

  { id:"techhouse", name:"Tech House", year:2015, lane:"house", j:2, bpm:126, swing:0.1,
    desc:"House's groove with techno's toughness and a rolling bassline. The default sound of 2010s–20s clubs worldwide.",
    track:["Fisher","Losing It"], gear:"Rolling bassline", demo:"esaw",
    icon:"drum", delay:0.12, bass:"square", root:55,
    p:["1000100010001000","0000100000001000","1111111111111111","0010001000100010","0010011000100110"], parents:["house","minimal"] },

  { id:"melodic", name:"Melodic Techno", year:2016, lane:"techno", j:-30, bpm:122, swing:0,
    desc:"Minimal's discipline plus trance's emotion: dark, cinematic arpeggios for sunset stages. Tale Of Us, Anyma.",
    track:["Tale Of Us","Monument"], gear:"Analog arpeggiator", demo:"arp",
    icon:"synth", delay:0.3, bass:"saw", root:55,
    p:["1000100010001000","0000000000001000","0010001000100010","0000000000000000","1310131013101310"], parents:["minimal","trance"] },

  { id:"hyperpop", name:"Hyperpop", year:2019, lane:"pop", j:30, bpm:160, swing:0,
    desc:"Pop pushed past breaking point: pitched vocals, crushed 808s, everything too loud and too fast on purpose. Internet-native maximalism.",
    track:["100 gecs","money machine"], gear:"Pitched vocals + clipped 808", demo:"hyper",
    icon:"laptop", delay:0.15, dist:0.5, bass:"square", root:65,
    p:["1000010010100000","0000100000001001","1110111011101110","0000000000000010","1000200010004000"], parents:["synthpop","futurebass"] },

  { id:"amapiano", name:"Amapiano", year:2019, lane:"house", j:-56, bpm:112, swing:0.12,
    desc:"South Africa's gift to the 2020s: spacious, jazzy house driven by the 'log drum' — a bouncing, pitched bass percussion.",
    track:["MFR Souls","Amanikiniki"], gear:"Log drum", demo:"log",
    icon:"drum", delay:0.2, bass:"log", root:55,
    p:["1000000010000000","0000000000000000","1111111111111111","0000100000001000","0010010100101001"], parents:["house"] },

  { id:"phonk", name:"Phonk", year:2020, lane:"bass", j:-62, bpm:130, swing:0,
    desc:"Memphis rap tapes + drifting cars + a distorted cowbell melody. TikTok-era bass music with a 90s ghost inside.",
    track:["Kordhell","Murder In My Mind"], gear:"Cowbell melody", demo:"cowbell",
    icon:"drum", delay:0.15, dist:0.6, bass:"cowbell", root:110,
    p:["1000000000100100","0000100000001000","1010101010101010","0000000000000000","1011001410110014"], parents:["trap","triphop"] },
];

/* ---------- melodic lines (MIDI notes) ----------
   each: w = waveform, n = notes as [startStep, midiNote, lengthInSteps] over 16 steps */
const MEL = {
  dub:        { w:"triangle", n:[[8,64,2],[10,62,1],[12,57,3]] },
  disco:      { w:"sawtooth", n:[[0,72,1],[2,72,1],[4,79,1],[6,76,1],[8,72,1],[10,74,1],[12,76,1],[14,79,1]] },
  synthpop:   { w:"square",   n:[[0,69,2],[2,71,1],[4,72,2],[8,71,2],[10,69,1],[12,64,3]] },
  electro:    { w:"square",   n:[[0,62,1],[3,65,1],[6,62,1],[8,69,1],[11,65,1],[14,60,1]] },
  house:      { w:"sawtooth", n:[[2,72,1],[6,72,1],[10,74,1],[14,72,1]] },
  detroit:    { w:"sawtooth", n:[[0,74,1],[1,77,1],[4,74,2],[8,72,1],[9,76,1],[12,72,2]] },
  ebm:        { w:"square",   n:[[0,57,1],[4,57,1],[6,60,1],[8,57,1],[12,55,1]] },
  acid:       { w:"square",   n:[[0,77,1],[2,75,1],[4,72,1],[8,77,1],[10,80,1],[12,72,1]] },
  ambient:    { w:"triangle", n:[[0,64,8],[8,62,8]] },
  bbhc:       { w:"sawtooth", n:[[0,72,1],[1,74,1],[2,77,1],[4,77,2],[8,76,1],[10,74,1],[12,72,2]] },
  jungle:     { w:"triangle", n:[[0,61,3],[10,59,2],[13,56,2]] },
  dnb:        { w:"triangle", n:[[0,62,4],[8,65,4],[12,67,4]] },
  gabber:     { w:"sawtooth", n:[[0,57,1],[2,57,1],[4,60,1],[6,57,1],[8,63,1],[10,62,1],[12,60,2]] },
  trance:     { w:"sawtooth", n:[[0,69,1],[2,72,1],[4,76,1],[6,72,1],[8,69,1],[10,72,1],[12,76,1],[14,81,1]] },
  psy:        { w:"square",   n:[[0,74,1],[1,73,1],[2,74,1],[4,77,1],[6,74,1],[8,79,1],[10,77,1],[12,74,1],[14,73,1]] },
  idm:        { w:"triangle", n:[[0,66,1],[3,73,1],[5,64,1],[9,71,2],[13,62,1]] },
  triphop:    { w:"triangle", n:[[0,63,3],[6,62,2],[8,58,4],[14,55,2]] },
  bigbeat:    { w:"sawtooth", n:[[0,57,1],[2,60,1],[4,62,1],[6,60,1],[8,57,2],[12,63,2]] },
  french:     { w:"sawtooth", n:[[2,76,1],[6,74,1],[10,76,1],[14,79,1]] },
  ukg:        { w:"triangle", n:[[0,72,1],[3,74,1],[7,76,1],[10,74,1],[14,72,1]] },
  minimal:    { w:"sine",     n:[[4,84,1],[12,86,1]] },
  grime:      { w:"square",   n:[[0,70,1],[3,67,1],[6,63,1],[8,70,1],[11,72,1],[14,63,1]] },
  dubstep:    { w:"triangle", n:[[0,61,2],[8,63,2],[12,58,3]] },
  electrohouse:{w:"sawtooth", n:[[0,67,1],[2,67,1],[4,70,1],[6,67,1],[8,72,1],[10,70,1],[12,67,2]] },
  synthwave:  { w:"sawtooth", n:[[0,69,2],[4,72,2],[8,76,2],[12,74,4]] },
  bigroom:    { w:"sawtooth", n:[[0,76,1],[2,76,1],[4,76,1],[6,79,1],[8,76,1],[10,74,1],[12,72,2]] },
  trap:       { w:"sine",     n:[[0,72,2],[6,75,1],[8,70,2],[12,67,2]] },
  futurebass: { w:"sawtooth", n:[[0,76,2],[4,77,2],[8,79,3],[12,84,3]] },
  techhouse:  { w:"square",   n:[[2,72,1],[6,70,1],[10,74,1],[14,70,1]] },
  melodic:    { w:"sawtooth", n:[[0,69,1],[2,72,1],[4,74,1],[6,76,1],[8,74,1],[10,72,1],[12,69,1],[14,67,1]] },
  hyperpop:   { w:"square",   n:[[0,84,1],[2,88,1],[4,84,1],[6,91,1],[8,89,1],[10,88,1],[12,84,2]] },
  amapiano:   { w:"triangle", n:[[0,72,2],[5,76,2],[8,74,2],[13,69,2]] },
  phonk:      { w:"triangle", n:[[0,62,4],[8,61,4],[12,58,4]] },
};
const MELODY = { on: true }; // live flag read by the scheduler

/* ---------- layout ---------- */
const X0 = 60, XW = 23, LANE_H = 118, TOP = 46;
const xOf = y => X0 + (y - 1972) * XW;
const laneY = id => TOP + LANES.findIndex(l => l.id === id) * LANE_H + LANE_H / 2;
const posOf = g => ({ x: xOf(g.year), y: laneY(g.lane) + (g.j || 0) });
const laneColor = id => LANES.find(l => l.id === id).color;
const MAP_W = xOf(2026) + 60, MAP_H = TOP + LANES.length * LANE_H + 10;

/* ---------- audio engine ---------- */
let CTX = null;
function ctx() {
  if (!CTX) CTX = new (window.AudioContext || window.webkitAudioContext)();
  if (CTX.state === "suspended") CTX.resume();
  return CTX;
}
function distCurve(k) {
  const n = 256, c = new Float32Array(n);
  for (let i = 0; i < n; i++) { const x = (i / (n - 1)) * 2 - 1; c[i] = Math.tanh(x * (1 + k * 20)); }
  return c;
}
function master(a, dist = 0) {
  const comp = a.createDynamicsCompressor();
  comp.threshold.value = -14; comp.ratio.value = 6;
  let inNode = comp;
  if (dist > 0) { const ws = a.createWaveShaper(); ws.curve = distCurve(dist); ws.connect(comp); inNode = ws; }
  comp.connect(a.destination);
  return inNode;
}
function delaySend(a, out, amt) {
  const d = a.createDelay(1); d.delayTime.value = 0.28;
  const fb = a.createGain(); fb.gain.value = 0.42;
  const wet = a.createGain(); wet.gain.value = amt;
  const flt = a.createBiquadFilter(); flt.type = "lowpass"; flt.frequency.value = 2400;
  d.connect(flt); flt.connect(fb); fb.connect(d); flt.connect(wet); wet.connect(out);
  return d;
}
function env(a, t, g0, len) { const g = a.createGain(); g.gain.setValueAtTime(g0, t); g.gain.exponentialRampToValueAtTime(0.001, t + len); return g; }
function noiseBuf(a) {
  if (!noiseBuf.b) { const b = a.createBuffer(1, a.sampleRate, a.sampleRate), d = b.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noiseBuf.b = b; }
  return noiseBuf.b;
}
function kick(a, t, out, hard) {
  const o = a.createOscillator(); o.type = "sine";
  o.frequency.setValueAtTime(hard ? 220 : 150, t);
  o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
  const g = env(a, t, hard ? 1.2 : 0.95, hard ? 0.34 : 0.42);
  o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.5);
}
function snare(a, t, out) {
  const s = a.createBufferSource(); s.buffer = noiseBuf(a);
  const f = a.createBiquadFilter(); f.type = "bandpass"; f.frequency.value = 1800; f.Q.value = 0.7;
  const g = env(a, t, 0.5, 0.16);
  s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 0.2);
  const o = a.createOscillator(); o.type = "triangle"; o.frequency.value = 185;
  const g2 = env(a, t, 0.32, 0.1); o.connect(g2); g2.connect(out); o.start(t); o.stop(t + 0.12);
}
function hat(a, t, out, open) {
  const s = a.createBufferSource(); s.buffer = noiseBuf(a);
  const f = a.createBiquadFilter(); f.type = "highpass"; f.frequency.value = 7500;
  const g = env(a, t, 0.22, open ? 0.28 : 0.045);
  s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + (open ? 0.32 : 0.07));
}
const SEMI = s => Math.pow(2, s / 12);
function bassNote(a, t, out, type, root, deg, stepDur) {
  const mul = { 1: 1, 2: 2, 3: SEMI(7), 4: SEMI(3) }[deg] || 1;
  const f = root * mul, len = Math.max(stepDur * 0.9, 0.1);
  const mk = (type2, det = 0) => { const o = a.createOscillator(); o.type = type2; o.frequency.value = f * SEMI(det / 100); return o; };
  if (type === "sub") {
    const o = mk("sine"); const g = env(a, t, 0.8, len * 2.2); o.connect(g); g.connect(out); o.start(t); o.stop(t + len * 2.4);
  } else if (type === "square" || type === "cowbell") {
    const o = mk("square"); const g = env(a, t, type === "cowbell" ? 0.3 : 0.4, len);
    const fl = a.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = type === "cowbell" ? 3000 : 900;
    o.connect(fl); fl.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.05);
  } else if (type === "saw") {
    const o = mk("sawtooth"); const g = env(a, t, 0.38, len);
    const fl = a.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 750;
    o.connect(fl); fl.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.05);
  } else if (type === "acid") {
    const o = mk("square"); const fl = a.createBiquadFilter(); fl.type = "lowpass"; fl.Q.value = 14;
    fl.frequency.setValueAtTime(2600, t); fl.frequency.exponentialRampToValueAtTime(220, t + len);
    const g = env(a, t, 0.34, len); o.connect(fl); fl.connect(g); g.connect(out); o.start(t); o.stop(t + len + 0.05);
  } else if (type === "reese") {
    const g = env(a, t, 0.3, len * 1.6);
    const fl = a.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = 520;
    [ -18, 18 ].forEach(d => { const o = mk("sawtooth", d); o.connect(fl); o.start(t); o.stop(t + len * 1.8); });
    fl.connect(g); g.connect(out);
  } else if (type === "wobble") {
    const o = mk("sawtooth"); const fl = a.createBiquadFilter(); fl.type = "lowpass"; fl.Q.value = 8;
    const lfo = a.createOscillator(); lfo.frequency.value = 3.5; const lg = a.createGain(); lg.gain.value = 420;
    fl.frequency.value = 480; lfo.connect(lg); lg.connect(fl.frequency);
    const g = env(a, t, 0.42, len * 1.8);
    o.connect(fl); fl.connect(g); g.connect(out); o.start(t); lfo.start(t); o.stop(t + len * 2); lfo.stop(t + len * 2);
  } else if (type === "log") {
    const o = mk("sine"); o.frequency.setValueAtTime(f * 2.2, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.06);
    const g = env(a, t, 0.85, 0.34); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.4);
  }
}

const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
function melNote(a, t, out, wave, midi, len) {
  const o = a.createOscillator(); o.type = wave; o.frequency.value = midiHz(midi);
  const fl = a.createBiquadFilter(); fl.type = "lowpass"; fl.frequency.value = wave === "sawtooth" ? 2600 : 5000;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(0.16, t + 0.015);
  g.gain.exponentialRampToValueAtTime(0.001, t + len);
  o.connect(fl); fl.connect(g); g.connect(out);
  o.start(t); o.stop(t + len + 0.1);
}

/* ---------- Standard MIDI File export (format 1, 96 ticks/quarter) ---------- */
function vlq(n) { const out = [n & 0x7f]; while ((n >>= 7) > 0) out.unshift((n & 0x7f) | 0x80); return out; }
function track(events) {
  events.sort((x, y) => x.t - y.t);
  const b = []; let last = 0;
  events.forEach(e => { b.push(...vlq(e.t - last), ...e.d); last = e.t; });
  b.push(...vlq(0), 0xff, 0x2f, 0x00);
  return [0x4d, 0x54, 0x72, 0x6b, (b.length >> 24) & 255, (b.length >> 16) & 255, (b.length >> 8) & 255, b.length & 255, ...b];
}
function buildMidi(g) {
  const TPS = 24, LOOPS = 4; // 24 ticks per 16th, loop the bar 4x
  const rootMidi = Math.round(69 + 12 * Math.log2(g.root / 440));
  const degOff = { 1: 0, 2: 12, 3: 7, 4: 3 };
  // track 0: tempo + melody (ch 0)
  const uspq = Math.round(60000000 / g.bpm);
  const ev0 = [{ t: 0, d: [0xff, 0x51, 0x03, (uspq >> 16) & 255, (uspq >> 8) & 255, uspq & 255] },
               { t: 0, d: [0xc0, 81] }]; // program: lead
  const mel = MEL[g.id];
  if (mel) for (let L = 0; L < LOOPS; L++) mel.n.forEach(([s, note, len]) => {
    const t0 = (L * 16 + s) * TPS;
    ev0.push({ t: t0, d: [0x90, note, 96] }, { t: t0 + len * TPS - 2, d: [0x80, note, 0] });
  });
  // track 1: drums (ch 10) + bass (ch 1)
  const ev1 = [{ t: 0, d: [0xc1, 38] }]; // program: synth bass
  const drumMap = [36, 38, 42, 46]; // kick snare closed-hat open-hat
  for (let L = 0; L < LOOPS; L++) for (let s = 0; s < 16; s++) {
    const t0 = (L * 16 + s) * TPS;
    for (let r = 0; r < 4; r++) if (g.p[r][s] === "1")
      ev1.push({ t: t0, d: [0x99, drumMap[r], r === 0 ? 110 : 90] }, { t: t0 + 10, d: [0x89, drumMap[r], 0] });
    const deg = +g.p[4][s];
    if (deg) { const n = rootMidi + degOff[deg];
      ev1.push({ t: t0, d: [0x91, n, 100] }, { t: t0 + TPS - 4, d: [0x81, n, 0] }); }
  }
  const hdr = [0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 1, 0, 2, 0, 96];
  return new Uint8Array([...hdr, ...track(ev0), ...track(ev1)]);
}
function downloadMidi(g) {
  const blob = new Blob([buildMidi(g)], { type: "audio/midi" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = g.id + "-" + g.bpm + "bpm.mid";
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* one-shot instrument demos */
function playDemo(kind) {
  const a = ctx(), t = a.currentTime + 0.02, out = master(a);
  const dl = delaySend(a, a.destination, 0.35);
  const chord = (freqs, type, len, g0 = 0.16) => freqs.forEach(f => {
    const o = a.createOscillator(); o.type = type; o.frequency.value = f;
    const g = env(a, t, g0, len); o.connect(g); g.connect(out); g.connect(dl); o.start(t); o.stop(t + len + 0.1);
  });
  switch (kind) {
    case "k808": { const o = a.createOscillator(); o.type = "sine"; o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(38, t + 0.5); const g = env(a, t, 1, 1.1); o.connect(g); g.connect(out); o.start(t); o.stop(t + 1.2); break; }
    case "k909": kick(a, t, out); kick(a, t + 0.25, out); kick(a, t + 0.5, out); kick(a, t + 0.75, out); break;
    case "gabber": { const w = master(a, 0.9); [0, 0.17, 0.34, 0.51].forEach(d => kick(a, t + d, w, true)); break; }
    case "acid": [[1,0],[3,0.15],[2,0.3],[4,0.45],[1,0.6]].forEach(([d, dt]) => bassNote(a, t + dt, out, "acid", 65, d, 0.14)); break;
    case "supersaw": chord([261.6, 329.6, 392, 523.2, 659.2].flatMap(f => [f * 0.994, f, f * 1.006]), "sawtooth", 1.4, 0.05); break;
    case "wobble": bassNote(a, t, out, "wobble", 49, 1, 0.9); break;
    case "reese": bassNote(a, t, out, "reese", 49, 1, 0.9); break;
    case "log": [0, 0.18, 0.42, 0.6].forEach((d, i) => bassNote(a, t + d, out, "log", 55, [1,1,3,1][i], 0.2)); break;
    case "cowbell": { const w = master(a, 0.5); [110, 130.8, 98, 110].forEach((f, i) => bassNote(a, t + i * 0.16, w, "cowbell", f, 1, 0.15)); break; }
    case "amen": { kick(a, t, out); hat(a, t + 0.09, out); snare(a, t + 0.18, out); hat(a, t + 0.27, out); snare(a, t + 0.32, out); kick(a, t + 0.45, out); snare(a, t + 0.54, out); hat(a, t + 0.63, out); break; }
    case "echo": { snare(a, t, dl); snare(a, t, out); break; }
    case "vinyl": { const s = a.createBufferSource(); s.buffer = noiseBuf(a); const f = a.createBiquadFilter(); f.type = "lowpass"; f.frequency.value = 1200; const g = env(a, t, 0.12, 1.2); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 1.3); kick(a, t + 0.2, out); snare(a, t + 0.7, out); break; }
    case "strings": chord([220, 261.6, 329.6, 440], "sawtooth", 1.8, 0.07); break;
    case "pad": chord([130.8, 196, 246.9, 329.6], "triangle", 2.4, 0.15); break;
    case "moog": [65.4, 65.4, 130.8, 65.4, 98, 65.4].forEach((f, i) => bassNote(a, t + i * 0.14, out, "saw", f, 1, 0.13)); break;
    case "ms20": [55, 55, 82.4, 55].forEach((f, i) => bassNote(a, t + i * 0.13, master(a, 0.3), "square", f, 1, 0.12)); break;
    case "vocoder": { chord([146.8, 220, 293.7], "square", 1, 0.08); const s = a.createBufferSource(); s.buffer = noiseBuf(a); const f = a.createBiquadFilter(); f.type = "bandpass"; f.Q.value = 6; f.frequency.setValueAtTime(400, t); f.frequency.linearRampToValueAtTime(2000, t + 0.9); const g = env(a, t, 0.1, 1); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 1); break; }
    case "m1": chord([130.8, 164.8, 196, 261.6], "square", 0.4, 0.1); break;
    case "stab": chord([220, 277.2, 329.6, 440], "sawtooth", 0.35, 0.14); break;
    case "grime": [1, 4, 3, 1].forEach((d, i) => bassNote(a, t + i * 0.15, out, "square", 58, d, 0.14)); break;
    case "esaw": [1, 1, 3, 1].forEach((d, i) => bassNote(a, t + i * 0.13, master(a, 0.4), "saw", 55, d, 0.12)); break;
    case "gated": { snare(a, t, out); const s = a.createBufferSource(); s.buffer = noiseBuf(a); const g = a.createGain(); g.gain.setValueAtTime(0.3, t); g.gain.setValueAtTime(0.3, t + 0.22); g.gain.setValueAtTime(0.001, t + 0.23); s.connect(g); g.connect(out); s.start(t); s.stop(t + 0.25); break; }
    case "lead": chord([523.2, 659.2, 784], "sawtooth", 0.8, 0.1); break;
    case "chords": { chord([261.6, 329.6, 392, 493.9], "sawtooth", 0.5, 0.08); chord([293.7, 370, 440, 554.4], "sawtooth", 0.5, 0.08); break; }
    case "arp": [1, 3, 2, 3, 1, 3, 2, 3].forEach((d, i) => bassNote(a, t + i * 0.11, out, "saw", 110, d, 0.1)); break;
    case "psy": [1, 1, 1].forEach((d, i) => bassNote(a, t + 0.1 + i * 0.11, out, "acid", 55, d, 0.1)); break;
    case "hyper": { const w = master(a, 0.6); chord([523.2, 659.2, 784], "square", 0.4, 0.06); bassNote(a, t + 0.1, w, "sub", 46, 1, 0.5); break; }
    case "glitch": [0, 0.07, 0.11, 0.24, 0.31].forEach((d, i) => { if (i % 2) hat(a, t + d, out); else snare(a, t + d, out); }); break;
    case "filterdisco": { const s = a.createBufferSource(); s.buffer = noiseBuf(a); const f = a.createBiquadFilter(); f.type = "lowpass"; f.Q.value = 4; f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(4000, t + 1.4); const g = env(a, t, 0.1, 1.5); s.connect(f); f.connect(g); g.connect(out); s.start(t); s.stop(t + 1.5); [0, 0.25, 0.5, 0.75, 1, 1.25].forEach(d => kick(a, t + d, out)); break; }
    default: kick(a, t, out);
  }
}

/* ---------- sequencer hook ---------- */
function useSequencer() {
  const [playing, setPlaying] = useState(null); // genre id
  const [step, setStep] = useState(-1);
  const ref = useRef({});
  const stop = () => {
    const r = ref.current;
    if (r.timer) clearInterval(r.timer);
    ref.current = {}; setPlaying(null); setStep(-1);
  };
  const play = g => {
    stop();
    const a = ctx();
    const out = master(a, g.dist || 0);
    const dl = g.delay ? delaySend(a, a.destination, g.delay) : null;
    const stepDur = 60 / g.bpm / 4;
    let next = a.currentTime + 0.06, i = 0;
    const sched = () => {
      while (next < a.currentTime + 0.12) {
        const s = i % 16, t = next + (s % 2 === 1 ? g.swing * stepDur : 0);
        const [K, S, H, O, B] = g.p;
        if (K[s] === "1") kick(a, t, out, g.dist > 0.6);
        if (S[s] === "1") { snare(a, t, out); if (dl) snare(a, t, dl); }
        if (H[s] === "1") hat(a, t, out, false);
        if (O[s] === "1") hat(a, t, out, true);
        if (B[s] !== "0") { bassNote(a, t, out, g.bass, g.root, +B[s], stepDur); if (dl && g.delay > 0.3) bassNote(a, t, dl, g.bass, g.root, +B[s], stepDur); }
        const mel = MEL[g.id];
        if (MELODY.on && mel) mel.n.forEach(([ms, note, len]) => {
          if (ms === s) { melNote(a, t, out, mel.w, note, len * stepDur); if (dl) melNote(a, t, dl, mel.w, note, len * stepDur); }
        });
        const ui = s; setTimeout(() => setStep(ui), Math.max(0, (t - a.currentTime) * 1000));
        next += stepDur; i++;
      }
    };
    sched();
    ref.current = { timer: setInterval(sched, 30) };
    setPlaying(g.id);
  };
  useEffect(() => stop, []);
  return { playing, step, play, stop };
}

/* ---------- small components ---------- */
const ICONS = {
  drum: <g><rect x="2" y="6" width="20" height="12" rx="2" fill="none" strokeWidth="1.6"/><circle cx="6" cy="12" r="1.6"/><circle cx="10" cy="12" r="1.6"/><circle cx="14" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></g>,
  acid: <g><rect x="3" y="5" width="18" height="14" rx="2" fill="none" strokeWidth="1.6"/><line x1="7" y1="9" x2="7" y2="15" strokeWidth="1.6"/><line x1="12" y1="9" x2="12" y2="15" strokeWidth="1.6"/><line x1="17" y1="9" x2="17" y2="15" strokeWidth="1.6"/><circle cx="7" cy="11" r="1.4"/><circle cx="12" cy="14" r="1.4"/><circle cx="17" cy="10" r="1.4"/></g>,
  synth: <g><rect x="2" y="7" width="20" height="10" rx="1.5" fill="none" strokeWidth="1.6"/><line x1="6" y1="12" x2="6" y2="17" strokeWidth="1.4"/><line x1="9" y1="12" x2="9" y2="17" strokeWidth="1.4"/><line x1="12" y1="12" x2="12" y2="17" strokeWidth="1.4"/><line x1="15" y1="12" x2="15" y2="17" strokeWidth="1.4"/><line x1="18" y1="12" x2="18" y2="17" strokeWidth="1.4"/></g>,
  sampler: <g><rect x="4" y="4" width="16" height="16" rx="2" fill="none" strokeWidth="1.6"/><rect x="7" y="7" width="4" height="4" rx="0.8"/><rect x="13" y="7" width="4" height="4" rx="0.8"/><rect x="7" y="13" width="4" height="4" rx="0.8"/><rect x="13" y="13" width="4" height="4" rx="0.8"/></g>,
  laptop: <g><rect x="4" y="5" width="16" height="11" rx="1.5" fill="none" strokeWidth="1.6"/><line x1="2" y1="19" x2="22" y2="19" strokeWidth="1.8"/><polyline points="8,9 10,13 12,8 14,12 16,10" fill="none" strokeWidth="1.4"/></g>,
  wave: <g><path d="M2 12 q2.5 -8 5 0 t5 0 t5 0 t5 0" fill="none" strokeWidth="1.8"/></g>,
  tape: <g><rect x="2" y="6" width="20" height="12" rx="2" fill="none" strokeWidth="1.6"/><circle cx="8" cy="12" r="2.6" fill="none" strokeWidth="1.6"/><circle cx="16" cy="12" r="2.6" fill="none" strokeWidth="1.6"/><line x1="10.6" y1="12" x2="13.4" y2="12" strokeWidth="1.4"/></g>,
};
const GearIcon = ({ kind, color }) => (
  <svg viewBox="0 0 24 24" width="26" height="26" style={{ stroke: color, fill: color }}>{ICONS[kind] || ICONS.wave}</svg>
);

const ROWS = [["Kick", 0], ["Snare", 1], ["Hi-hat", 2], ["Open hat", 3], ["Bass", 4]];
function PatternGrid({ g, playing, step, onPlay, onStop, compact }) {
  const active = playing === g.id;
  return (
    <div style={{ background: "#12162B", border: `1px solid ${laneColor(g.lane)}44`, borderRadius: 12, padding: "10px 12px", marginTop: 10 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
        <button onClick={() => (active ? onStop() : onPlay(g))}
          style={{ background: active ? laneColor(g.lane) : "transparent", color: active ? "#0B0E1A" : laneColor(g.lane),
            border: `1.5px solid ${laneColor(g.lane)}`, borderRadius: 999, padding: "5px 16px", fontWeight: 700,
            fontFamily: "inherit", fontSize: 13, cursor: "pointer" }}>
          {active ? "■ Stop" : "▶ Play groove"}
        </button>
        <span style={{ fontSize: 12, opacity: 0.75 }}>{g.name} · {g.bpm} BPM{g.swing ? " · swung" : ""}</span>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "58px 1fr", rowGap: 3, alignItems: "center" }}>
        {ROWS.map(([label, ri]) => (
          <React.Fragment key={label}>
            <span style={{ fontSize: 10, opacity: 0.65, letterSpacing: 0.5 }}>{label.toUpperCase()}</span>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(16, 1fr)", gap: 2 }}>
              {Array.from({ length: 16 }, (_, s) => {
                const on = g.p[ri][s] !== "0";
                const now = active && step === s;
                return <div key={s} style={{
                  height: compact ? 12 : 16, borderRadius: 3,
                  background: on ? (now ? "#fff" : laneColor(g.lane)) : (s % 4 === 0 ? "#232948" : "#1A1F38"),
                  opacity: on ? 1 : 0.9, transition: "background 60ms",
                  outline: now && !on ? "1px solid #ffffff33" : "none",
                }} />;
              })}
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

const NAMES = ["C","C#","D","D#","E","F","F#","G","G#","A","A#","B"];
const noteName = m => NAMES[m % 12] + (Math.floor(m / 12) - 1);
function PianoRoll({ g, playing, step, compact }) {
  const mel = MEL[g.id];
  if (!mel) return null;
  const notes = mel.n;
  const lo = Math.min(...notes.map(n => n[1])) - 1, hi = Math.max(...notes.map(n => n[1])) + 1;
  const rows = hi - lo + 1, rowH = compact ? 9 : 12, colW = 100 / 16;
  const H = rows * rowH, active = playing === g.id;
  const c = laneColor(g.lane);
  return (
    <div style={{ background: "#12162B", border: `1px solid ${c}33`, borderRadius: 12, padding: "8px 12px 10px", marginTop: 8 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, color: "#8A91B4", marginBottom: 6 }}>
        MELODIC LINE · PIANO ROLL {mel.w === "sawtooth" ? "· SAW" : mel.w === "square" ? "· SQUARE" : mel.w === "sine" ? "· SINE" : "· TRIANGLE"}
      </div>
      <div style={{ display: "flex", gap: 6 }}>
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", height: H, fontSize: 8.5, color: "#59608A", textAlign: "right", width: 26, flexShrink: 0 }}>
          <span>{noteName(hi)}</span><span>{noteName(lo)}</span>
        </div>
        <div style={{ position: "relative", flex: 1, height: H, background: "#0D1122", borderRadius: 6, overflow: "hidden" }}>
          {Array.from({ length: 4 }, (_, i) => (
            <div key={i} style={{ position: "absolute", left: `${i * 25}%`, top: 0, bottom: 0, width: 1, background: "#232948" }} />
          ))}
          {Array.from({ length: rows }, (_, r) => (hi - r) % 12 === 0 && (
            <div key={r} style={{ position: "absolute", top: r * rowH, left: 0, right: 0, height: 1, background: "#232948" }} />
          ))}
          {notes.map(([s, m, len], i) => (
            <div key={i} style={{
              position: "absolute", left: `${s * colW}%`, width: `calc(${len * colW}% - 2px)`,
              top: (hi - m) * rowH + 1, height: rowH - 2, borderRadius: 3,
              background: active && step >= s && step < s + len ? "#fff" : c,
              boxShadow: `0 0 6px ${c}66`, transition: "background 60ms",
            }} />
          ))}
          {active && step >= 0 && (
            <div style={{ position: "absolute", left: `${step * colW}%`, top: 0, bottom: 0, width: `${colW}%`, background: "#ffffff12" }} />
          )}
        </div>
      </div>
    </div>
  );
}

/* ---------- main app ---------- */
export default function App() {
  const [sel, setSel] = useState(null);
  const [cmp, setCmp] = useState("");
  const [melOn, setMelOn] = useState(true);
  const toggleMel = () => { MELODY.on = !melOn; setMelOn(!melOn); };
  const seq = useSequencer();
  const mapRef = useRef(null);

  const genre = G.find(g => g.id === sel);
  const cmpGenre = G.find(g => g.id === cmp);

  const select = id => { setSel(id); setCmp(""); };
  const tryDubTrance = () => {
    setSel("dub"); setCmp("trance");
    const el = mapRef.current;
    if (el) el.scrollTo({ left: 0, behavior: "smooth" });
  };
  const ytLink = ([a, t]) =>
    `https://www.youtube.com/results?search_query=${encodeURIComponent(a + " " + t)}`;

  const edges = useMemo(() => {
    const out = [];
    G.forEach(g => (g.parents || []).forEach(pid => {
      const p = G.find(x => x.id === pid); if (!p) return;
      const a = posOf(p), b = posOf(g);
      out.push({ key: p.id + ">" + g.id, a, b, color: laneColor(p.lane), hi: sel === g.id || sel === p.id });
    }));
    return out;
  }, [sel]);

  const font = "'Courier New', ui-monospace, SFMono-Regular, Menlo, monospace";

  return (
    <div style={{ minHeight: "100vh", background: "#0B0E1A", color: "#E8EAF6", fontFamily: font }}>
      {/* header */}
      <div style={{ padding: "18px 16px 8px", maxWidth: 1200, margin: "0 auto" }}>
        <div style={{ fontSize: 11, letterSpacing: 3, color: "#6C7396" }}>1973 — 2026 · TAP A NODE · SOUND ON 🔊</div>
        <h1 style={{ margin: "4px 0 6px", fontSize: 26, letterSpacing: 1, fontWeight: 800 }}>
          RHYTHM<span style={{ color: "#FFB03A" }}> CARTOGRAPHY</span>
        </h1>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: "#AAB0CC", maxWidth: 640 }}>
          {G.length} electronic genres, mapped by year and family. Lines show who descends from whom.
          Every node has a playable rhythm — the real DNA of a genre — plus its iconic instrument and one defining track.
        </p>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", margin: "10px 0 4px" }}>
          <button onClick={tryDubTrance} style={{ background: "#1A1F38", color: "#3DE1AD", border: "1px solid #3DE1AD66",
            borderRadius: 999, padding: "6px 14px", fontFamily: font, fontSize: 12, cursor: "pointer", fontWeight: 700 }}>
            ⚡ Try: Dub vs Trance rhythm
          </button>
          {LANES.map(l => (
            <span key={l.id} style={{ fontSize: 11, color: l.color, border: `1px solid ${l.color}44`, borderRadius: 999, padding: "6px 10px" }}>
              ● {l.name}
            </span>
          ))}
        </div>
      </div>

      {/* map */}
      <div ref={mapRef} style={{ overflowX: "auto", WebkitOverflowScrolling: "touch", borderTop: "1px solid #1C2140", borderBottom: "1px solid #1C2140" }}>
        <svg width={MAP_W} height={MAP_H} style={{ display: "block" }}>
          {/* decade grid */}
          {[1980, 1990, 2000, 2010, 2020].map(y => (
            <g key={y}>
              <line x1={xOf(y)} y1={TOP - 20} x2={xOf(y)} y2={MAP_H} stroke="#1C2140" strokeDasharray="3 5" />
              <text x={xOf(y)} y={TOP - 26} fill="#59608A" fontSize="12" textAnchor="middle" fontFamily={font} fontWeight="700">{y}s</text>
            </g>
          ))}
          {/* lane bands */}
          {LANES.map((l, i) => (
            <g key={l.id}>
              <rect x={0} y={TOP + i * LANE_H} width={MAP_W} height={LANE_H} fill={i % 2 ? "#0D1122" : "transparent"} />
              <text x={10} y={TOP + i * LANE_H + 16} fill={l.color} fontSize="10" letterSpacing="2" fontFamily={font} opacity="0.8">{l.name.toUpperCase()}</text>
            </g>
          ))}
          {/* edges */}
          {edges.map(e => {
            const mx = (e.a.x + e.b.x) / 2;
            return <path key={e.key} d={`M${e.a.x},${e.a.y} C${mx},${e.a.y} ${mx},${e.b.y} ${e.b.x},${e.b.y}`}
              fill="none" stroke={e.color} strokeWidth={e.hi ? 2.4 : 1.2} opacity={e.hi ? 0.95 : sel ? 0.18 : 0.42} />;
          })}
          {/* nodes */}
          {G.map(g => {
            const { x, y } = posOf(g);
            const c = laneColor(g.lane), isSel = sel === g.id, isPlay = seq.playing === g.id;
            return (
              <g key={g.id} onClick={() => select(g.id)} style={{ cursor: "pointer" }}>
                <circle cx={x} cy={y} r={20} fill="transparent" />
                {isPlay && <circle cx={x} cy={y} r={16} fill="none" stroke={c} opacity="0.6">
                  <animate attributeName="r" values="12;22" dur="0.5s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.7;0" dur="0.5s" repeatCount="indefinite" />
                </circle>}
                <circle cx={x} cy={y} r={isSel ? 11 : 8} fill={isSel ? c : "#0B0E1A"} stroke={c} strokeWidth={isSel ? 3 : 2} />
                <text x={x} y={y - 15} fill={isSel ? "#fff" : "#C6CBE6"} fontSize={isSel ? 12.5 : 11} fontWeight={isSel ? 800 : 600}
                  textAnchor="middle" fontFamily={font}>{g.name}</text>
                <text x={x} y={y + 24} fill="#59608A" fontSize="9.5" textAnchor="middle" fontFamily={font}>{g.year}</text>
              </g>
            );
          })}
        </svg>
      </div>

      {/* detail panel */}
      {genre ? (
        <div style={{ maxWidth: 760, margin: "0 auto", padding: "16px 16px 60px" }}>
          <div style={{ background: "#101430", border: `1px solid ${laneColor(genre.lane)}55`, borderRadius: 16, padding: 16 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
              <div>
                <div style={{ fontSize: 10, letterSpacing: 2, color: laneColor(genre.lane) }}>
                  {LANES.find(l => l.id === genre.lane).name.toUpperCase()} · b. {genre.year} · {genre.bpm} BPM
                </div>
                <h2 style={{ margin: "4px 0 6px", fontSize: 22 }}>{genre.name}</h2>
              </div>
              <button onClick={() => { setSel(null); seq.stop(); }} style={{ background: "none", border: "1px solid #2A3055", color: "#8A91B4", borderRadius: 8, padding: "4px 10px", cursor: "pointer", fontFamily: font }}>✕</button>
            </div>
            <p style={{ margin: "0 0 12px", fontSize: 13.5, lineHeight: 1.55, color: "#C6CBE6" }}>{genre.desc}</p>
            {genre.parents?.length > 0 && (
              <p style={{ margin: "0 0 12px", fontSize: 12, color: "#8A91B4" }}>
                Evolved from:{" "}
                {genre.parents.map((pid, i) => {
                  const p = G.find(x => x.id === pid);
                  return <span key={pid}>
                    <button onClick={() => select(pid)} style={{ background: "none", border: "none", color: laneColor(p.lane), cursor: "pointer", fontFamily: font, fontSize: 12, textDecoration: "underline", padding: 0 }}>{p.name}</button>
                    {i < genre.parents.length - 1 ? " + " : ""}
                  </span>;
                })}
              </p>
            )}

            {/* three interactions: track / instrument / rhythm */}
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <a href={ytLink(genre.track)} target="_blank" rel="noreferrer"
                style={{ flex: "1 1 200px", textDecoration: "none", background: "#12162B", border: "1px solid #2A3055", borderRadius: 12, padding: "10px 12px", color: "#E8EAF6" }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#8A91B4" }}>▶ DEFINING TRACK · YOUTUBE</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, marginTop: 4 }}>{genre.track[0]}</div>
                <div style={{ fontSize: 12.5, color: "#AAB0CC" }}>“{genre.track[1]}”</div>
              </a>
              <button onClick={() => playDemo(genre.demo)}
                style={{ flex: "1 1 200px", textAlign: "left", background: "#12162B", border: "1px solid #2A3055", borderRadius: 12, padding: "10px 12px", color: "#E8EAF6", cursor: "pointer", fontFamily: font }}>
                <div style={{ fontSize: 10, letterSpacing: 2, color: "#8A91B4" }}>🔊 ICONIC INSTRUMENT · TAP TO HEAR</div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 4 }}>
                  <GearIcon kind={genre.icon} color={laneColor(genre.lane)} />
                  <span style={{ fontSize: 13, fontWeight: 700 }}>{genre.gear}</span>
                </div>
              </button>
            </div>

            {/* rhythm DNA */}
            <div style={{ marginTop: 14 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: "#8A91B4" }}>RHYTHM DNA · 1 BAR · 16 STEPS</div>
              <PatternGrid g={genre} playing={seq.playing} step={seq.step} onPlay={seq.play} onStop={seq.stop} />
              <PianoRoll g={genre} playing={seq.playing} step={seq.step} />
              <div style={{ marginTop: 10, display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
                <label style={{ fontSize: 12, color: "#AAB0CC", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={melOn} onChange={toggleMel} style={{ accentColor: laneColor(genre.lane) }} />
                  Play melody with groove
                </label>
                <button onClick={() => downloadMidi(genre)}
                  style={{ background: "transparent", color: "#AAB0CC", border: "1px solid #2A3055", borderRadius: 999,
                    padding: "5px 14px", fontFamily: font, fontSize: 12, cursor: "pointer" }}>
                  ⬇ Download .mid (drums + bass + melody)
                </button>
              </div>
              <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <label style={{ fontSize: 12, color: "#8A91B4" }}>Compare rhythm with:</label>
                <select value={cmp} onChange={e => setCmp(e.target.value)}
                  style={{ background: "#12162B", color: "#E8EAF6", border: "1px solid #2A3055", borderRadius: 8, padding: "6px 8px", fontFamily: font, fontSize: 12 }}>
                  <option value="">— choose a genre —</option>
                  {G.filter(g => g.id !== genre.id).map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                </select>
              </div>
              {cmpGenre && (
                <>
                  <PatternGrid g={cmpGenre} playing={seq.playing} step={seq.step} onPlay={seq.play} onStop={seq.stop} compact />
                  <PianoRoll g={cmpGenre} playing={seq.playing} step={seq.step} compact />
                  <p style={{ fontSize: 12, lineHeight: 1.55, color: "#AAB0CC", marginTop: 10 }}>
                    Listen for where the <b>kick</b> and <b>snare</b> land. {genre.name} runs at {genre.bpm} BPM, {cmpGenre.name} at {cmpGenre.bpm} BPM.
                    {(genre.id === "dub" || cmpGenre.id === "dub") && (genre.id === "trance" || cmpGenre.id === "trance") &&
                      " Dub leaves beats 1–2 empty and drops everything on beat 3 (the 'one drop'), with echo filling the space. Trance fills every beat with a kick and puts the bass on the off-beats between them — total opposites, yet dub's echo and bass-weight live on inside trance breakdowns."}
                  </p>
                </>
              )}
            </div>
          </div>
        </div>
      ) : (
        <p style={{ textAlign: "center", color: "#59608A", fontSize: 13, padding: "20px 16px 60px" }}>
          ↑ Scroll the map sideways and tap any genre to open its track, instrument and playable groove.
        </p>
      )}
    </div>
  );
}
