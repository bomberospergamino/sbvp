const AGENDA_SHEET_ID = '1mL001zRLde_c8AEBHh3bjxCBW9ym99BTjybKVUbT24I';
const AGENDA_SHEET_NAME = 'BASE';
const ADMIN_PIN_PROPERTY = 'AGENDA_ADMIN_PIN';
const TOKEN_TTL_SECONDS = 21600;

function doGet(e) {
  try {
    const action = String((e && e.parameter && e.parameter.action) || 'list');
    if (action !== 'list') return jsonOutput({ ok: false, error: 'Acción no válida.' });
    return jsonOutput({ ok: true, contacts: readContacts(), updatedAt: new Date().toISOString() });
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message || String(error) });
  }
}

function doPost(e) {
  try {
    const payload = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (payload.action === 'adminLogin') return jsonOutput(adminLogin(payload.pin));
    if (!isValidToken(payload.token)) return jsonOutput({ ok: false, code: 'UNAUTHORIZED', error: 'La sesión administrativa venció. Ingresá nuevamente.' });
    if (payload.action === 'add') return jsonOutput(addContact(payload.data));
    if (payload.action === 'update') return jsonOutput(updateContact(payload.data));
    return jsonOutput({ ok: false, error: 'Acción no válida.' });
  } catch (error) {
    return jsonOutput({ ok: false, error: error.message || String(error) });
  }
}

function readContacts() {
  const sheet = getAgendaSheet();
  const values = sheet.getDataRange().getDisplayValues();
  if (values.length < 2) return [];
  const column = getColumns(values[0]);
  return values.slice(1).map(function (row, index) {
    return {
      id: String(index + 2),
      category: String(row[column.category] || '').trim(),
      name: String(row[column.name] || '').trim(),
      role: String(row[column.role] || '').trim(),
      phone: String(row[column.phone] || '').trim()
    };
  }).filter(function (contact) { return contact.name && contact.phone; });
}

function addContact(data) {
  const contact = validateContact(data);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getAgendaSheet();
    const column = getColumns(sheet.getRange(1, 1, 1, sheet.getLastColumn()).getDisplayValues()[0]);
    const row = new Array(sheet.getLastColumn()).fill('');
    row[column.category] = contact.category;
    row[column.name] = contact.name;
    row[column.role] = contact.role;
    row[column.phone] = contact.phone;
    sheet.appendRow(row);
    SpreadsheetApp.flush();
    return { ok: true, id: String(sheet.getLastRow()) };
  } finally { lock.releaseLock(); }
}

function updateContact(data) {
  const contact = validateContact(data);
  const requestedRow = Number(data && data.id);
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const sheet = getAgendaSheet();
    const values = sheet.getDataRange().getDisplayValues();
    const column = getColumns(values[0]);
    let rowNumber = findSourceRow(values, column, requestedRow, data.sourceName, data.sourcePhone);
    if (!rowNumber) throw new Error('El contacto cambió en la planilla. Actualizá la agenda y volvé a intentarlo.');
    sheet.getRange(rowNumber, column.category + 1).setValue(contact.category);
    sheet.getRange(rowNumber, column.name + 1).setValue(contact.name);
    sheet.getRange(rowNumber, column.role + 1).setValue(contact.role);
    sheet.getRange(rowNumber, column.phone + 1).setValue(contact.phone);
    SpreadsheetApp.flush();
    return { ok: true, id: String(rowNumber) };
  } finally { lock.releaseLock(); }
}

function findSourceRow(values, column, requestedRow, sourceName, sourcePhone) {
  const matches = function (row) {
    return String(row[column.name] || '').trim() === String(sourceName || '').trim() && String(row[column.phone] || '').trim() === String(sourcePhone || '').trim();
  };
  if (requestedRow >= 2 && requestedRow <= values.length && matches(values[requestedRow - 1])) return requestedRow;
  for (let index = 1; index < values.length; index += 1) if (matches(values[index])) return index + 1;
  return 0;
}

function validateContact(data) {
  const contact = {
    category: String((data && data.category) || '').trim(),
    name: String((data && data.name) || '').trim(),
    role: String((data && data.role) || '').trim(),
    phone: String((data && data.phone) || '').trim()
  };
  if (!contact.name || !contact.category || !contact.role || !contact.phone) throw new Error('Completá nombre, categoría, rol y teléfono.');
  if (contact.name.length > 120 || contact.category.length > 100 || contact.role.length > 100 || contact.phone.length > 60) throw new Error('Uno de los campos supera el largo permitido.');
  return contact;
}

function adminLogin(pin) {
  const expected = PropertiesService.getScriptProperties().getProperty(ADMIN_PIN_PROPERTY);
  if (!expected) return { ok: false, error: 'Todavía no se configuró la clave administrativa.' };
  if (String(pin || '') !== expected) return { ok: false, error: 'Clave incorrecta.' };
  const token = Utilities.getUuid() + Utilities.getUuid();
  CacheService.getScriptCache().put('agenda-token-' + token, '1', TOKEN_TTL_SECONDS);
  return { ok: true, token: token, expiresIn: TOKEN_TTL_SECONDS };
}

function isValidToken(token) {
  return Boolean(token && CacheService.getScriptCache().get('agenda-token-' + token));
}

function getAgendaSheet() {
  const sheet = SpreadsheetApp.openById(AGENDA_SHEET_ID).getSheetByName(AGENDA_SHEET_NAME);
  if (!sheet) throw new Error('No se encontró la hoja BASE.');
  return sheet;
}

function getColumns(headers) {
  const normalized = headers.map(normalizeHeader);
  const column = { category: normalized.indexOf('categoria'), name: normalized.indexOf('nombre y apellido'), role: normalized.indexOf('rol'), phone: normalized.indexOf('telefono') };
  Object.keys(column).forEach(function (key) { if (column[key] < 0) throw new Error('Falta una columna requerida en la agenda: ' + key); });
  return column;
}

function normalizeHeader(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();
}

function jsonOutput(payload) {
  return ContentService.createTextOutput(JSON.stringify(payload)).setMimeType(ContentService.MimeType.JSON);
}
