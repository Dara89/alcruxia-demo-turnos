/* Demo "Bot de turnos con recordatorios" — Alcruxia
   Vanilla JS, sin backend. Estado en localStorage. Todos los datos son ficticios. */
(() => {
'use strict';

const STORE_KEY = 'alcruxia-demo-turnos-v2';
const FAST = new URLSearchParams(location.search).has('fast');
const TYPE_MS = FAST ? 40 : 650;

/* ---------- Utilidades de fecha ---------- */
const pad = n => String(n).padStart(2, '0');
const ymd = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const parseYmd = s => { const [y, m, d] = s.split('-').map(Number); return new Date(y, m - 1, d); };
const addDays = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
const todayStr = () => ymd(new Date());
const toMin = t => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
const fromMin = m => `${pad(Math.floor(m / 60))}:${pad(m % 60)}`;
const nowHM = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const DAYS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
const DAYS_SHORT = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
const dm = s => { const d = parseYmd(s); return `${d.getDate()}/${d.getMonth() + 1}`; };
const dayShort = s => `${DAYS_SHORT[parseYmd(s).getDay()]} ${dm(s)}`;
const dayLong = s => `${DAYS[parseYmd(s).getDay()]} ${dm(s)}`;
const rel = s => { const t = todayStr(); if (s === t) return 'hoy'; if (s === ymd(addDays(new Date(), 1))) return 'mañana'; return null; };
const dayChip = s => { const r = rel(s); return r ? `${r[0].toUpperCase() + r.slice(1)} · ${dm(s)}` : dayShort(s); };
const dayPhrase = s => { const r = rel(s); return r ? `${r}, ${dayLong(s)}` : `el ${dayLong(s)}`; };
const weekStart = s => { const d = parseYmd(s); const k = (d.getDay() + 6) % 7; return ymd(addDays(d, -k)); };
const isPast = (date, time) => { const t = todayStr(); return date < t || (date === t && time <= nowHM()); };

/* ---------- Texto ---------- */
const norm = s => (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[¿?¡!.,;]/g, ' ').replace(/\s+/g, ' ').trim();
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const fmt = s => esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br>');
const money = n => n === 0 ? 'Sin costo' : '$ ' + n.toLocaleString('es-UY');
const first = name => (name || '').split(' ')[0];
const titleCase = s => s.replace(/\s+/g, ' ').trim().split(' ').map(w => w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w).join(' ');
const digits = s => (s || '').replace(/\D/g, '');
const fmtPhone = d => d.length === 9 ? `${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}` : d.length === 8 ? `${d.slice(0, 4)} ${d.slice(4)}` : d;
const samePhone = (a, b) => digits(a).slice(-8) === digits(b).slice(-8);
const uid = () => Math.random().toString(36).slice(2, 9);

/* ---------- Negocios (ficticios) ---------- */
const WEEKDAYS = (ranges) => ({ 1: ranges, 2: ranges, 3: ranges, 4: ranges, 5: ranges });
const BIZ = {
  dental: {
    emoji: '🦷', name: 'Clínica Dental Sonría', assistant: 'Sofi', agent: 'Carolina', panelTitle: 'Panel de la clínica', client: 'paciente', clients: 'pacientes',
    services: [
      { id: 'consulta', name: 'Consulta y diagnóstico', dur: 30, price: 1500, kw: ['consulta', 'diagnost', 'control', 'revision', 'chequeo'] },
      { id: 'limpieza', name: 'Limpieza dental', dur: 45, price: 2200, kw: ['limpieza', 'sarro', 'higiene'] },
      { id: 'blanqueamiento', name: 'Blanqueamiento', dur: 60, price: 6900, kw: ['blanque', 'blanco'] },
      { id: 'urgencia', name: 'Urgencia / dolor', dur: 30, price: 1900, kw: ['urgencia', 'dolor', 'duele', 'muela', 'emergencia', 'urgente'] },
    ],
    step: 30,
    schedule: { ...WEEKDAYS([['09:00', '13:00'], ['14:00', '19:00']]), 6: [['09:00', '13:00']] },
    hours: 'Lunes a viernes de 9 a 13 y de 14 a 19 h. Sábados de 9 a 13 h.',
    address: 'Av. Ficticia 1234, Pocitos, Montevideo',
    addressExtra: 'A dos cuadras de la rambla. Hay estacionamiento tarifado en la cuadra y pasan varias líneas de ómnibus.',
    payments: 'Efectivo, débito, crédito (hasta 3 cuotas sin recargo), transferencia bancaria y Mercado Pago.',
    priceNote: 'Valores de referencia: el presupuesto final lo define el odontólogo en la consulta.',
    extra: null,
    names: ['Ana Ejemplo', 'Martín Prueba', 'Lucía Demo', 'Diego Ficticio', 'Sofía Muestra', 'Pablo Testeo', 'Carla Simulada', 'Joaquín Ejemplar', 'Valentina Demo'],
  },
  vet: {
    emoji: '🐾', name: 'Veterinaria Huellitas', assistant: 'Lola', agent: 'Martina', panelTitle: 'Panel de la veterinaria', client: 'cliente', clients: 'clientes',
    services: [
      { id: 'consulta', name: 'Consulta general', dur: 30, price: 1200, kw: ['consulta', 'control', 'revision', 'chequeo', 'enfermo', 'mal'] },
      { id: 'vacuna', name: 'Vacunación', dur: 30, price: 900, kw: ['vacun', 'antirrab', 'refuerzo'] },
      { id: 'bano', name: 'Baño y corte', dur: 60, price: 1400, kw: ['bano', 'corte', 'peluqueria', 'pelo'] },
      { id: 'domicilio', name: 'Consulta a domicilio', dur: 60, price: 2100, kw: ['domicilio', 'casa', 'visita'] },
    ],
    step: 30,
    schedule: { ...WEEKDAYS([['09:00', '20:00']]), 6: [['09:00', '14:00']] },
    hours: 'Lunes a viernes de 9 a 20 h. Sábados de 9 a 14 h. Urgencias: te derivamos a la guardia 24 h.',
    address: 'Bvar. Inventado 2020, Malvín, Montevideo',
    addressExtra: 'Las consultas a domicilio cubren Montevideo y Ciudad de la Costa.',
    payments: 'Efectivo, débito, crédito, transferencia y Mercado Pago. Para domicilio también aceptamos link de pago.',
    priceNote: 'Medicación y vacunas especiales se presupuestan aparte.',
    extra: { key: 'pet', label: 'Mascota', ask: '¿Y cómo se llama tu mascota? 🐶🐱', icon: '🐾' },
    names: ['Ana Ejemplo', 'Martín Prueba', 'Lucía Demo', 'Diego Ficticio', 'Sofía Muestra', 'Pablo Testeo', 'Carla Simulada', 'Joaquín Ejemplar', 'Valentina Demo'],
    pets: ['Firulais', 'Michi', 'Tango', 'Luna', 'Rocco', 'Pelusa', 'Simón', 'Nala', 'Toby'],
  },
  pilates: {
    emoji: '🧘', name: 'Estudio Pilates Equilibrio', assistant: 'Vera', agent: 'Florencia', panelTitle: 'Panel del estudio', client: 'alumna/o', clients: 'alumnos',
    services: [
      { id: 'prueba', name: 'Clase de prueba', dur: 60, price: 0, kw: ['prueba', 'primera', 'probar', 'gratis'] },
      { id: 'reformer', name: 'Pilates reformer', dur: 60, price: 1300, kw: ['reformer', 'maquina'] },
      { id: 'mat', name: 'Pilates mat grupal', dur: 60, price: 650, kw: ['mat', 'grupal', 'suelo', 'colchoneta'] },
      { id: 'particular', name: 'Clase particular', dur: 60, price: 1600, kw: ['particular', 'individual', 'personal', 'privada'] },
    ],
    step: 60,
    schedule: { ...WEEKDAYS([['07:00', '12:00'], ['16:00', '21:00']]), 6: [['09:00', '12:00']] },
    hours: 'Lunes a viernes de 7 a 12 y de 16 a 21 h. Sábados de 9 a 12 h.',
    address: 'Calle Imaginaria 456, Punta Carretas, Montevideo',
    addressExtra: 'Tenemos vestuario con duchas y lugar para bicis.',
    payments: 'Efectivo, débito, crédito, transferencia y Mercado Pago. También pases mensuales de 4, 8 o 12 clases.',
    priceNote: 'Con pase mensual el valor por clase baja hasta un 25 %.',
    extra: null,
    names: ['Ana Ejemplo', 'Martín Prueba', 'Lucía Demo', 'Diego Ficticio', 'Sofía Muestra', 'Pablo Testeo', 'Carla Simulada', 'Joaquín Ejemplar', 'Valentina Demo'],
  },
};

/* ---------- Estado ---------- */
let state;
const fresh = () => ({ v: 1, biz: 'dental', data: {} });
function bizState(key = state.biz) {
  if (!state.data[key]) state.data[key] = seedBiz(key);
  if (!state.data[key].inbox) state.data[key].inbox = seedInbox(key, state.data[key]);
  return state.data[key];
}
const S = () => bizState();
const B = () => BIZ[state.biz];
function load() {
  try { state = JSON.parse(localStorage.getItem(STORE_KEY)) || fresh(); } catch { state = fresh(); }
  if (!BIZ[state.biz]) state = fresh();
}
function save() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch {} }

/* ---------- Agenda / disponibilidad ---------- */
function slotsFor(date, key = state.biz) {
  const b = BIZ[key]; const ranges = b.schedule[parseYmd(date).getDay()] || [];
  const out = [];
  ranges.forEach(([a, z]) => { for (let m = toMin(a); m + b.step <= toMin(z); m += b.step) out.push(fromMin(m)); });
  return out;
}
const activeBooking = (date, time, st = S()) => st.bookings.find(x => x.date === date && x.time === time && x.status !== 'cancelado');
const blockAt = (date, time, st = S()) => st.blocks.find(x => x.date === date && x.time === time);
function availableSlots(date) {
  const t = todayStr(); const limit = toMin(nowHM()) + 60; // no ofrecer turnos en menos de 1 h
  return slotsFor(date).filter(tm => !activeBooking(date, tm) && !blockAt(date, tm) && !(date < t) && !(date === t && toMin(tm) < limit));
}
function availableDays(n = 6) {
  const out = []; let d = new Date();
  for (let i = 0; i < 30 && out.length < n; i++, d = addDays(d, 1)) { const s = ymd(d); if (availableSlots(s).length) out.push(s); }
  return out;
}
const service = id => B().services.find(s => s.id === id) || B().services[0];

/* ---------- Datos de ejemplo ---------- */
function openDay(key, from, dir) {
  let d = from;
  for (let i = 0; i < 10; i++) { if (slotsFor(ymd(d), key).length) return ymd(d); d = addDays(d, dir); }
  return ymd(from);
}
function seedBiz(key) {
  const b = BIZ[key]; const st = { bookings: [], blocks: [], chat: [], convo: { step: 'idle', data: {} }, stats: { handoffs: 0, rescheduled: 0 } };
  const today = new Date();
  const d = (off) => off < 0 ? openDay(key, addDays(today, off), -1) : openDay(key, addDays(today, off), 1);
  const yest = d(-1), d0 = slotsFor(todayStr(), key).length ? todayStr() : null, d1 = d(1), d2 = openDay(key, addDays(parseYmd(d1), 1), 1), d3 = openDay(key, addDays(parseYmd(d2), 1), 1);
  const spec = [
    [yest, 1, 0, 'asistio'], [yest, 4, 1, 'ausente'], [yest, 7, 2, 'asistio'],
    [d0, 1, 3, 'auto'], [d0, -3, 4, 'auto'], [d0, -1, 5, 'auto', 'confirmado'],
    [d1, 0, 6, 'confirmado', 'confirmado'], [d1, 3, 7, 'confirmado'], [d1, 5, 8, 'cancelado'],
    [d2, 2, 2, 'confirmado'], [d2, 6, 0, 'confirmado'], [d3, 1, 4, 'confirmado'],
  ];
  spec.forEach(([date, idx, n, status, reminder], i) => {
    if (!date) return;
    const slots = slotsFor(date, key); if (!slots.length) return;
    const time = slots[(idx + slots.length) % slots.length];
    if (st.bookings.some(x => x.date === date && x.time === time)) return;
    if (status === 'auto') status = isPast(date, time) ? 'asistio' : 'confirmado';
    st.bookings.push({
      id: uid(), service: b.services[i % b.services.length].id, date, time,
      name: b.names[n], phone: fmtPhone(`0990000${pad(n + 1)}`), extra: b.pets ? b.pets[n] : null,
      status, source: 'seed', reminder: reminder || (status === 'cancelado' ? 'enviado' : null),
      cancelledVia: status === 'cancelado' ? 'recordatorio' : null, createdAt: Date.now() - 86400000 * (5 - i),
    });
  });
  const s1 = slotsFor(d1, key); const bt = s1.find(t => !st.bookings.some(x => x.date === d1 && x.time === t && x.status !== 'cancelado') && toMin(t) >= 12 * 60) || s1[s1.length - 1];
  if (bt) st.blocks.push({ date: d1, time: bt, reason: 'Reunión de equipo' });
  st.inbox = seedInbox(key, st);
  return st;
}

/* ---------- Render: chat ---------- */
const $ = s => document.querySelector(s);
const chatBody = $('#chatBody'), quickEl = $('#quick'), input = $('#chatInput');

function renderHeader() {
  const b = B();
  document.body.dataset.biz = state.biz;
  $('#chatAvatar').textContent = b.emoji;
  $('#chatName').textContent = b.name;
  $('#chatStatus').textContent = S().inbox?.live.botPaused ? `${b.agent} (recepción) está respondiendo` : `${b.assistant} · asistente virtual`;
  $('#panelTitle').textContent = b.panelTitle;
  $('#panelSub').textContent = `${b.name} · agenda en vivo`;
  document.querySelectorAll('#bizSwitch button').forEach(x => x.classList.toggle('active', x.dataset.biz === state.biz));
}

function msgHTML(m) {
  if (m.from === 'sys') return `<div class="sys">${fmt(m.text)}</div>`;
  const time = new Date(m.ts); const t = `${pad(time.getHours())}:${pad(time.getMinutes())}`;
  let inner = '';
  if (m.kind === 'reminder') inner += `<div class="rem-head">🔔 Recordatorio automático · 24 h antes</div>`;
  if (m.from === 'staff') inner += `<div class="agent">👩‍💼 ${esc(m.agent || 'Recepción')} · Recepción</div>`;
  inner += fmt(m.text);
  if (m.actions && m.actions.length) {
    inner += `<div class="actions ${m.used ? 'used' : ''}">` + m.actions.map(a =>
      `<button data-msg="${m.id}" data-payload="${esc(a.payload)}" class="${m.used === a.payload ? 'chosen' : ''}">${esc(a.label)}</button>`).join('') + `</div>`;
  }
  return `<div class="msg ${m.from} ${m.kind || ''}" data-id="${m.id}">${inner}<span class="time">${t}</span></div>`;
}
function renderChat() {
  const msgs = S().chat; let html = ''; let lastDay = '';
  msgs.forEach(m => {
    const day = ymd(new Date(m.ts));
    if (day !== lastDay) { html += `<div class="day-sep">${day === todayStr() ? 'Hoy' : dayLong(day)}</div>`; lastDay = day; }
    html += msgHTML(m);
  });
  chatBody.innerHTML = html;
  if (typingOn) chatBody.insertAdjacentHTML('beforeend', '<div class="typing"><i></i><i></i><i></i></div>');
  renderQuick();
  scrollChat();
}
function appendMsg(m) {
  const last = S().chat[S().chat.length - 2];
  if (!last || ymd(new Date(last.ts)) !== ymd(new Date(m.ts))) { renderChat(); return; }
  chatBody.querySelector('.typing')?.remove();
  chatBody.insertAdjacentHTML('beforeend', msgHTML(m));
  scrollChat();
}
const scrollChat = () => requestAnimationFrame(() => { chatBody.scrollTop = chatBody.scrollHeight; });
function renderQuick() {
  const q = typingOn ? [] : (S().convo.quick || []);
  quickEl.innerHTML = q.map(o => `<button data-payload="${esc(o.payload)}" class="${o.cls || ''}">${esc(o.label)}</button>`).join('');
}

/* ---------- Motor de conversación ---------- */
let typingOn = false;
let queue = Promise.resolve();
const wait = ms => new Promise(r => setTimeout(r, ms));
function push(m) {
  m.id = m.id || uid(); m.ts = m.ts || Date.now();
  S().chat.push(m); if (S().chat.length > 200) S().chat.splice(0, S().chat.length - 200);
  save(); appendMsg(m); onLiveMsg(m);
  return m;
}
async function say(text, opts = {}) {
  typingOn = true; renderQuick();
  chatBody.insertAdjacentHTML('beforeend', '<div class="typing"><i></i><i></i><i></i></div>'); scrollChat();
  await wait(opts.fast ? TYPE_MS / 2 : TYPE_MS + Math.min(text.length * (FAST ? 0 : 4), 500));
  typingOn = false;
  return push({ from: 'bot', text, ...opts.msg });
}
const sys = text => push({ from: 'sys', text });
function setQuick(list) { S().convo.quick = list; save(); renderQuick(); }
const setStep = (step, data) => { const c = S().convo; c.step = step; if (data !== undefined) c.data = data; save(); };

const MENU = () => [
  { label: '📅 Sacar turno', payload: 'intent:book' },
  { label: '🔄 Cancelar o cambiar', payload: 'intent:cancel' },
  { label: '🕘 Horarios', payload: 'faq:horarios', cls: 'secondary' },
  { label: '📍 Dirección', payload: 'faq:direccion', cls: 'secondary' },
  { label: '💲 Precios', payload: 'faq:precios', cls: 'secondary' },
  { label: '💳 Formas de pago', payload: 'faq:pagos', cls: 'secondary' },
  { label: '👤 Hablar con una persona', payload: 'intent:human', cls: 'secondary' },
];

function userSays(label, payload) {
  if (typingOn) return;
  const text = (label || '').trim(); if (!text) return;
  setQuick([]);
  push({ from: 'user', text });
  const L = S().inbox.live;
  if (L.botPaused && !(payload && payload.startsWith('rem:'))) {
    notifyInbox(`💬 ${S().convo.knownName || 'El cliente'} escribió: lo atiende ${B().agent} (bot en pausa)`);
    return;
  }
  queue = queue.then(() => handle(payload ? { payload } : { text })).catch(e => console.error(e));
}

const RX = {
  human: /\b(persona|humano|alguien|recepcion|secretari|operador|hablar con|atencion al cliente)/,
  cancel: /\b(cancel|anul|reprogram|cambiar (el|mi)? ?turno|mover (el|mi)? ?turno|no (voy a )?poder ir|no puedo ir|cambiar)/,
  book: /\b(turno|reserv|agend|sacar|cita|hora para|anotar|anotarme|clase|quiero (una|un)|necesito (una|un))/,
  horarios: /\b(horario|abren|cierran|atienden|hasta que hora|a que hora|que dias)/,
  direccion: /\b(direcc|donde|ubica|queda|llegar|estacion|parking|mapa)/,
  pagos: /\b(pago|pagar|tarjeta|efectivo|mercado ?pago|transfer|debito|credito|cuotas|aceptan)/,
  precios: /\b(precio|cuesta|cuanto|sale|valor|tarifa|costo|arancel)/,
  greet: /^(hola|holis|buenas|buen dia|buenos dias|buenas tardes|buenas noches|hey|que tal|ola)\b/,
  thanks: /\b(gracias|genial|perfecto|barbaro|joya|buenisimo|dale gracias)\b/,
  yes: /^(si|sii+|dale|ok|okey|confirmo|confirmar|perfecto|listo|de una|claro)\b/,
  no: /^(no|nop|cambiar|otro)\b/,
};
function detect(t) {
  if (RX.human.test(t)) return 'human';
  if (RX.cancel.test(t)) return 'cancel';
  if (RX.pagos.test(t)) return 'faq:pagos';
  if (RX.precios.test(t)) return 'faq:precios';
  if (RX.horarios.test(t)) return 'faq:horarios';
  if (RX.direccion.test(t)) return 'faq:direccion';
  if (RX.book.test(t)) return 'book';
  if (RX.greet.test(t)) return 'greet';
  if (RX.thanks.test(t)) return 'thanks';
  return null;
}
const isIntent = t => { const i = detect(t); return i && !['greet', 'thanks'].includes(i); };

function matchService(t) {
  const list = B().services; const n = parseInt(t, 10);
  if (n >= 1 && n <= list.length && /^\d+$/.test(t)) return list[n - 1];
  return list.find(s => s.kw.some(k => t.includes(k)) || t.includes(norm(s.name)));
}
function matchDay(t) {
  const days = availableDays(14); const today = new Date();
  if (/pasado manana/.test(t)) return ymd(addDays(today, 2));
  if (/\bmanana\b/.test(t)) return ymd(addDays(today, 1));
  if (/\bhoy\b/.test(t)) return todayStr();
  const names = ['domingo', 'lunes', 'martes', 'miercoles', 'jueves', 'viernes', 'sabado'];
  const wd = names.findIndex(n => t.includes(n));
  if (wd >= 0) { for (let i = 0; i < 8; i++) { const d = addDays(today, i); if (d.getDay() === wd) return ymd(d); } }
  const m = t.match(/\b(\d{1,2})\s*\/\s*(\d{1,2})\b/);
  if (m) return days.find(s => { const d = parseYmd(s); return d.getDate() === +m[1] && d.getMonth() + 1 === +m[2]; }) || null;
  return null;
}
function matchTime(t, date) {
  const m = t.match(/\b(\d{1,2})(?:\s*[:.h]\s*(\d{2}))?\b/); if (!m) return null;
  let h = +m[1]; const mm = m[2] ? +m[2] : 0;
  const slots = availableSlots(date); let c = `${pad(h)}:${pad(mm)}`;
  if (slots.includes(c)) return c;
  if (h < 12) { c = `${pad(h + 12)}:${pad(mm)}`; if (slots.includes(c)) return c; }
  return null;
}
function matchPhone(s) { const d = digits(s); return d.length >= 8 && d.length <= 12 ? fmtPhone(d) : null; }

async function handle({ text, payload }) {
  const c = S().convo;
  if (payload) return handlePayload(payload);
  const t = norm(text);
  switch (c.step) {
    case 'service': { const s = matchService(t); if (s) return pickService(s); break; }
    case 'day': { const d = matchDay(t); if (d) return pickDay(d); break; }
    case 'time': { const tm = matchTime(t, c.data.date); if (tm) return pickTime(tm); const d = matchDay(t); if (d) return pickDay(d); break; }
    case 'extra': if (!isIntent(t) && t.length >= 2) return giveExtra(titleCase(text)); break;
    case 'name': if (!isIntent(t) && /[a-zñ]{2,}/.test(t) && !/\d/.test(t)) return giveName(titleCase(text)); break;
    case 'phone': { const ph = matchPhone(text); if (ph) return givePhone(ph); if (!isIntent(t)) return say('Mmm, ese número no me cierra 🤔 ¿Me lo pasás de nuevo? Por ejemplo: **099 123 456**'); break; }
    case 'confirm': if (RX.yes.test(t)) return confirmFlow(); if (RX.no.test(t)) return startDay(); break;
    case 'cancel_phone': { const ph = matchPhone(text); if (ph) return lookup(ph); break; }
  }
  const intent = detect(t);
  if (intent) c.misses = 0;
  switch (intent) {
    case 'human': return human();
    case 'cancel': return startCancel();
    case 'book': { const s = matchService(t); if (s) { setStep('service', { mode: 'new' }); return pickService(s); } return startBooking(); }
    case 'greet': return welcome(true);
    case 'thanks': await say('¡De nada! 😊 Cualquier cosa, escribime por acá cuando quieras.'); return setQuick(MENU());
    default:
      if (intent && intent.startsWith('faq:')) return faq(intent.slice(4));
  }
  // Paso en curso con respuesta no reconocida
  if (c.step === 'service') { await say('Perdón, no identifiqué el servicio 🙈 Elegí una de las opciones:'); return askService(); }
  if (c.step === 'day') { await say('No encontré ese día en la agenda. Te dejo los próximos días con lugar:'); return startDay(true); }
  if (c.step === 'time') { await say('Ese horario no está disponible. Elegí uno de estos:'); return pickDay(c.data.date, true); }
  if (c.step === 'name') return say('¿Me decís tu nombre y apellido, así lo anoto? ✍️');
  if (c.step === 'cancel_phone') return say('Necesito el celular con el que sacaste el turno (por ejemplo **099 000 001**).');
  return fallback();
}

async function handlePayload(p) {
  const [kind, a, b] = p.split(':');
  const st = S();
  if (kind === 'intent') return ({ book: startBooking, cancel: startCancel, human, menu: () => welcome(true) })[a]();
  if (kind === 'faq') return faq(a);
  if (kind === 'svc') return pickService(service(a));
  if (kind === 'day') return pickDay(a);
  if (kind === 'time') return pickTime(`${a}:${b}`);
  if (kind === 'moredays') return startDay(true);
  if (kind === 'name') return giveName(st.convo.knownName);
  if (kind === 'phone') return st.convo.step === 'cancel_phone' ? lookup(a) : givePhone(a);
  if (kind === 'confirm') { if (a === 'yes') return confirmFlow(); if (a === 'change') return startDay(); return abort(); }
  const bk = st.bookings.find(x => x.id === b);
  if (kind === 'bk') {
    if (!bk) return say('No encontré ese turno 🤔');
    if (a === 'pick') return showBooking(bk);
    if (a === 'cancel') return cancelBooking(bk, 'chat');
    if (a === 'resched') return startResched(bk);
    if (a === 'keep') { await say(`¡Perfecto! Tu turno queda como estaba. Te esperamos ${dayPhrase(bk.date)} a las ${bk.time} 😊`); setStep('idle', {}); return setQuick(MENU()); }
  }
  if (kind === 'rem') {
    if (!bk || bk.status === 'cancelado') return say('Ese turno ya no está activo.');
    if (a === 'confirm') {
      bk.status = 'confirmado'; bk.reminder = 'confirmado'; save(); renderPanel({ flash: bk.id, bump: true });
      toast(`✅ ${bk.name} confirmó su turno (${dayShort(bk.date)} ${bk.time})`);
      await say(`¡Genial, ${first(bk.name)}! Tu turno queda **confirmado** ✅ Te esperamos ${dayPhrase(bk.date)} a las **${bk.time}**.`);
      setStep('idle', {}); return setQuick(MENU());
    }
    if (a === 'cancel') return cancelBooking(bk, 'recordatorio');
    if (a === 'resched') return startResched(bk);
  }
}

async function welcome(again) {
  const b = B();
  setStep('idle', {});
  await say(again
    ? `¡Hola de nuevo! 👋 ¿En qué te puedo ayudar?`
    : `¡Hola! 👋 Soy **${b.assistant}**, la asistente virtual de **${b.name}**.\nTe ayudo a sacar, cambiar o cancelar tu turno en un minuto, las 24 horas. ¿Qué necesitás?`);
  setQuick(MENU());
}
async function startBooking() {
  setStep('service', { mode: 'new' });
  await say('¡Buenísimo! ¿Qué servicio necesitás?\n' + B().services.map((s, i) => `${i + 1}. **${s.name}** · ${money(s.price)}`).join('\n'));
  setQuick(B().services.map(s => ({ label: s.name, payload: `svc:${s.id}` })));
}
async function askService() { setStep('service'); setQuick(B().services.map(s => ({ label: s.name, payload: `svc:${s.id}` }))); }
async function pickService(s) {
  const c = S().convo; c.data = { ...(c.data || {}), mode: c.data?.mode || 'new', service: s.id }; save();
  return startDay(false, `Perfecto, **${s.name}** (${s.dur} min). ¿Qué día te queda mejor? Estos son los próximos días con lugar:`);
}
async function startDay(silentIntro, intro) {
  const c = S().convo; c.step = 'day'; save();
  const days = availableDays(6);
  if (!days.length) { await say('Uy, no me quedan lugares en las próximas semanas 😕 Te derivo con una persona para buscarte una alternativa.'); return human(true); }
  if (!silentIntro) await say(intro || '¿Qué día te queda mejor? Estos son los próximos días con lugar:');
  setQuick([...days.map(d => ({ label: dayChip(d), payload: `day:${d}` })), { label: '↩️ Menú', payload: 'intent:menu', cls: 'secondary' }]);
}
async function pickDay(date, silent) {
  const c = S().convo;
  const slots = availableSlots(date);
  if (!slots.length) { await say(`${dayPhrase(date)[0].toUpperCase() + dayPhrase(date).slice(1)} no me quedan horarios libres 😕 Probá con otro día:`); return startDay(true); }
  c.step = 'time'; c.data.date = date; save();
  if (!silent) await say(`Para ${dayPhrase(date)} tengo estos horarios libres 👇 (podés tocar uno o escribirlo, ej. "10:30")`);
  setQuick([...slots.map(t => ({ label: t, payload: `time:${t}`, cls: 'time' })), { label: '📅 Otro día', payload: 'moredays', cls: 'secondary' }]);
}
async function pickTime(tm) {
  const c = S().convo; const d = c.data;
  if (!availableSlots(d.date).includes(tm)) { await say('Uy, ese horario se acaba de ocupar 😅 Elegí otro:'); return pickDay(d.date, true); }
  d.time = tm; save();
  if (d.mode === 'resched') return askConfirm();
  if (B().extra && !d.extra) { setStep('extra'); await say(B().extra.ask); return setQuick([]); }
  return askName();
}
async function giveExtra(v) { S().convo.data.extra = v; save(); return askName(`¡Qué lindo nombre! 🥰 `); }
async function askName(prefix = '') {
  const c = S().convo; setStep('name');
  await say(`${prefix}¿A nombre de quién hago la reserva? (nombre y apellido)`);
  setQuick(c.knownName ? [{ label: c.knownName, payload: 'name:known' }] : []);
}
async function giveName(n) {
  const c = S().convo; c.data.name = n; setStep('phone');
  await say(`Gracias, ${first(n)} 🙌 ¿A qué celular te mandamos la confirmación y el recordatorio?`);
  setQuick(c.knownPhone ? [{ label: c.knownPhone, payload: `phone:${digits(c.knownPhone)}` }] : []);
}
async function givePhone(ph) { S().convo.data.phone = fmtPhone(digits(ph)); save(); return askConfirm(); }
async function askConfirm() {
  const c = S().convo; const d = c.data; const s = service(d.service); setStep('confirm');
  if (d.mode === 'resched') {
    const bk = S().bookings.find(x => x.id === d.bookingId);
    await say(`Te cambio el turno:\n❌ Antes: ${dayLong(bk.date)} a las ${bk.time}\n✅ Ahora: **${dayLong(d.date)} a las ${d.time}**\n\n¿Confirmo el cambio?`);
  } else {
    const ex = B().extra && d.extra ? `\n${B().extra.icon} ${B().extra.label}: **${d.extra}**` : '';
    await say(`Te confirmo los datos:\n${B().emoji} **${s.name}** · ${money(s.price)}\n📅 **${dayLong(d.date)}** a las **${d.time}**\n👤 ${d.name} · ${d.phone}${ex}\n\n¿Confirmo el turno?`);
  }
  setQuick([{ label: '✅ Confirmar', payload: 'confirm:yes' }, { label: '🔄 Cambiar horario', payload: 'confirm:change', cls: 'secondary' }, { label: '✖️ No, gracias', payload: 'confirm:no', cls: 'secondary' }]);
}
async function confirmFlow() {
  const c = S().convo; const d = c.data; const st = S();
  if (!d.date || !d.time) return startDay();
  if (!availableSlots(d.date).includes(d.time)) { await say('Uy, justo ese horario se ocupó recién 😅 Elegí otro:'); return pickDay(d.date, true); }
  if (d.mode === 'resched') {
    const bk = st.bookings.find(x => x.id === d.bookingId);
    bk.date = d.date; bk.time = d.time; bk.status = 'confirmado'; bk.reminder = null; st.stats.rescheduled++;
    save(); panelDate = bk.date; renderPanel({ flash: bk.id, bump: true }); notifyPanel(`🔄 Turno reprogramado: ${bk.name} → ${dayShort(bk.date)} ${bk.time}`);
    await say(`¡Listo! 🎉 Tu turno quedó para **${dayPhrase(bk.date)} a las ${bk.time}**. Te mando un recordatorio 24 h antes.`);
    setStep('idle', {}); return setQuick(MENU());
  }
  const bk = { id: uid(), service: d.service, date: d.date, time: d.time, name: d.name, phone: d.phone, extra: d.extra || null, status: 'confirmado', source: 'chat', reminder: null, createdAt: Date.now() };
  st.bookings.push(bk); c.knownName = d.name; c.knownPhone = d.phone; save();
  panelDate = bk.date; panelMode = panelMode || 'day';
  renderPanel({ flash: bk.id, bump: true });
  notifyPanel(`📅 Nuevo turno desde el chat: ${bk.name} · ${dayShort(bk.date)} ${bk.time}`);
  await say(`¡Listo, ${first(d.name)}! 🎉 Tu turno quedó **confirmado** para ${dayPhrase(d.date)} a las **${d.time}**.\n📍 ${B().address}\n\nTe vamos a mandar un recordatorio 24 h antes. Si necesitás cambiarlo o cancelarlo, escribime por acá cuando quieras.`);
  setStep('idle', {}); setQuick(MENU());
}
async function abort() { setStep('idle', {}); await say('Sin problema, no reservé nada 👍 Si querés, seguimos cuando quieras.'); setQuick(MENU()); }

async function startCancel() {
  const c = S().convo;
  if (c.knownPhone) return lookup(c.knownPhone);
  setStep('cancel_phone', {});
  await say('Claro 🙂 ¿Me pasás el celular con el que sacaste el turno?');
  const sample = S().bookings.find(x => x.source === 'seed' && x.status === 'confirmado' && x.date >= todayStr() && !isPast(x.date, x.time));
  setQuick(sample ? [{ label: `${sample.phone} (ejemplo)`, payload: `phone:${digits(sample.phone)}`, cls: 'secondary' }] : []);
}
async function lookup(ph) {
  const st = S(); const c = st.convo;
  const list = st.bookings.filter(x => samePhone(x.phone, ph) && x.status === 'confirmado' && !isPast(x.date, x.time)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  if (!list.length) {
    setStep('idle', {});
    await say(`No encontré turnos próximos con el número ${fmtPhone(digits(ph))} 🤔 ¿Querés sacar uno nuevo o hablar con una persona?`);
    return setQuick([{ label: '📅 Sacar turno', payload: 'intent:book' }, { label: '👤 Hablar con una persona', payload: 'intent:human', cls: 'secondary' }]);
  }
  c.knownPhone = list[0].phone; c.knownName = list[0].name; save();
  if (list.length === 1) return showBooking(list[0]);
  setStep('idle', {});
  await say(`Encontré ${list.length} turnos a tu nombre. ¿Cuál querés gestionar?`);
  setQuick(list.map(x => ({ label: `${dayChip(x.date)} ${x.time} · ${service(x.service).name}`, payload: `bk:pick:${x.id}` })));
}
async function showBooking(bk) {
  setStep('idle', {});
  await say(`Tenés un turno de **${service(bk.service).name}**${bk.extra ? ` para ${bk.extra}` : ''} ${dayPhrase(bk.date)} a las **${bk.time}**, a nombre de ${bk.name}.\n¿Qué querés hacer?`);
  setQuick([{ label: '🔄 Reprogramar', payload: `bk:resched:${bk.id}` }, { label: '❌ Cancelar turno', payload: `bk:cancel:${bk.id}` }, { label: 'Dejarlo así', payload: `bk:keep:${bk.id}`, cls: 'secondary' }]);
}
async function cancelBooking(bk, via) {
  bk.status = 'cancelado'; bk.cancelledVia = via; bk.cancelledAt = Date.now(); save();
  panelDate = bk.date; renderPanel({ bump: true });
  notifyPanel(`❌ ${bk.name} canceló su turno · ${dayShort(bk.date)} ${bk.time} quedó libre`);
  await say(`Listo, cancelé tu turno de ${dayPhrase(bk.date)} a las ${bk.time}. ¡Gracias por avisar! 🙌 Así le damos el lugar a otro ${B().client}.\n¿Querés sacar uno nuevo para otro día?`);
  setStep('idle', {});
  setQuick([{ label: '📅 Sí, sacar otro turno', payload: 'intent:book' }, { label: 'No, gracias', payload: 'intent:menu', cls: 'secondary' }]);
}
async function startResched(bk) {
  setStep('day', { mode: 'resched', bookingId: bk.id, service: bk.service });
  return startDay(false, `Dale, busquemos otro horario para tu **${service(bk.service).name}** 📅 ¿Qué día te queda mejor?`);
}

async function faq(kind) {
  const b = B(); const c = S().convo; const inFlow = !['idle'].includes(c.step);
  const txt = {
    horarios: `🕘 Nuestros horarios:\n${b.hours}\n\nYo, en cambio, respondo las 24 horas 😉`,
    direccion: `📍 Estamos en **${b.address}**.\n${b.addressExtra}`,
    precios: `💲 Valores de referencia:\n${b.services.map(s => `• ${s.name}: **${money(s.price)}**`).join('\n')}\n\n${b.priceNote}`,
    pagos: `💳 Formas de pago: ${b.payments}`,
  }[kind];
  await say(txt);
  if (inFlow && ['service', 'day', 'time'].includes(c.step)) {
    await say('¿Seguimos con tu reserva? 👇', { fast: true });
    if (c.step === 'service') return askService();
    if (c.step === 'day') return startDay(true);
    return pickDay(c.data.date, true);
  }
  setStep('idle', {});
  setQuick([{ label: '📅 Sacar turno', payload: 'intent:book' }, ...MENU().slice(2).filter(q => q.payload !== `faq:${kind}`)]);
}
async function human(silent) {
  const st = S(); st.stats.handoffs++; st.convo.misses = 0; setStep('idle', {});
  if (!silent) await say(`Te derivo con una persona del equipo 👩‍💼 Te van a responder por este mismo chat en horario de atención (${B().hours.split('.')[0].toLowerCase()}).\n¡Gracias por la paciencia!`);
  sys('🔔 Conversación derivada a recepción');
  const L = st.inbox.live; L.status = 'derivado'; L.attention = true; save();
  renderPanel({ bump: true });
  toast('⚠️ Requiere atención: el bot derivó una conversación a una persona', { label: 'Ver', fn: () => openConv('live', true) });
  refreshInbox();
  setQuick([{ label: '📅 Mientras tanto, sacar turno', payload: 'intent:book', cls: 'secondary' }]);
}
async function fallback() {
  const c = S().convo; c.misses = (c.misses || 0) + 1; save();
  if (c.misses >= 2) {
    await say('Perdón, sigo sin entenderte bien 🙈 Para no hacerte perder tiempo, te derivo con una persona.');
    return human(true);
  }
  await say('Perdón, no te entendí del todo 🙈 Puedo ayudarte con **turnos, horarios, dirección, precios y formas de pago**. Si preferís, te derivo con una persona.');
  setQuick(MENU());
}

/* ---------- Recordatorios ---------- */
function sendReminder(bk) {
  if (!bk) {
    const cands = S().bookings.filter(x => x.status === 'confirmado' && !x.reminder && !isPast(x.date, x.time))
      .sort((a, b) => (b.source === 'chat') - (a.source === 'chat') || (a.source === 'chat' ? b.createdAt - a.createdAt : (a.date + a.time).localeCompare(b.date + b.time)));
    bk = cands[0];
  }
  if (!bk) { toast('No hay turnos próximos pendientes de recordatorio.'); return; }
  queue = queue.then(async () => {
    const c = S().convo; c.knownName = bk.name; c.knownPhone = bk.phone;
    bk.reminder = 'enviado'; save(); renderPanel({ flash: bk.id });
    sys(`Simulación: recordatorio enviado a ${bk.name} (${bk.phone})`);
    setQuick([]);
    await say(reminderText(bk), {
      msg: { kind: 'reminder', actions: [
        { label: '✅ Confirmo', payload: `rem:confirm:${bk.id}` },
        { label: '🔄 Reprogramar', payload: `rem:resched:${bk.id}` },
        { label: '❌ Cancelar turno', payload: `rem:cancel:${bk.id}` },
      ] },
    });
    toast(`🔔 Recordatorio enviado a ${bk.name}`);
  });
  setView('chat');
}

/* ---------- Render: panel ---------- */
let panelDate = todayStr();
let panelMode = 'day';
const agendaEl = $('#agenda');

function statusInfo(bk) {
  if (bk.status === 'asistio') return ['ok', 'Asistió', 'st-ok'];
  if (bk.status === 'ausente') return ['no', 'No vino', 'st-no'];
  if (bk.status === 'cancelado') return ['cx', 'Cancelado', ''];
  if (bk.reminder === 'confirmado') return ['ok', 'Confirmado ✓', 'st-ok'];
  if (bk.reminder === 'enviado') return ['wait', 'Esperando confirmación', 'st-wait'];
  return ['booked', 'Agendado', ''];
}
function computeStats() {
  const st = S(); const ws = weekStart(todayStr()); const we = ymd(addDays(parseYmd(ws), 6));
  const inWeek = x => x.date >= ws && x.date <= we;
  const week = st.bookings.filter(x => inWeek(x) && x.status !== 'cancelado');
  const cancels = st.bookings.filter(x => inWeek(x) && x.status === 'cancelado');
  const confirmedByRem = st.bookings.filter(x => inWeek(x) && x.reminder === 'confirmado' && x.status !== 'cancelado').length;
  const noShows = week.filter(x => x.status === 'ausente').length;
  const freedInTime = cancels.filter(x => x.cancelledVia === 'recordatorio' || x.cancelledVia === 'chat').length;
  // Estimación: sin recordatorios ~20 % de ausencias, con recordatorios ~7 %.
  const avoided = Math.round(week.length * 0.13) + freedInTime;
  return { week: week.length, cancels: cancels.length, freedInTime, confirmedByRem, noShows, avoided, handoffs: st.stats.handoffs, chat: week.filter(x => x.source === 'chat').length };
}
function renderStats(bump) {
  const s = computeStats();
  const cards = [
    ['📅 Turnos de la semana', s.week, s.chat ? `${s.chat} reservados por el chat` : 'Lunes a domingo'],
    ['✅ Confirmados por recordatorio', s.confirmedByRem, `${s.noShows} ${s.noShows === 1 ? 'ausencia registrada' : 'ausencias registradas'}`],
    ['↩️ Cancelaciones', s.cancels, s.freedInTime ? `${s.freedInTime} avisadas a tiempo (lugar liberado)` : 'Esta semana'],
    ['✨ Ausencias evitadas', `≈ ${s.avoided}`, 'Estimado: 20 % → 7 % con recordatorios', 'hl'],
  ];
  const el = $('#stats');
  const prev = [...el.querySelectorAll('.v')].map(v => v.textContent);
  el.innerHTML = cards.map(([k, v, sub, cls]) => `<div class="stat ${cls || ''}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${esc(sub)}</div></div>`).join('');
  if (bump) el.querySelectorAll('.stat').forEach((c, i) => { if (prev[i] !== undefined && prev[i] !== String(cards[i][1])) c.classList.add('bump'); });
}
function bookingRow(bk) {
  const [chip, label, cls] = statusInfo(bk); const s = service(bk.service);
  const ex = bk.extra ? ` · ${B().extra?.icon || ''} ${esc(bk.extra)}` : '';
  const past = isPast(bk.date, bk.time) || bk.date < todayStr();
  let acts = '';
  if (bk.status === 'asistio' || bk.status === 'ausente') acts = `<button class="mini" data-act="undo" data-id="${bk.id}">Deshacer</button>`;
  else {
    acts = `<button class="mini ok" data-act="attended" data-id="${bk.id}" title="Marcar asistencia">✓ Asistió</button>`
      + `<button class="mini no" data-act="noshow" data-id="${bk.id}" title="Marcar ausencia">✗ No vino</button>`;
    if (!past) acts += `<button class="mini rem" data-act="remind" data-id="${bk.id}" title="Simular recordatorio 24 h antes">🔔</button>`
      + `<button class="mini" data-act="cancel" data-id="${bk.id}" title="Cancelar turno">Cancelar</button>`;
  }
  return { chip, label, cls, s, ex, acts };
}
function renderDay() {
  const st = S(); const slots = slotsFor(panelDate);
  const extraTimes = st.bookings.filter(x => x.date === panelDate && x.status !== 'cancelado' && !slots.includes(x.time)).map(x => x.time);
  const times = [...new Set([...slots, ...extraTimes])].sort();
  if (!times.length) { agendaEl.innerHTML = `<div class="closed"><b>Cerrado</b>${dayLong(panelDate)} no hay atención. Usá las flechas para ver otro día.</div>`; return; }
  let html = '';
  times.forEach(tm => {
    const bk = activeBooking(panelDate, tm); const bl = blockAt(panelDate, tm); const past = isPast(panelDate, tm);
    if (bk) {
      const r = bookingRow(bk);
      html += `<div class="slot booked ${r.cls} ${past ? 'pastb' : ''}" data-bid="${bk.id}"><div class="t">${tm}</div>
        <div class="who"><div class="n">${esc(bk.name)} <span class="chip ${r.chip}">${r.label}</span> <span class="tag src-${bk.source}">${bk.source === 'chat' ? '💬 Chat' : 'Ejemplo'}</span></div>
        <div class="d">${esc(r.s.name)}${r.ex} · ${esc(bk.phone)}</div></div>
        <div class="acts">${r.acts}</div></div>`;
    } else if (bl) {
      html += `<div class="slot blocked"><div class="t">${tm}</div><div class="who">🔒 Bloqueado${bl.reason ? ' · ' + esc(bl.reason) : ''}</div>
        <div class="acts"><button class="mini" data-act="unblock" data-t="${tm}">Desbloquear</button></div></div>`;
    } else {
      html += `<div class="slot free ${past ? 'past' : ''}"><div class="t">${tm}</div><div class="who">${past ? '—' : 'Libre'}</div>
        <div class="acts">${past ? '' : `<button class="mini" data-act="block" data-t="${tm}">🔒 Bloquear</button>`}</div></div>`;
    }
  });
  const cx = st.bookings.filter(x => x.date === panelDate && x.status === 'cancelado');
  if (cx.length) html += `<div class="cx-list"><b>Cancelados este día</b>${cx.map(x => `<div><s>${x.time} · ${esc(x.name)} · ${esc(service(x.service).name)}</s> — por ${x.cancelledVia === 'recordatorio' ? 'respuesta al recordatorio' : x.cancelledVia === 'chat' ? 'el chat' : 'el panel'}</div>`).join('')}</div>`;
  agendaEl.innerHTML = html;
}
function renderWeek() {
  const st = S(); const ws = weekStart(panelDate); let html = '';
  for (let i = 0; i < 7; i++) {
    const d = ymd(addDays(parseYmd(ws), i));
    const items = [
      ...st.bookings.filter(x => x.date === d && x.status !== 'cancelado').map(x => ({ t: x.time, bk: x })),
      ...st.blocks.filter(x => x.date === d).map(x => ({ t: x.time, bl: x })),
    ].sort((a, b) => a.t.localeCompare(b.t));
    const n = items.filter(x => x.bk).length;
    const closed = !slotsFor(d).length;
    html += `<div class="week-day ${d === todayStr() ? 'today' : ''}"><h4 data-goto="${d}">${dayLong(d)[0].toUpperCase() + dayLong(d).slice(1)}${d === todayStr() ? ' · hoy' : ''}<span>${closed ? 'Cerrado' : `${n} ${n === 1 ? 'turno' : 'turnos'} · ${availableSlotsAll(d)} libres`}</span></h4>`;
    if (!items.length) html += `<div class="wempty">${closed ? '—' : 'Sin turnos todavía'}</div>`;
    items.forEach(it => {
      if (it.bk) { const [chip, label] = statusInfo(it.bk); html += `<div class="wrow" data-bid="${it.bk.id}"><span class="t">${it.t}</span><span class="x">${esc(it.bk.name)} <small>· ${esc(service(it.bk.service).name)}${it.bk.source === 'chat' ? ' · 💬' : ''}</small></span><span class="chip ${chip}">${label}</span></div>`; }
      else html += `<div class="wrow"><span class="t">${it.t}</span><span class="x"><small>🔒 Bloqueado${it.bl.reason ? ' · ' + esc(it.bl.reason) : ''}</small></span><span></span></div>`;
    });
    html += `</div>`;
  }
  agendaEl.innerHTML = html;
}
const availableSlotsAll = d => slotsFor(d).filter(tm => !activeBooking(d, tm) && !blockAt(d, tm)).length;
function renderPanel(opts = {}) {
  renderStats(opts.bump); updateInboxBadge();
  document.querySelectorAll('#viewSeg button').forEach(b => b.classList.toggle('active', b.dataset.mode === panelMode));
  if (panelMode === 'day') {
    const r = rel(panelDate);
    $('#dateLabel').textContent = (r ? r[0].toUpperCase() + r.slice(1) + ' · ' : '') + dayLong(panelDate);
    renderDay();
  } else {
    const ws = weekStart(panelDate); const we = ymd(addDays(parseYmd(ws), 6));
    $('#dateLabel').textContent = `Semana del ${dm(ws)} al ${dm(we)}`;
    renderWeek();
  }
  if (opts.flash) {
    const row = agendaEl.querySelector(`[data-bid="${opts.flash}"]`);
    if (row) { row.classList.add('flash'); row.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); }
  }
}

/* ---------- Toasts / vista móvil ---------- */
function toast(text, action) {
  const el = document.createElement('div'); el.className = 'toast';
  el.innerHTML = `<span>${esc(text)}</span>`;
  if (action) { const b = document.createElement('button'); b.textContent = action.label; b.onclick = () => { action.fn(); el.remove(); }; el.appendChild(b); }
  const box = $('#toasts'); box.appendChild(el);
  while (box.children.length > 2) box.firstElementChild.remove();
  setTimeout(() => el.remove(), 3800);
}
const isMobile = () => matchMedia('(max-width:900px)').matches;
function notifyPanel(text) {
  if (isMobile() && $('#stage').dataset.view === 'chat') { $('#panelDot').hidden = false; toast(text, { label: 'Ver panel', fn: () => setView('panel') }); }
  else toast(text);
}
function setView(v) {
  $('#stage').dataset.view = v === 'chat' ? 'chat' : 'panel';
  if (v !== 'chat') setPanelTab(v === 'inbox' ? 'inbox' : 'agenda');
  syncMobileTabs();
  if (v !== 'chat') { $('#panelDot').hidden = true; document.querySelectorAll('.toast').forEach(t => t.querySelector('button') && t.remove()); }
  if (v === 'chat') scrollChat();
}
function syncMobileTabs() {
  const v = $('#stage').dataset.view === 'chat' ? 'chat' : (panelTab === 'inbox' ? 'inbox' : 'panel');
  document.querySelectorAll('#mobileTabs button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
}

/* ---------- Bandeja omnicanal ---------- */
const ICON = {
  whatsapp: '<svg viewBox="0 0 24 24"><path d="M12 3a9 9 0 0 0-7.8 13.5L3 21l4.6-1.2A9 9 0 1 0 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9 9.5c0 3 2.5 5.5 5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
  instagram: '<svg viewBox="0 0 24 24"><rect x="3.5" y="3.5" width="17" height="17" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17" cy="7" r="1.2" fill="currentColor"/></svg>',
  messenger: '<svg viewBox="0 0 24 24"><path d="M12 3C7 3 3 6.7 3 11.3c0 2.6 1.3 4.9 3.3 6.4V21l3-1.7c.9.3 1.8.4 2.7.4 5 0 9-3.7 9-8.4S17 3 12 3z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="m7.5 13.5 3-3 2.5 2 3.5-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  web: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="8.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M3.5 12h17M12 3.5c2.5 2.5 3.5 5.5 3.5 8.5s-1 6-3.5 8.5c-2.5-2.5-3.5-5.5-3.5-8.5s1-6 3.5-8.5z" fill="none" stroke="currentColor" stroke-width="2"/></svg>',
  email: '<svg viewBox="0 0 24 24"><rect x="3" y="5.5" width="18" height="13" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="m4 7 8 6 8-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
};
const CHANNELS = {
  whatsapp: { label: 'WhatsApp', color: '#0F766E', bg: '#CCFBF1' },
  instagram: { label: 'Instagram', color: '#BE185D', bg: '#FCE7F3' },
  messenger: { label: 'Messenger', color: '#6D28D9', bg: '#EDE9FE' },
  web: { label: 'Web chat', color: '#1D4ED8', bg: '#DBEAFE' },
  email: { label: 'Email', color: '#B45309', bg: '#FEF3C7' },
};
const chBadge = (ch, extra = '') => { const c = CHANNELS[ch]; return `<span class="chb" style="--c:${c.color};--b:${c.bg}">${ICON[ch]}${c.label}${extra}</span>`; };

function reminderText(bk, key = state.biz) {
  const b = BIZ[key]; const s = b.services.find(x => x.id === bk.service) || b.services[0];
  return `Hola ${first(bk.name)} 👋 Te recordamos tu turno de **${s.name}**${bk.extra ? ` para **${bk.extra}**` : ''} ${dayPhrase(bk.date)} a las **${bk.time}** en ${b.name} (${b.address}).\n\n¿Nos confirmás tu asistencia?`;
}

function seedInbox(key, st) {
  const b = BIZ[key]; const ago = m => Date.now() - m * 60000; const P = n => money(n);
  const price = id => b.services.find(s => s.id === id)?.price ?? 0;
  const C = {
    dental: {
      ig: ['Camila Ejemplo', '@camila.ejemplo', [
        ['client', 'Hola!! Vi el posteo del blanqueamiento 😍 ¿cuánto sale?', 42],
        ['bot', `¡Hola Camila! 👋 El blanqueamiento sale **${P(price('blanqueamiento'))}** y se puede pagar hasta en 3 cuotas sin recargo. Antes hacemos una consulta de diagnóstico (${P(price('consulta'))}). ¿Querés que te reserve una?`, 41],
        ['client', 'Siii, ¿tienen algo el sábado de mañana?', 7]]],
      fb: [['Buenas. Ayer tenía turno a las 15 y me hicieron esperar 40 minutos 😡', 96], ['Encima me cobraron distinto de lo que me habían dicho por teléfono', 95]],
      fbBot: 'Lamento mucho lo que pasó, Roberto 🙏 Esto lo tiene que ver una persona del equipo: te derivo con recepción y te responden a la brevedad.',
      web: [['Hola, ¿trabajan con mutualistas o seguros?', 190], ['¡Hola! No trabajamos con mutualistas, pero aceptamos débito, crédito (hasta 3 cuotas sin recargo), transferencia y Mercado Pago. Si tenés seguro con reintegro, te damos la factura detallada 😊', 190], ['Perfecto, gracias!', 188]],
      mail: ['Asunto: Factura con RUT\nHola, ¿me podrían enviar la factura de mi última consulta a nombre de mi empresa? RUT 210000000019 (ficticio). Gracias.', 'Hola Sofía, ¡claro! Te la enviamos hoy antes de las 18 h. Saludos, Carolina.', 'Pide factura con RUT. Pasar a administración.'],
    },
    vet: {
      ig: ['Mica Ejemplo', '@mica.y.tango', [
        ['client', 'Hola! ¿Hacen baño y corte para perros grandes? Tengo un golden 🐕', 38],
        ['bot', `¡Hola Mica! Sí 🙌 Baño y corte desde **${P(price('bano'))}** (en perros grandes puede haber un recargo según el pelaje). ¿Querés que te reserve un lugar?`, 37],
        ['client', '¿Y el sábado temprano tienen?', 6]]],
      fb: [['Les escribí ayer por la vacuna de mi gata y nadie me contestó 😤', 90], ['Necesito saber si le toca el refuerzo este mes', 89]],
      fbBot: 'Perdón por la demora, Roberto 🙏 Te derivo con una persona del equipo para revisar la libreta de tu gata y responderte enseguida.',
      web: [['¿Hacen consultas a domicilio en Ciudad de la Costa?', 200], [`¡Hola! Sí, cubrimos Montevideo y Ciudad de la Costa. La consulta a domicilio sale **${P(price('domicilio'))}**. ¿Querés reservar una?`, 200], ['Genial, después reservo. Gracias!', 197]],
      mail: ['Asunto: Certificado de vacunas\nHola, viajamos a Brasil con Luna en diciembre y necesito el certificado de vacunas. ¿Me lo pueden preparar?', 'Hola Sofía, sí. Lo podés pasar a buscar el jueves después de las 15 h. Saludos, Martina.', 'Revisar vigencia de la antirrábica antes de emitir el certificado.'],
    },
    pilates: {
      ig: ['Mica Ejemplo', '@mica.ejemplo', [
        ['client', 'Hola! Nunca hice pilates 🙈 ¿puedo probar una clase?', 45],
        ['bot', '¡Hola Mica! Claro 😊 La **clase de prueba no tiene costo**. Tenemos reformer y mat grupal. ¿Querés que te reserve una?', 44],
        ['client', '¿A las 7 de la mañana hay lugar?', 5]]],
      fb: [['Hola, me cobraron dos veces el pase mensual este mes 😕', 92], ['Les mando captura del estado de cuenta', 91]],
      fbBot: 'Uy, lamento la molestia, Roberto 🙏 Te derivo con una persona del equipo para revisar el cobro y devolverte lo que corresponda.',
      web: [['¿Qué tengo que llevar a la primera clase?', 210], ['Ropa cómoda y medias antideslizantes (si no tenés, te prestamos 😉). Tenemos vestuario con duchas.', 210], ['Buenísimo, gracias!', 207]],
      mail: ['Asunto: Factura pase mensual\nHola, ¿me pueden mandar la factura del pase de noviembre a nombre de mi empresa? Gracias.', 'Hola Sofía, ¡sí! Te la enviamos hoy por este medio. Saludos, Florencia.', 'Factura a nombre de empresa (RUT ficticio en el legajo).'],
    },
  }[key];
  const msgs = arr => arr.map(([from, text, m, kind]) => ({ from, text, ts: ago(m), ...(kind ? { kind } : {}) }));
  const convs = [];
  convs.push({ id: uid(), channel: 'instagram', name: C.ig[0], handle: C.ig[1], phone: '', status: 'bot', attention: false, botPaused: false, unread: 1, notes: [], messages: msgs(C.ig[2]) });
  convs.push({ id: uid(), channel: 'messenger', name: 'Roberto Muestra', handle: 'Roberto Muestra (Facebook)', phone: '099 000 090', status: 'derivado', attention: true, botPaused: false, unread: 2, notes: [],
    messages: msgs([['client', C.fb[0][0], C.fb[0][1]], ['client', C.fb[1][0], C.fb[1][1]], ['bot', C.fbBot, C.fb[1][1] - 0.5], ['sys', '🔔 Conversación derivada a recepción', C.fb[1][1] - 0.6]]) });
  const rb = st.bookings.find(x => x.reminder === 'confirmado' && x.status === 'confirmado' && x.source === 'seed') || st.bookings.find(x => x.status === 'confirmado');
  if (rb) convs.push({ id: uid(), channel: 'whatsapp', name: rb.name, handle: rb.phone, phone: rb.phone, status: 'resuelto', attention: false, botPaused: false, unread: 0, notes: [],
    messages: msgs([['bot', reminderText(rb, key), 150, 'reminder'], ['client', '✅ Confirmo', 128], ['bot', `¡Genial, ${first(rb.name)}! Tu turno queda **confirmado** ✅ Te esperamos ${dayPhrase(rb.date)} a las **${rb.time}**.`, 128]]) });
  convs.push({ id: uid(), channel: 'web', name: 'Laura Testeo', handle: 'Visitante de la web', phone: '', status: 'resuelto', attention: false, botPaused: false, unread: 0, notes: [],
    messages: msgs([['client', C.web[0][0], C.web[0][1]], ['bot', C.web[1][0], C.web[1][1]], ['client', C.web[2][0], C.web[2][1]], ['bot', '¡De nada! 😊 Cualquier cosa, escribime por acá.', C.web[2][1] - 0.3]]) });
  const sb = st.bookings.find(x => x.name === BIZ[key].names[4]);
  convs.push({ id: uid(), channel: 'email', name: BIZ[key].names[4], handle: 'sofia.muestra@ejemplo.com', phone: sb ? sb.phone : '', status: 'derivado', attention: false, botPaused: true, unread: 0,
    notes: [{ type: 'note', text: C.mail[2], agent: b.agent, ts: ago(250) }],
    messages: msgs([['client', C.mail[0], 300], ['bot', 'Recibimos tu correo 📩 Lo derivamos a administración, que te responde en el día.', 299.5], ['staff', C.mail[1], 240]]).map(m => m.from === 'staff' ? { ...m, agent: b.agent } : m) });
  return { live: { channel: 'whatsapp', status: 'bot', attention: false, botPaused: false, unread: 0, notes: [] }, convs };
}

let panelTab = 'agenda';
let selConv = null;
let ibxFilter = { ch: 'all', st: 'all', q: '' };
let composeMode = 'reply';
let showCard = false;

const IB = () => S().inbox;
function liveConv() {
  const st = S(); const c = st.convo;
  return { ...st.inbox.live, id: 'live', live: true, name: c.knownName || 'Visitante del chat', phone: c.knownPhone || '', handle: 'Chat en vivo (izquierda)',
    messages: st.chat.map(m => ({ from: m.from === 'user' ? 'client' : m.from, text: m.text, ts: m.ts, kind: m.kind, agent: m.agent })) };
}
const allConvs = () => [liveConv(), ...IB().convs];
const metaOf = id => id === 'live' ? IB().live : IB().convs.find(c => c.id === id);
const convOf = id => id === 'live' ? liveConv() : IB().convs.find(c => c.id === id);
const lastTs = c => c.messages.length ? c.messages[c.messages.length - 1].ts : 0;
const initials = n => n.split(' ').filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const shortTime = ts => { const d = new Date(ts); const s = ymd(d); if (s === todayStr()) return `${pad(d.getHours())}:${pad(d.getMinutes())}`; if (s === ymd(addDays(new Date(), -1))) return 'Ayer'; return dm(s); };
const plain = t => (t || '').replace(/\*\*/g, '').replace(/\n+/g, ' ');
function statusChip(c) {
  let h = c.status === 'resuelto' ? '<span class="chip ok">✓ Resuelto</span>' : c.status === 'derivado' ? `<span class="chip wait">👩‍💼 ${c.botPaused ? 'Atiende una persona' : 'Derivado a humano'}</span>` : '<span class="chip booked">🤖 Bot atendiendo</span>';
  if (c.attention) h = '<span class="chip no">⚠️ Requiere atención</span>' + h;
  return h;
}
const inboxVisible = () => panelTab === 'inbox' && (!isMobile() || $('#stage').dataset.view === 'panel');

function setPanelTab(t) {
  panelTab = t;
  $('#tabAgenda').hidden = t !== 'agenda'; $('#tabInbox').hidden = t !== 'inbox';
  document.querySelectorAll('#ptabs button').forEach(b => b.classList.toggle('active', b.dataset.ptab === t));
  syncMobileTabs();
  if (t === 'inbox') { if (selConv) { const m = metaOf(selConv); if (m) { m.unread = 0; save(); } } renderInbox(); } else renderPanel();
}
function updateInboxBadge() {
  if (!S().inbox) return;
  const cs = allConvs(); const unread = cs.reduce((a, c) => a + (c.unread || 0), 0); const att = cs.some(c => c.attention);
  [$('#inboxBadge'), $('#mobileInboxBadge')].forEach(el => { el.hidden = !unread && !att; el.textContent = unread > 9 ? '9+' : (unread || '!'); el.classList.toggle('alert', att); });
}
function onLiveMsg(m) {
  if (!S().inbox) return;
  const L = IB().live;
  if (m.from === 'user') {
    if (!(inboxVisible() && selConv === 'live')) L.unread = (L.unread || 0) + 1;
    if (L.status === 'resuelto') L.status = L.botPaused ? 'derivado' : 'bot';
    save();
  }
  refreshInbox('live');
}
function refreshInbox(id) {
  updateInboxBadge();
  if (!inboxVisible()) return;
  renderIbxStats(); renderConvList();
  if (!id || id === selConv) { renderThreadHead(); renderThreadBody(); renderCard(); }
}
function notifyInbox(text) {
  if (inboxVisible() && selConv === 'live') return;
  toast(text, { label: 'Ver', fn: () => openConv('live', true) });
}

function renderIbxStats() {
  const cs = allConvs();
  const open = cs.filter(c => c.status !== 'resuelto').length;
  const att = cs.filter(c => c.attention).length;
  const der = cs.filter(c => c.status === 'derivado').length;
  const botOnly = cs.filter(c => c.messages.some(m => m.from === 'client') && !c.messages.some(m => m.from === 'staff') && c.status !== 'derivado' && !c.attention).length;
  const total = cs.filter(c => c.messages.some(m => m.from === 'client')).length;
  const chans = new Set(cs.map(c => c.channel)).size;
  $('#ibxStats').innerHTML = [
    ['💬 Conversaciones abiertas', open, `${cs.length} en total · ${chans} canales`],
    ['⚠️ Requieren atención', att, att ? 'Derivadas por el bot, sin tomar' : 'Todo al día 🙌', att ? 'alert' : ''],
    ['👩‍💼 Derivadas a humano', der, 'Las atiende tu equipo'],
    ['🤖 Resueltas solo por el bot', `${botOnly}/${total}`, 'Sin intervención del equipo', 'hl'],
  ].map(([k, v, sub, cls]) => `<div class="stat ${cls || ''}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${esc(sub)}</div></div>`).join('');
}
function renderChFilter() {
  const opts = [['all', 'Todos']].concat(Object.keys(CHANNELS).map(k => [k, CHANNELS[k].label]));
  $('#chFilter').innerHTML = opts.map(([k, l]) => `<button data-ch="${k}" class="${ibxFilter.ch === k ? 'active' : ''}" title="${l}" ${k !== 'all' ? `style="--c:${CHANNELS[k].color};--b:${CHANNELS[k].bg}"` : ''}>${k === 'all' ? 'Todos' : ICON[k]}</button>`).join('');
}
function filteredConvs() {
  const q = norm(ibxFilter.q);
  return allConvs().filter(c => {
    if (ibxFilter.ch !== 'all' && c.channel !== ibxFilter.ch) return false;
    if (ibxFilter.st === 'atencion' && !c.attention) return false;
    if (['bot', 'derivado', 'resuelto'].includes(ibxFilter.st) && c.status !== ibxFilter.st) return false;
    if (q && !norm(`${c.name} ${c.handle} ${c.phone} ${c.messages.map(m => m.text).join(' ')}`).includes(q)) return false;
    return true;
  }).sort((a, b) => (b.attention - a.attention) || (lastTs(b) - lastTs(a)));
}
function renderConvList() {
  const list = filteredConvs();
  if (!list.length) { $('#convList').innerHTML = '<div class="conv-empty">No hay conversaciones con esos filtros.</div>'; return; }
  $('#convList').innerHTML = list.map(c => {
    const last = [...c.messages].reverse().find(m => m.from !== 'sys') || { text: '' };
    const who = last.from === 'bot' ? '🤖 ' : last.from === 'staff' ? 'Vos: ' : '';
    const col = CHANNELS[c.channel];
    return `<button class="conv ${selConv === c.id ? 'sel' : ''} ${c.attention ? 'att' : ''} ${c.unread ? 'unread' : ''}" data-conv="${c.id}">
      <span class="cav" style="--c:${col.color};--b:${col.bg}">${esc(initials(c.name))}<i style="background:${col.color}">${ICON[c.channel]}</i></span>
      <span class="cmain">
        <span class="crow"><b>${esc(c.name)}</b><time>${lastTs(c) ? shortTime(lastTs(c)) : ''}</time></span>
        <span class="cprev">${esc(who + plain(last.text))}</span>
        <span class="crow2">${chBadge(c.channel, c.live ? ' · en vivo' : '')}${statusChip(c)}${c.unread ? `<em class="unr">${c.unread}</em>` : ''}</span>
      </span></button>`;
  }).join('');
}
function renderThreadHead() {
  const c = selConv && convOf(selConv);
  $('#thComposer').hidden = !c;
  if (!c) {
    $('#thHead').innerHTML = ''; $('#thBanner').innerHTML = '';
    $('#thBody').innerHTML = '<div class="th-empty"><div>💬</div><b>Todas tus conversaciones en un solo lugar</b>WhatsApp, Instagram, Messenger, web y email. Elegí una conversación para ver el hilo completo.</div>';
    $('#ibxThread').classList.remove('has-card');
    return;
  }
  const col = CHANNELS[c.channel];
  $('#thHead').innerHTML = `
    <button class="icon-btn th-back" data-ia="back" aria-label="Volver">‹</button>
    <span class="cav" style="--c:${col.color};--b:${col.bg}">${esc(initials(c.name))}</span>
    <div class="th-who"><b>${esc(c.name)}</b><span>${chBadge(c.channel, c.live ? ' · en vivo' : '')} ${statusChip(c)}</span></div>
    <div class="th-acts">
      ${c.botPaused ? '<button class="mini" data-ia="return">🤖 Devolver al bot</button>' : '<button class="mini primary" data-ia="take">✋ Tomar conversación</button>'}
      ${c.status === 'resuelto' ? '<button class="mini" data-ia="reopen">↺ Reabrir</button>' : '<button class="mini ok" data-ia="resolve">✓ Marcar resuelta</button>'}
      <button class="mini th-cardbtn" data-ia="card">👤 Ficha</button>
    </div>`;
  let ban = '';
  if (c.attention) ban += `<div class="ban ban-att">⚠️ <span><b>Requiere atención.</b> El bot derivó esta conversación a una persona.</span><button class="mini primary" data-ia="take">Tomar conversación</button></div>`;
  else if (c.botPaused) ban += `<div class="ban ban-pause">⏸ <span><b>Bot en pausa:</b> está atendiendo ${esc(B().agent)}. El asistente no responde hasta que lo devuelvas.</span></div>`;
  if (c.live) ban += `<div class="ban ban-live">🔴 <span>Es la conversación del chat ${isMobile() ? 'de la pestaña «Chat»' : 'de la izquierda'}: lo que respondas aparece ahí en tiempo real.</span></div>`;
  $('#thBanner').innerHTML = ban;
  $('#thInput').placeholder = composeMode === 'note' ? 'Nota interna: solo la ve tu equipo…' : c.live ? 'Respondé como recepción: aparece en el chat del cliente…' : `Respondé por ${col.label}…`;
  $('#ibxThread').classList.toggle('has-card', showCard);
}
function renderThreadBody() {
  const c = selConv && convOf(selConv); if (!c) return;
  const items = [...c.messages, ...(c.notes || []).map(n => ({ ...n, from: n.type === 'event' ? 'event' : 'note' }))].sort((a, b) => a.ts - b.ts);
  let html = ''; let lastDay = '';
  items.forEach(m => {
    const day = ymd(new Date(m.ts));
    if (day !== lastDay) { html += `<div class="day-sep">${day === todayStr() ? 'Hoy' : dayLong(day)}</div>`; lastDay = day; }
    const t = shortTime(m.ts).includes(':') ? shortTime(m.ts) : `${pad(new Date(m.ts).getHours())}:${pad(new Date(m.ts).getMinutes())}`;
    if (m.from === 'sys' || m.from === 'event') { html += `<div class="im-sys">${fmt(m.text)} · ${t}</div>`; return; }
    if (m.from === 'note') { html += `<div class="im im-note"><div class="im-h">🔒 Nota interna · ${esc(m.agent || B().agent)}</div>${fmt(m.text)}<span class="time">${t}</span></div>`; return; }
    const label = m.from === 'client' ? esc(c.name) : m.from === 'bot' ? `🤖 ${esc(B().assistant)} (bot)${m.kind === 'reminder' ? ' · 🔔 recordatorio' : ''}` : `👩‍💼 ${esc(m.agent || B().agent)}`;
    html += `<div class="im im-${m.from}"><div class="im-h">${label}</div>${fmt(m.text)}<span class="time">${t}</span></div>`;
  });
  const body = $('#thBody'); body.innerHTML = html;
  requestAnimationFrame(() => { body.scrollTop = body.scrollHeight; });
}
function renderCard() {
  const c = selConv && convOf(selConv); if (!c) { $('#ccard').innerHTML = ''; return; }
  const st = S();
  const mine = c.phone || c.name !== 'Visitante del chat' ? st.bookings.filter(x => (c.phone && samePhone(x.phone, c.phone)) || x.name === c.name) : [];
  const upcoming = mine.filter(x => x.status === 'confirmado' && !isPast(x.date, x.time)).sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  const att = mine.filter(x => x.status === 'asistio').length, no = mine.filter(x => x.status === 'ausente').length, cx = mine.filter(x => x.status === 'cancelado').length;
  const notes = (c.notes || []).filter(n => n.type !== 'event');
  $('#ccard').innerHTML = `
    <button class="icon-btn card-close" data-ia="card" aria-label="Cerrar ficha">✕</button>
    <div class="cc-top"><span class="cav big" style="--c:${CHANNELS[c.channel].color};--b:${CHANNELS[c.channel].bg}">${esc(initials(c.name))}</span>
      <b>${esc(c.name)}</b><small>${esc(B().client[0].toUpperCase() + B().client.slice(1))}${c.live ? ' · demo en vivo' : ''}</small></div>
    <dl class="cc-dl">
      <dt>Canal</dt><dd>${chBadge(c.channel)}</dd>
      <dt>Contacto</dt><dd>${esc(c.handle || '—')}</dd>
      <dt>Teléfono</dt><dd>${esc(c.phone || 'Sin dato todavía')}</dd>
      ${mine.length ? `<dt>Historial</dt><dd>${att} asistencias · ${no} ausencias · ${cx} cancelaciones</dd>` : ''}
    </dl>
    <h5>Próximos turnos</h5>
    ${upcoming.length ? upcoming.map(x => `<button class="cc-appt" data-goto-bk="${x.id}"><b>${dayChip(x.date)} · ${x.time}</b><span>${esc(service(x.service).name)}${x.extra ? ' · ' + esc(x.extra) : ''}</span>${(() => { const [ch, l] = statusInfo(x); return `<span class="chip ${ch}">${l}</span>`; })()}</button>`).join('') : '<p class="cc-empty">Sin turnos agendados.</p>'}
    <h5>Notas internas</h5>
    ${notes.length ? notes.map(n => `<div class="cc-note">${fmt(n.text)}<small>${esc(n.agent || B().agent)} · ${shortTime(n.ts)}</small></div>`).join('') : '<p class="cc-empty">Todavía no hay notas.</p>'}
    <button class="mini" data-ia="notemode">🔒 Agregar nota</button>`;
}
function renderInbox() {
  if (!S().inbox) return;
  updateInboxBadge();
  if (selConv && !convOf(selConv)) selConv = null;
  $('#ibx').dataset.mobile = selConv && mobileThread ? 'thread' : 'list';
  $('#tabInbox').classList.toggle('in-thread', !!(selConv && mobileThread));
  renderChFilter(); renderIbxStats(); renderConvList(); renderThreadHead(); renderThreadBody(); renderCard();
  document.querySelectorAll('#thMode button').forEach(b => b.classList.toggle('active', b.dataset.mode === composeMode));
  $('#thComposer').classList.toggle('note', composeMode === 'note');
}
let mobileThread = false;
function openConv(id, navigate) {
  selConv = id; mobileThread = true; showCard = false;
  const m = metaOf(id); if (m) { m.unread = 0; save(); }
  if (navigate) { if (isMobile()) setView('inbox'); else setPanelTab('inbox'); }
  renderInbox();
}
function addEvent(id, text) {
  const m = metaOf(id); m.notes = m.notes || []; m.notes.push({ type: 'event', text, ts: Date.now() });
}
function takeConv(id) {
  const m = metaOf(id); if (m.botPaused) return;
  m.botPaused = true; m.attention = false; m.status = 'derivado';
  if (id === 'live') { save(); setQuick([]); sys(`👩‍💼 ${B().agent} (recepción) se sumó a la conversación`); renderHeader(); }
  else { m.messages.push({ from: 'sys', text: `👩‍💼 ${B().agent} tomó la conversación`, ts: Date.now() }); }
  save(); toast(`✋ Tomaste la conversación con ${convOf(id).name}: el bot queda en pausa`);
}
function returnConv(id) {
  const m = metaOf(id); m.botPaused = false; m.status = 'bot'; m.attention = false; save();
  if (id === 'live') {
    sys('🤖 La conversación volvió al asistente virtual'); renderHeader();
    queue = queue.then(async () => { await say('¡Hola de nuevo! Sigo yo por acá 😊 ¿Te ayudo con algo más?'); setStep('idle', {}); setQuick(MENU()); });
  } else addEvent(id, '🤖 Devuelta al bot');
  save(); toast('🤖 El asistente vuelve a responder esta conversación');
}
function resolveConv(id) {
  const m = metaOf(id); m.status = 'resuelto'; m.attention = false;
  const wasPaused = m.botPaused; m.botPaused = false;
  addEvent(id, `✓ Marcada como resuelta por ${B().agent}`); save();
  if (id === 'live') { renderHeader(); if (wasPaused) { setStep('idle', {}); setQuick(MENU()); } }
  toast(`✓ Conversación con ${convOf(id).name} resuelta`);
}
function sendStaff(id, text) {
  const m = metaOf(id);
  if (composeMode === 'note') { m.notes = m.notes || []; m.notes.push({ type: 'note', text, agent: B().agent, ts: Date.now() }); save(); toast('🔒 Nota interna guardada (el cliente no la ve)'); return; }
  if (!m.botPaused) takeConv(id);
  if (m.status === 'resuelto') m.status = 'derivado';
  if (id === 'live') { push({ from: 'staff', text, agent: B().agent }); }
  else {
    m.messages.push({ from: 'staff', text, agent: B().agent, ts: Date.now() }); save();
    if (!m.autoReplied) {
      m.autoReplied = true; save();
      setTimeout(() => {
        const mm = metaOf(id); if (!mm) return;
        mm.messages.push({ from: 'client', text: '¡Dale, muchas gracias! 🙌', ts: Date.now() });
        if (!(inboxVisible() && selConv === id)) mm.unread = (mm.unread || 0) + 1;
        save(); refreshInbox(id);
      }, FAST ? 600 : 2600);
    }
  }
}

$('#ptabs').addEventListener('click', e => { const b = e.target.closest('[data-ptab]'); if (b) setPanelTab(b.dataset.ptab); });
$('#chFilter').addEventListener('click', e => { const b = e.target.closest('[data-ch]'); if (!b) return; ibxFilter.ch = b.dataset.ch; renderChFilter(); renderConvList(); });
$('#stFilter').addEventListener('change', e => { ibxFilter.st = e.target.value; renderConvList(); });
$('#ibxSearch').addEventListener('input', e => { ibxFilter.q = e.target.value; renderConvList(); });
$('#convList').addEventListener('click', e => { const b = e.target.closest('[data-conv]'); if (b) openConv(b.dataset.conv); });
$('#thMode').addEventListener('click', e => { const b = e.target.closest('[data-mode]'); if (!b) return; composeMode = b.dataset.mode; renderInbox(); $('#thInput').focus(); });
$('#ibxThread').addEventListener('click', e => {
  const g = e.target.closest('[data-goto-bk]');
  if (g) { const bk = S().bookings.find(x => x.id === g.dataset.gotoBk); if (bk) { panelDate = bk.date; panelMode = 'day'; if (isMobile()) setView('panel'); else setPanelTab('agenda'); renderPanel({ flash: bk.id }); } return; }
  const b = e.target.closest('[data-ia]'); if (!b || !selConv) return;
  const a = b.dataset.ia;
  if (a === 'back') { mobileThread = false; renderInbox(); return; }
  if (a === 'card') { showCard = !showCard; $('#ibxThread').classList.toggle('has-card', showCard); return; }
  if (a === 'notemode') { composeMode = 'note'; showCard = false; renderInbox(); $('#thInput').focus(); return; }
  if (a === 'take') takeConv(selConv);
  if (a === 'return') returnConv(selConv);
  if (a === 'resolve') resolveConv(selConv);
  if (a === 'reopen') { const m = metaOf(selConv); m.status = m.botPaused ? 'derivado' : 'bot'; addEvent(selConv, '↺ Conversación reabierta'); save(); }
  renderInbox();
});
$('#thComposer').addEventListener('submit', e => {
  e.preventDefault(); const v = $('#thInput').value.trim(); if (!v || !selConv) return;
  $('#thInput').value = ''; sendStaff(selConv, v); renderInbox(); $('#thInput').focus();
});

/* ---------- Eventos ---------- */
$('#composer').addEventListener('submit', e => { e.preventDefault(); const v = input.value; if (!v.trim() || typingOn) return; input.value = ''; userSays(v); });
quickEl.addEventListener('click', e => { const b = e.target.closest('button'); if (b) userSays(b.textContent, b.dataset.payload); });
chatBody.addEventListener('click', e => {
  const b = e.target.closest('.actions button'); if (!b || typingOn) return;
  const m = S().chat.find(x => x.id === b.dataset.msg); if (!m || m.used) return;
  m.used = b.dataset.payload; save();
  const wrap = b.parentElement; wrap.classList.add('used'); b.classList.add('chosen');
  userSays(b.textContent, b.dataset.payload);
});
agendaEl.addEventListener('click', e => {
  const h = e.target.closest('[data-goto]'); if (h) { panelDate = h.dataset.goto; panelMode = 'day'; return renderPanel(); }
  const b = e.target.closest('[data-act]'); if (!b) return;
  const st = S(); const bk = st.bookings.find(x => x.id === b.dataset.id); const act = b.dataset.act;
  if (act === 'block') { st.blocks.push({ date: panelDate, time: b.dataset.t, reason: 'Bloqueado desde el panel' }); toast(`🔒 ${dayShort(panelDate)} ${b.dataset.t} bloqueado: ya no se ofrece en el chat`); }
  if (act === 'unblock') { st.blocks = st.blocks.filter(x => !(x.date === panelDate && x.time === b.dataset.t)); toast(`🔓 ${dayShort(panelDate)} ${b.dataset.t} vuelve a estar disponible`); }
  if (act === 'attended') { bk.status = 'asistio'; toast(`✓ ${bk.name} asistió`); }
  if (act === 'noshow') { bk.status = 'ausente'; toast(`✗ ${bk.name} no vino`); }
  if (act === 'undo') { bk.status = 'confirmado'; }
  if (act === 'cancel') { bk.status = 'cancelado'; bk.cancelledVia = 'panel'; toast(`Turno de ${bk.name} cancelado desde el panel`); }
  save(); renderPanel({ bump: true });
  if (act === 'remind') sendReminder(bk);
});
document.querySelectorAll('#viewSeg button').forEach(b => b.addEventListener('click', () => { panelMode = b.dataset.mode; renderPanel(); }));
$('#prevDate').addEventListener('click', () => { panelDate = ymd(addDays(parseYmd(panelDate), panelMode === 'day' ? -1 : -7)); renderPanel(); });
$('#nextDate').addEventListener('click', () => { panelDate = ymd(addDays(parseYmd(panelDate), panelMode === 'day' ? 1 : 7)); renderPanel(); });
$('#todayBtn').addEventListener('click', () => { panelDate = todayStr(); renderPanel(); });
document.querySelectorAll('#mobileTabs button').forEach(b => b.addEventListener('click', () => setView(b.dataset.view)));
document.querySelectorAll('#bizSwitch button').forEach(b => b.addEventListener('click', () => switchBiz(b.dataset.biz)));
$('#btnReminder').addEventListener('click', () => sendReminder());
$('#btnReset').addEventListener('click', () => {
  const biz = state.biz; state = fresh(); state.biz = biz; save();
  typingOn = false; queue = Promise.resolve(); panelDate = todayStr(); panelMode = 'day'; selConv = null; ibxFilter = { ch: 'all', st: 'all', q: '' }; $('#ibxSearch').value = ''; $('#stFilter').value = 'all';
  boot(); toast('↺ Demo reiniciada con datos de ejemplo');
});
window.addEventListener('storage', e => { if (e.key === STORE_KEY && !typingOn) { load(); renderHeader(); renderChat(); renderPanel(); renderInbox(); } });

function switchBiz(key) {
  if (key === state.biz || typingOn) return;
  state.biz = key; save(); panelDate = todayStr(); selConv = null;
  boot();
}
function boot() {
  bizState(); save();
  renderHeader(); renderChat(); renderPanel(); renderInbox();
  if (!S().chat.length) queue = queue.then(() => welcome(false));
}

load(); boot();
window.__demo = { get state() { return state; }, reset: () => $('#btnReset').click() };
})();
