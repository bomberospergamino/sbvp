/*************** AGREGAR AL doGet EXISTENTE ***************/
// Dentro del doGet actual de SBVP_ EQUIPAMIENTO V2, sumar esta linea:
// if (action === 'checksSummary') return jsonResponse({ ok: true, ...getChecksSummary_(Number(params.days) || 7) });

/*************** FUNCIONES NUEVAS ***************/
function getChecksSummary_(days) {
  const safeDays = Math.max(1, Math.min(Number(days) || 7, 31));
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const activities = getExpectedCheckActivities_(ss);
  const registros = getCheckRegistros_(ss);
  const tz = Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  from.setDate(from.getDate() - safeDays + 1);

  const byActivity = {};
  registros.forEach(row => {
    const activity = String(row.actividad || '').trim();
    if (!activity) return;
    const controlDate = parseCheckRegistroDate_(row.fechaControl || row.fechaCarga);
    if (!controlDate) return;
    const controlDay = new Date(controlDate);
    controlDay.setHours(0, 0, 0, 0);
    if (controlDay < from || controlDay > today) return;
    const current = byActivity[activity];
    if (!current || controlDate > current._sortDate) byActivity[activity] = { ...row, _sortDate: controlDate };
  });

  const sourceNames = activities.length
    ? activities
    : Array.from(new Set(registros.map(r => r.actividad).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));

  const items = sourceNames.map(name => {
    const match = byActivity[name];
    return {
      activity: name,
      done: Boolean(match),
      lastControlDate: match ? dateForCheckClient_(match.fechaControl || match.fechaCarga, tz) : '',
      lastLoadDate: match ? dateForCheckClient_(match.fechaCarga, tz) : '',
      responsables: match ? splitCheckResponsables_(match.responsables) : [],
      observaciones: match ? match.observaciones || '' : '',
      pdf: match ? match.pdf || '' : '',
      totalItems: match ? match.totalItems || '' : '',
      totalNovedades: match ? match.totalNovedades || 0 : 0
    };
  }).sort((a, b) => Number(a.done) - Number(b.done) || a.activity.localeCompare(b.activity, 'es', { numeric: true }));

  return {
    days: safeDays,
    from: Utilities.formatDate(from, tz, 'yyyy-MM-dd'),
    to: Utilities.formatDate(today, tz, 'yyyy-MM-dd'),
    generatedAt: Utilities.formatDate(new Date(), tz, "yyyy-MM-dd'T'HH:mm:ss"),
    expectedHeaders: ['Fecha carga', 'Fecha control', 'Actividad', 'Responsable/s', 'Observaciones', 'PDF', 'Total items', 'Total novedades'],
    items
  };
}

function getExpectedCheckActivities_(ss) {
  const internal = ['AGENDA', 'REGISTROS', 'NOVEDADES', 'PIZARRA', 'PIZZARRA'];
  return ss.getSheets()
    .map(sheet => sheet.getName())
    .filter(name => !internal.includes(String(name || '').trim().toUpperCase()))
    .sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
}

function getCheckRegistros_(ss) {
  const sheet = ss.getSheetByName('REGISTROS');
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h || '').trim());
  const idx = {
    fechaCarga: findCheckHeader_(headers, ['Fecha carga', 'Fecha de carga', 'Carga']),
    fechaControl: findCheckHeader_(headers, ['Fecha control', 'Fecha de control', 'Control']),
    actividad: findCheckHeader_(headers, ['Actividad', 'Check', 'Control']),
    responsables: findCheckHeader_(headers, ['Responsable/s', 'Responsables', 'Responsable']),
    observaciones: findCheckHeader_(headers, ['Observaciones', 'Observacion']),
    pdf: findCheckHeader_(headers, ['PDF', 'Archivo', 'Link PDF']),
    totalItems: findCheckHeader_(headers, ['Total items', 'Items', 'Total de items']),
    totalNovedades: findCheckHeader_(headers, ['Total novedades', 'Novedades', 'Total de novedades'])
  };

  if (idx.actividad < 0) throw new Error('REGISTROS no tiene encabezado Actividad. Encabezados encontrados: ' + headers.join(' | '));

  return values.slice(1).map(row => ({
    fechaCarga: idx.fechaCarga >= 0 ? row[idx.fechaCarga] : '',
    fechaControl: idx.fechaControl >= 0 ? row[idx.fechaControl] : '',
    actividad: idx.actividad >= 0 ? row[idx.actividad] : '',
    responsables: idx.responsables >= 0 ? row[idx.responsables] : '',
    observaciones: idx.observaciones >= 0 ? row[idx.observaciones] : '',
    pdf: idx.pdf >= 0 ? row[idx.pdf] : '',
    totalItems: idx.totalItems >= 0 ? row[idx.totalItems] : '',
    totalNovedades: idx.totalNovedades >= 0 ? row[idx.totalNovedades] : ''
  })).filter(row => row.actividad);
}

function findCheckHeader_(headers, names) {
  const normalized = headers.map(normalizeHeader_);
  for (let i = 0; i < names.length; i += 1) {
    const idx = normalized.indexOf(normalizeHeader_(names[i]));
    if (idx >= 0) return idx;
  }
  return -1;
}

function splitCheckResponsables_(value) {
  return String(value || '').split(/[,;\n]+/).map(name => name.trim()).filter(Boolean);
}

function parseCheckRegistroDate_(value) {
  if (!value) return null;
  if (Object.prototype.toString.call(value) === '[object Date]' && !isNaN(value)) return value;
  const text = String(value || '').trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const ar = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (ar) return new Date(Number(ar[3]), Number(ar[2]) - 1, Number(ar[1]));
  const parsed = new Date(text);
  return isNaN(parsed) ? null : parsed;
}

function dateForCheckClient_(value, tz) {
  const date = parseCheckRegistroDate_(value);
  return date ? Utilities.formatDate(date, tz, "yyyy-MM-dd'T'HH:mm:ss") : '';
}
