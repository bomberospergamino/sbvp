/**
 * Prepara un Google Sheets para el modulo Brigadas.
 * Ejecutar setupBrigadas() desde Apps Script ligado a la planilla.
 * Es idempotente: no borra datos ni duplica filas base.
 */
const BRIGADAS_CONFIG = [
  ['rescate_acuatico', 'Rescate acuatico', 'rescate_acuatico', 'rescateacuatico_logo.jpeg', '#0077B6', 'SI', 1, 1, '', '', ''],
  ['buceo', 'Buceo', 'buceo', 'buceo_logo.jpeg', '#003566', 'SI', 2, 1, '', '', ''],
  ['k9', 'K9', 'k9', 'k9_logo.jpeg', '#D00000', 'SI', 3, 1, '', '', ''],
  ['mat_pel', 'Mat Pel', 'mat_pel', 'matpel_logo.jpeg', '#70E000', 'SI', 4, 1, '', 'General|https://drive.google.com/drive/folders/1Jn3Zg-V2umhoep5QKUiO3SPoiXm3VZUQ?usp=sharing\nIdentificacion|https://drive.google.com/drive/folders/1RLG5BTS_p_zFKUS3ye8ZhytzGvplL_QW?usp=drive_link\nMaterial complementario|https://drive.google.com/drive/folders/17g4oBDcsGCvQXkPuojPtZvTVVnx-7ECp?usp=drive_link', ''],
  ['altura', 'Altura', 'altura', 'altura_logo.jpeg', '#B5179E', 'SI', 5, 1, '', '', ''],
  ['socorrismo', 'Socorrismo', 'socorrismo', 'socorrismo_logo.jpeg', '#E85D04', 'SI', 6, 1, '', '', ''],
  ['brec', 'BREC', 'brec', 'brec_logo.jpeg', '#6C584C', 'SI', 7, 1, '', '', ''],
];

const BRIGADAS_SPREADSHEET_ID = '1ZXYNwSNQjDOsISQLcc0bNGg5qR93j0WyXaY6dvhmXlk';
const REPORTES_DRIVE_FOLDER_ID = '1yzN-2WNhyAch4_9FX0GIv4fCeaGkSKE8';
const UNUSED_BRIGADAS_SHEETS = ['DETALLE_CHECK_EQUIPAMIENTO', 'HISTORIAL_ACCIONES', 'ADMIN_RESUMEN'];
const BRIGADAS_WEBAPP_VERSION = 'brigadas-fila-real-2026-07-12';

const BRIGADAS_SHEETS = {
  CONFIG_BRIGADAS: ['id_brigada', 'nombre_brigada', 'columna_personal', 'logo_file', 'color', 'activa', 'orden', 'frecuencia_minima_mensual', 'responsable', 'bibliografia_url', 'observaciones'],
  PERSONAL: ['id_persona', 'apellido', 'nombre', 'bombero', 'legajo', 'jerarquia', 'activo', 'rescate_acuatico', 'buceo', 'k9', 'mat_pel', 'altura', 'socorrismo', 'brec', 'cantidad_brigadas'],
  ENCUENTROS: ['id_encuentro', 'fecha', 'mes_periodo', 'id_brigada', 'brigada', 'tipo_encuentro', 'tema', 'responsable', 'lugar', 'hora_inicio', 'hora_fin', 'estado', 'observaciones', 'id_asistencia'],
  ASISTENCIAS: ['id_asistencia', 'id_encuentro', 'fecha', 'mes_periodo', 'id_brigada', 'brigada', 'tipo_actividad', 'responsable', 'observaciones_generales', 'creado_por', 'timestamp', 'pdf_url', 'estado_registro'],
  DETALLE_ASISTENCIAS: ['id_asistencia', 'legajo', 'apellido', 'nombre', 'bombero', 'jerarquia', 'estado_asistencia', 'observacion_individual'],
  EQUIPAMIENTO: ['brigada', 'ubicacion', 'elemento', 'unidades', 'cantidad_ok_no', 'estado_bueno_malo', 'observaciones'],
  CHECK_EQUIPAMIENTO: ['id_check', 'fecha', 'mes_periodo', 'brigada', 'ubicacion', 'elemento', 'unidades', 'cantidad_ok_no', 'estado_bueno_malo', 'observaciones', 'responsable', 'pdf_url'],
  NECESIDADES: ['id_necesidad', 'fecha_alta', 'id_brigada', 'brigada', 'tipo_necesidad', 'elemento', 'descripcion', 'cantidad', 'prioridad', 'estado', 'presupuesto_unitario', 'presupuesto_total', 'proveedor', 'link_referencia', 'justificacion_operativa', 'origen', 'id_check_origen', 'responsable', 'fecha_objetivo', 'observaciones'],
  PARAMETROS: ['tipo_parametro', 'valor', 'descripcion', 'activo', 'orden'],
};

const PARAMETROS_BASE = [
  ['estado_encuentro', 'Programado', 'Encuentro planificado', 'SI', 1],
  ['estado_encuentro', 'Realizado', 'Encuentro realizado', 'SI', 2],
  ['estado_encuentro', 'Suspendido', 'Encuentro suspendido', 'SI', 3],
  ['estado_encuentro', 'Reprogramado', 'Encuentro reprogramado', 'SI', 4],
  ['estado_encuentro', 'Pendiente', 'Pendiente de definir', 'SI', 5],
  ['estado_asistencia', 'P', 'Presente', 'SI', 1],
  ['estado_asistencia', 'A', 'Ausente', 'SI', 2],
  ['estado_asistencia', 'Just.', 'Justificado', 'SI', 3],
  ['estado_equipamiento', 'OK', 'Correcto', 'SI', 1],
  ['estado_equipamiento', 'Faltante', 'Elemento faltante', 'SI', 2],
  ['estado_equipamiento', 'Averiado', 'Elemento averiado', 'SI', 3],
  ['estado_equipamiento', 'Vencido', 'Elemento vencido', 'SI', 4],
  ['estado_equipamiento', 'No aplica', 'No aplica', 'SI', 5],
  ['prioridad', 'Alta', 'Prioridad alta', 'SI', 1],
  ['prioridad', 'Media', 'Prioridad media', 'SI', 2],
  ['prioridad', 'Baja', 'Prioridad baja', 'SI', 3],
  ['estado_necesidad', 'Pendiente', 'Necesidad pendiente', 'SI', 1],
  ['estado_necesidad', 'Cotizado', 'Ya tiene cotizacion', 'SI', 2],
  ['estado_necesidad', 'Solicitado', 'Pedido solicitado', 'SI', 3],
  ['estado_necesidad', 'Comprado', 'Comprado', 'SI', 4],
  ['estado_necesidad', 'Recibido', 'Recibido', 'SI', 5],
  ['estado_necesidad', 'Cancelado', 'Cancelado', 'SI', 6],
  ['resultado_check', 'OK', 'Todo correcto', 'SI', 1],
  ['resultado_check', 'Observado', 'Hay observaciones', 'SI', 2],
  ['resultado_check', 'Critico', 'Situacion critica', 'SI', 3],
  ['activo', 'SI', 'Registro activo', 'SI', 1],
  ['activo', 'NO', 'Registro inactivo', 'SI', 2],
];

function setupBrigadasDirecto_() {
  const ss = getBrigadasSpreadsheet_();
  UNUSED_BRIGADAS_SHEETS.forEach((name) => {
    const sheet = ss.getSheetByName(name);
    if (sheet) ss.deleteSheet(sheet);
  });
  Object.keys(BRIGADAS_SHEETS).forEach((name) => ensureSheet_(ss, name, BRIGADAS_SHEETS[name]));
  ensureSheet_(ss, 'EQUIPAMIENTO', BRIGADAS_SHEETS.EQUIPAMIENTO);
  compactSheet_(ss.getSheetByName('CHECK_EQUIPAMIENTO'), BRIGADAS_SHEETS.CHECK_EQUIPAMIENTO);
  upsertRows_(ss.getSheetByName('CONFIG_BRIGADAS'), BRIGADAS_CONFIG, 1);
  upsertRows_(ss.getSheetByName('PARAMETROS'), PARAMETROS_BASE, 2);
  fixConfigBrigadas_(ss.getSheetByName('CONFIG_BRIGADAS'));
  setupPersonalDefaults_(ss.getSheetByName('PERSONAL'));
  Object.keys(BRIGADAS_SHEETS).forEach((name) => formatSheet_(ss.getSheetByName(name)));
  applyValidations_(ss);
  applyFormulas_(ss);
}

function setupBrigadas() {
  return setupBrigadasSeguro();
}

function setupBrigadasSeguro() {
  const pasos = [];
  const ss = getBrigadasSpreadsheet_();
  logSetup_(ss, 'INICIO', 'setupBrigadasSeguro');
  try {
    pasos.push('Borrar hojas sobrantes');
    logSetup_(ss, 'PASO', pasos[pasos.length - 1]);
    UNUSED_BRIGADAS_SHEETS.forEach((name) => {
      const sheet = ss.getSheetByName(name);
      if (sheet) ss.deleteSheet(sheet);
    });
    pasos.push('Crear/verificar hojas');
    logSetup_(ss, 'PASO', pasos[pasos.length - 1]);
    Object.keys(BRIGADAS_SHEETS).forEach((name) => ensureSheet_(ss, name, BRIGADAS_SHEETS[name]));
    pasos.push('Verificar equipamiento');
    logSetup_(ss, 'PASO', pasos[pasos.length - 1]);
    ensureSheet_(ss, 'EQUIPAMIENTO', BRIGADAS_SHEETS.EQUIPAMIENTO);
    pasos.push('Compactar encuentros');
    logSetup_(ss, 'PASO', pasos[pasos.length - 1]);
    compactSheet_(ss.getSheetByName('ENCUENTROS'), BRIGADAS_SHEETS.ENCUENTROS);
    compactSheet_(ss.getSheetByName('CHECK_EQUIPAMIENTO'), BRIGADAS_SHEETS.CHECK_EQUIPAMIENTO);
    pasos.push('Cargar configuracion');
    logSetup_(ss, 'PASO', pasos[pasos.length - 1]);
    upsertRows_(ss.getSheetByName('CONFIG_BRIGADAS'), BRIGADAS_CONFIG, 1);
    upsertRows_(ss.getSheetByName('PARAMETROS'), PARAMETROS_BASE, 2);
    pasos.push('Normalizar personal');
    logSetup_(ss, 'PASO', pasos[pasos.length - 1]);
    fixConfigBrigadas_(ss.getSheetByName('CONFIG_BRIGADAS'));
    setupPersonalDefaults_(ss.getSheetByName('PERSONAL'));
    pasos.push('Formato');
    logSetup_(ss, 'PASO', pasos[pasos.length - 1]);
    Object.keys(BRIGADAS_SHEETS).forEach((name) => formatSheet_(ss.getSheetByName(name)));
    pasos.push('Validaciones');
    logSetup_(ss, 'PASO', pasos[pasos.length - 1]);
    applyValidations_(ss);
    pasos.push('Formulas');
    logSetup_(ss, 'PASO', pasos[pasos.length - 1]);
    applyFormulas_(ss);
    const ok = 'OK: ' + pasos.join(' > ');
    logSetup_(ss, 'OK', ok);
    return ok;
  } catch (error) {
    const detalle = 'ERROR en paso "' + (pasos[pasos.length - 1] || 'inicio') + '": ' + (error && error.message ? error.message : String(error));
    logSetup_(ss, 'ERROR', detalle);
    return detalle;
  }
}

function diagnosticoBrigadas() {
  const ss = getBrigadasSpreadsheet_();
  const info = [
    ['timestamp', new Date()],
    ['spreadsheet_id', ss.getId()],
    ['spreadsheet_name', ss.getName()],
    ['sheets_actuales', ss.getSheets().map((sheet) => sheet.getName()).join(', ')],
    ['usuario', Session.getActiveUser().getEmail() || 'sin_email_visible'],
  ];
  const sheet = getSetupLogSheet_(ss);
  sheet.clear();
  sheet.getRange(1, 1, info.length, 2).setValues(info);
  return 'Diagnostico escrito en SETUP_LOG';
}

function setupBrigadasMinimo() {
  const ss = getBrigadasSpreadsheet_();
  logSetup_(ss, 'INICIO', 'setupBrigadasMinimo');
  try {
    Object.keys(BRIGADAS_SHEETS).forEach((name) => ensureSheet_(ss, name, BRIGADAS_SHEETS[name]));
    upsertRows_(ss.getSheetByName('CONFIG_BRIGADAS'), BRIGADAS_CONFIG, 1);
    upsertRows_(ss.getSheetByName('PARAMETROS'), PARAMETROS_BASE, 2);
    logSetup_(ss, 'OK', 'setupBrigadasMinimo');
    return 'OK setupBrigadasMinimo';
  } catch (error) {
    const detalle = error && error.message ? error.message : String(error);
    logSetup_(ss, 'ERROR', detalle);
    return detalle;
  }
}

function borrarHojasSobrantesBrigadas() {
  const ss = getBrigadasSpreadsheet_();
  UNUSED_BRIGADAS_SHEETS.forEach((name) => {
    const sheet = ss.getSheetByName(name);
    if (sheet) ss.deleteSheet(sheet);
  });
  logSetup_(ss, 'OK', 'Hojas sobrantes borradas');
  return 'OK hojas sobrantes borradas';
}

function getSetupLogSheet_(ss) {
  const sheet = ss.getSheetByName('SETUP_LOG') || ss.insertSheet('SETUP_LOG');
  if (sheet.getLastRow() === 0) sheet.appendRow(['fecha_hora', 'nivel', 'detalle']);
  return sheet;
}

function logSetup_(ss, level, detail) {
  const sheet = getSetupLogSheet_(ss);
  sheet.appendRow([new Date(), level, detail]);
}

function doGet(e) {
  try {
    const action = e && e.parameter && e.parameter.action;
    if (action === 'health') {
      return webResponse_(e, {
        ok: true,
        module: 'brigadas',
        version: BRIGADAS_WEBAPP_VERSION,
        calendar_get_actions: true,
        actions: ['health', 'read_all', 'preparar_estructura', 'validar_estructura', 'diagnostico', 'test_encuentro', 'programar_encuentro', 'editar_encuentro', 'eliminar_encuentro'],
        timestamp: new Date().toISOString(),
      });
    }
    if (action === 'read_all') {
      return webResponse_(e, readAllSheets_());
    }
    if (action === 'preparar_estructura') {
      const setup = setupBrigadasSeguro();
      return webResponse_(e, { ok: true, setup, structure: validarEstructuraBrigadas_() });
    }
    if (action === 'validar_estructura') {
      return webResponse_(e, validarEstructuraBrigadas_());
    }
    if (action === 'diagnostico') {
      return webResponse_(e, diagnosticoBrigadasDetallado_());
    }
    if (action === 'test_encuentro') {
      return webResponse_(e, { ok: true, result: testEncuentro_() });
    }
    if (action === 'programar_encuentro') {
      const result = programarEncuentro_(e.parameter || {});
      return webResponse_(e, { ok: true, result });
    }
    if (action === 'editar_encuentro') {
      const result = editarEncuentro_(e.parameter || {});
      return webResponse_(e, { ok: true, result });
    }
    if (action === 'eliminar_encuentro') {
      const result = eliminarEncuentro_(e.parameter || {});
      return webResponse_(e, { ok: true, result });
    }
    return webResponse_(e, { ok: true, message: 'Brigadas activo', version: BRIGADAS_WEBAPP_VERSION });
  } catch (error) {
    return webResponse_(e, { ok: false, version: BRIGADAS_WEBAPP_VERSION, error: error.message || String(error) });
  }
}

function doPost(e) {
  try {
    const params = parsePostParams_(e);
    if (params.action === 'programar_encuentro') {
      const result = programarEncuentro_(params);
      return jsonResponse_({ ok: true, result });
    }
    if (params.action === 'editar_encuentro') {
      const result = editarEncuentro_(params);
      return jsonResponse_({ ok: true, result });
    }
    if (params.action === 'eliminar_encuentro') {
      const result = eliminarEncuentro_(params);
      return jsonResponse_({ ok: true, result });
    }
    if (params.action === 'preparar_estructura') {
      const setup = setupBrigadasSeguro();
      return jsonResponse_({ ok: true, setup, structure: validarEstructuraBrigadas_() });
    }
    if (params.action === 'validar_estructura') {
      return jsonResponse_(validarEstructuraBrigadas_());
    }
    if (params.action === 'test_encuentro') {
      return jsonResponse_({ ok: true, result: testEncuentro_() });
    }
    if (params.action === 'guardar_reporte') {
      const result = guardarReporte_(params);
      return jsonResponse_({ ok: true, result });
    }
    if (params.action === 'guardar_certificado') {
      const result = guardarCertificado_(params);
      return jsonResponse_({ ok: true, result });
    }
    return jsonResponse_({ ok: false, error: 'Accion no reconocida' });
  } catch (error) {
    return jsonResponse_({ ok: false, error: error.message || String(error) });
  }
}

function parsePostParams_(e) {
  if (e && e.postData && e.postData.contents) {
    try {
      return JSON.parse(e.postData.contents);
    } catch (error) {
      // Sigue con e.parameter para formularios viejos.
    }
  }
  return e && e.parameter ? e.parameter : {};
}

function validarEstructuraBrigadas_() {
  const ss = getBrigadasSpreadsheet_();
  const result = {
    ok: true,
    version: BRIGADAS_WEBAPP_VERSION,
    spreadsheet_id: ss.getId(),
    spreadsheet_name: ss.getName(),
    timestamp: new Date().toISOString(),
    sheets: {},
  };
  Object.keys(BRIGADAS_SHEETS).forEach((name) => {
    const sheet = ss.getSheetByName(name);
    const expectedHeaders = BRIGADAS_SHEETS[name];
    if (!sheet) {
      result.ok = false;
      result.sheets[name] = {
        exists: false,
        missing_headers: expectedHeaders,
        extra_headers: [],
        row_count: 0,
      };
      return;
    }
    const headers = getNormalizedHeaderList_(sheet);
    const headerSet = new Set(headers);
    const expectedSet = new Set(expectedHeaders);
    const missing = expectedHeaders.filter((header) => !headerSet.has(header));
    const extra = headers.filter((header) => header && !expectedSet.has(header));
    if (missing.length) result.ok = false;
    result.sheets[name] = {
      exists: true,
      row_count: Math.max(getLastContentRow_(sheet) - 1, 0),
      column_count: sheet.getLastColumn(),
      missing_headers: missing,
      extra_headers: extra,
      headers: headers.filter(Boolean),
    };
  });
  const log = getSetupLogSheet_(ss);
  log.appendRow([new Date(), result.ok ? 'OK' : 'WARN', 'validar_estructura: ' + JSON.stringify({
    ok: result.ok,
    faltantes: Object.keys(result.sheets).filter((name) => result.sheets[name].missing_headers && result.sheets[name].missing_headers.length),
  })]);
  return result;
}

function diagnosticoBrigadasDetallado_() {
  const ss = getBrigadasSpreadsheet_();
  const structure = validarEstructuraBrigadas_();
  return {
    ok: structure.ok,
    version: BRIGADAS_WEBAPP_VERSION,
    spreadsheet_id: ss.getId(),
    spreadsheet_name: ss.getName(),
    sheets_actuales: ss.getSheets().map((sheet) => sheet.getName()),
    usuario: Session.getActiveUser().getEmail() || 'sin_email_visible',
    drive_folder_id: REPORTES_DRIVE_FOLDER_ID,
    structure,
  };
}

function testEncuentro_() {
  const now = new Date();
  return programarEncuentro_({
    action: 'test_encuentro',
    id_encuentro: 'test_' + Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyyMMdd_HHmmss'),
    fecha: Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd'),
    mes_periodo: Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM'),
    id_brigada: 'mat_pel',
    brigada: 'Mat Pel',
    tipo_encuentro: 'Prueba tecnica',
    tema: 'Prueba de escritura Web App',
    responsable: 'Sistema',
    lugar: 'Apps Script',
    hora_inicio: Utilities.formatDate(now, Session.getScriptTimeZone(), 'HH:mm'),
    hora_fin: '',
    estado: 'Programado',
    observaciones: 'Fila de prueba para verificar guardado en ENCUENTROS',
  });
}

function programarEncuentro_(params) {
  const ss = getBrigadasSpreadsheet_();
  ensureSheet_(ss, 'ENCUENTROS', BRIGADAS_SHEETS.ENCUENTROS);
  const sheet = ss.getSheetByName('ENCUENTROS');
  const headers = getHeaderMap_(sheet);
  logSetup_(ss, 'WEBAPP', 'programar_encuentro params: ' + JSON.stringify(params || {}));
  const idBrigada = String(params.id_brigada || '').trim();
  if (!idBrigada) throw new Error('Falta id_brigada');
  if (!params.fecha) throw new Error('Falta fecha');

  const brigade = BRIGADAS_CONFIG.find((row) => row[0] === idBrigada);
  const values = {
    id_encuentro: params.id_encuentro || `enc_${Date.now()}`,
    fecha: params.fecha,
    mes_periodo: params.mes_periodo || Utilities.formatDate(new Date(params.fecha + 'T00:00:00'), Session.getScriptTimeZone(), 'yyyy-MM'),
    id_brigada: idBrigada,
    brigada: params.brigada || (brigade ? brigade[1] : idBrigada),
    tipo_encuentro: params.tipo_encuentro || 'Encuentro mensual',
    tema: params.tema || '',
    responsable: params.responsable || '',
    lugar: params.lugar || '',
    hora_inicio: params.hora_inicio || '',
    hora_fin: params.hora_fin || '',
    estado: params.estado || 'Programado',
    observaciones: params.observaciones || 'Cargado desde modulo Brigadas',
    id_asistencia: params.id_asistencia || '',
  };
  const rowNumber = findRowById_(sheet, 'id_encuentro', values.id_encuentro) || Math.max(getLastContentRow_(sheet) + 1, 2);
  Object.keys(values).forEach((header) => {
    if (headers[header]) sheet.getRange(rowNumber, headers[header]).setValue(values[header]);
  });
  formatSheet_(sheet);
  SpreadsheetApp.flush();
  const lastRowAfter = sheet.getLastRow();
  logSetup_(ss, 'WEBAPP', 'programar_encuentro escrito: ' + JSON.stringify({
    id_encuentro: values.id_encuentro,
    spreadsheet_id: ss.getId(),
    sheet: sheet.getName(),
    rowNumber: rowNumber,
    lastRowAfter: lastRowAfter,
  }));
  return Object.assign({}, values, {
    spreadsheet_id: ss.getId(),
    spreadsheet_name: ss.getName(),
    sheet: sheet.getName(),
    rowNumber: rowNumber,
    lastRowAfter: lastRowAfter,
  });
}

function editarEncuentro_(params) {
  const ss = getBrigadasSpreadsheet_();
  const sheet = ss.getSheetByName('ENCUENTROS');
  const rowNumber = findRowById_(sheet, 'id_encuentro', params.id_encuentro);
  if (!rowNumber) return programarEncuentro_(params);
  const headers = getHeaderMap_(sheet);
  const brigade = BRIGADAS_CONFIG.find((row) => row[0] === params.id_brigada);
  const values = {
    fecha: params.fecha || '',
    mes_periodo: params.mes_periodo || '',
    id_brigada: params.id_brigada || '',
    brigada: params.brigada || (brigade ? brigade[1] : ''),
    tipo_encuentro: params.tipo_encuentro || 'Encuentro mensual',
    tema: params.tema || '',
    responsable: params.responsable || '',
    lugar: params.lugar || '',
    hora_inicio: params.hora_inicio || '',
    hora_fin: params.hora_fin || '',
    estado: params.estado || 'Programado',
    observaciones: params.observaciones || '',
  };
  Object.keys(values).forEach((header) => {
    if (headers[header]) sheet.getRange(rowNumber, headers[header]).setValue(values[header]);
  });
  formatSheet_(sheet);
  return { id_encuentro: params.id_encuentro, updated: true };
}

function eliminarEncuentro_(params) {
  const ss = getBrigadasSpreadsheet_();
  const sheet = ss.getSheetByName('ENCUENTROS');
  const rowNumber = findRowById_(sheet, 'id_encuentro', params.id_encuentro);
  if (!rowNumber) return { id_encuentro: params.id_encuentro, deleted: false, reason: 'No encontrado' };
  sheet.deleteRow(rowNumber);
  return { id_encuentro: params.id_encuentro, deleted: true };
}

function findRowById_(sheet, idHeader, idValue) {
  if (!sheet || !idValue) return 0;
  const headers = getHeaderMap_(sheet);
  const column = headers[idHeader];
  if (!column) return 0;
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return 0;
  const values = sheet.getRange(2, column, lastRow - 1, 1).getDisplayValues();
  for (let i = 0; i < values.length; i++) {
    if (String(values[i][0]) === String(idValue)) return i + 2;
  }
  return 0;
}

function guardarReporte_(params) {
  const root = DriveApp.getFolderById(REPORTES_DRIVE_FOLDER_ID);
  const brigadeFolder = getBrigadeFolder_(root, params.brigada || params.id_brigada || 'Brigada');
  const reportType = params.tipo_reporte || 'reportes';
  const typeFolderName = reportType === 'asistencia' ? '01 Asistencias' : reportType === 'equipamiento' ? '02 Equipamiento' : 'Reportes';
  const typeFolder = getOrCreateFolder_(brigadeFolder, typeFolderName);
  const monthFolder = getOrCreateFolder_(typeFolder, Utilities.formatDate(new Date(), Session.getScriptTimeZone(), 'yyyy-MM'));
  const bytes = Utilities.base64Decode(params.base64 || '');
  const blob = Utilities.newBlob(bytes, params.mime_type || 'application/pdf', params.filename || `reporte-${Date.now()}.pdf`);
  const file = monthFolder.createFile(blob);
  return { file_id: file.getId(), url: file.getUrl(), name: file.getName() };
}

function guardarCertificado_(params) {
  const root = DriveApp.getFolderById(REPORTES_DRIVE_FOLDER_ID);
  const brigadeFolder = getBrigadeFolder_(root, params.brigada || params.id_brigada || 'Brigada');
  const certificatesFolder = getOrCreateFolder_(brigadeFolder, '03 Certificaciones');
  const memberFolder = getOrCreateFolder_(certificatesFolder, String(params.integrante || 'sin_identificar'));
  const bytes = Utilities.base64Decode(params.base64 || '');
  const safeTitle = String(params.titulo || 'certificado').replace(/[\\/:*?"<>|]/g, '_');
  const originalName = params.filename || 'certificado';
  const blob = Utilities.newBlob(bytes, params.mime_type || 'application/octet-stream', safeTitle + ' - ' + originalName);
  const file = memberFolder.createFile(blob);
  return { file_id: file.getId(), url: file.getUrl(), name: file.getName() };
}

function getBrigadeFolder_(root, brigadeName) {
  const normalized = normalizeHeader_(brigadeName).replace(/_/g, ' ');
  const knownNames = {
    'brec': 'BRIGADA BREC',
    'buceo': 'BRIGADA DE BUCEO',
    'k9': 'BRIGADA K9',
    'mat pel': 'BRIGADA MAT PEL',
    'rescate acuatico': 'BRIGADA RESCATE ACUÁTICO',
    'altura': 'BRIGADA RESCATE EN ALTURA',
    'rescate en altura': 'BRIGADA RESCATE EN ALTURA',
    'socorrismo': 'BRIGADA SOCORRISMO',
  };
  const folderName = knownNames[normalized] || ('BRIGADA ' + String(brigadeName).toUpperCase());
  return getOrCreateFolder_(root, folderName);
}

function getOrCreateFolder_(parent, name) {
  const folders = parent.getFoldersByName(name);
  return folders.hasNext() ? folders.next() : parent.createFolder(name);
}

function getBrigadasSpreadsheet_() {
  return SpreadsheetApp.openById(BRIGADAS_SPREADSHEET_ID);
}

function readAllSheets_() {
  const ss = getBrigadasSpreadsheet_();
  const sheets = {};
  const readableSheets = [
    'CONFIG_BRIGADAS',
    'PERSONAL',
    'ENCUENTROS',
    'ASISTENCIAS',
    'DETALLE_ASISTENCIAS',
    'EQUIPAMIENTO',
    'CHECK_EQUIPAMIENTO',
    'NECESIDADES',
    'PARAMETROS',
  ];
  readableSheets.forEach((name) => {
    const sheet = ss.getSheetByName(name);
    sheets[name] = sheet ? sheetToObjects_(sheet) : [];
  });
  return { ok: true, sheets, timestamp: new Date().toISOString() };
}

function sheetToObjects_(sheet) {
  const lastRow = getLastContentRow_(sheet);
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return [];
  const values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  if (values.length < 2) return [];
  const headers = values[0].map((header) => normalizeHeader_(header));
  return values.slice(1).map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      if (header) item[header] = row[index] || '';
    });
    return item;
  }).filter((item) => Object.keys(item).some((key) => item[key] !== ''));
}

function getLastContentRow_(sheet) {
  const lastRow = sheet.getLastRow();
  const lastColumn = sheet.getLastColumn();
  if (lastRow < 2 || lastColumn < 1) return lastRow;
  const values = sheet.getRange(1, 1, lastRow, lastColumn).getDisplayValues();
  for (let r = values.length - 1; r >= 0; r--) {
    if (values[r].some((value) => value !== '')) return r + 1;
  }
  return 1;
}

function normalizeHeader_(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function webResponse_(e, payload) {
  const callback = e && e.parameter && e.parameter.callback;
  if (callback) {
    return ContentService
      .createTextOutput(`${callback}(${JSON.stringify(payload)});`)
      .setMimeType(ContentService.MimeType.TEXT);
  }
  return jsonResponse_(payload);
}

function jsonResponse_(payload) {
  return ContentService
    .createTextOutput(JSON.stringify(payload))
    .setMimeType(ContentService.MimeType.JSON);
}

function ensureSheet_(ss, name, headers) {
  const sheet = ss.getSheetByName(name) || ss.insertSheet(name);
  const existing = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const map = {};
  existing.forEach((value, index) => {
    if (value) map[String(value)] = index + 1;
  });
  if (name === 'PERSONAL') {
    const legacy = {'APELLIDO': 'apellido', 'NOMBRE': 'nombre', 'BOMBERO': 'bombero', 'LEGAJO': 'legajo', 'Jerarquia': 'jerarquia', 'Jerarquía': 'jerarquia', 'Rescate acuatico': 'rescate_acuatico', 'Rescate acuático': 'rescate_acuatico', 'Buceo': 'buceo', 'K9': 'k9', 'Mat Pel': 'mat_pel', 'Altura': 'altura', 'Socorrismo': 'socorrismo', 'BREC': 'brec'};
    Object.keys(legacy).forEach((oldHeader) => {
      if (map[oldHeader] && !map[legacy[oldHeader]]) sheet.getRange(1, map[oldHeader]).setValue(legacy[oldHeader]);
    });
  }
  const refreshed = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const refreshedMap = {};
  refreshed.forEach((value, index) => {
    if (value) refreshedMap[String(value)] = index + 1;
  });
  headers.forEach((header) => {
    if (!refreshedMap[header]) sheet.getRange(1, sheet.getLastColumn() + 1).setValue(header);
  });
}

function compactSheet_(sheet, targetHeaders) {
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) {
    sheet.clear();
    sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
    return;
  }
  const headers = values[0].map((header) => normalizeHeader_(header));
  const findIndex = (target) => {
    const exact = headers.indexOf(target);
    if (exact >= 0) return exact;
    if (target === 'ubicacion') return headers.findIndex((header) => header.indexOf('ubicacion') >= 0);
    if (target === 'unidades') return headers.findIndex((header) => header === 'un' || header.indexOf('unidad') >= 0 || header.indexOf('unidades') >= 0);
    if (target === 'cantidad_ok_no') return headers.findIndex((header) => header.indexOf('cantidad') >= 0);
    if (target === 'estado_bueno_malo') return headers.findIndex((header) => header.indexOf('estado') >= 0);
    return -1;
  };
  const compactRows = values.slice(1).map((row) => targetHeaders.map((header) => {
    const index = findIndex(header);
    return index >= 0 ? row[index] : '';
  })).filter((row) => row.some((value) => value !== ''));
  sheet.clear();
  sheet.getRange(1, 1, 1, targetHeaders.length).setValues([targetHeaders]);
  if (compactRows.length) sheet.getRange(2, 1, compactRows.length, targetHeaders.length).setValues(compactRows);
}

function upsertRows_(sheet, rows, keyColumns) {
  const lastRow = sheet.getLastRow();
  const current = lastRow > 1 ? sheet.getRange(2, 1, lastRow - 1, keyColumns).getValues() : [];
  const keys = new Set(current.map((row) => row.join('|')).filter(Boolean));
  rows.forEach((row) => {
    const key = row.slice(0, keyColumns).join('|');
    if (!keys.has(key)) sheet.appendRow(row);
  });
}

function fixConfigBrigadas_(sheet) {
  const headers = getHeaderMap_(sheet);
  const expected = {};
  BRIGADAS_CONFIG.forEach((row) => expected[row[0]] = row);
  for (let r = 2; r <= sheet.getLastRow(); r++) {
    const id = sheet.getRange(r, headers.id_brigada).getValue();
    if (!expected[id]) continue;
    sheet.getRange(r, headers.columna_personal).setValue(expected[id][2]);
    if (headers.bibliografia_url && expected[id][9]) sheet.getRange(r, headers.bibliografia_url).setValue(expected[id][9]);
  }
}

function setupPersonalDefaults_(sheet) {
  const headers = getHeaderMap_(sheet);
  const lastRow = sheet.getLastRow();
  if (lastRow < 2) return;
  const values = sheet.getRange(2, 1, lastRow - 1, sheet.getLastColumn()).getValues();
  let changed = false;
  values.forEach((row) => {
    if (headers.id_persona && headers.legajo && !row[headers.id_persona - 1] && row[headers.legajo - 1]) {
      row[headers.id_persona - 1] = row[headers.legajo - 1];
      changed = true;
    }
    if (headers.activo && !row[headers.activo - 1]) {
      row[headers.activo - 1] = 'SI';
      changed = true;
    }
  });
  if (changed) sheet.getRange(2, 1, values.length, values[0].length).setValues(values);
}

function formatSheet_(sheet) {
  const maxCol = Math.max(sheet.getLastColumn(), 1);
  sheet.setFrozenRows(1);
  sheet.getRange(1, 1, 1, maxCol).setFontWeight('bold').setFontColor('#FFFFFF').setBackground('#7A1113').setHorizontalAlignment('center');
  if (sheet.getFilter()) sheet.getFilter().remove();
  sheet.getRange(1, 1, Math.max(sheet.getLastRow(), 1), maxCol).createFilter();
  sheet.setColumnWidths(1, maxCol, 150);
}

function applyValidations_(ss) {
  const brigadeNames = BRIGADAS_CONFIG.map((b) => b[1]);
  setListValidation_(ss.getSheetByName('PERSONAL'), 'activo', ['SI', 'NO']);
  BRIGADAS_CONFIG.forEach((b) => setListValidation_(ss.getSheetByName('PERSONAL'), b[2], ['x', 'X', 'SI']));
  setListValidation_(ss.getSheetByName('CONFIG_BRIGADAS'), 'activa', ['SI', 'NO']);
  setListValidation_(ss.getSheetByName('ENCUENTROS'), 'estado', ['Programado', 'Realizado', 'Suspendido', 'Reprogramado', 'Pendiente']);
  setListValidation_(ss.getSheetByName('ASISTENCIAS'), 'estado_registro', ['Borrador', 'Cerrado', 'Anulado']);
  setListValidation_(ss.getSheetByName('DETALLE_ASISTENCIAS'), 'estado_asistencia', ['P', 'A', 'Just.']);
  setListValidation_(ss.getSheetByName('EQUIPAMIENTO'), 'brigada', brigadeNames);
  setListValidation_(ss.getSheetByName('EQUIPAMIENTO'), 'cantidad_ok_no', ['OK', 'NO']);
  setListValidation_(ss.getSheetByName('EQUIPAMIENTO'), 'estado_bueno_malo', ['BUENO', 'MALO']);
  setListValidation_(ss.getSheetByName('CHECK_EQUIPAMIENTO'), 'brigada', brigadeNames);
  setListValidation_(ss.getSheetByName('CHECK_EQUIPAMIENTO'), 'cantidad_ok_no', ['OK', 'NO']);
  setListValidation_(ss.getSheetByName('CHECK_EQUIPAMIENTO'), 'estado_bueno_malo', ['BUENO', 'MALO']);
  setListValidation_(ss.getSheetByName('NECESIDADES'), 'prioridad', ['Alta', 'Media', 'Baja']);
  setListValidation_(ss.getSheetByName('NECESIDADES'), 'estado', ['Pendiente', 'Cotizado', 'Solicitado', 'Comprado', 'Recibido', 'Cancelado']);
}

function applyFormulas_(ss) {
  ['ASISTENCIAS', 'CHECK_EQUIPAMIENTO'].forEach((name) => {
    const sheet = ss.getSheetByName(name);
    const h = getHeaderMap_(sheet);
    if (!h.fecha || !h.mes_periodo) return;
    const offset = h.fecha - h.mes_periodo;
    sheet.getRange(2, h.mes_periodo, 499, 1).setFormulaR1C1(`=IF(RC[${offset}]<>"",TEXT(RC[${offset}],"yyyy-mm"),"")`);
  });
  const personal = ss.getSheetByName('PERSONAL');
  const h = getHeaderMap_(personal);
  if (h.cantidad_brigadas) {
    const parts = BRIGADAS_CONFIG
      .filter((b) => h[b[2]])
      .map((b) => {
        const offset = h[b[2]] - h.cantidad_brigadas;
        return `IF(OR(LOWER(TRIM(RC[${offset}]))="x",LOWER(TRIM(RC[${offset}]))="si"),1,0)`;
      });
    if (parts.length) personal.getRange(2, h.cantidad_brigadas, 499, 1).setFormulaR1C1('=' + parts.join('+'));
  }
}

function setListValidation_(sheet, header, values) {
  const h = getHeaderMap_(sheet);
  if (!h[header]) return;
  const rule = SpreadsheetApp.newDataValidation().requireValueInList(values, true).setAllowInvalid(false).build();
  sheet.getRange(2, h[header], 999).setDataValidation(rule);
}

function getHeaderMap_(sheet) {
  const values = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getValues()[0];
  const map = {};
  values.forEach((value, index) => {
    if (value) map[String(value)] = index + 1;
  });
  return map;
}

function getNormalizedHeaderList_(sheet) {
  const values = sheet.getRange(1, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0];
  return values.map((value) => normalizeHeader_(value));
}

function columnLetter_(column) {
  let temp = '';
  while (column > 0) {
    const mod = (column - 1) % 26;
    temp = String.fromCharCode(65 + mod) + temp;
    column = Math.floor((column - mod) / 26);
  }
  return temp;
}
