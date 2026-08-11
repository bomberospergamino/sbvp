/**
 * SBVP Hidrantes — backend para Google Sheets + Drive.
 * Vincular este proyecto de Apps Script a la planilla de hidrantes.
 */
const CONFIG = Object.freeze({
  SPREADSHEET_ID: '1kv2uCGnNBO_KRj4f2uRXA647pJYrbzjHiBEkI3zrdwg',
  SHEET_GID: 0,
  ROOT_FOLDER_ID: '1Cj22WMe44kRIA3s4-6XOLTmn0OByK9Bo',
  PUBLICAR_FOTOS: true,
  ADMIN_SESSION_SECONDS: 1800,
  GEOJSON_FILE_ID: '15-CaswNW7LWiBitCgNEQMcBOCDwRjkVA'
});

const REQUIRED_HEADERS = [
  'ID', 'N°', 'Nombre', 'Estado', 'Publicación', 'Latitud', 'Longitud',
  'Horario', 'Altura', 'Apto móviles', 'Tipo de acople', 'Responsable',
  'Contacto', 'Observaciones', 'Carpeta de fotos', 'ID carpeta fotos',
  'Foto principal', 'Fecha de creación', 'Fecha de actualización',
  'Actualizado por', 'Eliminado'
];

function inicializarSistema() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ctx = getContext_();
    ensureHeaders_(ctx);
    formatSheet_(ctx);
    const result = syncFolders_();
    instalarAutomatizaciones();
    console.log(`Inicialización completa: ${result.rows} hidrantes revisados y ${result.created} carpetas creadas.`);
    return result;
  } finally {
    lock.releaseLock();
  }
}

function configurarClaveAdmin() {
  const props = PropertiesService.getScriptProperties();
  const pin = String(props.getProperty('ADMIN_PIN_SETUP') || '').trim();
  if (pin.length < 4) throw new Error('Primero agregá la propiedad de secuencia de comandos ADMIN_PIN_SETUP con la clave elegida.');
  const salt = Utilities.getUuid();
  props.setProperties({
    ADMIN_SALT: salt,
    ADMIN_HASH: hash_(salt + pin)
  });
  props.deleteProperty('ADMIN_PIN_SETUP');
  console.log('Clave administrativa configurada correctamente.');
  return { ok: true };
}

function instalarAutomatizaciones() {
  const handlers = ['alEditarHidrante', 'sincronizarCarpetas'];
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (handlers.includes(trigger.getHandlerFunction())) ScriptApp.deleteTrigger(trigger);
  });
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  ScriptApp.newTrigger('alEditarHidrante').forSpreadsheet(ss).onEdit().create();
  ScriptApp.newTrigger('sincronizarCarpetas').timeBased().everyHours(6).create();
}

function alEditarHidrante(e) {
  if (!e || e.range.getSheet().getSheetId() !== CONFIG.SHEET_GID) return;
  const ctx = getContext_();
  ensureHeaders_(ctx);
  const start = Math.max(e.range.getRow(), ctx.headerRow + 1);
  const end = e.range.getLastRow();
  for (let row = start; row <= end; row++) ensureFolderForRow_(ctx, row);
}

function sincronizarCarpetas() {
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try { return syncFolders_(); } finally { lock.releaseLock(); }
}

function syncFolders_() {
  const ctx = getContext_();
  ensureHeaders_(ctx);
  let created = 0;
  for (let row = ctx.headerRow + 1; row <= ctx.sheet.getLastRow(); row++) {
    const result = ensureFolderForRow_(ctx, row);
    if (result && result.created) created++;
  }
  return { ok: true, rows: Math.max(0, ctx.sheet.getLastRow() - ctx.headerRow), created };
}

function ensureFolderForRow_(ctx, row) {
  const values = rowObject_(ctx, row);
  if (!values.Nombre || truthy_(values.Eliminado)) return null;

  let id = String(values.ID || '').trim();
  if (!id) {
    id = Utilities.getUuid();
    setCell_(ctx, row, 'ID', id);
  }

  let folder = null;
  const existingId = String(values['ID carpeta fotos'] || '').trim() || extractDriveId_(values['Carpeta de fotos']);
  if (existingId) {
    try { folder = DriveApp.getFolderById(existingId); } catch (err) { folder = null; }
  }

  let created = false;
  if (!folder) {
    folder = getRootFolder_().createFolder(`${safeName_(values.Nombre)} — ${id.slice(0, 8)}`);
    created = true;
  }
  folder = ensureFolderInRoot_(folder, values.Nombre, id);
  folder.setDescription(`Fotos operativas del hidrante: ${values.Nombre}\nID SBVP: ${id}`);
  if (CONFIG.PUBLICAR_FOTOS) {
    try { folder.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW); } catch (err) { console.warn(err); }
  }
  setCell_(ctx, row, 'ID carpeta fotos', folder.getId());
  setCell_(ctx, row, 'Carpeta de fotos', folder.getUrl());
  if (!values['Fecha de creación']) setCell_(ctx, row, 'Fecha de creación', new Date());
  if (!values.Estado) setCell_(ctx, row, 'Estado', 'Activo');
  if (!values.Publicación) setCell_(ctx, row, 'Publicación', 'Publicado');
  return { created, folderId: folder.getId(), folderUrl: folder.getUrl() };
}

function getRootFolder_() {
  return DriveApp.getFolderById(CONFIG.ROOT_FOLDER_ID);
}

function ensureFolderInRoot_(folder, hydrantName, id) {
  const root = getRootFolder_();
  const parents = folder.getParents();
  while (parents.hasNext()) if (parents.next().getId() === root.getId()) return folder;
  console.log(`Se ignora la carpeta anterior de ${hydrantName} porque está fuera de la carpeta configurada.`);
  return root.createFolder(`${safeName_(hydrantName)} — ${String(id).slice(0, 8)}`);
}

function doGet(e) {
  try {
    const action = String(e.parameter.action || 'list');
    let result;
    if (action === 'list') result = listHydrants_(e.parameter);
    else if (action === 'photos') result = listPhotos_(e.parameter.id);
    else if (action === 'health') result = { ok: true, service: 'SBVP Hidrantes', time: new Date().toISOString() };
    else throw new Error('Acción GET desconocida.');
    return output_(result, e.parameter.callback);
  } catch (err) {
    return output_({ ok: false, error: err.message }, e && e.parameter && e.parameter.callback);
  }
}

function doPost(e) {
  try {
    const body = parseBody_(e);
    const action = String(body.action || '');
    let result;
    if (action === 'add') result = addHydrant_(body.data || body);
    else if (action === 'adminLogin') result = adminLogin_(body.pin);
    else if (action === 'update') { requireAdmin_(body.token); result = updateHydrant_(body.data || body); }
    else if (action === 'delete') { requireAdmin_(body.token); result = deleteHydrant_(body.id); }
    else throw new Error('Acción POST desconocida.');
    return output_(result);
  } catch (err) {
    return output_({ ok: false, error: err.message });
  }
}

function listHydrants_(params) {
  const ctx = getContext_();
  ensureHeaders_(ctx);
  const isAdmin = params.token && isValidAdmin_(params.token);
  const data = [];
  for (let row = ctx.headerRow + 1; row <= ctx.sheet.getLastRow(); row++) {
    const item = rowObject_(ctx, row);
    if (!item.Nombre || truthy_(item.Eliminado)) continue;
    if (!isAdmin && String(item.Publicación || '').toLowerCase() !== 'publicado') continue;
    data.push(publicRecord_(item));
  }
  return { ok: true, hydrants: data };
}

function addHydrant_(data) {
  validateHydrant_(data, true);
  const lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    const ctx = getContext_();
    ensureHeaders_(ctx);
    const row = ctx.sheet.getLastRow() + 1;
    const record = normalizePayload_(data);
    record.ID = Utilities.getUuid();
    record.Estado = record.Estado || 'Activo';
    record.Publicación = 'Pendiente';
    record['Fecha de creación'] = new Date();
    record['Fecha de actualización'] = new Date();
    record['Actualizado por'] = record['Actualizado por'] || 'Alta pública';
    writeRecord_(ctx, row, record);
    const folder = ensureFolderForRow_(ctx, row);
    return { ok: true, id: record.ID, status: 'Pendiente', folderUrl: folder.folderUrl };
  } finally { lock.releaseLock(); }
}

function updateHydrant_(data) {
  if (!data.ID && !data.id) throw new Error('Falta el ID del hidrante.');
  validateHydrant_(data, false);
  const lock = LockService.getScriptLock(); lock.waitLock(30000);
  try {
    const ctx = getContext_(); ensureHeaders_(ctx);
    const row = findRowById_(ctx, data.ID || data.id);
    if (!row) throw new Error('Hidrante no encontrado.');
    const record = normalizePayload_(data);
    delete record.ID;
    record['Fecha de actualización'] = new Date();
    record['Actualizado por'] = record['Actualizado por'] || 'Administrador';
    writeRecord_(ctx, row, record, true);
    ensureFolderForRow_(ctx, row);
    return { ok: true, id: data.ID || data.id };
  } finally { lock.releaseLock(); }
}

function deleteHydrant_(id) {
  if (!id) throw new Error('Falta el ID del hidrante.');
  const ctx = getContext_(); ensureHeaders_(ctx);
  const row = findRowById_(ctx, id);
  if (!row) throw new Error('Hidrante no encontrado.');
  setCell_(ctx, row, 'Eliminado', true);
  setCell_(ctx, row, 'Fecha de actualización', new Date());
  setCell_(ctx, row, 'Actualizado por', 'Administrador');
  return { ok: true, id };
}

function listPhotos_(id) {
  const ctx = getContext_(); ensureHeaders_(ctx);
  const row = findRowById_(ctx, id);
  if (!row) throw new Error('Hidrante no encontrado.');
  const item = rowObject_(ctx, row);
  const folderId = item['ID carpeta fotos'];
  if (!folderId) return { ok: true, photos: [], folderUrl: '' };
  const folder = DriveApp.getFolderById(String(folderId));
  const files = folder.getFiles(), photos = [];
  while (files.hasNext()) {
    const file = files.next();
    if (!String(file.getMimeType()).startsWith('image/')) continue;
    photos.push({ id: file.getId(), name: file.getName(), url: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w1200` });
  }
  return { ok: true, photos, folderUrl: folder.getUrl() };
}

function adminLogin_(pin) {
  const props = PropertiesService.getScriptProperties();
  const salt = props.getProperty('ADMIN_SALT'), expected = props.getProperty('ADMIN_HASH');
  if (!salt || !expected) throw new Error('La clave administrativa todavía no fue configurada.');
  const failures = Number(CacheService.getScriptCache().get('ADMIN_FAILURES') || 0);
  if (failures >= 10) throw new Error('Acceso bloqueado temporalmente por demasiados intentos.');
  if (!constantTimeEquals_(hash_(salt + String(pin || '')), expected)) {
    CacheService.getScriptCache().put('ADMIN_FAILURES', String(failures + 1), 600);
    throw new Error('Clave incorrecta.');
  }
  CacheService.getScriptCache().remove('ADMIN_FAILURES');
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('ADMIN_' + token, '1', CONFIG.ADMIN_SESSION_SECONDS);
  return { ok: true, token, expiresIn: CONFIG.ADMIN_SESSION_SECONDS };
}

function requireAdmin_(token) { if (!isValidAdmin_(token)) throw new Error('Sesión administrativa inválida o vencida.'); }
function isValidAdmin_(token) { return !!token && CacheService.getScriptCache().get('ADMIN_' + token) === '1'; }

function importarGeoJsonDesdeDrive() {
  if (!CONFIG.GEOJSON_FILE_ID) throw new Error('Completá CONFIG.GEOJSON_FILE_ID con el ID del archivo GeoJSON subido a Drive.');
  const geo = JSON.parse(DriveApp.getFileById(CONFIG.GEOJSON_FILE_ID).getBlob().getDataAsString('UTF-8'));
  const ctx = getContext_(); ensureHeaders_(ctx);
  let updated = 0;
  (geo.features || []).forEach(feature => {
    const p = feature.properties || {}, c = (feature.geometry || {}).coordinates || [];
    const row = findMatchingRow_(ctx, p.title, c[1], c[0]);
    if (!row) return;
    const parsed = parseDescription_(p.description || '');
    const record = Object.assign(parsed, {
      Estado: /fuera de servicio/i.test(p.description || '') || String(p['marker-color']).toLowerCase() === '#cc1b15' ? 'Inactivo' : 'Activo',
      'Carpeta de fotos': p.url || undefined,
      'Fecha de actualización': new Date(),
      'Actualizado por': 'Migración GeoJSON'
    });
    Object.keys(record).forEach(key => record[key] === undefined && delete record[key]);
    writeRecord_(ctx, row, record, true); updated++;
  });
  syncFolders_();
  console.log(`Migración terminada: ${updated} hidrantes actualizados.`);
  return { ok: true, updated };
}

function parseDescription_(text) {
  const get = regex => ((text.match(regex) || [])[1] || '').trim().replace(/[.\s]+$/, '');
  const horario = get(/Horario:\s*([^\n]+)/i), aptos = get(/Apto para móviles:\s*([^\n]+)/i);
  const acople = get(/Tipo de acople:\s*([^\n]+)/i), contactoRaw = get(/Contacto:\s*([^\n]+)/i);
  const altura = get(/Altura:\s*([^\n]*)/i);
  const knownLines = /^(?:❌.*|⏰?\s*Horario:|🚒?\s*Apto para móviles:|🧩?\s*Tipo de acople:|🤳🏾?\s*Contacto:|⬆️?\s*Altura:)/i;
  const observations = text.split('\n').map(s => s.trim()).filter(s => s && !knownLines.test(s)).join('\n');
  const phone = contactoRaw.match(/[\d][\d\s\-/]{5,}/);
  let responsable = contactoRaw;
  if (phone) responsable = contactoRaw.replace(phone[0], '').replace(/[()\-/]/g, ' ').trim();
  return { Horario: horario, 'Apto móviles': aptos, 'Tipo de acople': acople, Contacto: phone ? phone[0].trim() : contactoRaw, Responsable: responsable, Altura: altura, Observaciones: observations };
}

function getContext_() {
  const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = ss.getSheets().find(s => s.getSheetId() === CONFIG.SHEET_GID);
  if (!sheet) throw new Error('No se encontró la hoja configurada.');
  const headerRow = detectHeaderRow_(sheet);
  const headers = sheet.getRange(headerRow, 1, 1, Math.max(sheet.getLastColumn(), 1)).getDisplayValues()[0];
  return { ss, sheet, headerRow, headers, columns: columnsFromHeaders_(headers) };
}

function detectHeaderRow_(sheet) {
  const rows = sheet.getRange(1, 1, Math.min(5, Math.max(sheet.getLastRow(), 1)), Math.max(sheet.getLastColumn(), 5)).getDisplayValues();
  for (let i = 0; i < rows.length; i++) {
    const normalized = rows[i].map(normalizeHeader_);
    if (normalized.includes('nombre') && normalized.includes('latitud') && normalized.includes('longitud')) return i + 1;
  }
  return 1;
}

function ensureHeaders_(ctx) {
  const existing = new Set(ctx.headers.map(normalizeHeader_));
  const missing = REQUIRED_HEADERS.filter(h => !existing.has(normalizeHeader_(h)));
  if (missing.length) ctx.sheet.getRange(ctx.headerRow, ctx.sheet.getLastColumn() + 1, 1, missing.length).setValues([missing]);
  ctx.headers = ctx.sheet.getRange(ctx.headerRow, 1, 1, ctx.sheet.getLastColumn()).getDisplayValues()[0];
  ctx.columns = columnsFromHeaders_(ctx.headers);
}

function formatSheet_(ctx) {
  ctx.sheet.setFrozenRows(ctx.headerRow);
  const header = ctx.sheet.getRange(ctx.headerRow, 1, 1, ctx.sheet.getLastColumn());
  header.setBackground('#063452').setFontColor('#ffffff').setFontWeight('bold').setWrap(true);
  const statusCol = ctx.columns[normalizeHeader_('Estado')];
  const publicationCol = ctx.columns[normalizeHeader_('Publicación')];
  ctx.sheet.getRange(ctx.headerRow + 1, statusCol, Math.max(ctx.sheet.getMaxRows() - ctx.headerRow, 1), 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Activo', 'Inactivo'], true).build());
  ctx.sheet.getRange(ctx.headerRow + 1, publicationCol, Math.max(ctx.sheet.getMaxRows() - ctx.headerRow, 1), 1).setDataValidation(SpreadsheetApp.newDataValidation().requireValueInList(['Pendiente', 'Publicado'], true).build());
  ctx.sheet.autoResizeColumns(1, ctx.sheet.getLastColumn());
}

function rowObject_(ctx, row) {
  const values = ctx.sheet.getRange(row, 1, 1, ctx.sheet.getLastColumn()).getValues()[0], out = {};
  ctx.headers.forEach((header, i) => { if (header) out[canonicalHeader_(header)] = values[i]; });
  return out;
}

function writeRecord_(ctx, row, record, preserveMissing) {
  const range = ctx.sheet.getRange(row, 1, 1, ctx.sheet.getLastColumn());
  const values = preserveMissing ? range.getValues()[0] : Array(ctx.sheet.getLastColumn()).fill('');
  Object.keys(record).forEach(key => {
    const col = ctx.columns[normalizeHeader_(key)];
    if (col) values[col - 1] = record[key] == null ? '' : record[key];
  });
  range.setValues([values]);
}

function setCell_(ctx, row, header, value) { const col = ctx.columns[normalizeHeader_(header)]; if (col) ctx.sheet.getRange(row, col).setValue(value); }
function findRowById_(ctx, id) { const col = ctx.columns[normalizeHeader_('ID')]; if (!col) return 0; const finder = ctx.sheet.getRange(ctx.headerRow + 1, col, Math.max(ctx.sheet.getLastRow() - ctx.headerRow, 1), 1).createTextFinder(String(id)).matchEntireCell(true).findNext(); return finder ? finder.getRow() : 0; }
function findMatchingRow_(ctx, title, lat, lng) {
  for (let row = ctx.headerRow + 1; row <= ctx.sheet.getLastRow(); row++) {
    const v = rowObject_(ctx, row);
    if (Math.abs(Number(v.Latitud) - Number(lat)) < .000001 && Math.abs(Number(v.Longitud) - Number(lng)) < .000001) return row;
  }
  const matches = [];
  for (let row = ctx.headerRow + 1; row <= ctx.sheet.getLastRow(); row++) {
    if (String(rowObject_(ctx, row).Nombre).trim() === String(title).trim()) matches.push(row);
  }
  return matches.length === 1 ? matches[0] : 0;
}

function normalizePayload_(data) {
  const aliases = { id:'ID', name:'Nombre', nombre:'Nombre', status:'Estado', estado:'Estado', publication:'Publicación', publicacion:'Publicación', lat:'Latitud', latitude:'Latitud', latitud:'Latitud', lng:'Longitud', lon:'Longitud', longitude:'Longitud', longitud:'Longitud', schedule:'Horario', horario:'Horario', height:'Altura', altura:'Altura', suitablevehicles:'Apto móviles', aptomoviles:'Apto móviles', couplingtype:'Tipo de acople', tipoacople:'Tipo de acople', responsible:'Responsable', responsable:'Responsable', contact:'Contacto', contacto:'Contacto', notes:'Observaciones', observaciones:'Observaciones', photosfolder:'Carpeta de fotos', carpetafotos:'Carpeta de fotos', mainphoto:'Foto principal', fotoprincipal:'Foto principal', updatedby:'Actualizado por', actualizadopor:'Actualizado por' };
  const out = {};
  Object.keys(data || {}).forEach(key => { const target = aliases[normalizeHeader_(key).replace(/\s/g, '')] || canonicalHeader_(key); if (REQUIRED_HEADERS.includes(target)) out[target] = data[key]; });
  return out;
}

function validateHydrant_(data, isNew) { const d = normalizePayload_(data); if (isNew && !String(d.Nombre || '').trim()) throw new Error('El nombre es obligatorio.'); const lat = Number(d.Latitud), lng = Number(d.Longitud); if (isNew && (!Number.isFinite(lat) || !Number.isFinite(lng))) throw new Error('Latitud y longitud son obligatorias.'); if (d.Latitud !== undefined && (lat < -90 || lat > 90)) throw new Error('Latitud inválida.'); if (d.Longitud !== undefined && (lng < -180 || lng > 180)) throw new Error('Longitud inválida.'); if (d.Estado && !['Activo','Inactivo'].includes(d.Estado)) throw new Error('Estado inválido.'); }
function publicRecord_(item) { return { id:item.ID, number:item['N°'], name:item.Nombre, status:item.Estado, publication:item.Publicación, lat:Number(item.Latitud), lng:Number(item.Longitud), schedule:item.Horario, height:item.Altura, suitableVehicles:item['Apto móviles'], couplingType:item['Tipo de acople'], responsible:item.Responsable, contact:item.Contacto, notes:item.Observaciones, photosFolder:item['Carpeta de fotos'], mainPhoto:item['Foto principal'], updatedAt:item['Fecha de actualización'] }; }
function columnsFromHeaders_(headers) { const out={}; headers.forEach((h,i)=>{if(h)out[normalizeHeader_(h)]=i+1}); return out; }
function canonicalHeader_(header) { const normalized=normalizeHeader_(header); return REQUIRED_HEADERS.find(h=>normalizeHeader_(h)===normalized)||header; }
function normalizeHeader_(value) { return String(value||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').trim().toLowerCase(); }
function parseBody_(e) { const raw=e && e.postData && e.postData.contents; if (raw) { try { return JSON.parse(raw); } catch(err) {} } return Object.assign({}, e && e.parameter); }
function output_(value, callback) { const json=JSON.stringify(value); if(callback && /^[a-zA-Z_$][\w$\.]*$/.test(callback)) return ContentService.createTextOutput(`${callback}(${json});`).setMimeType(ContentService.MimeType.JAVASCRIPT); return ContentService.createTextOutput(json).setMimeType(ContentService.MimeType.JSON); }
function hash_(value) { return Utilities.base64EncodeWebSafe(Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value, Utilities.Charset.UTF_8)); }
function constantTimeEquals_(a,b) { if(a.length!==b.length)return false; let diff=0; for(let i=0;i<a.length;i++)diff|=a.charCodeAt(i)^b.charCodeAt(i); return diff===0; }
function extractDriveId_(url) { const match=String(url||'').match(/[-\w]{20,}/); return match?match[0]:''; }
function safeName_(name) { return String(name||'Hidrante').replace(/[\\/:*?"<>|]/g,'-').trim().slice(0,100); }
function truthy_(value) { return value===true || ['true','si','sí','1'].includes(String(value||'').toLowerCase()); }
