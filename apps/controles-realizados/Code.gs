/*************** SEGUIMIENTO DE CHECKS SBVP ***************/
const SPREADSHEET_ID = '1iej80w--kZK_N33UTq9FbDbA0air3qFimrDIB1QAxZ0';
const REGISTROS_SHEET_NAME = 'REGISTROS';
const AGENDA_SHEET_NAME = 'AGENDA';
const INTERNAL_SHEETS = ['AGENDA', 'REGISTROS', 'NOVEDADES', 'PIZARRA', 'PIZZARRA'];

function doGet(e) {
  try {
    const params = e.parameter || {};
    const action = String(params.action || '').trim();

    if (action === 'checksSummary') {
      return jsonResponse({ ok: true, ...getChecksSummary_(Number(params.days) || 7) });
    }

    return jsonResponse({ ok: true, message: 'Seguimiento de checks activo' });
  } catch (err) {
    return jsonResponse({ ok: false, message: err.message, error: err.message });
  }
}

function jsonResponse(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

function getChecksSummary_(days) {
  const safeDays = Math.max(1, Math.min(Number(days) || 7, 31));
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const activities = getExpectedActivities_(ss);
  const registros = getRegistros_(ss);
  const tz = Session.getScriptTimeZone() || 'America/Argentina/Buenos_Aires';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const from = new Date(today);
  from.setDate(from.getDate() - safeDays + 1);

  const byActivity = {};
  registros.forEach(row => {
    const activity = String(row.actividad || '').trim();
    if (!activity) return;

    const controlDate = parseRegistroDate_(row.fechaControl || row.fechaCarga);
    if (!controlDate) return;
    const controlDay = new Date(controlDate);
    controlDay.setHours(0, 0, 0, 0);
    if (controlDay < from || controlDay > today) return;

    const current = byActivity[activity];
    if (!current || controlDate > current._sortDate) {
      byActivity[activity] = { ...row, _sortDate: controlDate };
    }
  });

  const sourceNames = activities.length
    ? activities
    : Array.from(new Set(registros.map(r => r.actividad).filter(Boolean))).sort((a, b) => a.localeCompare(b, 'es'));

  const items = sourceNames.map(name => {
    const match = byActivity[name];
    return {
      activity: name,
      done: Boolean(match),
      lastControlDate: match ? dateForClient_(match.fechaControl || match.fechaCarga, tz) : '',
      lastLoadDate: match ? dateForClient_(match.fechaCarga, tz) : '',
      responsables: match ? splitResponsables_(match.responsables) : [],
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

function getExpectedActivities_(ss) {
  const sheetNames = ss.getSheets()
    .map(sheet => sheet.getName())
    .filter(name => !INTERNAL_SHEETS.includes(String(name || '').trim().toUpperCase()));

  if (sheetNames.length) return sheetNames.sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));

  const agenda = ss.getSheetByName(AGENDA_SHEET_NAME);
  if (!agenda || agenda.getLastRow() < 2) return [];
  const values = agenda.getDataRange().getDisplayValues().filter(row => row.some(Boolean));
  const names = [];
  values.slice(1).forEach(row => {
    row.slice(1).forEach(value => {
      const name = String(value || '').trim();
      if (name && !names.includes(name)) names.push(name);
    });
  });
  return names.sort((a, b) => a.localeCompare(b, 'es', { numeric: true }));
}

function getRegistros_(ss) {
  const sheet = ss.getSheetByName(REGISTROS_SHEET_NAME);
  if (!sheet || sheet.getLastRow() < 2) return [];

  const values = sheet.getDataRange().getValues();
  const headers = values[0].map(h => String(h || '').trim());
  const idx = {
    fechaCarga: findHeader_(headers, ['Fecha carga', 'Fecha de carga', 'Carga']),
    fechaControl: findHeader_(headers, ['Fecha control', 'Fecha de control', 'Control']),
    actividad: findHeader_(headers, ['Actividad', 'Check', 'Control']),
    responsables: findHeader_(headers, ['Responsable/s', 'Responsables', 'Responsable']),
    observaciones: findHeader_(headers, ['Observaciones', 'Observacion']),
    pdf: findHeader_(headers, ['PDF', 'Archivo', 'Link PDF']),
    totalItems: findHeader_(headers, ['Total items', 'Items', 'Total de items']),
    totalNovedades: findHeader_(headers, ['Total novedades', 'Novedades', 'Total de novedades'])
  };

  if (idx.actividad < 0) {
    throw new Error('REGISTROS no tiene encabezado Actividad. Encabezados encontrados: ' + headers.join(' | '));
  }

  return values.slice(1).map(row => ({
    fechaCarga: valueAt_(row, idx.fechaCarga),
    fechaControl: valueAt_(row, idx.fechaControl),
    actividad: valueAt_(row, idx.actividad),
    responsables: valueAt_(row, idx.responsables),
    observaciones: valueAt_(row, idx.observaciones),
    pdf: valueAt_(row, idx.pdf),
    totalItems: valueAt_(row, idx.totalItems),
    totalNovedades: valueAt_(row, idx.totalNovedades)
  })).filter(row => row.actividad);
}

function findHeader_(headers, names) {
  const normalized = headers.map(normalizeHeader_);
  for (let i = 0; i < names.length; i += 1) {
    const idx = normalized.indexOf(normalizeHeader_(names[i]));
    if (idx >= 0) return idx;
  }
  return -1;
}

function valueAt_(row, idx) {
  return idx >= 0 ? row[idx] : '';
}

function splitResponsables_(value) {
  return String(value || '')
    .split(/[,;\n]+/)
    .map(name => name.trim())
    .filter(Boolean);
}

function parseRegistroDate_(value) {
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

function dateForClient_(value, tz) {
  const date = parseRegistroDate_(value);
  if (!date) return '';
  return Utilities.formatDate(date, tz, "yyyy-MM-dd'T'HH:mm:ss");
}

function normalizeHeader_(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}
