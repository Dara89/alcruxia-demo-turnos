/* Demo "Asistente inteligente para tu negocio" — Alcruxia
   Vanilla JS, sin backend. Estado en localStorage. Todos los datos son ficticios. */
(() => {
'use strict';

const STORE_KEY = 'alcruxia-demo-turnos-v3';
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
  contenedores: {
    kind: 'sales', emoji: '📦', name: 'Contenedores del Sur', assistant: 'Maite', agent: 'Rodrigo', roleLabel: 'Ventas', handoffTo: 'el equipo de ventas',
    panelTitle: 'Panel comercial', client: 'cliente', clients: 'clientes', askEmail: true, followup: true,
    remLabel: 'Simular seguimiento de cotización', remTitle: 'Envía al chat el seguimiento automático de la última cotización',
    quoteLabel: '📦 Cotizar contenedor', humanLabel: '👤 Hablar con un vendedor',
    welcome: '¡Hola! 👋 Soy **Maite**, la asistente virtual de **Contenedores del Sur**.\nTe ayudo a cotizar contenedores marítimos (compra, alquiler o modificados), te cuento plazos y formas de pago y te agendo una visita al predio. ¿Qué necesitás?',
    fallbackText: 'Perdón, no te entendí del todo 🙈 Puedo **cotizarte un contenedor**, contarte **plazos, formas de pago, financiación, garantía y permisos**, o agendarte una visita. Si preferís, te derivo con un vendedor.',
    services: [
      { id: 'visita', name: 'Visita al predio', dur: 60, price: 0, kw: ['visita', 'predio', 'verlo', 'ir a ver', 'pasar'] },
      { id: 'llamada', name: 'Llamada con un vendedor', dur: 30, price: 0, kw: ['llamada', 'llamen', 'llamar', 'telefono', 'vendedor'] },
    ],
    step: 30,
    schedule: { ...WEEKDAYS([['08:00', '12:00'], ['13:00', '17:00']]), 6: [['09:00', '12:00']] },
    hours: 'Lunes a viernes de 8 a 17 h. Sábados de 9 a 12 h (predio abierto con cita).',
    address: 'Ruta Ficticia 101 km 23, Canelones',
    addressExtra: 'Predio con más de 150 contenedores en exhibición. Hay estacionamiento adentro del predio.',
    payments: 'Transferencia, depósito, tarjeta de crédito y efectivo en el predio.',
    priceNote: 'Pedí tu cotización por el chat: te la armo en un minuto.',
    extra: null,
    stages: [{ id: 'nuevo', label: 'Nuevo' }, { id: 'cotizado', label: 'Cotizado' }, { id: 'visita', label: 'Visita agendada' }, { id: 'ganado', label: 'Ganado' }, { id: 'perdido', label: 'Perdido' }],
    faqs: [
      { id: 'financ', label: '🏦 Financiación', rx: /\b(financ|cuotas|plan de pago|leasing|a plazo)/, text: '🏦 **Financiación**: hasta 12 cuotas con tarjeta de crédito, o plan propio con 40 % de entrega y el saldo en 6 o 12 cuotas en dólares (sujeto a aprobación). Para empresas también se puede hacer por leasing.' },
      { id: 'pagos', label: '💳 Formas de pago', rx: /\b(pago|pagar|tarjeta|efectivo|transfer|debito|credito|aceptan|sena)/, text: '💳 **Formas de pago**: transferencia bancaria (en dólares o en pesos al cambio del día), depósito, tarjeta de crédito y efectivo en el predio.\nPara reservar el contenedor se paga una seña del 30 % y el saldo antes de la entrega.' },
      { id: 'plazos', label: '🚚 Plazos de entrega', rx: /\b(plazo|demora|cuando llega|entrega|envio|flete|camion|grua|tardan)/, text: '🚚 **Plazos de entrega** (contenedores en stock): Montevideo y Canelones en 2 a 4 días hábiles; el resto del país, en 3 a 8 días.\nLos modificados llevan entre 25 y 40 días de fabricación.\nEntregamos con camión con hidrogrúa: el terreno tiene que tener un acceso firme y unos 3 m libres a los costados.' },
      { id: 'garantia', label: '🛡️ Garantía', rx: /\b(garant|estanc|hermetic|se llueve|filtra)/, text: '🛡️ **Garantía**\n• Nuevos y one-trip: 12 meses de estanqueidad (no entra agua).\n• Usados: certificado de inspección “apto carga” y 3 meses de garantía.\n• Modificados: 12 meses en estructura, aberturas e instalaciones.' },
      { id: 'permisos', label: '📄 Permisos', rx: /\b(permiso|habilit|intendencia|municipal|tramite|regulariz|legal)/, text: '📄 **Permisos**: para usarlo como depósito en tu terreno normalmente no hace falta trámite. Si lo vas a usar como vivienda u oficina, cada Intendencia pide su permiso o regularización.\nTe damos los planos y la memoria técnica del modificado para presentar. Consultá siempre en la Intendencia de tu departamento.' },
    ],
    names: ['Ana Ejemplo', 'Martín Prueba', 'Lucía Demo', 'Diego Ficticio', 'Sofía Muestra', 'Pablo Testeo', 'Carla Simulada', 'Joaquín Ejemplar', 'Valentina Demo'],
  },
  inmobiliaria: {
    kind: 'sales', emoji: '🏠', name: 'Inmobiliaria Costa Este', assistant: 'Clara', agent: 'Valeria', roleLabel: 'Agente', handoffTo: 'un agente',
    panelTitle: 'Panel de la inmobiliaria', client: 'cliente', clients: 'clientes', askEmail: false,
    remLabel: 'Simular recordatorio de visita', remTitle: 'Envía al chat el recordatorio de la próxima visita (24 h antes)',
    remHead: '🔔 Recordatorio de visita · 24 h antes',
    quoteLabel: '🏠 Buscar propiedad', humanLabel: '👤 Hablar con un agente',
    welcome: '¡Hola! 👋 Soy **Clara**, la asistente virtual de **Inmobiliaria Costa Este**.\nTe ayudo a encontrar tu próxima propiedad en Punta del Este o Montevideo, para comprar o alquilar (anual o por temporada), y te agendo la visita. ¿Qué estás buscando?',
    fallbackText: 'Perdón, no te entendí del todo 🙈 Puedo **buscarte propiedades**, agendarte una **visita** o contarte sobre **requisitos, garantías, comisión y gastos comunes**. Si preferís, te derivo con un agente.',
    services: [
      { id: 'visita', name: 'Visita a la propiedad', dur: 60, price: 0, kw: ['visita', 'ver la', 'verla', 'conocer', 'recorrer'] },
      { id: 'video', name: 'Videollamada con un agente', dur: 30, price: 0, kw: ['video', 'llamada', 'virtual', 'zoom', 'meet'] },
    ],
    step: 30,
    schedule: { ...WEEKDAYS([['09:00', '13:00'], ['14:00', '19:00']]), 6: [['10:00', '14:00']] },
    hours: 'Lunes a viernes de 9 a 19 h. Sábados de 10 a 14 h. En temporada también abrimos los domingos.',
    address: 'Av. Inventada 900, Punta del Este · Sucursal: Calle Ejemplo 2500, Pocitos, Montevideo',
    addressExtra: 'Las visitas se hacen en la propiedad: el agente te espera en la puerta.',
    payments: 'Transferencia, depósito y tarjeta de crédito (temporarios).',
    priceNote: 'Cada propiedad tiene su precio publicado en la ficha.',
    extra: { key: 'prop', label: 'Propiedad', ask: '¿Qué propiedad te interesa? Pasame el código (por ejemplo **CE-105**) o la zona 🏠', icon: '🏠', thanks: '¡Anotado! 🏠 ' },
    seedExtras: ['CE-304 · Playa Mansa', 'CE-101 · Península', 'CE-201 · Pocitos', 'CE-104 · La Barra', 'CE-205 · Playa Mansa', 'CE-103 · Playa Mansa', 'CE-105 · Pocitos', 'CE-202 · Punta Carretas', 'CE-302 · Península'],
    stages: [{ id: 'nuevo', label: 'Nuevo' }, { id: 'calificado', label: 'Calificado' }, { id: 'visita', label: 'Visita' }, { id: 'oferta', label: 'Oferta' }, { id: 'cerrado', label: 'Cerrado' }],
    faqs: [
      { id: 'requisitos', label: '📋 Requisitos para alquilar', rx: /\b(requisit|que necesito|papeles|documentos|recibo de sueldo|ingresos)/, text: '📋 **Requisitos para alquilar** (anual): cédula de identidad, comprobante de ingresos (lo ideal es que los ingresos del hogar sean al menos 3 veces el alquiler) y una garantía.\nPara un **temporario** alcanza con cédula o pasaporte y una seña del 30 %; el saldo se paga al ingresar.' },
      { id: 'garantias', label: '🛡️ Garantías', rx: /\b(garant|anda|cgn|contaduria|fianza|aval|deposito)/, text: '🛡️ **Garantías que aceptamos** para alquiler anual:\n• **ANDA**\n• **Contaduría General de la Nación (CGN)**, para funcionarios públicos\n• **Seguro de fianza** de una aseguradora habilitada\n• **Depósito en garantía** (habitualmente el equivalente a 3 a 5 meses de alquiler)' },
      { id: 'comision', label: '💼 Comisión', rx: /\b(comision|honorario|cuanto cobran)/, text: '💼 **Comisión**\n• Compra: 3 % + IVA sobre el precio.\n• Alquiler anual: un mes de alquiler + IVA.\n• Temporario: ya está incluida en el precio publicado.' },
      { id: 'gastos', label: '🏢 Gastos comunes', rx: /\b(gastos? comun|expensas|contribucion|impuesto)/, text: '🏢 **Gastos comunes**: figuran en cada ficha (en nuestra cartera van de $ 4.500 a $ 14.000 por mes, según los amenities).\nEn alquiler anual los paga el inquilino; la contribución inmobiliaria la paga el propietario. En temporario está todo incluido.' },
    ],
    names: ['Ana Ejemplo', 'Martín Prueba', 'Lucía Demo', 'Diego Ficticio', 'Sofía Muestra', 'Pablo Testeo', 'Carla Simulada', 'Joaquín Ejemplar', 'Valentina Demo'],
  },
};
const RUBROS = { dental: 'dental', vet: 'vet', veterinaria: 'vet', pilates: 'pilates', contenedores: 'contenedores', inmobiliaria: 'inmobiliaria' };
const rubroOf = key => key === 'vet' ? 'veterinaria' : key;
const roleLabel = (b = B()) => b.roleLabel || 'Recepción';

/* ---------- Estado ---------- */
let state;
const fresh = () => ({ v: 1, biz: 'dental', data: {} });
function bizState(key = state.biz) {
  if (!state.data[key]) state.data[key] = seedBiz(key);
  if (!state.data[key].inbox) state.data[key].inbox = seedInbox(key, state.data[key]);
  if (BIZ[key].kind === 'sales' && !state.data[key].leads) state.data[key].leads = seedLeads(key, state.data[key]);
  return state.data[key];
}
const S = () => bizState();
const B = () => BIZ[state.biz];
function load() {
  try { state = JSON.parse(localStorage.getItem(STORE_KEY)) || fresh(); } catch { state = fresh(); }
  if (!BIZ[state.biz]) state = fresh();
  const r = RUBROS[norm(new URLSearchParams(location.search).get('rubro') || '')];
  if (r && !rubroApplied) { state.biz = r; rubroApplied = true; }
}
let rubroApplied = false;
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
      name: b.names[n], phone: fmtPhone(`0990000${pad(n + 1)}`), extra: b.pets ? b.pets[n] : b.seedExtras ? b.seedExtras[n] : null,
      status, source: 'seed', reminder: reminder || (status === 'cancelado' ? 'enviado' : null),
      cancelledVia: status === 'cancelado' ? 'recordatorio' : null, createdAt: Date.now() - 86400000 * (5 - i),
    });
  });
  const s1 = slotsFor(d1, key); const bt = s1.find(t => !st.bookings.some(x => x.date === d1 && x.time === t && x.status !== 'cancelado') && toMin(t) >= 12 * 60) || s1[s1.length - 1];
  if (bt) st.blocks.push({ date: d1, time: bt, reason: 'Reunión de equipo' });
  st.inbox = seedInbox(key, st);
  if (b.kind === 'sales') { st.leads = seedLeads(key, st); st.quoteSeq = 1041; }
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
  $('#chatStatus').textContent = S().inbox?.live.botPaused ? `${b.agent} (${roleLabel(b).toLowerCase()}) está respondiendo` : `${b.assistant} · asistente virtual`;
  $('#panelTitle').textContent = b.panelTitle;
  const sales = b.kind === 'sales';
  $('#panelSub').textContent = `${b.name} · ${sales ? 'agenda y ventas en vivo' : 'agenda en vivo'}`;
  $('#ptabLeads').hidden = !sales; $('#mobileLeadsTab').hidden = !sales; $('#mobileTabs').classList.toggle('four', sales);
  if (!sales && panelTab === 'leads') setPanelTab('agenda');
  const ab = document.querySelector(`#bizSwitch button[data-biz="${state.biz}"]`); const bs = $('#bizSwitch'); if (ab && bs.scrollWidth > bs.clientWidth) bs.scrollLeft = Math.max(0, ab.offsetLeft - bs.offsetLeft - 12);
  $('#btnReminder span').textContent = b.remLabel || 'Simular recordatorio 24 h antes';
  $('#btnReminder').title = b.remTitle || 'Envía al chat el recordatorio del próximo turno';
  document.querySelectorAll('#bizSwitch button').forEach(x => x.classList.toggle('active', x.dataset.biz === state.biz));
}

function msgHTML(m) {
  if (m.from === 'sys') return `<div class="sys">${fmt(m.text)}</div>`;
  const time = new Date(m.ts); const t = `${pad(time.getHours())}:${pad(time.getMinutes())}`;
  let inner = '';
  if (m.kind === 'reminder') inner += `<div class="rem-head">${B().remHead || '🔔 Recordatorio automático · 24 h antes'}</div>`;
  if (m.kind === 'followup') inner += `<div class="rem-head">📨 Seguimiento automático de cotización</div>`;
  if (m.kind === 'quote') inner += `<div class="rem-head">🧾 Cotización generada por el bot</div>`;
  if (m.from === 'staff') inner += `<div class="agent">👩‍💼 ${esc(m.agent || roleLabel())} · ${roleLabel()}</div>`;
  inner += fmt(m.text);
  if (m.cards && m.cards.length) inner += `<div class="pcards">${m.cards.map(id => propCard(prop(id))).join('')}</div>`;
  if (m.actions && m.actions.length) {
    inner += `<div class="actions ${m.used ? 'used' : ''}">` + m.actions.map(a =>
      `<button data-msg="${m.id}" data-payload="${esc(a.payload)}" class="${m.used === a.payload ? 'chosen' : ''}">${esc(a.label)}</button>`).join('') + `</div>`;
  }
  return `<div class="msg ${m.from} ${m.kind || ''} ${m.cards ? 'has-cards' : ''}" data-id="${m.id}">${inner}<span class="time">${t}</span></div>`;
}
function propCard(p) {
  if (!p) return '';
  return `<div class="pcard"><div class="pimg" style="--g1:${p.g[0]};--g2:${p.g[1]}"><span class="pic">${p.icon}</span><span class="pcode">${p.id}</span><span class="pop">${OPS[p.op]}</span></div>`
    + `<div class="pbody"><b class="pprice">${priceLabel(p)}</b><div class="ptitle">${esc(p.title)}</div>`
    + `<div class="pfeat"><span>📍 ${p.zone}</span><span>📐 ${p.m2} m²</span><span>🛏️ ${bedsLabel(p.beds)}</span></div>`
    + `<div class="pbtns"><button data-card="prop:visit:${p.id}" data-label="📅 Visitar ${p.id}">📅 Visitar</button><button class="sec" data-card="prop:info:${p.id}" data-label="Ver ficha ${p.id}">Ver ficha</button></div></div></div>`;
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

const MENU = () => isSales() ? [
  { label: B().quoteLabel, payload: 'intent:quote' },
  { label: state.biz === 'contenedores' ? '📅 Agendar visita o llamada' : '📅 Agendar visita', payload: 'intent:book' },
  { label: '🔄 Cambiar o cancelar visita', payload: 'intent:cancel', cls: 'secondary' },
  ...B().faqs.map(f => ({ label: f.label, payload: `faq:${f.id}`, cls: 'secondary' })),
  { label: '📍 Dirección y horarios', payload: 'faq:direccion', cls: 'secondary' },
  { label: B().humanLabel, payload: 'intent:human', cls: 'secondary' },
] : [
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
const RXQ = {
  contenedores: /\b(cotiz|contenedor|container|comprar|compra|alquil|precio|cuanto|modificad|pies|presupuesto)/,
  inmobiliaria: /\b(propiedad|apartamento|apto|casa|alquil|comprar|venta|tempor|monoambiente|dormitorio|busco|punta del este|pocitos)/,
};
function detect(t) {
  if (RX.human.test(t)) return 'human';
  if (isSales()) {
    if (/\b(cancel|reprogram|cambiar (la|mi)? ?visita)/.test(t)) return 'cancel';
    const f = B().faqs.find(x => x.rx.test(t)); if (f) return 'faq:' + f.id;
    if (RXQ[state.biz].test(t)) return 'quote';
    if (/\b(visitas?\b|visitar|agendar|coordinar|llamada|llamen)/.test(t)) return 'book';
  }
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
const isIntent = t => { const i = detect(t); return i && !['greet', 'thanks', 'quote'].includes(i); };

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
    case 'q_need': { const v = /alquil|rent/.test(t) ? 'alquiler' : /modific|adapt|oficina|vivienda|casa/.test(t) ? 'mod' : /compr/.test(t) ? 'compra' : null; if (v) { if (v === 'mod') { const m = matchMod(t); if (m) qd().mod = m; } return qSet('need', v); } break; }
    case 'q_mod': { const m = matchMod(t); if (m) return qSet('mod', m); break; }
    case 'q_size': { const v = matchSize(t); if (v) return qSet('size', v); break; }
    case 'q_cond': { const v = matchCond(t); if (v) return qSet('cond', v); break; }
    case 'q_qty': { const n = parseInt((t.match(/\d+/) || [])[0] || NUMW[t.split(' ')[0]], 10); if (n >= 1 && n <= 50) return qSet('qty', n); break; }
    case 'q_dept': { const v = matchDept(t); if (v) return qSet('dept', v); break; }
    case 'c_name': if (!isIntent(t) && /[a-zñ]{2,}/.test(t) && !/\d/.test(t)) return cName(titleCase(text)); break;
    case 'c_phone': { const ph = matchPhone(text); if (ph) return cPhone(ph); if (!isIntent(t)) return say('Mmm, ese número no me cierra 🤔 ¿Me lo pasás de nuevo? Por ejemplo: **099 123 456**'); break; }
    case 'c_email': { const e = text.trim().match(/[^\s@]+@[^\s@]+\.[^\s@]+/); if (e) return cEmail(e[0]); if (/^no\b|prefiero|sin (mail|email)|whatsapp/.test(t)) return cEmail(''); if (!isIntent(t)) return say('Ese email no me cierra 🤔 ¿Me lo pasás de nuevo? (o tocá “Prefiero solo WhatsApp”)'); break; }
    case 'p_op': { const v = /tempor|verano|enero|febrero|quincena|vacacion/.test(t) ? 'temp' : /alquil|anual/.test(t) ? 'anual' : /compr|venta/.test(t) ? 'venta' : null; if (v) return pSet('op', v); break; }
    case 'p_zone': { const p = {}; parsePropText(t, p); if (/igual|cualquier|no importa|indistinto/.test(t)) p.zone = 'any'; if (p.zone) return pSet('zone', p.zone); break; }
    case 'p_budget': { const n = parseMoney(t); if (n) { const pp = pd(); pp.budget = [0, n]; pp.budgetLabel = `Hasta ${pp.op === 'anual' ? '$ ' + n.toLocaleString('es-UY') : usd(n)}`; save(); return nextP(); } break; }
    case 'p_beds': { const n = /mono/.test(t) ? 0 : parseInt((t.match(/\d/) || [])[0] || NUMW[t.split(' ')[0]], 10); if (n >= 0 && n <= 9) return pSet('beds', Math.min(4, n)); break; }
    case 'p_dates': if (!isIntent(t) && t.length >= 3) return pSet('dates', text.trim()); break;
    case 'p_pick': { const m = t.match(/ce ?-? ?(\d{3})/); if (m && prop(`CE-${m[1]}`)) return /visit|agend|ver la|conocer/.test(t) ? propVisit(`CE-${m[1]}`) : propInfo(`CE-${m[1]}`);
      const res = c.data?.p?.results || []; const k = /primer|\b1\b/.test(t) ? 0 : /segund|\b2\b/.test(t) ? 1 : /tercer|\b3\b/.test(t) ? 2 : -1; if (k >= 0 && res[k]) return propInfo(res[k]); break; }
    case 'p_question': if (t.length >= 2 && !RX.human.test(t)) return propAnswer(text); break;
  }
  const intent = detect(t);
  if (intent) c.misses = 0;
  switch (intent) {
    case 'human': return human();
    case 'cancel': return startCancel();
    case 'quote': return state.biz === 'contenedores' ? startQuote(text) : startSearch(text);
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
  if (/^(q|p)_/.test(c.step) && c.step !== 'p_pick') { await say('Perdón, no te entendí 🙈 Elegí una de las opciones o escribilo de otra forma:'); return c.step[0] === 'q' ? nextQ() : nextP(); }
  if (c.step === 'c_name') return say('¿Me decís tu nombre y apellido? ✍️');
  return fallback();
}

async function handlePayload(p) {
  const [kind, a, b] = p.split(':');
  const st = S();
  if (kind === 'intent') return ({ book: startBooking, cancel: startCancel, human, menu: () => welcome(true), quote: () => state.biz === 'contenedores' ? startQuote() : startSearch() })[a]();
  if (kind === 'q') return qSet(a, b);
  if (kind === 'p') return a === 'again' ? (st.convo.data?.p?.results ? showResults() : startSearch()) : pSet(a, b);
  if (kind === 'prop') return ({ visit: propVisit, info: propInfo, ask: propAsk, contact: propContact })[a](b);
  if (kind === 'c') { if (a === 'name') return cName(st.convo.knownName); if (a === 'phone') return cPhone(b); if (a === 'email') return cEmail(b === 'none' ? '' : b); }
  if (kind === 'lead') return bookForLead(a, b);
  if (kind === 'rem' && a.startsWith('q')) return followupAnswer(a, (st.leads || []).find(x => x.id === b));
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
    if (a === 'keep') { await say(isSales() ? `¡Perfecto! Tu ${service(bk.service).name.toLowerCase()} queda como estaba: ${dayPhrase(bk.date)} a las ${bk.time} 😊` : `¡Perfecto! Tu turno queda como estaba. Te esperamos ${dayPhrase(bk.date)} a las ${bk.time} 😊`); setStep('idle', {}); return setQuick(MENU()); }
  }
  if (kind === 'rem') {
    if (!bk || bk.status === 'cancelado') return say('Ese turno ya no está activo.');
    if (a === 'confirm') {
      bk.status = 'confirmado'; bk.reminder = 'confirmado'; save(); renderPanel({ flash: bk.id, bump: true });
      toast(`✅ ${bk.name} confirmó su turno (${dayShort(bk.date)} ${bk.time})`);
      await say(salesConfirmText(bk) || `¡Genial, ${first(bk.name)}! Tu turno queda **confirmado** ✅ Te esperamos ${dayPhrase(bk.date)} a las **${bk.time}**.`);
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
    : b.welcome || `¡Hola! 👋 Soy **${b.assistant}**, la asistente virtual de **${b.name}**.\nTe ayudo a sacar, cambiar o cancelar tu turno en un minuto, las 24 horas. ¿Qué necesitás?`);
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
  const kc = S().convo; if (isSales() && kc.knownName && kc.knownPhone && (d.leadId || d.prop) && !(B().extra && !d.extra)) { d.name = kc.knownName; d.phone = kc.knownPhone; save(); return askConfirm(); }
  if (B().extra && !d.extra) { setStep('extra'); await say(B().extra.ask); return setQuick([]); }
  return askName();
}
async function giveExtra(v) {
  const m = norm(v).match(/ce ?-? ?(\d{3})/); const x = m && prop(`CE-${m[1]}`);
  if (x) { S().convo.data.extra = `${x.id} · ${x.zone}`; S().convo.data.prop = x.id; } else S().convo.data.extra = v;
  save(); return askName(B().extra.thanks ?? `¡Qué lindo nombre! 🥰 `);
}
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
  if (isSales()) {
    let L;
    if (state.biz === 'inmobiliaria') L = upsertInmoLead({ name: d.name, phone: d.phone, x: prop(d.prop), f: d.p, stage: 'visita', visit: true, bookingId: bk.id });
    else { L = d.leadId && (st.leads || []).find(x => x.id === d.leadId); if (!L) L = addLead({ name: d.name, phone: d.phone, stage: 'visita', value: 0, detail: `${service(d.service).name} (sin cotización todavía)` }); if (['nuevo', 'cotizado', 'perdido'].includes(L.stage)) L.stage = 'visita'; L.bookingId = bk.id; delete L.lostReason; }
    save(); renderLeads({ flash: L.id });
    notifyPanel(`📅 ${service(bk.service).name} agendada: ${bk.name} · ${dayShort(bk.date)} ${bk.time} (oportunidad en “${B().stages.find(s => s.id === L.stage).label}”)`);
    const s = service(bk.service); const call = s.id !== 'visita';
    await say(`¡Listo, ${first(d.name)}! 🎉 Quedó agendada tu **${s.name.toLowerCase()}**${bk.extra ? ` (${bk.extra})` : ''} para ${dayPhrase(d.date)} a las **${d.time}**.\n${call ? `📞 Te contactamos al ${d.phone}.` : state.biz === 'inmobiliaria' ? `📍 ${B().agent} te espera en la puerta de la propiedad.` : `📍 ${B().address}`}\n\nTe mando un recordatorio 24 h antes. Si necesitás cambiarla, escribime por acá.`);
    setStep('idle', {}); return setQuick(MENU());
  }
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
  let txt = {
    horarios: `🕘 Nuestros horarios:\n${b.hours}\n\nYo, en cambio, respondo las 24 horas 😉`,
    direccion: `📍 Estamos en **${b.address}**.\n${b.addressExtra}`,
    precios: `💲 Valores de referencia:\n${b.services.map(s => `• ${s.name}: **${money(s.price)}**`).join('\n')}\n\n${b.priceNote}`,
    pagos: `💳 Formas de pago: ${b.payments}`,
  }[kind];
  const sf = isSales() && b.faqs.find(f => f.id === kind);
  if (isSales() && kind === 'direccion') txt = `📍 Estamos en **${b.address}**.\n${b.addressExtra}\n\n🕘 ${b.hours}`;
  if (sf) txt = sf.text;
  if (isSales() && kind === 'precios') return state.biz === 'contenedores' ? startQuote() : startSearch();
  if (isSales() && /^(q|p|c)_/.test(c.step)) {
    await say(txt); await say('¿Seguimos? 👇', { fast: true });
    if (c.step[0] === 'q') return nextQ(); if (c.step[0] === 'p' && c.step !== 'p_pick' && c.step !== 'p_question') return nextP();
    if (c.step === 'c_name') return say('¿Me decís tu nombre y apellido?'); if (c.step === 'c_phone') return say('¿A qué celular te podemos escribir?'); if (c.step === 'c_email') return say('¿Y un email para mandarte la cotización?');
    return setQuick(MENU());
  }
  await say(txt);
  if (inFlow && ['service', 'day', 'time'].includes(c.step)) {
    await say('¿Seguimos con tu reserva? 👇', { fast: true });
    if (c.step === 'service') return askService();
    if (c.step === 'day') return startDay(true);
    return pickDay(c.data.date, true);
  }
  setStep('idle', {});
  setQuick(isSales() ? [MENU()[0], MENU()[1], ...MENU().slice(3).filter(q => q.payload !== `faq:${kind}`)] : [{ label: '📅 Sacar turno', payload: 'intent:book' }, ...MENU().slice(2).filter(q => q.payload !== `faq:${kind}`)]);
}
async function human(silent) {
  const st = S(); st.stats.handoffs++; st.convo.misses = 0; setStep('idle', {});
  if (!silent) await say(`Te derivo con ${isSales() ? (state.biz === 'contenedores' ? 'un vendedor' : 'un agente') : 'una persona del equipo'} 👩‍💼 Te van a responder por este mismo chat en horario de atención (${B().hours.split('.')[0].toLowerCase()}).\n¡Gracias por la paciencia!`);
  sys(`🔔 Conversación derivada a ${B().handoffTo || 'recepción'}`);
  const L = st.inbox.live; L.status = 'derivado'; L.attention = true; save();
  renderPanel({ bump: true });
  toast('⚠️ Requiere atención: el bot derivó una conversación a una persona', { label: 'Ver', fn: () => openConv('live', true) });
  refreshInbox();
  setQuick(isSales() ? [{ ...MENU()[0], label: 'Mientras tanto: ' + MENU()[0].label, cls: 'secondary' }] : [{ label: '📅 Mientras tanto, sacar turno', payload: 'intent:book', cls: 'secondary' }]);
}
async function fallback() {
  const c = S().convo; c.misses = (c.misses || 0) + 1; save();
  if (c.misses >= 2) {
    await say('Perdón, sigo sin entenderte bien 🙈 Para no hacerte perder tiempo, te derivo con una persona.');
    return human(true);
  }
  await say(B().fallbackText || 'Perdón, no te entendí del todo 🙈 Puedo ayudarte con **turnos, horarios, dirección, precios y formas de pago**. Si preferís, te derivo con una persona.');
  setQuick(MENU());
}

/* ---------- Recordatorios ---------- */
function salesConfirmText(bk, key = state.biz) {
  const b = BIZ[key]; if (b.kind !== 'sales') return '';
  const sv = b.services.find(x => x.id === bk.service) || b.services[0];
  const tail = sv.id === 'llamada' ? `Te llamamos ${dayPhrase(bk.date)} a las **${bk.time}** 📞` : sv.id === 'video' ? `Te mandamos el link ${dayPhrase(bk.date)} antes de las **${bk.time}** 💻` : `Nos vemos ${dayPhrase(bk.date)} a las **${bk.time}**${bk.extra ? ` en la ${bk.extra.split(' · ')[0]}` : ''} 🙌`;
  return `¡Genial, ${first(bk.name)}! Tu ${sv.name.toLowerCase()} quedó **confirmada** ✅ ${tail}`;
}
function sendReminder(bk) {
  if (!bk && B().followup) {
    const L = (S().leads || []).filter(x => x.stage === 'cotizado' && !x.followup).sort((a, z) => (z.source === 'chat') - (a.source === 'chat') || z.createdAt - a.createdAt)[0];
    if (L) return sendFollowup(L);
  }
  if (!bk) {
    const cands = S().bookings.filter(x => x.status === 'confirmado' && !x.reminder && !isPast(x.date, x.time))
      .sort((a, b) => (b.source === 'chat') - (a.source === 'chat') || (a.source === 'chat' ? b.createdAt - a.createdAt : (a.date + a.time).localeCompare(b.date + b.time)));
    bk = cands[0];
  }
  if (!bk) { toast(isSales() ? 'No hay visitas ni cotizaciones pendientes de seguimiento.' : 'No hay turnos próximos pendientes de recordatorio.'); return; }
  queue = queue.then(async () => {
    const c = S().convo; c.knownName = bk.name; c.knownPhone = bk.phone;
    bk.reminder = 'enviado'; save(); renderPanel({ flash: bk.id });
    sys(`Simulación: recordatorio enviado a ${bk.name} (${bk.phone})`);
    setQuick([]);
    await say(reminderText(bk), {
      msg: { kind: 'reminder', actions: [
        { label: '✅ Confirmo', payload: `rem:confirm:${bk.id}` },
        { label: '🔄 Reprogramar', payload: `rem:resched:${bk.id}` },
        { label: isSales() ? '❌ Cancelar' : '❌ Cancelar turno', payload: `rem:cancel:${bk.id}` },
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
  const cards = isSales() ? salesCards() : [
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
  renderStats(opts.bump); updateInboxBadge(); updateLeadsBadge();
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
function notifyPanel(text, tab) {
  if (isMobile() && $('#stage').dataset.view === 'chat') { $('#panelDot').hidden = false; toast(text, { label: 'Ver panel', fn: () => setView(tab || 'panel') }); }
  else if (tab && panelTab !== tab) toast(text, { label: 'Ver', fn: () => isMobile() ? setView(tab) : setPanelTab(tab) });
  else toast(text);
}
function setView(v) {
  $('#stage').dataset.view = v === 'chat' ? 'chat' : 'panel';
  if (v !== 'chat') setPanelTab(v === 'inbox' ? 'inbox' : v === 'leads' ? 'leads' : 'agenda');
  syncMobileTabs();
  if (v !== 'chat') { $('#panelDot').hidden = true; document.querySelectorAll('.toast').forEach(t => t.querySelector('button') && t.remove()); }
  if (v === 'chat') scrollChat();
}
function syncMobileTabs() {
  const v = $('#stage').dataset.view === 'chat' ? 'chat' : (panelTab === 'inbox' ? 'inbox' : panelTab === 'leads' ? 'leads' : 'panel');
  document.querySelectorAll('#mobileTabs button').forEach(b => b.classList.toggle('active', b.dataset.view === v));
}

/* ---------- Ventas: contenedores e inmobiliaria ---------- */
const isSales = (key = state.biz) => BIZ[key].kind === 'sales';
const usd = n => 'USD ' + Math.round(n).toLocaleString('es-UY');
const SIZES = { '20': "20' (6 m)", '40': "40' (12 m)", '40hc': "40' HC (12 m, alto)" };
const SZ = { '20': "20'", '40': "40'", '40hc': "40' HC" };
const COND = { nuevo: 'Nuevo', onetrip: 'One-trip', usado: 'Usado (apto carga)' };
const MODS = { oficina: 'Oficina', vivienda: 'Vivienda', deposito: 'Depósito' };
const PRICES = {
  compra: { '20': { nuevo: [3900, 4400], onetrip: [3200, 3600], usado: [1900, 2400] }, '40': { nuevo: [5900, 6600], onetrip: [4600, 5200], usado: [2500, 3100] }, '40hc': { nuevo: [6300, 7000], onetrip: [5000, 5600], usado: [2800, 3400] } },
  alquiler: { '20': [120, 150], '40': [180, 220], '40hc': [200, 240] },
  mod: { oficina: { '20': [9500, 12500], '40': [15500, 19900], '40hc': [17000, 21500] }, vivienda: { '20': [14500, 18500], '40': [24000, 31000], '40hc': [26000, 33500] }, deposito: { '20': [5200, 6200], '40': [7600, 8900], '40hc': [8200, 9500] } },
};
const DEPTS = [['Montevideo', 180], ['Canelones', 250], ['Maldonado', 380], ['San José', 380], ['Colonia', 420], ['Florida', 400], ['Rocha', 450], ['Lavalleja', 420], ['Flores', 450], ['Soriano', 480], ['Durazno', 480], ['Río Negro', 520], ['Treinta y Tres', 540], ['Paysandú', 560], ['Cerro Largo', 600], ['Tacuarembó', 600], ['Salto', 620], ['Rivera', 650], ['Artigas', 690]];
const CITIES = { 'punta del este': 'Maldonado', piriapolis: 'Maldonado', 'san carlos': 'Maldonado', 'ciudad de la costa': 'Canelones', pando: 'Canelones', 'las piedras': 'Canelones', atlantida: 'Canelones', carmelo: 'Colonia', 'sarandi grande': 'Florida', 'la paloma': 'Rocha', 'fray bentos': 'Río Negro', mercedes: 'Soriano', minas: 'Lavalleja', trinidad: 'Flores', melo: 'Cerro Largo' };
const plazoFor = cost => cost <= 250 ? '2 a 4 días hábiles' : cost <= 450 ? '3 a 6 días hábiles' : '5 a 8 días hábiles';
function matchDept(t) {
  const c = Object.keys(CITIES).find(k => t.includes(k)); if (c) return CITIES[c];
  const d = DEPTS.find(([n]) => t.includes(norm(n))); return d ? d[0] : null;
}
const matchMod = t => /oficina|escritorio/.test(t) ? 'oficina' : /vivienda|casa|habitab|vivir/.test(t) ? 'vivienda' : /deposito|galpon|guardar/.test(t) ? 'deposito' : null;
const matchSize = t => /\bhc\b|high|alto/.test(t) ? '40hc' : /\b40\b/.test(t) ? '40' : /\b20\b/.test(t) ? '20' : null;
const matchCond = t => /one ?trip|un (solo )?viaje|1 viaje/.test(t) ? 'onetrip' : /\bnuev/.test(t) ? 'nuevo' : /usad|segunda mano/.test(t) ? 'usado' : null;
const NUMW = { un: 1, uno: 1, una: 1, dos: 2, tres: 3, cuatro: 4, cinco: 5, seis: 6 };

function computeQuote(q) {
  const fl = (DEPTS.find(d => d[0] === q.dept) || DEPTS[0])[1]; const n = q.qty || 1;
  if (q.need === 'alquiler') {
    const u = PRICES.alquiler[q.size]; const flete = fl * 2;
    return {
      desc: `${n} × ${SZ[q.size]} en alquiler · ${q.dept}`, value: Math.round((u[0] + u[1]) / 2 * 6 * n + flete * n),
      lines: [`📦 **${n} × Contenedor ${SIZES[q.size]}** · alquiler`, `💲 ${usd(u[0])} a ${usd(u[1])} por mes c/u (mínimo 3 meses)`, `🚚 Flete ida y vuelta a ${q.dept}: ${usd(flete)} c/u · entrega en ${plazoFor(fl)}`, `**Total estimado: ${usd(u[0] * n)} a ${usd(u[1] * n)} por mes** + ${usd(flete * n)} de flete`],
    };
  }
  const u = q.need === 'mod' ? PRICES.mod[q.mod][q.size] : PRICES.compra[q.size][q.cond];
  const tot = [(u[0] + fl) * n, (u[1] + fl) * n];
  const what = q.need === 'mod' ? `${MODS[q.mod]} modificad${q.mod === 'deposito' ? 'o' : 'a'} ${SIZES[q.size]}` : `Contenedor ${SIZES[q.size]} · ${COND[q.cond]}`;
  return {
    desc: q.need === 'mod' ? `${n} × ${MODS[q.mod]} modificad${q.mod === 'deposito' ? 'o' : 'a'} ${SZ[q.size]} · ${q.dept}` : `${n} × ${SZ[q.size]} ${COND[q.cond].split(' ')[0].toLowerCase()} · ${q.dept}`,
    value: Math.round((tot[0] + tot[1]) / 2),
    lines: [`📦 **${n} × ${what}**`, `💲 ${usd(u[0])} a ${usd(u[1])} c/u`, `🚚 Envío a ${q.dept}: ${usd(fl)} c/u · ${q.need === 'mod' ? `fabricación 25 a 40 días + entrega en ${plazoFor(fl)}` : `entrega en ${plazoFor(fl)}`}`, `**Total estimado: ${usd(tot[0])} a ${usd(tot[1])}** (IVA incluido)`],
  };
}

const qd = () => { const c = S().convo; c.data = c.data || {}; c.data.q = c.data.q || {}; return c.data.q; };
function parseQuoteText(t, q) {
  if (!q.need) { if (/alquil|rent/.test(t)) q.need = 'alquiler'; else if (/modific|adaptad|oficina|vivienda/.test(t)) q.need = 'mod'; else if (/compr/.test(t)) q.need = 'compra'; }
  if (q.need === 'mod' && !q.mod) q.mod = matchMod(t);
  if (!q.size) q.size = matchSize(t);
  if (!q.cond && q.need === 'compra') q.cond = matchCond(t);
  const m = t.match(/\b(\d{1,2})\s*(contenedores|containers|unidades)/); if (m && !q.qty) q.qty = +m[1];
  if (!q.dept) q.dept = matchDept(t);
  Object.keys(q).forEach(k => q[k] == null && delete q[k]);
}
async function startQuote(text) {
  setStep('q_need', { q: {} });
  const q = qd(); if (text) parseQuoteText(norm(text), q); save();
  await say('¡Genial! Te armo una cotización en un minuto 📦');
  return nextQ();
}
async function nextQ() {
  const q = qd(); save();
  if (!q.need) { setStep('q_need'); await say('¿Qué estás buscando?', { fast: true }); return setQuick([{ label: '🛒 Comprar', payload: 'q:need:compra' }, { label: '📆 Alquilar', payload: 'q:need:alquiler' }, { label: '🏗️ Contenedor modificado', payload: 'q:need:mod' }]); }
  if (q.need === 'mod' && !q.mod) { setStep('q_mod'); await say('¿Para qué lo vas a usar? Lo entregamos listo, con aislación, aberturas e instalación eléctrica 🔌'); return setQuick(Object.entries(MODS).map(([k, v]) => ({ label: { oficina: '💼 ', vivienda: '🛏️ ', deposito: '📦 ' }[k] + v, payload: `q:mod:${k}` }))); }
  if (!q.size) { setStep('q_size'); await say("¿Qué tamaño necesitás?\n• **20'**: 6 m de largo, unos 15 m²\n• **40'**: 12 m de largo, unos 30 m²\n• **40' HC** (High Cube): 12 m y 30 cm más alto"); return setQuick(Object.entries(SIZES).map(([k, v]) => ({ label: v, payload: `q:size:${k}` }))); }
  if (q.need === 'compra' && !q.cond) { setStep('q_cond'); await say('¿En qué estado lo preferís?\n• **Nuevo**: de fábrica, sin uso\n• **One-trip**: hizo un solo viaje, prácticamente nuevo\n• **Usado**: apto carga, con detalles estéticos (el más económico)'); return setQuick(Object.entries(COND).map(([k, v]) => ({ label: v, payload: `q:cond:${k}` }))); }
  if (!q.qty) { setStep('q_qty'); await say('¿Cuántos necesitás?'); return setQuick([1, 2, 3, 4].map(n => ({ label: String(n), payload: `q:qty:${n}`, cls: 'time' })).concat([{ label: '5 o más', payload: 'q:qty:5', cls: 'secondary' }])); }
  if (!q.dept) return askDept();
  return showEstimate();
}
async function askDept(more) {
  setStep('q_dept');
  if (!more) await say('¿A qué departamento o ciudad lo enviamos? 🚚 (podés escribirlo, por ejemplo “Punta del Este”)');
  const list = more ? DEPTS.slice(8) : DEPTS.slice(0, 8);
  setQuick(list.map(([n]) => ({ label: n, payload: `q:dept:${n}` })).concat(more ? [] : [{ label: 'Otro departamento', payload: 'q:dept:_more', cls: 'secondary' }]));
}
async function qSet(field, v) {
  const q = qd();
  if (field === 'dept' && v === '_more') return askDept(true);
  q[field] = field === 'qty' ? +v : v;
  if (field === 'need' && v !== 'compra') delete q.cond;
  save(); return nextQ();
}
async function showEstimate() {
  const r = computeQuote(qd());
  await say(`Esta es tu estimación 👇\n${r.lines.join('\n')}\n\nValores de referencia en dólares. El precio final lo confirma un vendedor según el stock.`);
  return askContact('quote');
}

/* Captura de contacto (común) */
async function askContact(after) {
  const c = S().convo; c.data.after = after; setStep('c_name');
  await say(after === 'quote' ? 'Para mandarte la cotización formal con número, ¿me decís tu nombre y apellido?' : '¡Buenísimo! Para que te contacte un agente, ¿me decís tu nombre y apellido?', { fast: true });
  setQuick(c.knownName ? [{ label: c.knownName, payload: 'c:name' }] : []);
}
async function cName(n) {
  const c = S().convo; c.data.name = n; setStep('c_phone');
  await say(`Gracias, ${first(n)} 🙌 ¿A qué celular te podemos escribir?`);
  setQuick(c.knownPhone ? [{ label: c.knownPhone, payload: `c:phone:${digits(c.knownPhone)}` }] : []);
}
async function cPhone(ph) {
  const c = S().convo; c.data.phone = fmtPhone(digits(ph)); c.knownName = c.data.name; c.knownPhone = c.data.phone; save();
  if (B().askEmail && c.data.after === 'quote') {
    setStep('c_email'); await say('¿Y un email para mandarte el PDF de la cotización? 📧');
    return setQuick([{ label: 'Prefiero solo WhatsApp', payload: 'c:email:none', cls: 'secondary' }]);
  }
  return afterContact();
}
async function cEmail(e) { S().convo.data.email = e || ''; save(); return afterContact(); }
async function afterContact() { const d = S().convo.data; return d.after === 'quote' ? createQuote() : inmoContact(); }

function addLead(l) {
  const st = S(); st.leads = st.leads || [];
  const lead = { id: uid(), email: '', channel: 'whatsapp', source: 'chat', createdAt: Date.now(), ...l };
  st.leads.push(lead); save(); return lead;
}
async function createQuote() {
  const st = S(); const d = st.convo.data; const r = computeQuote(d.q);
  st.quoteSeq = (st.quoteSeq || 1041) + 1; const no = `COT-${st.quoteSeq}`;
  const lead = addLead({ name: d.name, phone: d.phone, email: d.email || '', stage: 'cotizado', value: r.value, quoteNo: no, detail: r.desc, followup: null });
  renderPanel({ bump: true }); renderLeads({ flash: lead.id });
  notifyPanel(`🧾 Nueva cotización ${no} · ${lead.name} · ${usd(r.value)}`, 'leads');
  await say(`**Cotización ${no}**\n👤 ${d.name} · ${d.phone}${d.email ? ` · ${d.email}` : ''}\n${r.lines.join('\n')}\n📅 Válida hasta el ${dm(ymd(addDays(new Date(), 7)))}\n\nTe la mandamos también ${d.email ? 'por email' : 'por WhatsApp'} en PDF 📎`, { msg: { kind: 'quote' } });
  await say('¿Querés ver el contenedor antes de decidir? Te reservo una visita al predio o te llama un vendedor 👇', { fast: true });
  setStep('idle', { leadId: lead.id });
  setQuick([{ label: '🏗️ Visitar el predio', payload: `lead:visita:${lead.id}` }, { label: '📞 Que me llame un vendedor', payload: `lead:llamada:${lead.id}` }, { label: '✅ Listo, gracias', payload: 'intent:menu', cls: 'secondary' }]);
}
async function bookForLead(svc, leadId) {
  setStep('day', { mode: 'new', service: svc, leadId });
  const intro = svc === 'llamada' ? '¡Perfecto! 📞 ¿Qué día te viene bien que te llame un vendedor?' : svc === 'video' ? '¡Dale! 💻 ¿Qué día te queda bien la videollamada?' : `¡Dale! ${B().emoji} ¿Qué día querés venir? Estos son los próximos días con lugar:`;
  return startDay(false, intro);
}
function sendFollowup(L) {
  queue = queue.then(async () => {
    const c = S().convo; c.knownName = L.name; c.knownPhone = L.phone; L.followup = 'enviado'; save(); renderLeads({ flash: L.id });
    sys(`Simulación: seguimiento automático enviado a ${L.name} (${L.phone}) · 48 h después de la cotización`);
    setQuick([]);
    await say(`Hola ${first(L.name)} 👋 Soy ${B().assistant}, de ${B().name}. ¿Pudiste ver la cotización **${L.quoteNo}** (${L.detail})?\n\nSi querés, te reservo un lugar para ver el contenedor en el predio, o te llama un vendedor para ajustar los números 🙂`, {
      msg: { kind: 'followup', actions: [
        { label: '📅 Agendar visita al predio', payload: `rem:qvisit:${L.id}` },
        { label: '💬 Tengo una consulta', payload: `rem:qhuman:${L.id}` },
        { label: '🙅 Por ahora no', payload: `rem:qlost:${L.id}` },
      ] },
    });
    toast(`📨 Seguimiento enviado a ${L.name} (${L.quoteNo})`);
  });
  setView('chat');
}
async function followupAnswer(a, L) {
  if (!L) return say('No encontré esa cotización 🤔');
  if (a === 'qvisit') { L.followup = 'respondió'; save(); renderLeads(); return bookForLead('visita', L.id); }
  if (a === 'qhuman') { L.followup = 'respondió'; save(); renderLeads(); return human(); }
  if (a === 'qlost') {
    L.followup = 'respondió'; L.stage = 'perdido'; L.lostReason = 'Respondió “por ahora no” al seguimiento'; save();
    renderPanel({ bump: true }); renderLeads({ flash: L.id }); notifyPanel(`✗ ${L.name} descartó la cotización ${L.quoteNo}`, 'leads');
    await say(`¡Gracias por avisarnos, ${first(L.name)}! 🙌 Dejo la cotización archivada. Si más adelante la necesitás, escribime y te la actualizo.`);
    setStep('idle', {}); return setQuick(MENU());
  }
}

/* Inmobiliaria */
const OPS = { venta: 'Venta', anual: 'Alquiler anual', temp: 'Temporario' };
const ZONES = { pde: ['Península', 'Playa Brava', 'Playa Mansa', 'La Barra', 'Manantiales', 'Pinares'], mvd: ['Pocitos', 'Punta Carretas', 'Carrasco', 'Cordón'] };
const ZONE_OPTS = [['pde', 'Punta del Este (todas)'], ['Península', 'Península'], ['Playa Brava', 'Playa Brava'], ['Playa Mansa', 'Playa Mansa'], ['La Barra', 'La Barra / Manantiales'], ['mvd', 'Montevideo (todas)'], ['Pocitos', 'Pocitos'], ['Punta Carretas', 'Punta Carretas'], ['Carrasco', 'Carrasco'], ['any', 'Me da igual']];
const zonesOf = z => z === 'pde' ? ZONES.pde : z === 'mvd' ? ZONES.mvd : z === 'La Barra' ? ['La Barra', 'Manantiales'] : z === 'any' || !z ? [...ZONES.pde, ...ZONES.mvd] : [z];
const zoneLabel = z => (ZONE_OPTS.find(o => o[0] === z) || [, z])[1];
const cityOf = zone => ZONES.mvd.includes(zone) ? 'Montevideo' : 'Punta del Este';
const BUDGETS = {
  venta: [[0, 150000, 'Hasta USD 150.000'], [150000, 300000, 'USD 150.000 a 300.000'], [300000, 600000, 'USD 300.000 a 600.000'], [600000, 1e9, 'Más de USD 600.000']],
  anual: [[0, 30000, 'Hasta $ 30.000 por mes'], [30000, 50000, '$ 30.000 a 50.000'], [50000, 80000, '$ 50.000 a 80.000'], [80000, 1e9, 'Más de $ 80.000']],
  temp: [[0, 120, 'Hasta USD 120 por noche'], [120, 250, 'USD 120 a 250 por noche'], [250, 1e9, 'Más de USD 250 por noche']],
};
const DATES = ['Navidad y Año Nuevo (20/12 al 5/1)', '1ª quincena de enero', '2ª quincena de enero', 'Febrero / Carnaval', 'Semana de Turismo'];
const P = (id, op, zone, title, beds, baths, m2, price, gc, extras, pets, garage, g, icon) => ({ id, op, zone, title, beds, baths, m2, price, gc, extras, pets, garage, g, icon });
const PROPS = [
  P('CE-101', 'venta', 'Península', 'Apartamento con vista al puerto', 2, 2, 78, 245000, 9500, 'Balcón al puerto, a 2 cuadras de la playa, ascensor', true, false, ['#0EA5E9', '#1E3A8A'], '🏢'),
  P('CE-102', 'venta', 'Playa Brava', 'Torre frente al mar con amenities', 2, 2, 95, 380000, 14000, 'Piscina climatizada, gimnasio, seguridad 24 h', false, true, ['#06B6D4', '#0F766E'], '🏙️'),
  P('CE-103', 'venta', 'Playa Mansa', 'Luminoso 1 dormitorio, parada 5', 1, 1, 52, 168000, 6500, 'Vista lateral al mar, barbacoa en el edificio', true, true, ['#F59E0B', '#EA580C'], '🏢'),
  P('CE-104', 'venta', 'La Barra', 'Casa entre pinos con piscina', 3, 3, 180, 520000, 0, 'Terreno de 900 m², piscina, parrillero', true, true, ['#22C55E', '#166534'], '🏡'),
  P('CE-105', 'venta', 'Pocitos', 'A una cuadra de la rambla', 2, 1, 70, 210000, 7800, 'Muy luminoso, cocina integrada, portería', true, false, ['#818CF8', '#4338CA'], '🏢'),
  P('CE-106', 'venta', 'Punta Carretas', 'Penthouse con terraza', 3, 2, 140, 640000, 12500, 'Terraza de 60 m² con parrillero, 2 garajes', true, true, ['#F472B6', '#9D174D'], '🌇'),
  P('CE-107', 'venta', 'Cordón', 'Monoambiente ideal inversión', 0, 1, 36, 98000, 4500, 'A estrenar, cerca de facultades, renta asegurada', false, false, ['#A3A3A3', '#404040'], '🏢'),
  P('CE-108', 'venta', 'Carrasco', 'Casa con jardín y barbacoa', 4, 3, 260, 790000, 0, 'Jardín, barbacoa cerrada, a 4 cuadras de la playa', true, true, ['#84CC16', '#3F6212'], '🏡'),
  P('CE-201', 'anual', 'Pocitos', '2 dormitorios con balcón', 2, 1, 68, 42000, 8200, 'Balcón al frente, calefacción, portería', true, false, ['#6366F1', '#312E81'], '🏢'),
  P('CE-202', 'anual', 'Punta Carretas', '1 dormitorio cerca del shopping', 1, 1, 48, 33000, 6000, 'Amenities con gimnasio y laundry', false, false, ['#EC4899', '#831843'], '🏢'),
  P('CE-203', 'anual', 'Cordón', '1 dormitorio reciclado', 1, 1, 45, 24000, 4500, 'Reciclado a nuevo, cerca de todo', true, false, ['#F97316', '#7C2D12'], '🏢'),
  P('CE-204', 'anual', 'Carrasco', 'Casa 3 dormitorios con fondo', 3, 2, 150, 85000, 0, 'Fondo con parrillero, garaje para 2 autos', true, true, ['#10B981', '#065F46'], '🏡'),
  P('CE-205', 'anual', 'Playa Mansa', '2 dormitorios todo el año', 2, 2, 80, 38000, 9000, 'Equipado, piscina en el edificio', true, true, ['#38BDF8', '#075985'], '🏢'),
  P('CE-206', 'anual', 'Península', '1 dormitorio frente al puerto', 1, 1, 55, 28000, 5200, 'Vista al puerto, a pasos de todo', false, false, ['#22D3EE', '#155E75'], '🏢'),
  P('CE-301', 'temp', 'Playa Brava', 'Frente al mar con amenities', 2, 2, 90, 220, 0, 'Piscina, gimnasio, servicio de playa', false, true, ['#0EA5E9', '#0C4A6E'], '🌊'),
  P('CE-302', 'temp', 'Península', 'Monoambiente a pasos del puerto', 1, 1, 50, 110, 0, 'Wifi, aire acondicionado, ropa de cama', true, false, ['#FB923C', '#9A3412'], '🏢'),
  P('CE-303', 'temp', 'La Barra', 'Casa con piscina y parrillero', 3, 2, 160, 380, 0, 'Piscina, parrillero, a 5 cuadras de la playa', true, true, ['#4ADE80', '#14532D'], '🏡'),
  P('CE-304', 'temp', 'Playa Mansa', '2 dormitorios con vista al mar', 2, 2, 75, 160, 0, 'Vista al mar, garaje, piscina', true, true, ['#60A5FA', '#1E40AF'], '🏢'),
  P('CE-305', 'temp', 'Manantiales', 'Casa de diseño frente a la playa', 4, 4, 240, 650, 0, 'Piscina infinita, vista al mar, servicio de limpieza', true, true, ['#FBBF24', '#92400E'], '🏖️'),
  P('CE-306', 'temp', 'Pinares', 'Dúplex entre pinos', 2, 1, 70, 95, 0, 'Parrillero, a 3 cuadras de la playa', true, true, ['#34D399', '#064E3B'], '🌲'),
];
const prop = id => PROPS.find(p => p.id === id);
const priceLabel = p => p.op === 'venta' ? usd(p.price) : p.op === 'anual' ? `$ ${p.price.toLocaleString('es-UY')}/mes` : `${usd(p.price)}/noche`;
const propValue = p => p.op === 'venta' ? p.price : p.op === 'anual' ? Math.round(p.price * 12 / 40) : p.price * 14;
const bedsLabel = n => n === 0 ? 'Monoambiente' : `${n} dorm.`;
const TEMP = { hot: '🔥 Caliente', warm: '🌤️ Tibio', cold: '❄️ Frío' };
function qualify(f, opts = {}) {
  let s = 0; f = f || {};
  if (f.budget) s++; if (f.beds != null) s++; if (f.dates) s++; if (opts.contact) s++; if (opts.visit) s += 2;
  return s >= 4 ? 'hot' : s >= 2 ? 'warm' : 'cold';
}
const pd = () => { const c = S().convo; c.data = c.data || {}; c.data.p = c.data.p || {}; return c.data.p; };
function parseMoney(t) {
  const m = t.match(/(\d[\d.]*)\s*(mil|k)?/); if (!m) return null;
  let n = +m[1].replace(/\./g, ''); if (m[2]) n *= 1000; return n || null;
}
function parsePropText(t, p) {
  if (!p.op) { if (/tempor|verano|enero|febrero|quincena|vacacion|carnaval|semana de turismo/.test(t)) p.op = 'temp'; else if (/alquil|arrend/.test(t)) p.op = 'anual'; else if (/compr|venta|invertir/.test(t)) p.op = 'venta'; }
  if (!p.zone) { const z = ZONE_OPTS.find(([k, l]) => !['pde', 'mvd', 'any'].includes(k) && t.includes(norm(k))); p.zone = z ? z[0] : /manantiales/.test(t) ? 'La Barra' : /punta del este|\bpunta\b/.test(t) ? 'pde' : /montevideo/.test(t) ? 'mvd' : undefined; }
  if (p.beds == null) { if (/monoambiente/.test(t)) p.beds = 0; else { const m = t.match(/\b(\d)\s*(dorm|habitac|cuarto)/); if (m) p.beds = Math.min(4, +m[1]); } }
  Object.keys(p).forEach(k => p[k] === undefined && delete p[k]);
}
async function startSearch(text) {
  setStep('p_op', { p: {} });
  const p = pd(); if (text) parsePropText(norm(text), p); save();
  await say('¡Dale! Te busco opciones en un minuto 🏠');
  return nextP();
}
async function nextP() {
  const p = pd(); save();
  if (!p.op) { setStep('p_op'); await say('¿Qué estás buscando?', { fast: true }); return setQuick([{ label: '🔑 Comprar', payload: 'p:op:venta' }, { label: '📆 Alquiler anual', payload: 'p:op:anual' }, { label: '☀️ Alquiler temporario', payload: 'p:op:temp' }]); }
  if (!p.zone) { setStep('p_zone'); await say(`¿En qué zona? Trabajamos en **Punta del Este** y **Montevideo**.`); return setQuick(ZONE_OPTS.filter(([k]) => p.op !== 'temp' || !ZONES.mvd.includes(k) && k !== 'mvd').map(([k, l]) => ({ label: l, payload: `p:zone:${k}`, cls: k === 'any' ? 'secondary' : '' }))); }
  if (!p.budget) { setStep('p_budget'); await say(p.op === 'venta' ? '¿Cuál es tu presupuesto aproximado? 💲' : p.op === 'anual' ? '¿Hasta cuánto querés pagar de alquiler por mes? 💲' : '¿Cuál es tu presupuesto por noche? 💲'); return setQuick(BUDGETS[p.op].map((b, i) => ({ label: b[2], payload: `p:budget:${i}` }))); }
  if (p.beds == null) { setStep('p_beds'); await say('¿Cuántos dormitorios necesitás? 🛏️'); return setQuick([['Monoambiente', 0], ['1', 1], ['2', 2], ['3', 3], ['4 o más', 4]].map(([l, n]) => ({ label: l, payload: `p:beds:${n}` }))); }
  if (p.op === 'temp' && !p.dates) { setStep('p_dates'); await say('¿Para qué fechas? 📅 (elegí una o escribí las tuyas, por ejemplo “del 3 al 17 de enero”)'); return setQuick(DATES.map((d, i) => ({ label: d, payload: `p:dates:${i}` }))); }
  return showResults();
}
async function pSet(field, v) {
  const p = pd();
  if (field === 'budget') { const b = BUDGETS[p.op][+v]; p.budget = [b[0], b[1]]; p.budgetLabel = b[2]; }
  else if (field === 'beds') p.beds = +v;
  else if (field === 'dates') p.dates = DATES[+v] || v;
  else { p[field] = v; if (field === 'op') { delete p.budget; delete p.budgetLabel; if (v !== 'temp') delete p.dates; if (v === 'temp' && ZONES.mvd.includes(p.zone)) delete p.zone; } }
  save(); return nextP();
}
function searchProps(f) {
  const zs = zonesOf(f.zone); const [mn, mx] = f.budget || [0, 1e12];
  const sc = PROPS.filter(x => x.op === f.op).map(x => {
    const zm = zs.includes(x.zone); const bm = x.price <= mx && x.price >= mn * 0.85; let s = 0;
    if (zm) s += 3; if (bm) s += 3; else if (x.price <= mx * 1.15) s += 1;
    if (f.beds != null) { if (x.beds === f.beds || (f.beds >= 4 && x.beds >= 4)) s += 2; else if (Math.abs(x.beds - f.beds) === 1) s += 1; }
    return { x, s, exact: zm && bm };
  }).sort((a, b) => b.s - a.s || a.x.price - b.x.price);
  return { list: sc.slice(0, 3).map(o => o.x), exact: !!sc[0]?.exact };
}
async function showResults() {
  const p = pd(); const r = searchProps(p); p.results = r.list.map(x => x.id); save();
  const sum = `${OPS[p.op]} · ${zoneLabel(p.zone)} · ${p.budgetLabel || 'sin tope'} · ${p.beds === 0 ? 'monoambiente' : (p.beds >= 4 ? '4+' : p.beds) + ' dorm.'}${p.dates ? ' · ' + p.dates : ''}`;
  await say(`${r.exact ? 'Encontré estas propiedades para vos' : 'No encontré algo exacto, pero estas opciones se acercan mucho'} 👇\n🔎 ${sum}`, { msg: { cards: p.results } });
  setStep('p_pick');
  await say('Tocá **Visitar** para agendar una visita o **Ver ficha** para más detalles. También podés escribirme el código (ej. ' + p.results[0] + ').', { fast: true });
  setQuick([{ label: '🔎 Cambiar la búsqueda', payload: 'intent:quote', cls: 'secondary' }, { label: B().humanLabel, payload: 'intent:human', cls: 'secondary' }]);
}
async function propInfo(id) {
  const x = prop(id); if (!x) return say('No encontré esa propiedad 🤔');
  const c = S().convo; c.data = { ...(c.data || {}), prop: id }; setStep('p_pick');
  await say(`🏠 **${x.title}** (${x.id})\n📍 ${x.zone}, ${cityOf(x.zone)} · ${x.m2} m² · ${bedsLabel(x.beds)} · ${x.baths} ${x.baths === 1 ? 'baño' : 'baños'}\n💲 **${priceLabel(x)}**${x.gc ? ` · gastos comunes $ ${x.gc.toLocaleString('es-UY')}` : ''}\n✨ ${x.extras}\n🐾 ${x.pets ? 'Acepta mascotas' : 'No acepta mascotas'} · 🚗 ${x.garage ? 'Con garaje' : 'Sin garaje'}`);
  setQuick([{ label: '📅 Agendar visita', payload: `prop:visit:${id}` }, { label: '❓ Hacer una pregunta', payload: `prop:ask:${id}` }, { label: '📲 Que me contacte un agente', payload: `prop:contact:${id}`, cls: 'secondary' }, { label: '🔎 Ver otras', payload: 'p:again:1', cls: 'secondary' }]);
}
async function propAsk(id) {
  const c = S().convo; c.data = { ...(c.data || {}), prop: id }; setStep('p_question');
  await say(`Dale, ¿qué querés saber de la ${id}? (mascotas, garaje, gastos comunes, si se puede negociar…)`); setQuick([]);
}
async function propAnswer(text) {
  const t = norm(text); const c = S().convo; const x = prop(c.data.prop) || PROPS[0];
  let a;
  if (/mascota|perro|gato/.test(t)) a = x.pets ? `Sí 🐾 La ${x.id} acepta mascotas.` : `La ${x.id} no acepta mascotas 😕 Si querés, te busco otras opciones que sí.`;
  else if (/garaje|garage|cochera|auto|estacion/.test(t)) a = x.garage ? `Sí 🚗 La ${x.id} tiene garaje.` : `La ${x.id} no tiene garaje, pero hay estacionamiento en la zona.`;
  else if (/gasto|expensa/.test(t)) a = x.gc ? `Los gastos comunes de la ${x.id} son de **$ ${x.gc.toLocaleString('es-UY')}** por mes.` : `La ${x.id} no tiene gastos comunes${x.op === 'temp' ? ': en temporario está todo incluido' : ' (es una casa)'}.`;
  else if (/negoci|rebaj|descuento|oferta/.test(t)) a = `El precio publicado es **${priceLabel(x)}**. Las ofertas se presentan por escrito y el propietario las evalúa; ${B().agent} te puede orientar.`;
  else if (/disponib|libre|sigue/.test(t)) a = `Sí, la ${x.id} sigue disponible ✅`;
  else a = `Buena pregunta 🙌 Se la paso a ${B().agent}, nuestra agente, que conoce la propiedad y te responde en el día.`;
  await say(a);
  setStep('p_pick');
  setQuick([{ label: '📅 Agendar visita', payload: `prop:visit:${x.id}` }, { label: '📲 Que me contacte un agente', payload: `prop:contact:${x.id}`, cls: 'secondary' }, { label: '🔎 Ver otras', payload: 'p:again:1', cls: 'secondary' }]);
}
async function propVisit(id) {
  const x = prop(id); if (!x) return say('No encontré esa propiedad 🤔');
  const c = S().convo; const p = c.data?.p || {};
  setStep('day', { mode: 'new', service: 'visita', prop: id, extra: `${x.id} · ${x.zone}`, p });
  return startDay(false, `¡Buenísimo! Coordinemos la visita a **${x.title}** (${x.id}) 📅 ¿Qué día te queda mejor?`);
}
async function propContact(id) { const c = S().convo; c.data = { ...(c.data || {}), prop: id }; save(); return askContact('inmo'); }
async function inmoContact() {
  const st = S(); const d = st.convo.data; const x = prop(d.prop);
  const lead = upsertInmoLead({ name: d.name, phone: d.phone, x, f: d.p, stage: 'calificado', visit: false });
  renderPanel({ bump: true }); renderLeads({ flash: lead.id });
  notifyPanel(`📈 Nuevo lead calificado: ${lead.name} · ${TEMP[lead.temp]}`, 'leads');
  await say(`¡Listo, ${first(d.name)}! 🙌 ${B().agent} te escribe hoy al ${d.phone}${x ? ` para contarte todo sobre la ${x.id}` : ''}.\n¿Querés aprovechar y dejar agendada una visita?`);
  setStep('idle', {});
  setQuick(x ? [{ label: '📅 Agendar visita', payload: `prop:visit:${x.id}` }, { label: 'No por ahora', payload: 'intent:menu', cls: 'secondary' }] : MENU());
}
function upsertInmoLead({ name, phone, x, f, stage, visit, bookingId }) {
  const st = S(); st.leads = st.leads || [];
  const order = B().stages.map(s => s.id);
  let L = st.leads.find(l => samePhone(l.phone, phone) && (!x || l.propId === x.id || !l.propId) && !['cerrado'].includes(l.stage));
  const detail = x ? `${OPS[x.op]} · ${x.title} (${x.id})` : 'Consulta general';
  const temp = qualify(f, { contact: true, visit });
  if (L) {
    Object.assign(L, { name, detail, propId: x?.id || L.propId, value: x ? propValue(x) : L.value, temp: ['hot', 'warm', 'cold'].indexOf(temp) < ['hot', 'warm', 'cold'].indexOf(L.temp) ? temp : L.temp });
    if (order.indexOf(stage) > order.indexOf(L.stage)) L.stage = stage;
    if (bookingId) L.bookingId = bookingId; save(); return L;
  }
  return addLead({ name, phone, stage, value: x ? propValue(x) : 0, detail, propId: x?.id, temp, bookingId });
}

/* Panel: oportunidades */
function salesCards() {
  const b = B(); const st = S(); const L = st.leads || []; const s = computeStats();
  const closedIds = ['ganado', 'cerrado']; const lostIds = ['perdido'];
  const open = L.filter(x => !closedIds.includes(x.stage) && !lostIds.includes(x.stage));
  const won = L.filter(x => closedIds.includes(x.stage)); const lost = L.filter(x => lostIds.includes(x.stage));
  const openV = open.reduce((a, x) => a + (x.value || 0), 0), wonV = won.reduce((a, x) => a + (x.value || 0), 0);
  const rate = won.length + lost.length ? Math.round(won.length / (won.length + lost.length) * 100) : 0;
  if (state.biz === 'contenedores') {
    const q = L.filter(x => x.quoteNo).length; const fromChat = L.filter(x => x.quoteNo && x.source === 'chat').length;
    return [
      ['🧾 Cotizaciones', q, fromChat ? `${fromChat} generadas por el chat` : 'Generadas por el bot'],
      ['💰 Pipeline abierto', usd(openV), `${open.length} oportunidades activas`],
      ['📅 Visitas y llamadas', s.week, 'Agendadas esta semana'],
      ['🏆 Ganado', usd(wonV), `Tasa de cierre: ${rate} %`, 'hl'],
    ];
  }
  const hot = L.filter(x => x.temp === 'hot' && open.includes(x)).length, warm = L.filter(x => x.temp === 'warm' && open.includes(x)).length, cold = L.filter(x => x.temp === 'cold' && open.includes(x)).length;
  return [
    ['🔥 Leads calientes', hot, `${warm} tibios · ${cold} fríos`],
    ['💰 Pipeline abierto', usd(openV), `${open.length} oportunidades activas`],
    ['📅 Visitas de la semana', s.week, s.chat ? `${s.chat} agendadas por el chat` : 'Lunes a domingo'],
    ['🤝 Cerrado', usd(wonV), `${won.length} ${won.length === 1 ? 'operación' : 'operaciones'} este mes`, 'hl'],
  ];
}
function leadCard(x, i) {
  const b = B(); const st = S(); const next = b.stages[i + 1];
  const bk = x.bookingId ? st.bookings.find(k => k.id === x.bookingId && k.status !== 'cancelado') : null;
  let acts = '';
  if (x.stage === 'perdido') acts = `<button class="mini" data-lm="reopen" data-id="${x.id}">↺ Reabrir</button>`;
  else acts = `<button class="mini" data-lm="-1" data-id="${x.id}" ${i === 0 ? 'disabled' : ''} title="Etapa anterior" aria-label="Etapa anterior">◀</button>`
    + `<button class="mini ok" data-lm="1" data-id="${x.id}" ${!next || next.id === 'perdido' ? 'disabled' : ''} title="${next && next.id !== 'perdido' ? 'Pasar a ' + next.label : ''}" aria-label="Etapa siguiente">${next && next.id !== 'perdido' ? next.label + ' ▶' : '▶'}</button>`
    + (b.stages.some(s => s.id === 'perdido') && !['ganado'].includes(x.stage) ? `<button class="mini no" data-lm="lost" data-id="${x.id}" title="Marcar como perdido">✗</button>` : '');
  return `<div class="lead" data-lid="${x.id}">
    <div class="lead-top"><b>${esc(x.name)}</b>${x.temp ? `<span class="temp t-${x.temp}">${TEMP[x.temp]}</span>` : ''}</div>
    <div class="lead-d">${esc(x.detail)}</div>
    <div class="lead-m">${chBadge(x.channel)}${x.quoteNo ? `<span class="qno">${x.quoteNo}</span>` : ''}<b class="val">${usd(x.value || 0)}</b></div>
    ${bk ? `<div class="lead-x">📅 ${esc(service(bk.service).name)} · ${dayChip(bk.date)} ${bk.time}</div>` : ''}
    ${x.followup ? `<div class="lead-x">📨 Seguimiento ${x.followup === 'enviado' ? 'enviado, esperando respuesta' : 'respondido'}</div>` : ''}
    ${x.lostReason ? `<div class="lead-x lost">✗ ${esc(x.lostReason)}</div>` : ''}
    ${x.source === 'chat' ? '<span class="tag src-chat">💬 Desde el chat</span>' : ''}
    <div class="lead-a">${acts}</div></div>`;
}
function renderLeads(opts = {}) {
  updateLeadsBadge();
  const el = $('#pipeline'); if (!el || !isSales()) return;
  const b = B(); const L = S().leads || [];
  const cards = salesCards();
  $('#leadStats').innerHTML = cards.map(([k, v, sub, cls]) => `<div class="stat ${cls || ''}"><div class="k">${k}</div><div class="v">${v}</div><div class="s">${esc(sub)}</div></div>`).join('');
  el.innerHTML = b.stages.map((sg, i) => {
    const items = L.filter(x => x.stage === sg.id).sort((a, z) => z.createdAt - a.createdAt);
    const tot = items.reduce((a, x) => a + (x.value || 0), 0);
    return `<div class="pcol st-${sg.id}" data-stage="${sg.id}"><div class="pcol-h"><b>${sg.label}</b><span class="n">${items.length}</span><small>${usd(tot)}</small></div>
      <div class="pcol-b">${items.map(x => leadCard(x, i)).join('') || '<div class="pempty">Sin oportunidades</div>'}</div></div>`;
  }).join('');
  if (opts.flash) { const c = el.querySelector(`[data-lid="${opts.flash}"]`); if (c) { c.classList.add('flash'); c.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'smooth' }); } }
}
function updateLeadsBadge() {
  const el = $('#leadsBadge'); if (!el) return;
  const n = isSales() ? (S().leads || []).filter(x => x.stage === 'nuevo' || (x.source === 'chat' && !x.seen)).length : 0;
  el.hidden = !n; el.textContent = n > 9 ? '9+' : n;
  const m = $('#mobileLeadsBadge'); if (m) { m.hidden = !n; m.textContent = el.textContent; }
}
function moveLead(id, how) {
  const b = B(); const st = S(); const L = (st.leads || []).find(x => x.id === id); if (!L) return;
  const order = b.stages.map(s => s.id); let i = order.indexOf(L.stage);
  if (how === 'lost') { L.stage = 'perdido'; L.lostReason = L.lostReason || 'Marcado como perdido desde el panel'; }
  else if (how === 'reopen') { L.stage = L.quoteNo ? 'cotizado' : 'nuevo'; delete L.lostReason; }
  else { i = Math.max(0, Math.min(order.length - 1, i + +how)); if (order[i] === 'perdido') return; L.stage = order[i]; }
  L.seen = true; save();
  const label = b.stages.find(s => s.id === L.stage).label;
  if (['ganado', 'cerrado'].includes(L.stage)) toast(`🏆 ¡${L.stage === 'ganado' ? 'Venta ganada' : 'Operación cerrada'}! ${L.name} · ${usd(L.value || 0)}`);
  else toast(`➡️ ${L.name} pasó a “${label}”`);
  renderStats(true); renderLeads({ flash: L.id });
}
function seedLeads(key, st) {
  const ago = h => Date.now() - h * 3600000;
  const bkOf = n => st.bookings.find(x => x.name === BIZ[key].names[n] && x.status === 'confirmado' && !isPast(x.date, x.time));
  const mk = (o, n) => ({ id: uid(), email: '', source: 'seed', followup: null, ...o, ...(n != null && bkOf(n) ? { bookingId: bkOf(n).id, name: BIZ[key].names[n] } : {}) });
  if (key === 'contenedores') return [
    mk({ name: 'Gonzalo Ejemplo', phone: '099 000 101', stage: 'nuevo', value: 5300, detail: "Consulta 40' HC para chacra · Florida", channel: 'instagram', createdAt: ago(1) }),
    mk({ name: 'Andrea Prueba', phone: '099 000 102', stage: 'nuevo', value: 1260, detail: "Alquiler 20' para obra (3 meses) · Montevideo", channel: 'web', createdAt: ago(5) }),
    mk({ name: 'Martín Prueba', phone: '099 000 002', stage: 'cotizado', value: 4800, quoteNo: 'COT-1038', detail: "2 × 20' usado · Canelones", channel: 'whatsapp', createdAt: ago(52) }),
    mk({ name: 'Florencia Demo', phone: '099 000 104', email: 'florencia.demo@ejemplo.com', stage: 'cotizado', value: 18080, quoteNo: 'COT-1040', detail: "1 × Oficina modificada 40' · Maldonado", channel: 'email', createdAt: ago(30) }),
    mk({ name: 'Hernán Muestra', phone: '099 000 105', stage: 'cotizado', value: 5080, quoteNo: 'COT-1041', detail: "1 × 40' one-trip · Montevideo", channel: 'whatsapp', createdAt: ago(49) }),
    mk({ phone: '099 000 007', stage: 'visita', value: 30200, quoteNo: 'COT-1036', detail: "1 × Vivienda modificada 40' HC · Rocha", channel: 'whatsapp', createdAt: ago(80) }, 6),
    mk({ phone: '099 000 001', stage: 'visita', value: 9690, quoteNo: 'COT-1035', detail: "3 × 40' usado · San José", channel: 'messenger', createdAt: ago(100) }, 0),
    mk({ name: 'Cooperativa Ficticia', phone: '099 000 108', stage: 'ganado', value: 18280, quoteNo: 'COT-1029', detail: "4 × 20' nuevo · Colonia", channel: 'email', createdAt: ago(200) }),
    mk({ name: 'Esteban Testeo', phone: '099 000 109', stage: 'perdido', value: 2770, quoteNo: 'COT-1031', detail: "1 × 20' usado · Salto", channel: 'whatsapp', createdAt: ago(170), lostReason: 'Eligió otro proveedor' }),
  ];
  return [
    mk({ name: 'Roberto Muestra', phone: '099 000 090', stage: 'nuevo', value: 12600, temp: 'warm', detail: 'Alquiler anual · 2 dormitorios con balcón (CE-201)', propId: 'CE-201', channel: 'messenger', createdAt: ago(2) }),
    mk({ name: 'Paula Muestra', phone: '099 000 202', stage: 'nuevo', value: 2240, temp: 'warm', detail: 'Temporario enero · 2 dorm. en Punta del Este', channel: 'instagram', createdAt: ago(1) }),
    mk({ name: 'Martín Prueba', phone: '099 000 002', stage: 'calificado', value: 245000, temp: 'warm', detail: 'Venta · Apartamento con vista al puerto (CE-101)', propId: 'CE-101', channel: 'whatsapp', createdAt: ago(28) }),
    mk({ name: 'Romina Ejemplar', phone: '099 000 204', stage: 'calificado', value: 25500, temp: 'cold', detail: 'Alquiler anual · Casa en Carrasco (CE-204)', propId: 'CE-204', channel: 'web', createdAt: ago(40) }),
    mk({ phone: '099 000 007', stage: 'visita', value: 210000, temp: 'hot', detail: 'Venta · A una cuadra de la rambla (CE-105)', propId: 'CE-105', channel: 'whatsapp', createdAt: ago(60) }, 6),
    mk({ phone: '099 000 001', stage: 'visita', value: 2240, temp: 'hot', detail: 'Temporario · 2 dormitorios con vista al mar (CE-304)', propId: 'CE-304', channel: 'instagram', createdAt: ago(75) }, 0),
    mk({ name: 'Familia Ficticia', phone: '099 000 207', stage: 'oferta', value: 495000, temp: 'hot', detail: 'Oferta USD 495.000 · Casa entre pinos (CE-104)', propId: 'CE-104', channel: 'email', createdAt: ago(120) }),
    mk({ name: 'Diego Ficticio', phone: '099 000 004', stage: 'cerrado', value: 7200, temp: 'hot', detail: 'Alquiler anual firmado con garantía ANDA (CE-203)', propId: 'CE-203', channel: 'whatsapp', createdAt: ago(300) }),
  ];
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
  if (b.kind === 'sales') {
    const where = s.id !== 'visita' ? `Te contactamos al ${bk.phone}.` : key === 'inmobiliaria' ? `${b.agent} te espera en la puerta de la propiedad 🏠` : `Te esperamos en ${b.address}.`;
    return `Hola ${first(bk.name)} 👋 Te recordamos tu **${s.name.toLowerCase()}**${bk.extra ? ` (**${bk.extra}**)` : ''} ${dayPhrase(bk.date)} a las **${bk.time}** con ${b.name}. ${where}\n\n¿Confirmás o preferís reprogramarla?`;
  }
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
    contenedores: {
      ig: ['Gonzalo Ejemplo', '@gonza.chacra', [
        ['client', 'Hola! ¿Cuánto sale un contenedor de 40 pies? Lo quiero para guardar herramientas en el campo 🚜', 52],
        ['bot', "¡Hola Gonzalo! 👋 Un **40' usado** (apto carga) está entre **USD 2.500 y 3.100**, y un **40' HC one-trip** entre **USD 5.000 y 5.600**, más el envío según el departamento. ¿Me decís dónde sería la entrega y te armo la cotización?", 51],
        ['client', 'Es en Florida, cerca de Sarandí Grande. ¿El HC es más alto?', 8]]],
      fb: [["Hola, alquilé un 20' para la obra y me dijeron que lo entregaban ayer y no llegó 😠", 95], ['Tengo a los albañiles esperando', 94]],
      fbBot: 'Lamento mucho la demora, Roberto 🙏 Te derivo con el equipo de ventas y logística para que te confirmen hoy mismo el horario de entrega.',
      web: [['¿Hacen contenedores adaptados como oficina con baño?', 205], ["¡Sí! Hacemos oficinas modificadas en 20' y 40', con aislación, aire acondicionado, instalación eléctrica y baño opcional. Una oficina de 20' arranca en **USD 9.500**. ¿Querés que te arme una cotización?", 205], ['Dale, después la pido por el chat. Gracias!', 202]],
      mail: ['Asunto: Factura y certificado de los contenedores\nHola, compramos 2 contenedores la semana pasada. ¿Nos pueden mandar la factura con RUT y el certificado de inspección? Gracias.', 'Hola Sofía, te adjuntamos la factura y el certificado de inspección de ambos contenedores. A las órdenes. Saludos, Rodrigo.', 'Cliente ganado. Enviar certificados de inspección y coordinar encuesta de satisfacción.'],
    },
    inmobiliaria: {
      ig: ['Paula Muestra', '@pau.muestra', [
        ['client', 'Hola! Busco algo para alquilar en enero en Punta, 2 dormitorios, cerca de la playa ☀️', 48],
        ['bot', '¡Hola Paula! 👋 Para enero tengo un **2 dormitorios con vista al mar en Playa Mansa** (USD 160 por noche) y otro **frente a Playa Brava** con amenities (USD 220 por noche). ¿Querés que te mande las fichas?', 47],
        ['client', 'Siii! ¿Aceptan mascotas? Tengo una perrita chiquita 🐶', 6]]],
      fb: [['Hola, vi el apartamento de 2 dormitorios en Pocitos que publicaron. ¿Sigue disponible?', 93], ['¿Aceptan garantía ANDA? ¿Lo puedo ver el sábado?', 92]],
      fbBot: 'Sí, Roberto: sigue disponible y aceptamos garantía ANDA 🙌 Para coordinar la visita del sábado te derivo con un agente, que te confirma el horario.',
      web: [['¿Cuánto es la comisión si compro?', 215], ['La comisión en compra es del **3 % + IVA** sobre el precio. En alquiler anual es un mes de alquiler + IVA. ¿Querés que te muestre propiedades?', 215], ['Por ahora no, gracias!', 212]],
      mail: ['Asunto: Documentación para la oferta\nHola, ¿qué documentos tengo que presentar para hacer la oferta por la casa de La Barra?', 'Hola Sofía, te pasamos la lista: cédula, constancia de domicilio y la carta oferta firmada. Te la mandamos en PDF. Saludos, Valeria.', 'Oferta en curso por CE-104. Coordinar con escribanía.'],
    },
  }[key];
  const msgs = arr => arr.map(([from, text, m, kind]) => ({ from, text, ts: ago(m), ...(kind ? { kind } : {}) }));
  const convs = [];
  convs.push({ id: uid(), channel: 'instagram', name: C.ig[0], handle: C.ig[1], phone: '', status: 'bot', attention: false, botPaused: false, unread: 1, notes: [], messages: msgs(C.ig[2]) });
  convs.push({ id: uid(), channel: 'messenger', name: 'Roberto Muestra', handle: 'Roberto Muestra (Facebook)', phone: '099 000 090', status: 'derivado', attention: true, botPaused: false, unread: 2, notes: [],
    messages: msgs([['client', C.fb[0][0], C.fb[0][1]], ['client', C.fb[1][0], C.fb[1][1]], ['bot', C.fbBot, C.fb[1][1] - 0.5], ['sys', `🔔 Conversación derivada a ${b.handoffTo || 'recepción'}`, C.fb[1][1] - 0.6]]) });
  const rb = st.bookings.find(x => x.reminder === 'confirmado' && x.status === 'confirmado' && x.source === 'seed') || st.bookings.find(x => x.status === 'confirmado');
  if (rb) convs.push({ id: uid(), channel: 'whatsapp', name: rb.name, handle: rb.phone, phone: rb.phone, status: 'resuelto', attention: false, botPaused: false, unread: 0, notes: [],
    messages: msgs([['bot', reminderText(rb, key), 150, 'reminder'], ['client', '✅ Confirmo', 128], ['bot', b.kind === 'sales' ? salesConfirmText(rb, key) : `¡Genial, ${first(rb.name)}! Tu turno queda **confirmado** ✅ Te esperamos ${dayPhrase(rb.date)} a las **${rb.time}**.`, 128]]) });
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
  if (t === 'leads' && !isSales()) t = 'agenda'; panelTab = t;
  $('#tabAgenda').hidden = t !== 'agenda'; $('#tabInbox').hidden = t !== 'inbox'; $('#tabLeads').hidden = t !== 'leads';
  document.querySelectorAll('#ptabs button').forEach(b => b.classList.toggle('active', b.dataset.ptab === t));
  syncMobileTabs();
  if (t === 'inbox') { if (selConv) { const m = metaOf(selConv); if (m) { m.unread = 0; save(); } } renderInbox(); } else if (t === 'leads') { renderLeads(); } else renderPanel();
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
  $('#thInput').placeholder = composeMode === 'note' ? 'Nota interna: solo la ve tu equipo…' : c.live ? `Respondé como ${roleLabel().toLowerCase()}: aparece en el chat del cliente…` : `Respondé por ${col.label}…`;
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
    <h5>${isSales() ? 'Próximas visitas y llamadas' : 'Próximos turnos'}</h5>
    ${upcoming.length ? upcoming.map(x => `<button class="cc-appt" data-goto-bk="${x.id}"><b>${dayChip(x.date)} · ${x.time}</b><span>${esc(service(x.service).name)}${x.extra ? ' · ' + esc(x.extra) : ''}</span>${(() => { const [ch, l] = statusInfo(x); return `<span class="chip ${ch}">${l}</span>`; })()}</button>`).join('') : '<p class="cc-empty">Sin turnos agendados.</p>'}
    ${isSales() ? (() => { const ls = (st.leads || []).filter(l => (c.phone && samePhone(l.phone, c.phone)) || l.name === c.name); return `<h5>Oportunidades</h5>` + (ls.length ? ls.map(l => `<button class="cc-appt" data-goto-lead="${l.id}"><b>${esc(B().stages.find(s => s.id === l.stage).label)} · ${usd(l.value || 0)}</b><span>${esc(l.detail)}</span>${l.temp ? `<span class="temp t-${l.temp}">${TEMP[l.temp]}</span>` : ''}</button>`).join('') : '<p class="cc-empty">Todavía sin oportunidad en el embudo.</p>'); })() : ''}
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
  if (id === 'live') { save(); setQuick([]); sys(`👩‍💼 ${B().agent} (${roleLabel().toLowerCase()}) se sumó a la conversación`); renderHeader(); }
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
chatBody.addEventListener('click', e => { const b = e.target.closest('[data-card]'); if (b) userSays(b.dataset.label || b.textContent, b.dataset.card); });
$('#pipeline').addEventListener('click', e => { const b = e.target.closest('[data-lm]'); if (b && !b.disabled) moveLead(b.dataset.id, b.dataset.lm); });
$('#btnCopyLink').addEventListener('click', () => {
  const url = `${location.origin}${location.pathname}?rubro=${rubroOf(state.biz)}`;
  const done = () => toast(`🔗 Link copiado: ${url}`);
  if (navigator.clipboard?.writeText) navigator.clipboard.writeText(url).then(done, () => toast(`🔗 ${url}`)); else toast(`🔗 ${url}`);
});
$('#btnReminder').addEventListener('click', () => sendReminder());
$('#btnReset').addEventListener('click', () => {
  const biz = state.biz; state = fresh(); state.biz = biz; save();
  typingOn = false; queue = Promise.resolve(); panelDate = todayStr(); panelMode = 'day'; selConv = null; ibxFilter = { ch: 'all', st: 'all', q: '' }; $('#ibxSearch').value = ''; $('#stFilter').value = 'all';
  boot(); toast('↺ Demo reiniciada con datos de ejemplo');
});
window.addEventListener('storage', e => { if (e.key === STORE_KEY && !typingOn) { load(); renderHeader(); renderChat(); renderPanel(); renderInbox(); renderLeads(); } });

function syncUrl() {
  try { const u = new URL(location.href); u.searchParams.set('rubro', rubroOf(state.biz)); history.replaceState(null, '', u.pathname + u.search + u.hash); } catch {}
}
function switchBiz(key) {
  if (key === state.biz || typingOn || !BIZ[key]) return;
  state.biz = key; save(); panelDate = todayStr(); selConv = null; syncUrl();
  boot();
}
function boot() {
  bizState(); save();
  renderHeader(); renderChat(); renderPanel(); renderInbox(); renderLeads();
  if (!S().chat.length) queue = queue.then(() => welcome(false));
}

load(); boot();
window.__demo = { get state() { return state; }, reset: () => $('#btnReset').click() };
})();
