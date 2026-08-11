/*************** SBVP - CONTROL DE CHOFERES ***************/
const SPREADSHEET_ID = '1liMVXb48E4O271C0xxv_4pT_N00xdr2xNrX61A221Jg';
const ROOT_FOLDER_ID = '1JTrRwKdj86zQ7N0IvZOofb6jKPHhHb9f';
const INSTITUTION = 'Sociedad Bomberos Voluntarios Pergamino';
const LOGO_PUBLIC_URL = 'https://bomberospergamino.github.io/choferes/logo-sbvp.png';

const SHEET_AGENDA = 'AGENDA';
const SHEET_PREGUNTAS = 'PREGUNTAS_MOVILES';
const SHEET_NOVEDADES_ORIGEN = 'NOVEDADES';
const SHEET_REGISTROS = 'REGISTROS_CHECKS';
const SHEET_REPORTES = 'REGISTROS_REPORTES';
const SHEET_NOVEDADES = 'NOVEDADES_CHOFERES';
const SHEET_CHOFERES = 'CHOFERES';

const VEHICLES = ['MOVIL 3', 'MOVIL 5', 'MOVIL 6', 'MOVIL 7', 'MOVIL 8', 'MOVIL 9', 'MOVIL 11', 'MOVIL 12', 'MOVIL 19', 'MOVIL 24', 'MOVIL 26', 'MOVIL 27'];
const MONDAY_CHECKS = ['MOVIL 12', 'MOVIL 19', 'MOVIL 24', 'MOVIL 27', 'MOVIL 3'];
const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const SECTION_ORDER = ['CABINA', 'BOMBA', 'LUCES', 'NEUMATICOS', 'FLUIDOS', 'FLUIDOS Y NEUMATICOS', 'OBSERVACIONES'];

const MOBILE_QUESTIONS_BY_VEHICLE = {
  'MOVIL 3': [
    ...q('CABINA', ['Estado e higiene', 'Instrumentos y VHF', 'Sirena', 'Limpia parabrisas', 'Bocinas', 'Puertas', 'Parabrisas', 'Ventanillas', 'Espejos laterales', 'Asiento conductor', 'Asiento acompanante', 'Persianas']),
    ...q('LUCES', ['Luces cajoneras', 'Cabina delantera', 'Antiniebla delantera', 'Delantera posicion', 'Delantera baja', 'Delantera alta', 'Delantera giros', 'Delantera baliza', 'Trasera posicion', 'Trasera stop', 'Trasera giros', 'Trasera baliza', 'Reversa', 'Alarma reversa', 'Balizas', 'Luces de escena']),
    ...q('OBSERVACIONES', ['Fuera de servicio'])
  ],
  'MOVIL 5': [
    ...q('CABINA', ['Estado e higiene', 'Lunetas', 'Limpia parabrisas', 'Sirena', 'Bocina', 'Porton trasero', 'Puertas', 'Parabrisas', 'Ventanillas', 'Espejo retrovisor', 'Espejos laterales', 'Asiento conductor', 'Asiento acompanante', 'Asientos traseros']),
    ...q('LUCES', ['Instrumentos', 'Cabina delantera', 'Cabina trasera', 'Delantera posicion', 'Delantera baja', 'Delantera alta', 'Delantera giros', 'Delantera baliza', 'Trasera posicion', 'Trasera stop', 'Trasera giros', 'Trasera baliza', 'Reversa', 'Alarma reversa', 'Balizas'])
  ],
  'MOVIL 6': [
    ...q('CABINA', ['Estado e higiene', 'Instrumentos y VHF', 'Sirena', 'Limpia parabrisas', 'Bocinas', 'Puertas', 'Parabrisas', 'Ventanillas', 'Espejos laterales', 'Asiento conductor', 'Asiento acompanante', 'Persianas']),
    ...q('BOMBA', ['Motobomba']),
    ...q('LUCES', ['Luces cajoneras', 'Cabina delantera', 'Antiniebla delantera', 'Delantera posicion', 'Delantera baja', 'Delantera alta', 'Delantera giros', 'Delantera baliza', 'Trasera posicion', 'Trasera stop', 'Trasera giros', 'Trasera baliza', 'Reversa', 'Alarma reversa', 'Balizas'])
  ],
  'MOVIL 8': [
    ...q('CABINA', ['Estado e higiene', 'Instrumentos y VHF', 'Sirena', 'Limpia parabrisas', 'Bocinas', 'Puertas', 'Parabrisas', 'Ventanillas', 'Espejos laterales', 'Asiento conductor', 'Asiento acompanante', 'Asiento trasero']),
    ...q('BOMBA', ['Acople a bomba de cabina', 'Bomba']),
    ...q('LUCES', ['Cabina delantera', 'Cabina trasera', 'Delantera posicion', 'Delantera baja', 'Delantera alta', 'Delantera giros', 'Delantera baliza', 'Reflectores delanteros', 'Trasera posicion', 'Trasera stop', 'Trasera giros', 'Trasera baliza', 'Reversa', 'Alarma reversa', 'Balizas']),
    ...q('OBSERVACIONES', ['Fuera de servicio'])
  ],
  'MOVIL 11': [
    ...q('CABINA', ['Estado e higiene', 'Instrumentos y VHF', 'Sirena', 'Bocina', 'Limpia parabrisas', 'Puertas', 'Parabrisas', 'Ventanillas', 'Espejos laterales', 'Asiento conductor', 'Asiento acompanante', 'Asiento trasero', 'Persianas']),
    ...q('BOMBA', ['Acople a bomba de cabina', 'Bomba']),
    ...q('LUCES', ['Luces cajoneras', 'Cabina delantera', 'Cabina trasera', 'Delantera posicion', 'Delantera baja', 'Delantera alta', 'Delantera giros', 'Delantera baliza', 'Reflectores superiores frontales', 'Reflectores superiores laterales', 'Trasera posicion', 'Trasera stop', 'Reversa', 'Alarma reversa', 'Trasera giros', 'Trasera baliza', 'Balizas'])
  ],
  'MOVIL 12': [
    ...q('CABINA', ['Estado e higiene', 'Instrumentos y VHF', 'Sirena conductor', 'Sirena acompanante', 'Siren brake conductor', 'Siren brake acompanante', 'Pantalla de reversa', 'Bocina volante', 'Bocina pedal conductor', 'Bocina pedal acompanante', 'Limpia parabrisas', 'Puertas', 'Parabrisas', 'Ventanillas', 'Espejos laterales', 'Asiento conductor', 'Asiento acompanante', 'Asiento trasero', 'Persianas']),
    ...q('BOMBA', ['Acople a bomba de cabina', 'Bomba', 'Generador']),
    ...q('LUCES', ['Luces cajoneras', 'Cabina delantera', 'Cabina trasera', 'Delantera posicion', 'Delantera baja', 'Delantera alta', 'Delantera giros', 'Delantera baliza', 'Reflectores superiores', 'Reflectores laterales', 'Trasera posicion', 'Trasera stop', 'Reversa', 'Alarma reversa', 'Trasera giros', 'Trasera baliza', 'Balizas'])
  ],
  'MOVIL 19': [
    ...q('CABINA', ['Estado e higiene', 'Instrumentos y VHF', 'Limpia parabrisas', 'Sirena aire', 'Bocina', 'Puertas', 'Parabrisas', 'Ventanillas', 'Espejos laterales', 'Asiento conductor', 'Asiento acompanante', 'Asiento trasero']),
    ...q('BOMBA', ['Motobomba']),
    ...q('LUCES', ['Reflectores led delanteros', 'Luz bomba y equipamiento', 'Luz cabina', 'Delantera posicion', 'Delantera baja', 'Delantera alta', 'Delantera giros', 'Delantera baliza', 'Reflectores superiores traseros', 'Trasera posicion', 'Trasera stop', 'Trasera giros', 'Trasera baliza', 'Reversa', 'Alarma de reversa', 'Balizas'])
  ],
  'MOVIL 24': [
    ...q('CABINA', ['Estado e higiene', 'Instrumentos y VHF', 'Limpia parabrisas', 'Sirena aire', 'Bocina', 'Puertas', 'Parabrisas', 'Ventanillas', 'Espejos laterales', 'Asiento conductor', 'Asiento acompanante', 'Asiento trasero', 'Persianas laterales y trasera']),
    ...q('BOMBA', ['Bomba', 'Acople a bomba desde cabina', 'Acople a bomba desde atras']),
    ...q('LUCES', ['Luces cajoneras', 'Antiniebla delantero', 'Antiniebla trasera', 'Cabina delantera', 'Cabina trasera', 'Delantera posicion', 'Delantera baja', 'Delantera alta', 'Delantera giros', 'Delantera baliza', 'Trasera posicion', 'Trasera stop', 'Trasera giros', 'Trasera baliza', 'Reversa', 'Alarma de reversa', 'Balizas'])
  ],
  'MOVIL 27': [
    ...q('CABINA', ['Estado e higiene', 'Instrumentos y VHF', 'Limpia parabrisas', 'Sirena aire', 'Bocina', 'Puertas', 'Parabrisas', 'Ventanillas', 'Espejos laterales', 'Asiento conductor', 'Asiento acompanante', 'Asiento trasero', 'Persianas laterales y trasera']),
    ...q('BOMBA', ['Bomba', 'Acople a bomba desde cabina', 'Acople a bomba desde atras']),
    ...q('LUCES', ['Luces cajoneras', 'Antiniebla delantero', 'Antiniebla trasera', 'Cabina delantera', 'Cabina trasera', 'Delantera posicion', 'Delantera baja', 'Delantera alta', 'Delantera giros', 'Delantera baliza', 'Trasera posicion', 'Trasera stop', 'Trasera giros', 'Trasera baliza', 'Reversa', 'Alarma de reversa', 'Balizas'])
  ]
};

const FALLBACK_MOBILE_QUESTIONS = [
  ...q('CABINA', ['Estado e higiene', 'Instrumentos y VHF', 'Limpia parabrisas', 'Sirena', 'Bocina', 'Puertas', 'Parabrisas', 'Ventanillas', 'Espejos laterales', 'Asiento conductor', 'Asiento acompanante', 'Asiento trasero', 'Persianas']),
  ...q('BOMBA', ['Bomba / motobomba']),
  ...q('LUCES', ['Luces cajoneras', 'Cabina delantera', 'Cabina trasera', 'Delantera posicion', 'Delantera baja', 'Delantera alta', 'Delantera giros', 'Delantera baliza', 'Trasera posicion', 'Trasera stop', 'Trasera giros', 'Trasera baliza', 'Reversa', 'Alarma de reversa', 'Balizas'])
];

const FLUID_QUESTIONS = [
  ...q('NEUMATICOS', ['Presion cubiertas delanteras', 'Presion cubiertas traseras', 'Estado cubiertas delanteras', 'Estado cubiertas traseras']),
  ...q('FLUIDOS', ['Aceite de motor', 'Agua / refrigerante', 'Liquido de frenos', 'Combustible', 'Sapito']),
  ...q('OBSERVACIONES', ['Fuera de servicio'])
];

function setupWorkbook() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  setupAgenda_(ss);
  setupPreguntas_(ss);
  setupNovedadesOrigen_(ss);
  setupRegistroSheets_(ss);
  setupChoferes_(ss);
  setupDriveFolders_();
  return 'Listo: estructura creada para Control de Choferes.';
}

function setupDriveFolders() {
  setupDriveFolders_();
  return 'Listo: carpetas de moviles creadas en la carpeta de Drive configurada.';
}

function doGet(e) {
  try {
    const action = String((e.parameter || {}).action || '').trim();
    if (action === 'config') return jsonResponse({ ok: true, config: getConfig_() });
    if (action === 'history') return jsonResponse({ ok: true, items: getHistory_() });
    return jsonResponse({ ok: true, message: 'Control de Choferes activo' });
  } catch (err) {
    return jsonResponse({ ok: false, message: err.message });
  }
}

function doPost(e) {
  try {
    const body = JSON.parse((e.postData && e.postData.contents) || '{}');
    const payload = body.payload || {};
    if (body.action === 'saveChecks') return jsonResponse({ ok: true, ...saveChecks_(payload) });
    if (body.action === 'saveReport') return jsonResponse({ ok: true, ...saveReport_(payload) });
    throw new Error('Accion no valida');
  } catch (err) {
    return jsonResponse({ ok: false, message: err.message });
  }
}

function getConfig_() {
  setupWorkbook();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return {
    vehicles: VEHICLES,
    agenda: readAgenda_(ss),
    questions: readQuestions_(ss),
    fluidQuestions: readFluidQuestions_(ss),
    novedades: readNovedadesOrigen_(ss),
    choferes: readChoferes_(ss),
    lastChecks: readLastChecks_(ss)
  };
}

function setupAgenda_(ss) {
  const sh = getOrCreateSheet_(ss, SHEET_AGENDA);
  if (sh.getLastRow() > 0) return;
  sh.appendRow(['Dia', 'Movil', 'Control movil', 'Control fluidos']);
  const rows = [];
  MONDAY_CHECKS.forEach(vehicle => rows.push(['Lunes', vehicle, 'SI', vehicle === 'MOVIL 3' ? 'SI' : '']));
  DAYS.forEach(day => {
    if (day === 'Lunes') return;
    VEHICLES.forEach(vehicle => rows.push([day, vehicle, '', '']));
  });
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
}

function setupPreguntas_(ss) {
  const sh = getOrCreateSheet_(ss, SHEET_PREGUNTAS);
  if (sh.getLastRow() > 0) return;
  sh.appendRow(['Tipo', 'Movil', 'Seccion', 'Orden', 'Pregunta']);
  const rows = [];
  VEHICLES.forEach(vehicle => {
    const questions = MOBILE_QUESTIONS_BY_VEHICLE[vehicle] || FALLBACK_MOBILE_QUESTIONS;
    questions.forEach((item, index) => rows.push(['MOVIL', vehicle, item.section, index + 1, item.question]));
  });
  FLUID_QUESTIONS.forEach((item, index) => rows.push(['FLUIDOS', 'TODOS', item.section, index + 1, item.question]));
  sh.getRange(2, 1, rows.length, rows[0].length).setValues(rows);
  sh.setFrozenRows(1);
}

function setupNovedadesOrigen_(ss) {
  const sh = getOrCreateSheet_(ss, SHEET_NOVEDADES_ORIGEN);
  if (sh.getLastRow() > 0) return;
  sh.getRange(1, 1, 1, VEHICLES.length).setValues([VEHICLES]);
  sh.setFrozenRows(1);
}

function setupRegistroSheets_(ss) {
  ensureHeaders_(getOrCreateSheet_(ss, SHEET_REGISTROS), [
    'Fecha carga', 'Fecha control', 'Dia', 'Chofer carga', 'Movil', 'Tipo',
    'Kilometros', 'Botiquin', 'Chofer', 'Elemento', 'Condicion', 'Observacion',
    'Completado', 'PDF check'
  ]);
  ensureHeaders_(getOrCreateSheet_(ss, SHEET_REPORTES), [
    'Fecha carga', 'Fecha control', 'Dia', 'Chofer', 'Moviles', 'Fluidos', 'PDF novedades'
  ]);
  ensureHeaders_(getOrCreateSheet_(ss, SHEET_NOVEDADES), [
    'Fecha carga', 'Fecha control', 'Dia', 'Chofer', 'Movil', 'Tipo',
    'Elemento', 'Condicion', 'Observacion', 'PDF'
  ]);
}

function setupChoferes_(ss) {
  const sh = getOrCreateSheet_(ss, SHEET_CHOFERES);
  if (sh.getLastRow() > 0) return;
  sh.appendRow(['Chofer']);
  sh.setFrozenRows(1);
}

function readAgenda_(ss) {
  const values = ss.getSheetByName(SHEET_AGENDA).getDataRange().getDisplayValues();
  const agenda = {};
  DAYS.forEach(day => agenda[day] = { mobileChecks: [], fluids: [] });
  values.slice(1).forEach(row => {
    const day = normalizeDay_(row[0]);
    const vehicle = normalizeVehicle_(row[1]);
    if (!day || !vehicle) return;
    if (isYes_(row[2])) agenda[day].mobileChecks.push(vehicle);
    if (isYes_(row[3])) agenda[day].fluids.push(vehicle);
  });
  DAYS.forEach(day => {
    agenda[day].mobileChecks = unique_(agenda[day].mobileChecks);
    agenda[day].fluids = unique_(agenda[day].fluids);
  });
  return agenda;
}

function readQuestions_(ss) {
  const values = ss.getSheetByName(SHEET_PREGUNTAS).getDataRange().getDisplayValues();
  const questions = {};
  VEHICLES.forEach(vehicle => questions[vehicle] = []);
  values.slice(1).forEach(row => {
    if (normalizeText_(row[0]) !== 'movil') return;
    const vehicle = normalizeVehicle_(row[1]);
    const hasSectionColumn = values[0].length >= 5;
    const section = hasSectionColumn ? String(row[2] || '').trim() : 'Control general';
    const order = hasSectionColumn ? Number(row[3]) || 9999 : Number(row[2]) || 9999;
    const question = String((hasSectionColumn ? row[4] : row[3]) || '').trim();
    if (!vehicle || !question) return;
    questions[vehicle].push({ order, section: section || 'Control general', question });
  });
  VEHICLES.forEach(vehicle => {
    questions[vehicle] = questions[vehicle].sort((a, b) => a.order - b.order).map(item => ({ section: item.section, question: item.question }));
    if (!questions[vehicle].length) questions[vehicle] = MOBILE_QUESTIONS_BY_VEHICLE[vehicle] || FALLBACK_MOBILE_QUESTIONS;
  });
  return questions;
}

function readFluidQuestions_(ss) {
  const values = ss.getSheetByName(SHEET_PREGUNTAS).getDataRange().getDisplayValues();
  const hasSectionColumn = values[0].length >= 5;
  const rows = values.slice(1)
    .filter(row => normalizeText_(row[0]) === 'fluidos')
    .map(row => ({
      section: hasSectionColumn ? String(row[2] || '').trim() : 'FLUIDOS',
      order: hasSectionColumn ? Number(row[3]) || 9999 : Number(row[2]) || 9999,
      question: String((hasSectionColumn ? row[4] : row[3]) || '').trim()
    }))
    .filter(item => item.question)
    .sort((a, b) => a.order - b.order)
    .map(item => ({ section: item.section || 'FLUIDOS', question: item.question }));
  return rows.length ? rows : FLUID_QUESTIONS.slice();
}

function readNovedadesOrigen_(ss) {
  const sh = ss.getSheetByName(SHEET_NOVEDADES_ORIGEN);
  if (!sh || sh.getLastRow() < 1) return {};
  const values = sh.getDataRange().getDisplayValues();
  const headers = values[0].map(normalizeVehicle_);
  const result = {};
  VEHICLES.forEach(vehicle => result[vehicle] = []);
  values.slice(1).forEach(row => {
    row.forEach((value, index) => {
      const vehicle = headers[index];
      const text = String(value || '').trim();
      if (vehicle && text) result[vehicle].push(text);
    });
  });
  return result;
}

function readChoferes_(ss) {
  const sh = ss.getSheetByName(SHEET_CHOFERES);
  if (!sh || sh.getLastRow() < 2) return [];
  return sh.getRange(2, 1, sh.getLastRow() - 1, 1).getDisplayValues()
    .map(row => String(row[0] || '').trim())
    .filter(Boolean);
}

function readLastChecks_(ss) {
  const result = {};
  VEHICLES.forEach(vehicle => {
    result[vehicle] = {
      km: '',
      botiquin: '',
      chofer: '',
      mobile: { answers: {}, notes: {}, savedAt: '', pdfUrl: '' },
      fluids: { answers: {}, notes: {}, savedAt: '', pdfUrl: '' }
    };
  });

  const sh = ss.getSheetByName(SHEET_REGISTROS);
  if (!sh || sh.getLastRow() < 2) return result;

  const values = sh.getDataRange().getDisplayValues();
  const headers = values[0];
  const idx = {
    loadedAt: headerIndex_(headers, ['Fecha carga']),
    driverLoad: headerIndex_(headers, ['Chofer carga', 'Responsable']),
    vehicle: headerIndex_(headers, ['Movil']),
    type: headerIndex_(headers, ['Tipo']),
    km: headerIndex_(headers, ['Kilometros']),
    botiquin: headerIndex_(headers, ['Botiquin']),
    driver: headerIndex_(headers, ['Chofer']),
    item: headerIndex_(headers, ['Elemento', 'Pregunta']),
    condition: headerIndex_(headers, ['Condicion', 'Estado']),
    note: headerIndex_(headers, ['Observacion']),
    pdf: headerIndex_(headers, ['PDF check', 'PDF'])
  };

  for (let i = values.length - 1; i >= 1; i--) {
    const row = values[i];
    const vehicle = normalizeVehicle_(row[idx.vehicle]);
    if (!vehicle) continue;
    const type = normalizeText_(row[idx.type]).indexOf('fluidos') >= 0 ? 'fluids' : normalizeText_(row[idx.type]).indexOf('movil') >= 0 ? 'mobile' : '';
    if (!type) continue;

    const target = result[vehicle];
    const group = target[type];
    const batchKey = `${row[idx.loadedAt] || ''}|${row[idx.pdf] || ''}|${type}`;
    if (!group.batchKey) {
      group.batchKey = batchKey;
      group.savedAt = row[idx.loadedAt] || '';
      group.pdfUrl = row[idx.pdf] || '';
      if (!target.km) target.km = row[idx.km] || '';
      if (!target.botiquin) target.botiquin = row[idx.botiquin] || '';
      if (!target.chofer) target.chofer = row[idx.driver] || row[idx.driverLoad] || '';
    }
    if (group.batchKey !== batchKey) continue;

    const item = String(row[idx.item] || '').trim();
    if (!item) continue;
    group.answers[item] = row[idx.condition] || 'Bien';
    group.notes[item] = row[idx.note] || '';
  }

  VEHICLES.forEach(vehicle => {
    delete result[vehicle].mobile.batchKey;
    delete result[vehicle].fluids.batchKey;
  });
  return result;
}

function saveChecks_(payload) {
  if (!payload.date || !payload.day) throw new Error('Faltan fecha o dia');
  setupWorkbook();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const now = new Date();
  const pdfByVehicle = {};
  const registroRows = [];
  const novedadesRows = [];

  (payload.vehicles || []).forEach(vehicle => {
    const record = (payload.records && payload.records[vehicle]) || {};
    if (!shouldSaveRecord_(payload, record, vehicle)) return;
    const file = saveMobileCheckPdf_(payload, vehicle, record, now);
    pdfByVehicle[vehicle] = file.getUrl();
    appendRegistroRowsForVehicle_(registroRows, now, payload, vehicle, record, file.getUrl());
    appendNovedadesRowsForVehicle_(novedadesRows, now, payload, vehicle, record, file.getUrl());
  });

  if (registroRows.length) {
    const sh = ss.getSheetByName(SHEET_REGISTROS);
    sh.getRange(sh.getLastRow() + 1, 1, registroRows.length, registroRows[0].length).setValues(registroRows);
  }
  if (novedadesRows.length) {
    const sh = ss.getSheetByName(SHEET_NOVEDADES);
    sh.getRange(sh.getLastRow() + 1, 1, novedadesRows.length, novedadesRows[0].length).setValues(novedadesRows);
  }

  return { savedRows: registroRows.length, pdfByVehicle };
}

function saveReport_(payload) {
  const checksResult = saveChecks_(payload);
  const now = new Date();
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const folder = getOrCreateFolder_(root, 'NOVEDADES');
  const filename = buildReportFilename_(payload, now);
  const file = folder.createFile(buildNovedadesPdf_(payload, now).setName(filename));

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  ss.getSheetByName(SHEET_REPORTES).appendRow([
    now,
    payload.date || '',
    payload.day || '',
    payload.responsible || '',
    (payload.vehicles || []).join(', '),
    (payload.fluids || []).join(', '),
    file.getUrl()
  ]);

  return { pdfUrl: file.getUrl(), filename, pdfByVehicle: checksResult.pdfByVehicle || {} };
}

function saveMobileCheckPdf_(payload, vehicle, record, now) {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  const vehicleFolder = getOrCreateFolder_(root, vehicle);
  const filename = buildMobileFilename_(payload, vehicle, now, record);
  return vehicleFolder.createFile(buildMobileCheckPdf_(payload, vehicle, record, now).setName(filename));
}

function appendRegistroRowsForVehicle_(rows, now, payload, vehicle, record, pdfUrl) {
  const includeMobile = shouldIncludeMobile_(payload, record);
  const includeFluids = shouldIncludeFluids_(payload, record, vehicle);
  const mobileQuestions = (payload.questions && payload.questions[vehicle]) || MOBILE_QUESTIONS_BY_VEHICLE[vehicle] || FALLBACK_MOBILE_QUESTIONS;
  const fluidQuestions = includeFluids
    ? (payload.fluidQuestions || FLUID_QUESTIONS)
    : [];
  if (includeMobile) appendQuestionRows_(rows, now, payload, vehicle, record, 'MOVIL', mobileQuestions, record.answers && record.answers.mobile, record.notes && record.notes.mobile, pdfUrl);
  appendQuestionRows_(rows, now, payload, vehicle, record, 'FLUIDOS', fluidQuestions, record.answers && record.answers.fluids, record.notes && record.notes.fluids, pdfUrl);
}

function appendNovedadesRowsForVehicle_(rows, now, payload, vehicle, record, pdfUrl) {
  if (shouldIncludeMobile_(payload, record)) collectNoveltyRows_(rows, now, payload, vehicle, 'MOVIL', record.answers && record.answers.mobile, record.notes && record.notes.mobile, pdfUrl);
  if (shouldIncludeFluids_(payload, record, vehicle)) collectNoveltyRows_(rows, now, payload, vehicle, 'FLUIDOS', record.answers && record.answers.fluids, record.notes && record.notes.fluids, pdfUrl);
  if (record.observaciones) rows.push([now, payload.date || '', payload.day || '', payload.responsible || '', vehicle, 'GENERAL', 'Observaciones generales', '', record.observaciones, pdfUrl]);
}

function appendQuestionRows_(rows, now, payload, vehicle, record, type, questions, answers, notes, pdfUrl) {
  normalizeQuestionItems_(questions).forEach(item => {
    const question = item.question;
    rows.push([
      now, payload.date || '', payload.day || '', payload.responsible || '', vehicle, type,
      record.km || '', record.botiquin || '', record.chofer || '', question,
      (answers && answers[question]) || 'Bien',
      (notes && notes[question]) || '',
      record.completed ? 'SI' : '',
      pdfUrl
    ]);
  });
}

function appendNovedadesDetectadas_(ss, payload, now, pdfUrl) {
  const rows = [];
  Object.keys(payload.records || {}).forEach(vehicle => {
    const record = payload.records[vehicle] || {};
    collectNoveltyRows_(rows, now, payload, vehicle, 'MOVIL', record.answers && record.answers.mobile, record.notes && record.notes.mobile, pdfUrl);
    collectNoveltyRows_(rows, now, payload, vehicle, 'FLUIDOS', record.answers && record.answers.fluids, record.notes && record.notes.fluids, pdfUrl);
    if (record.observaciones) rows.push([now, payload.date || '', payload.day || '', payload.responsible || '', vehicle, 'GENERAL', 'Observaciones generales', '', record.observaciones, pdfUrl]);
  });
  if (rows.length) {
    const sh = ss.getSheetByName(SHEET_NOVEDADES);
    sh.getRange(sh.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
  }
}

function collectNoveltyRows_(rows, now, payload, vehicle, type, answers, notes, pdfUrl) {
  Object.keys(answers || {}).forEach(question => {
    const state = answers[question] || '';
    const note = (notes && notes[question]) || '';
    if (state === 'Regular' || state === 'Mal' || note) rows.push([now, payload.date || '', payload.day || '', payload.responsible || '', vehicle, type, question, state, note, pdfUrl]);
  });
}

function shouldSaveRecord_(payload, record, vehicle) {
  const checkType = payload.checkType || 'day';
  const flags = completionFlags_(record);
  if (checkType === 'check-fluidos') return flags.fluids || Boolean(record.completed);
  if (checkType === 'check-movil') return flags.mobile || Boolean(record.completed);
  if (checkType === 'botiquines') return false;
  return Boolean(record.completed || flags.mobile || flags.fluids);
}

function shouldIncludeMobile_(payload, record) {
  const checkType = payload.checkType || 'day';
  const flags = completionFlags_(record);
  if (checkType === 'check-fluidos' || checkType === 'botiquines') return false;
  if (checkType === 'check-movil') return true;
  return flags.hasTyped ? flags.mobile : Boolean(record.completed);
}

function shouldIncludeFluids_(payload, record, vehicle) {
  const checkType = payload.checkType || 'day';
  const flags = completionFlags_(record);
  const scheduled = (payload.fluids || []).indexOf(vehicle) >= 0;
  if (checkType === 'check-fluidos') return true;
  if (checkType === 'check-movil' || checkType === 'botiquines' || !scheduled) return false;
  return flags.hasTyped ? flags.fluids : Boolean(record.completed);
}

function completionFlags_(record) {
  const completedChecks = record.completedChecks || {};
  const mobile = Boolean(completedChecks.mobile);
  const fluids = Boolean(completedChecks.fluids);
  return { mobile, fluids, hasTyped: mobile || fluids };
}

function buildMobileCheckPdf_(payload, vehicle, record, now) {
  const checkType = payload.checkType || 'day';
  const includeMobile = shouldIncludeMobile_(payload, record);
  const includeFluids = shouldIncludeFluids_(payload, record, vehicle);
  const mobileQuestions = (payload.questions && payload.questions[vehicle]) || MOBILE_QUESTIONS_BY_VEHICLE[vehicle] || FALLBACK_MOBILE_QUESTIONS;
  const fluidQuestions = includeFluids ? (payload.fluidQuestions || FLUID_QUESTIONS) : [];
  const sectionsHtml = (includeMobile ? buildPdfQuestionSections_(mobileQuestions, 'MOVIL', record.answers && record.answers.mobile, record.notes && record.notes.mobile) : '')
    + buildPdfQuestionSections_(fluidQuestions, 'FLUIDOS Y NEUMATICOS', record.answers && record.answers.fluids, record.notes && record.notes.fluids);
  const title = checkType === 'check-fluidos' || (!includeMobile && includeFluids) ? 'Control de fluidos y neumaticos' : 'Check de movil';
  const generatedText = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');

  const html = `
  <html><head><style>
    @page{size:A4 portrait;margin:8mm}
    body{font-family:Arial,sans-serif;color:#18202a;margin:0;background:#fff}
    .top{display:grid;grid-template-columns:70px 1fr 150px;align-items:center;gap:12px;border-bottom:5px solid #b51f2d;padding-bottom:8px;margin-bottom:10px}
    .top img{width:62px;height:62px;object-fit:contain}
    .kicker{color:#b51f2d;font-size:10px;font-weight:bold;text-transform:uppercase;letter-spacing:.4px;margin-bottom:3px}
    h1{font-size:18px;text-transform:uppercase;margin:0;color:#151a22}
    .generated{text-align:right;font-size:10px;color:#596579;font-weight:bold;align-self:start;padding-top:3px}
    .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;margin-bottom:10px;font-size:10px}
    .meta div{border:1px solid #ccd5df;border-left:4px solid #b51f2d;border-radius:4px;padding:6px;background:#f8fafc}
    .section-title{background:#151a22;color:white;font-weight:bold;padding:7px 8px;margin-top:10px;font-size:11px;text-transform:uppercase;border-radius:4px 4px 0 0}
    table{width:100%;border-collapse:collapse;font-size:9px;margin-bottom:8px}
    th,td{border:1px solid #ccd5df;padding:4px;vertical-align:top}
    th{background:#f4c542;color:#151a22;text-align:left}
    tr:nth-child(even) td{background:#f8fafc}
  </style></head><body>
    <div class="top">
      ${getLogoHtml_()}
      <div><div class="kicker">${esc(INSTITUTION)}</div><h1>${esc(title)} - ${esc(vehicle)}</h1></div>
      <div class="generated">Generado<br>${esc(generatedText)}</div>
    </div>
    <div class="meta">
      <div><b>Fecha:</b> ${esc(payload.dateText || payload.date || '')}</div>
      <div><b>Chofer:</b> ${esc(payload.responsible || '')}</div>
      <div><b>Kilometros:</b> ${esc(record.km || '')}</div>
      <div><b>Botiquin:</b> ${esc(record.botiquin || '')}</div>
    </div>
    ${sectionsHtml}
  </body></html>`;
  return HtmlService.createHtmlOutput(html).getBlob().getAs(MimeType.PDF);
}

function buildPdfQuestionSections_(questions, type, answers, notes) {
  return groupQuestionItems_(questions).map(group => {
    const rows = group.items.map(item => {
      const question = item.question;
      return `<tr><td>${esc(question)}</td><td>${esc((answers && answers[question]) || 'Bien')}</td><td>${esc((notes && notes[question]) || '')}</td></tr>`;
    }).join('');
    return `<div class="section-title">${esc(type)} - ${esc(group.section)}</div><table><thead><tr><th>Elemento</th><th>Condicion</th><th>Observacion</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join('');
}

function buildNovedadesPdf_(payload, now) {
  const vehicles = payload.vehicles || [];
  const allVehicles = payload.allVehicles || VEHICLES;
  const noveltyRows = payload.noveltyRows || [];
  const generatedText = Utilities.formatDate(now, Session.getScriptTimeZone(), 'dd/MM/yyyy HH:mm');
  const novRows = noveltyRows.length ? noveltyRows : [{}];
  const novedadesHtml = novRows.map(row => '<tr>' + vehicles.map(vehicle => `<td>${esc(row[vehicle] || '')}</td>`).join('') + '</tr>').join('');
  const kmRows = allVehicles.map(vehicle => {
    const record = (payload.records && payload.records[vehicle]) || {};
    return `<tr><td>${esc(vehicle)}</td><td>${esc(record.km || '')}</td><td>${esc(record.botiquin || '')}</td></tr>`;
  }).join('');

  const html = `
  <html><head><style>
    @page{size:A4 landscape;margin:7mm}
    body{font-family:Arial,sans-serif;color:#18202a;margin:0}
    .title{display:grid;grid-template-columns:64px 1fr 145px;align-items:center;gap:10px;border-bottom:4px solid #b51f2d;padding-bottom:8px;margin-bottom:10px}
    .title img{width:54px;height:54px;object-fit:contain}
    h1{font-size:18px;text-align:center;text-transform:uppercase;margin:0;color:#151a22}
    .generated{text-align:right;font-size:9px;color:#596579;font-weight:bold;align-self:start;padding-top:3px}
    .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:10px;font-size:10px}
    .meta div{border:1px solid #ccd5df;border-left:4px solid #b51f2d;border-radius:4px;padding:5px;background:#f8fafc}
    table{width:100%;border-collapse:collapse;table-layout:fixed;margin-bottom:10px;font-size:8px}
    th,td{border:1px solid #ccd5df;padding:3px;vertical-align:top;word-break:break-word}
    th{background:#f4c542;text-align:center;color:#151a22}
  </style></head><body>
    <div class="title">${getLogoHtml_()}<h1>Novedades - ${esc(payload.day || '')}</h1><div class="generated">Generado<br>${esc(generatedText)}</div></div>
    <div class="meta">
      <div><b>Institucion:</b> ${esc(INSTITUTION)}</div>
      <div><b>Fecha:</b> ${esc(payload.dateText || payload.date || '')}</div>
      <div><b>Chofer:</b> ${esc(payload.responsible || '')}</div>
      <div><b>Fluidos:</b> ${esc((payload.fluids || []).join(', ') || 'Sin fluidos')}</div>
    </div>
    <table><thead><tr>${vehicles.map(vehicle => `<th>${esc(vehicle)}</th>`).join('')}</tr></thead><tbody>${novedadesHtml}</tbody></table>
    <table><thead><tr><th>Movil</th><th>Kilometros</th><th>Botiquin</th></tr></thead><tbody>${kmRows}</tbody></table>
  </body></html>`;
  return HtmlService.createHtmlOutput(html).getBlob().getAs(MimeType.PDF);
}

function getHistory_() {
  setupWorkbook();
  const sh = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_REPORTES);
  if (!sh || sh.getLastRow() < 2) return [];
  const values = sh.getDataRange().getDisplayValues();
  const headers = values[0];
  return values.slice(1).map(row => {
    const item = {};
    headers.forEach((header, index) => item[header] = row[index]);
    return item;
  }).reverse();
}

function buildMobileFilename_(payload, vehicle, now, record) {
  const stamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm');
  const fluidOnly = payload.checkType === 'check-fluidos' || (record && !shouldIncludeMobile_(payload, record) && shouldIncludeFluids_(payload, record, vehicle));
  const kind = fluidOnly ? 'Fluidos_Neumaticos' : 'Check_Movil';
  return `${vehicle.replace(/\s+/g, '_')}_${kind}_${stamp}.pdf`;
}

function buildReportFilename_(payload, now) {
  const stamp = Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd_HH-mm');
  return `Novedades_${String(payload.day || 'Control')}_${stamp}.pdf`;
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function getOrCreateSheet_(ss, name) {
  return ss.getSheetByName(name) || ss.insertSheet(name);
}

function ensureHeaders_(sheet, headers) {
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    sheet.setFrozenRows(1);
  }
}

function getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function setupDriveFolders_() {
  const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
  VEHICLES.forEach(vehicle => getOrCreateFolder_(root, vehicle));
  getOrCreateFolder_(root, 'NOVEDADES');
}

function getLogoHtml_() {
  try {
    const root = DriveApp.getFolderById(ROOT_FOLDER_ID);
    const files = root.getFilesByName('logo-sbvp.png');
    if (!files.hasNext()) return LOGO_PUBLIC_URL ? `<img src="${esc(LOGO_PUBLIC_URL)}" />` : '<div style="width:54px"></div>';
    const file = files.next();
    const data = Utilities.base64Encode(file.getBlob().getBytes());
    return `<img src="data:${file.getMimeType()};base64,${data}" />`;
  } catch (err) {
    return LOGO_PUBLIC_URL ? `<img src="${esc(LOGO_PUBLIC_URL)}" />` : '<div style="width:54px"></div>';
  }
}

function normalizeDay_(value) {
  const clean = normalizeText_(value);
  const map = { lunes: 'Lunes', martes: 'Martes', miercoles: 'Miercoles', jueves: 'Jueves', viernes: 'Viernes', sabado: 'Sabado', domingo: 'Domingo' };
  return map[clean] || '';
}

function normalizeVehicle_(value) {
  const clean = normalizeText_(value);
  const match = clean.match(/movil\D*(\d+)/);
  if (!match) return '';
  const vehicle = `MOVIL ${match[1]}`;
  return VEHICLES.indexOf(vehicle) >= 0 ? vehicle : '';
}

function normalizeText_(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
}

function isYes_(value) {
  const clean = normalizeText_(value);
  return clean === 'si' || clean === 'x' || clean === 'true' || clean === '1';
}

function unique_(items) {
  return items.filter((item, index, arr) => arr.indexOf(item) === index);
}

function headerIndex_(headers, names) {
  const normalized = headers.map(header => normalizeText_(header));
  for (let i = 0; i < names.length; i++) {
    const index = normalized.indexOf(normalizeText_(names[i]));
    if (index >= 0) return index;
  }
  return -1;
}

function q(section, questions) {
  return questions.map(question => ({ section, question }));
}

function normalizeQuestionItems_(items) {
  return (items || []).map(item => {
    if (typeof item === 'string') return { section: 'Control general', question: item };
    return {
      section: item.section || item.seccion || 'Control general',
      question: item.question || item.pregunta || ''
    };
  }).filter(item => item.question);
}

function groupQuestionItems_(items) {
  const groups = [];
  normalizeQuestionItems_(items).forEach(item => {
    let group = groups.find(entry => entry.section === item.section);
    if (!group) {
      group = { section: item.section, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });
  return groups.sort((a, b) => sectionRank_(a.section) - sectionRank_(b.section));
}

function sectionRank_(section) {
  const index = SECTION_ORDER.indexOf(section);
  return index >= 0 ? index : SECTION_ORDER.length;
}

function esc(value) {
  return String(value ?? '').replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
}
