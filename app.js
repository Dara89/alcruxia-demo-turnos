/* Demo "Bot de turnos con recordatorios" — Alcruxia
   Vanilla JS, sin backend. Estado en localStorage. Todos los datos son ficticios. */
(() => {
'use strict';

const STORE_KEY = 'alcruxia-demo-turnos-v1';
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
    emoji: '🦷', name: 'Clínica Dental Sonría', assistant: 'Sofi', panelTitle: 'Panel de la clínica', client: 'paciente', clients: 'pacientes',
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
    emoji: '🐾', name: 'Veterinaria Huellitas', assistant: 'Lola', panelTitle: 'Panel de la veterinaria', client: 'cliente', clients: 'clientes',
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
    emoji: '🧘', name: 'Estudio Pilates Equilibrio', assistant: 'Vera', panelTitle: 'Panel del estudio', client: 'alumna/o', clients: 'alumnos',
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
  $('#chatStatus').textContent = `${b.assistant} · asistente virtual`;
  $('#panelTitle').textContent = b.panelTitle;
  $('#mobilePanelLabel').textContent = b.panelTitle;
  $('#panelSub').textContent = `${b.name} · agenda en vivo`;
  document.querySelectorAll('#bizSwitch button').forEach(x => x.classList.toggle('active', x.dataset.biz === state.biz));
}

function msgHTML(m) {
  if (m.from === 'sys') return `<div class="sys">${fmt(m.text)}</div>`;
  const time = new Date(m.ts); const t = `${pad(time.getHours())}:${pad(time.getMinutes())}`;
  let inner = '';
  if (m.kind === 'reminder') inner += `<div class="rem-head">🔔 Recordatorio automático · 24 h antes</div>`;
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
  save(); appendMsg(m);
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
  renderPanel({ bump: true }); notifyPanel('👤 Una conversación fue derivada a una persona');
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
    await say(`Hola ${first(bk.name)} 👋 Te recordamos tu turno de **${service(bk.service).name}**${bk.extra ? ` para **${bk.extra}**` : ''} ${dayPhrase(bk.date)} a las **${bk.time}** en ${B().name} (${B().address}).\n\n¿Nos confirmás tu asistencia?`, {
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
  renderStats(opts.bump);
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
  $('#stage').dataset.view = v;
  document.querySelectorAll('#mobileTabs button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
  if (v === 'panel') { $('#panelDot').hidden = true; document.querySelectorAll('.toast').forEach(t => t.querySelector('button') && t.remove()); }
  if (v === 'chat') scrollChat();
}

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
  typingOn = false; queue = Promise.resolve(); panelDate = todayStr(); panelMode = 'day';
  boot(); toast('↺ Demo reiniciada con datos de ejemplo');
});
window.addEventListener('storage', e => { if (e.key === STORE_KEY && !typingOn) { load(); renderHeader(); renderChat(); renderPanel(); } });

function switchBiz(key) {
  if (key === state.biz || typingOn) return;
  state.biz = key; save(); panelDate = todayStr();
  boot();
}
function boot() {
  bizState(); save();
  renderHeader(); renderChat(); renderPanel();
  if (!S().chat.length) queue = queue.then(() => welcome(false));
}

load(); boot();
window.__demo = { get state() { return state; }, reset: () => $('#btnReset').click() };
})();
