const ADMIN_PASSWORD = '1105';
const GOOGLE_SHEET_ID = '1ZXYNwSNQjDOsISQLcc0bNGg5qR93j0WyXaY6dvhmXlk';
const APP_VERSION = 'brigadas-calendario-rango-visible-22';
const CALENDAR_SYNC_INTERVAL_MS = 30000;
const GOOGLE_SHEET_EXPORT_URL = `https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/export?format=xlsx`;
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyLv47WN0kWtizeiN4ssvq9F25v5xLw879lGAyxPhIROCjf5mv9z_LysiIqNBySfo3fVg/exec';
const GOOGLE_SHEET_NAMES = [
  'CONFIG_BRIGADAS',
  'PERSONAL',
  'ENCUENTROS',
  'ASISTENCIAS',
  'DETALLE_ASISTENCIAS',
  'EQUIPAMIENTO',
  'CHECK_EQUIPAMIENTO',
  'DETALLE_CHECK_EQUIPAMIENTO',
  'NECESIDADES',
  'HISTORIAL_ACCIONES',
  'PARAMETROS',
];
const VALID_MEETING_STATES = new Set(['programado', 'realizado', 'reprogramado']);
const BRIGADES_FALLBACK = [
  { id_brigada: 'rescate_acuatico', nombre_brigada: 'Rescate acuatico', columna_personal: 'rescate_acuatico', logo_file: 'rescateacuatico_logo.jpeg', color: '#0077B6', activa: 'SI', orden: 1 },
  { id_brigada: 'buceo', nombre_brigada: 'Buceo', columna_personal: 'buceo', logo_file: 'buceo_logo.jpeg', color: '#003566', activa: 'SI', orden: 2 },
  { id_brigada: 'k9', nombre_brigada: 'K9', columna_personal: 'k9', logo_file: 'k9_logo.jpeg', color: '#D00000', activa: 'SI', orden: 3 },
  { id_brigada: 'mat_pel', nombre_brigada: 'Mat Pel', columna_personal: 'mat_pel', logo_file: 'matpel_logo.jpeg', color: '#70E000', activa: 'SI', orden: 4 },
  { id_brigada: 'altura', nombre_brigada: 'Altura', columna_personal: 'altura', logo_file: 'altura_logo.jpeg', color: '#B5179E', activa: 'SI', orden: 5 },
  { id_brigada: 'socorrismo', nombre_brigada: 'Socorrismo', columna_personal: 'socorrismo', logo_file: 'socorrismo_logo.jpeg', color: '#E85D04', activa: 'SI', orden: 6 },
  { id_brigada: 'brec', nombre_brigada: 'BREC', columna_personal: 'brec', logo_file: 'brec_logo.jpeg', color: '#6C584C', activa: 'SI', orden: 7 },
];
const EQUIPMENT_EXAMPLES = [
  { ubicacion: 'MÃ³vil / DepÃ³sito', elemento: 'Bolso operativo', unidades: '1', cantidad_ok_no: 'OK', estado_bueno_malo: 'BUENO', observaciones: 'Ejemplo de carga' },
  { ubicacion: 'MÃ³vil / DepÃ³sito', elemento: 'Guantes de trabajo', unidades: '4 pares', cantidad_ok_no: 'OK', estado_bueno_malo: 'BUENO', observaciones: 'Ejemplo de carga' },
];

const MATPEL_BIBLIOGRAPHY = [
  { label: 'General', url: 'https://drive.google.com/drive/folders/1Jn3Zg-V2umhoep5QKUiO3SPoiXm3VZUQ?usp=sharing' },
  { label: 'Identificacion', url: 'https://drive.google.com/drive/folders/1RLG5BTS_p_zFKUS3ye8ZhytzGvplL_QW?usp=drive_link' },
  { label: 'Material complementario', url: 'https://drive.google.com/drive/folders/17g4oBDcsGCvQXkPuojPtZvTVVnx-7ECp?usp=drive_link' },
];

const state = {
  sheets: {},
  selectedBrigade: 'rescate_acuatico',
  calendarDate: new Date(),
  adminMonth: monthKey(new Date()),
  adminPeriodType: 'month',
  adminYear: String(new Date().getFullYear()),
  currentFileName: '',
  localMeetings: loadStoredMeetings(),
  editingEventId: '',
};

document.addEventListener('DOMContentLoaded', () => {
  bindEvents();
  renderAll();
  loadGoogleSheet();
  startCalendarSync();
});

function bindEvents() {
  document.getElementById('workbookInput').addEventListener('change', handleWorkbookUpload);
  document.getElementById('reloadSheetButton').addEventListener('click', loadGoogleSheet);
  document.querySelectorAll('.nav-button').forEach((button) => button.addEventListener('click', () => openView(button.dataset.view)));
  document.querySelectorAll('[data-view-jump]').forEach((button) => button.addEventListener('click', () => openView(button.dataset.viewJump)));
  document.getElementById('adminButton').addEventListener('click', requestAdminAccess);
  document.getElementById('adminForm').addEventListener('submit', handleAdminSubmit);
  document.getElementById('backToBrigadesButton').addEventListener('click', closeBrigadeDetail);
  document.getElementById('prevMonthButton').addEventListener('click', () => changeMonth(-1));
  document.getElementById('nextMonthButton').addEventListener('click', () => changeMonth(1));
  document.getElementById('homePrevMonthButton').addEventListener('click', () => changeMonth(-1));
  document.getElementById('homeNextMonthButton').addEventListener('click', () => changeMonth(1));
  document.getElementById('homeCalendarPrevInner').addEventListener('click', () => changeMonth(-1));
  document.getElementById('homeCalendarNextInner').addEventListener('click', () => changeMonth(1));
  document.getElementById('calendarPrevInner').addEventListener('click', () => changeMonth(-1));
  document.getElementById('calendarNextInner').addEventListener('click', () => changeMonth(1));
  document.getElementById('todayButton').addEventListener('click', () => {
    state.calendarDate = new Date();
    renderCalendar();
  });
  document.getElementById('downloadCalendarButton').addEventListener('click', exportarCalendarioPNG);
  document.getElementById('shareCalendarButton').addEventListener('click', compartirCalendarioPNG);
  document.getElementById('printCalendarButton').addEventListener('click', () => window.print());
  document.getElementById('scheduleMeetingButton').addEventListener('click', () => openScheduleDialog());
  document.getElementById('homeScheduleButton').addEventListener('click', () => openScheduleDialog());
  document.getElementById('adminNewEventButton').addEventListener('click', () => openScheduleDialog());
  document.getElementById('scheduleForm').addEventListener('submit', handleScheduleSubmit);
  document.getElementById('membersDownloadButton').addEventListener('click', descargarIntegrantesBrigada);
  document.getElementById('downloadLogoButton').addEventListener('click', descargarLogoBrigada);
  document.getElementById('saveAttendanceButton').addEventListener('click', () => generarPDFAsistencia(true));
  document.getElementById('saveEquipmentCheckButton').addEventListener('click', generarPDFCheckEquipamiento);
  document.getElementById('downloadEquipmentPdfButton').addEventListener('click', () => generarPDFCheckEquipamiento(false));
  document.getElementById('downloadEquipmentExcelButton').addEventListener('click', descargarEquipamientoExcel);
  document.getElementById('sendCertificateButton').addEventListener('click', enviarCertificado);
  document.querySelectorAll('[data-brigade-panel]').forEach((button) => {
    button.addEventListener('click', () => openBrigadePanel(button.dataset.brigadePanel));
  });
  document.getElementById('exportCsvButton').addEventListener('click', exportAdminCsv);
  document.getElementById('exportAdminPdfButton').addEventListener('click', exportAdminPdf);
  ['adminPeriodType', 'adminYear', 'adminMonth', 'adminBrigadeFilter', 'adminStateFilter', 'onlyMissingFilter', 'onlyHighFilter'].forEach((id) => {
    document.getElementById(id).addEventListener('change', renderAdmin);
  });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) syncCalendarFromOnline();
  });
}

let calendarSyncTimer = null;
let calendarSyncInProgress = false;

function startCalendarSync() {
  clearInterval(calendarSyncTimer);
  calendarSyncTimer = setInterval(() => {
    if (!document.hidden) syncCalendarFromOnline();
  }, CALENDAR_SYNC_INTERVAL_MS);
}

async function fetchSharedCalendar() {
  let payload = await loadJsonp(`${APPS_SCRIPT_URL}?action=read_calendar&cacheBust=${Date.now()}`);
  if (!payload?.sheets?.ENCUENTROS) {
    payload = await loadJsonp(`${APPS_SCRIPT_URL}?action=read_all&cacheBust=${Date.now()}`);
  }
  if (!payload?.ok || !payload.sheets?.ENCUENTROS) {
    throw new Error(payload?.error || 'No se pudo leer el calendario compartido');
  }
  return payload.sheets;
}

async function syncCalendarFromOnline(showFeedback = false) {
  if (calendarSyncInProgress) return false;
  calendarSyncInProgress = true;
  try {
    const sharedSheets = await fetchSharedCalendar();
    state.sheets = { ...state.sheets, ...sharedSheets };
    clearSyncedLocalMeetings();
    renderCalendar();
    renderAdmin();
    if (showFeedback) showAppToast('Calendario actualizado para todos.', 'success');
    return true;
  } catch (error) {
    console.warn('No se pudo actualizar el calendario compartido', error);
    if (showFeedback) showAppToast('No se pudo actualizar el calendario online.', 'warning');
    return false;
  } finally {
    calendarSyncInProgress = false;
  }
}

async function handleWorkbookUpload(event) {
  const file = event.target.files[0];
  if (!file) return;
  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    state.sheets = {};
    workbook.SheetNames.forEach((name) => {
      state.sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '', raw: false });
    });
    state.currentFileName = file.name;
    validateRequiredSheets();
    setDataStatus(`Excel cargado: ${file.name}`);
    renderAll();
  } catch (error) {
    console.error(error);
    setDataStatus(`Error al leer Excel: ${error.message}`);
  }
}

async function loadGoogleSheet() {
  if (!window.XLSX) return;
  setDataStatus('Leyendo Google Sheets...');
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 6000);
    const response = await fetch(`${GOOGLE_SHEET_EXPORT_URL}&cacheBust=${Date.now()}`, { signal: controller.signal });
    clearTimeout(timer);
    if (!response.ok) {
      throw new Error(`Google Sheets respondio ${response.status}`);
    }
    const data = await response.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array', cellDates: true });
    state.sheets = {};
    workbook.SheetNames.forEach((name) => {
      state.sheets[name] = XLSX.utils.sheet_to_json(workbook.Sheets[name], { defval: '', raw: false });
    });
    clearSyncedLocalMeetings();
    state.currentFileName = 'Google Sheets Brigadas';
    validateRequiredSheets();
    setDataStatus('Datos cargados desde Google Sheets');
    renderAll();
  } catch (error) {
    try {
      await loadGoogleSheetFromAppsScript();
      setDataStatus('Datos cargados desde Google Sheets');
      renderAll();
    } catch (fallbackError) {
      try {
        await loadGoogleSheetsByJsonp();
        setDataStatus('Datos cargados desde Google Sheets');
        renderAll();
      } catch (lastError) {
        console.warn('No se pudo leer Google Sheets', error, fallbackError, lastError);
        setDataStatus('No se pudo leer Google Sheets. Revisar permisos o usar Cargar Excel.');
      }
    }
  }
}

async function loadGoogleSheetFromAppsScript() {
  const payload = await loadJsonp(`${APPS_SCRIPT_URL}?action=read_all`);
  if (!payload.ok || !payload.sheets) throw new Error(payload.error || 'Respuesta invalida del Web App');
  state.sheets = payload.sheets;
  clearSyncedLocalMeetings();
  state.currentFileName = 'Google Sheets Brigadas';
  validateRequiredSheets();
}

async function loadGoogleSheetsByJsonp() {
  const entries = await Promise.all(GOOGLE_SHEET_NAMES.map(async (sheetName) => {
    try {
      const rows = await loadGoogleSheetTab(sheetName);
      return [sheetName, rows];
    } catch (error) {
      if (['CONFIG_BRIGADAS', 'PERSONAL', 'ENCUENTROS'].includes(sheetName)) throw error;
      return [sheetName, []];
    }
  }));
  state.sheets = Object.fromEntries(entries);
  clearSyncedLocalMeetings();
  state.currentFileName = 'Google Sheets Brigadas';
  validateRequiredSheets();
}

function loadGoogleSheetTab(sheetName) {
  const url = new URL(`https://docs.google.com/spreadsheets/d/${GOOGLE_SHEET_ID}/gviz/tq`);
  url.searchParams.set('sheet', sheetName);
  return loadJsonp(url.toString()).then((payload) => {
    if (payload.status === 'error') {
      throw new Error(payload.errors?.[0]?.detailed_message || `No se pudo leer ${sheetName}`);
    }
    return gvizTableToRows(payload.table);
  });
}

function loadJsonp(baseUrl) {
  return new Promise((resolve, reject) => {
    const callbackName = `brigadasJsonp_${Date.now()}_${Math.round(Math.random() * 10000)}`;
    const script = document.createElement('script');
    const url = new URL(baseUrl);
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error('Tiempo agotado leyendo Apps Script'));
    }, 20000);
    if (url.hostname.includes('docs.google.com')) {
      url.searchParams.set('tqx', `out:json;responseHandler:${callbackName}`);
    } else {
      url.searchParams.set('callback', callbackName);
    }
    window[callbackName] = (payload) => {
      cleanup();
      resolve(payload);
    };
    script.onerror = () => {
      cleanup();
      reject(new Error('No se pudo cargar JSONP'));
    };
    function cleanup() {
      clearTimeout(timer);
      delete window[callbackName];
      script.remove();
    }
    script.src = url.toString();
    document.head.appendChild(script);
  });
}

function gvizTableToRows(table) {
  const headers = (table.cols || []).map((col) => normalizeHeader(col.label || col.id));
  return (table.rows || []).map((row) => {
    const output = {};
    headers.forEach((header, index) => {
      if (!header) return;
      const cell = row.c?.[index];
      output[header] = cell?.f ?? cell?.v ?? '';
    });
    return output;
  }).filter((row) => Object.values(row).some((value) => value !== ''));
}

function validateRequiredSheets() {
  ['CONFIG_BRIGADAS', 'PERSONAL', 'ENCUENTROS'].forEach((sheet) => {
    if (!state.sheets[sheet]) console.warn(`Falta la hoja ${sheet}`);
  });
}

function renderAll() {
  if (!getBrigadasActivas().some((b) => b.id_brigada === state.selectedBrigade)) {
    state.selectedBrigade = getBrigadasActivas()[0]?.id_brigada || '';
  }
  renderNavigation();
  renderBrigades();
  renderMembers();
  if (!document.getElementById('brigadeDetail')?.classList.contains('hidden')) {
    renderEquipment();
    renderCertificates();
    renderBibliography();
  }
  renderCalendar();
  setupAdminFilters();
  setupScheduleOptions();
  renderAdmin();
}

function openView(viewId) {
  if (viewId === 'adminView' && sessionStorage.getItem('brigadasAdmin') !== '1') {
    requestAdminAccess();
    return;
  }
  if (viewId !== 'brigadasView') closeBrigadeDetail(false);
  document.querySelectorAll('.view').forEach((view) => view.classList.toggle('active', view.id === viewId));
  document.querySelectorAll('.nav-button').forEach((button) => button.classList.toggle('active', button.dataset.view === viewId));
  if (viewId === 'adminView') loadGoogleSheet();
}

function requestAdminAccess() {
  if (sessionStorage.getItem('brigadasAdmin') === '1') {
    openView('adminView');
    return;
  }
  document.getElementById('adminPassword').value = '';
  document.getElementById('adminError').classList.add('hidden');
  document.getElementById('adminDialog').showModal();
}

function handleAdminSubmit(event) {
  event.preventDefault();
  if (document.getElementById('adminPassword').value === ADMIN_PASSWORD) {
    sessionStorage.setItem('brigadasAdmin', '1');
    document.querySelector('[data-view="adminView"]')?.classList.remove('locked');
    document.getElementById('adminDialog').close();
    openView('adminView');
  } else {
    document.getElementById('adminError').classList.remove('hidden');
  }
}

function renderNavigation() {
  document.querySelector('[data-view="adminView"]')?.classList.toggle('locked', sessionStorage.getItem('brigadasAdmin') !== '1');
}

function renderBrigades() {
  const cards = document.getElementById('brigadeCards');
  cards.innerHTML = '';
  getBrigadasActivas().forEach((brigade) => {
    const card = document.createElement('article');
    card.className = `brigade-card${brigade.id_brigada === state.selectedBrigade ? ' active' : ''}`;
    card.style.borderLeftColor = brigade.color || '#8d1619';
    card.innerHTML = `
      <img src="${logoPath(brigade)}" alt="">
      <div>
        <strong>${brigade.nombre_brigada}</strong>
        <p></p>
      </div>
    `;
    card.addEventListener('click', () => {
      if (state.selectedBrigade !== brigade.id_brigada) {
        document.getElementById('attendanceTopic').value = '';
        document.getElementById('attendanceNotes').value = '';
      }
      state.selectedBrigade = brigade.id_brigada;
      renderBrigades();
      renderMembers();
      renderEquipment();
      renderCertificates();
      renderBibliography();
      openBrigadePanel('membersPanel');
      document.getElementById('brigadeDetail').classList.remove('hidden');
      document.body.classList.add('brigade-open');
      document.getElementById('brigadeDetail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    cards.appendChild(card);
  });
}

function renderMembers() {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  if (!brigade) return;
  const members = getIntegrantesBrigada(brigade.id_brigada);
  const tbody = document.getElementById('membersTable');
  const list = document.getElementById('membersList');
  const warning = document.getElementById('attendanceWarning');
  document.getElementById('selectedBrigadeTitle').textContent = brigade.nombre_brigada;
  document.getElementById('selectedBrigadeMeta').textContent = '';
  tbody.innerHTML = '';
  list.innerHTML = '';
  warning.classList.toggle('hidden', members.length > 0);
  warning.textContent = members.length ? '' : 'Advertencia: esta brigada no tiene integrantes cargados en PERSONAL.';
  document.getElementById('membersCount').textContent = `Integrantes: ${members.length}`;
  members.forEach((person, index) => {
    const name = [person.apellido, person.nombre].filter(Boolean).join(', ') || person.bombero || 'Sin nombre';
    const item = document.createElement('div');
    item.className = 'simple-item';
    item.innerHTML = `<strong>${escapeHtml(name)}</strong><span>${escapeHtml(person.legajo || '')}</span>`;
    list.appendChild(item);
    const row = document.createElement('tr');
    row.innerHTML = `
      <td>${escapeHtml(name)}</td>
      <td>${escapeHtml(person.legajo || '')}</td>
      <td>${escapeHtml(person.jerarquia || '')}</td>
      <td><input name="att-${index}" type="radio" value="P"></td>
      <td><input name="att-${index}" type="radio" value="A"></td>
      <td><input name="att-${index}" type="radio" value="Just."></td>
      <td><input type="text" data-observation="${index}" placeholder="Observacion"></td>
    `;
    tbody.appendChild(row);
  });
}

function openBrigadePanel(panelId) {
  if (panelId === 'equipmentPanel') renderEquipment();
  if (panelId === 'certificatesPanel') renderCertificates();
  if (panelId === 'bibliographyPanel') renderBibliography();
  document.querySelectorAll('.brigade-panel').forEach((panel) => panel.classList.toggle('active', panel.id === panelId));
  document.querySelectorAll('[data-brigade-panel]').forEach((button) => button.classList.toggle('active', button.dataset.brigadePanel === panelId));
}

function closeBrigadeDetail(scrollTop = true) {
  document.body.classList.remove('brigade-open');
  document.getElementById('brigadeDetail')?.classList.add('hidden');
  if (scrollTop) document.getElementById('brigadeCards')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function renderBrigadeMetrics() {
  if (!document.getElementById('brigadeMetrics')) return;
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  const month = monthKey(state.calendarDate);
  const row = calcularResumenAdmin(month).find((item) => item.id_brigada === state.selectedBrigade);
  const members = getIntegrantesBrigada(state.selectedBrigade).length;
  document.getElementById('brigadeMetrics').innerHTML = [
    ['Integrantes', members],
    ['Reunion mensual', row?.cumple_encuentro_mensual ? 'OK' : 'Falta'],
    ['Asistencia', `${row?.porcentaje_asistencia || 0}%`],
    ['Necesidades', row?.necesidades_pendientes || 0],
    ['Estado', row?.estado_general || 'Sin datos'],
  ].map(([label, value]) => `<article class="kpi-card"><span>${label}</span><strong>${escapeHtml(value)}</strong></article>`).join('');
  if (brigade) document.getElementById('selectedBrigadeTitle').textContent = brigade.nombre_brigada;
}

function renderEquipmentLegacy() {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  const realRows = getEquipamientoBrigada(state.selectedBrigade);
  const rows = realRows.length ? realRows : EQUIPMENT_EXAMPLES.map((item) => ({ ...item, brigada: brigade?.nombre_brigada }));
  const container = document.getElementById('equipmentContainer');
  const grouped = new Map();
  rows.forEach((row) => {
    const key = row.ubicacion || 'Sin ubicacion';
    if (!grouped.has(key)) grouped.set(key, []);
    grouped.get(key).push(row);
  });
  container.innerHTML = `${realRows.length ? '' : '<div class="notice">Ejemplos de carga. Para que sea real, cargÃ¡ la hoja EQUIPAMIENTO.</div>'}` + Array.from(grouped, ([ubicacion, items]) => `
    <section class="equipment-location">
      <h3>${escapeHtml(ubicacion)}</h3>
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Elemento</th>
              <th>Un.</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Obs.</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((item, index) => `
              <tr data-equipment-row="1">
                <td>${escapeHtml(item.elemento || '')}</td>
                <td>${escapeHtml(item.unidades || '')}</td>
                <td>
                  <select data-eq-field="cantidad">
                    <option>Bien</option>
                    <option>Hay menos</option>
                    <option>Hay mas</option>
                  </select>
                </td>
                <td>
                  <select data-eq-field="estado">
                    <option>Bueno</option>
                    <option>Regular</option>
                    <option>Malo</option>
                  </select>
                </td>
                <td><input data-eq-field="obs" type="text" placeholder="Obs..."></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `).join('');
}

function renderEquipment() {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  const realRows = getEquipamientoBrigada(state.selectedBrigade);
  const rows = realRows.length ? realRows : EQUIPMENT_EXAMPLES.map((item) => ({ ...item, brigada: brigade?.nombre_brigada }));
  const container = document.getElementById('equipmentContainer');
  container.innerHTML = `${realRows.length ? '' : '<div class="notice">Ejemplos de carga. Para que sea real, carga la hoja EQUIPAMIENTO.</div>'}
    <section class="equipment-location">
      <h3>${escapeHtml(brigade?.nombre_brigada || 'Equipamiento')}</h3>
      <div class="table-wrap">
        <table class="equipment-check-table">
          <thead>
            <tr>
              <th>Elemento</th>
              <th>Unidad</th>
              <th>Cantidad</th>
              <th>Estado</th>
              <th>Observaciones</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map((item) => `
              <tr data-equipment-row="1">
                <td>
                  <strong>${escapeHtml(item.elemento || '')}</strong>
                  <small>${escapeHtml(item.ubicacion || '')}</small>
                </td>
                <td>${escapeHtml(item.unidades || item.unidad || item.cantidad || '')}</td>
                <td>
                  <select data-eq-field="cantidad">
                    <option>OK</option>
                    <option>Faltante</option>
                    <option>Sobra</option>
                  </select>
                </td>
                <td>
                  <select data-eq-field="estado">
                    <option>Bueno</option>
                    <option>Regular</option>
                    <option>Malo</option>
                  </select>
                </td>
                <td><input data-eq-field="obs" type="text" placeholder="Obs..."></td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    </section>
  `;
}

function renderCertificates() {
  const select = document.getElementById('certificateMember');
  select.innerHTML = '';
  getIntegrantesBrigada(state.selectedBrigade).forEach((person) => {
    const name = [person.apellido, person.nombre].filter(Boolean).join(', ') || person.bombero || person.legajo || 'Sin nombre';
    select.add(new Option(name, person.legajo || name));
  });
}

function renderBibliography() {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  const links = getBibliographyItems(brigade);
  const container = document.getElementById('bibliographyLinks');
  container.innerHTML = links.length
    ? links.map((item) => `<a class="simple-item bibliography-button" href="${escapeHtml(item.url)}" target="_blank" rel="noreferrer"><strong>${escapeHtml(item.label)}</strong></a>`).join('')
    : '<div class="simple-item"><strong>Material 1</strong><span>Pendiente de link</span></div><div class="simple-item"><strong>Material 2</strong><span>Pendiente de link</span></div>';
}

function getBibliographyItems(brigade) {
  if (brigade?.id_brigada === 'mat_pel') return MATPEL_BIBLIOGRAPHY;
  const raw = brigade?.bibliografia_url || brigade?.link_bibliografia || brigade?.bibliografia || '';
  return String(raw).split(/[\n,]+/).map((item, index) => {
    const text = item.trim();
    if (!text) return null;
    const parts = text.split('|').map((part) => part.trim()).filter(Boolean);
    return parts.length >= 2 ? { label: parts[0], url: parts.slice(1).join('|') } : { label: `Material ${index + 1}`, url: text };
  }).filter(Boolean);
}

function renderCalendar() {
  const selectedMonth = monthKey(state.calendarDate);
  const visibleDates = calendarWeekdays(state.calendarDate);
  const meetings = getEncuentrosRango(visibleDates[0], visibleDates[visibleDates.length - 1]);
  const missing = getBrigadasSinEncuentro(selectedMonth);
  renderCalendarInto({
    gridId: 'calendarGrid',
    titleId: 'calendarTitle',
    counterId: 'calendarCounter',
    missingId: 'missingMeetings',
    selectedMonth,
    visibleDates,
    meetings,
    missing,
  });
  renderCalendarInto({
    gridId: 'homeCalendarGrid',
    titleId: 'homeCalendarTitle',
    counterId: 'homeCalendarCounter',
    missingId: 'homeMissingMeetings',
    selectedMonth,
    visibleDates,
    meetings,
    missing,
  });
  const covered = getBrigadasActivas().length - missing.length;
  document.getElementById('homeCoveredCount').textContent = `${covered} / ${getBrigadasActivas().length}`;
}

function renderCalendarInto({ gridId, titleId, counterId, missingId, selectedMonth, visibleDates, meetings, missing }) {
  const grid = document.getElementById(gridId);
  grid.innerHTML = '';
  [
    ['Lunes', 'Lun'],
    ['Martes', 'Mar'],
    ['Miercoles', 'Mie'],
    ['Jueves', 'Jue'],
    ['Viernes', 'Vie'],
    ['Sabado', 'Sab'],
    ['Domingo', 'Dom'],
  ].forEach(([day, shortDay]) => {
    const head = document.createElement('div');
    head.className = 'day-head';
    head.dataset.short = shortDay;
    head.textContent = day;
    grid.appendChild(head);
  });
  visibleDates.forEach((date) => {
    const cell = document.createElement('div');
    const isCurrentMonth = monthKey(date) === selectedMonth;
    cell.className = `day-cell${isCurrentMonth ? '' : ' outside'}`;
    cell.innerHTML = `<div class="day-number">${date.getDate()}</div>`;
    meetings.filter((meeting) => sameDay(parseDate(meeting.fecha), date)).forEach((meeting) => {
      const pill = document.createElement('span');
      pill.className = `event-pill ${normalizeState(meeting.estado)}`;
      const brigade = getBrigadasActivas().find((item) => item.id_brigada === meeting.id_brigada);
      const hour = meeting.hora_inicio || '';
      const brigadeLabel = meeting.brigada || brigade?.nombre_brigada || meeting.id_brigada || 'Brigada';
      const topic = meeting.tema || 'Encuentro mensual';
      pill.title = `${brigadeLabel} · ${hour} · ${topic}`;
      pill.innerHTML = `
        <img src="${logoPath(brigade || {})}" alt="">
        <span class="event-details">
          <strong>${escapeHtml(brigadeLabel)}</strong>
          <span>${escapeHtml(topic)}</span>
        </span>
        <span class="event-hour">${escapeHtml(hour)}</span>
      `;
      cell.appendChild(pill);
    });
    grid.appendChild(cell);
  });
  const covered = getBrigadasActivas().length - missing.length;
  document.getElementById(titleId).textContent = state.calendarDate.toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  document.getElementById(counterId).textContent = `Encuentros mensuales cubiertos: ${covered} / ${getBrigadasActivas().length}`;
  document.getElementById(missingId).textContent = missing.length
    ? `Falta programar encuentro mensual para: ${missing.map((b) => b.nombre_brigada).join(', ')}`
    : 'Todas las brigadas tienen encuentro mensual programado';
}

function setupAdminFilters() {
  const periodType = document.getElementById('adminPeriodType');
  const year = document.getElementById('adminYear');
  const month = document.getElementById('adminMonth');
  const brigade = document.getElementById('adminBrigadeFilter');
  const status = document.getElementById('adminStateFilter');
  const selectedMonth = state.adminMonth || monthKey(new Date());
  const years = getAvailableMetricYears();
  year.innerHTML = '';
  years.forEach((value) => year.add(new Option(String(value), String(value))));
  year.value = state.adminYear || selectedMonth.slice(0, 4);
  month.innerHTML = '';
  Array.from({ length: 12 }, (_, index) => {
    const date = new Date(2020, index, 1);
    month.add(new Option(date.toLocaleDateString('es-AR', { month: 'long' }), String(index + 1).padStart(2, '0')));
  });
  month.value = selectedMonth.slice(5, 7);
  periodType.value = state.adminPeriodType || 'month';
  brigade.innerHTML = '<option value="">Todas</option>';
  getBrigadasActivas().forEach((item) => brigade.add(new Option(item.nombre_brigada, item.id_brigada)));
  status.innerHTML = '<option value="">Todos</option><option>OK</option><option>Observado</option><option>Critico</option>';
}

function setupScheduleOptions() {
  const select = document.getElementById('scheduleBrigade');
  if (!select) return;
  const current = select.value || state.selectedBrigade;
  select.innerHTML = '';
  getBrigadasActivas().forEach((item) => select.add(new Option(item.nombre_brigada, item.id_brigada)));
  select.value = current;
}

function renderAdmin() {
  const period = getSelectedAdminPeriod();
  state.adminPeriodType = period.type;
  state.adminYear = period.year;
  state.adminMonth = `${period.year}-${period.month}`;
  document.getElementById('adminMonthLabel').classList.toggle('hidden', period.type === 'year');
  document.getElementById('adminSummaryTitle').textContent = period.type === 'year'
    ? `Métricas anuales por brigada · ${period.year}`
    : `Métricas mensuales por brigada · ${period.label}`;
  const fullSummary = calcularResumenAdminRango(period.from, period.to, period.expectedMonths);
  const summary = fullSummary.filter(filterAdminRow);
  const kpis = calculateKpis(fullSummary);
  document.getElementById('adminKpis').innerHTML = [
    ['Brigadas activas', kpis.active],
    ['Meses cubiertos', `${kpis.covered} / ${kpis.expected}`],
    ['Encuentros realizados', kpis.realized],
    ['% cumplimiento', `${kpis.meetingCompliance}%`],
    ['Meses pendientes', kpis.missing],
    ['Asistencia promedio', `${kpis.avgAttendance}%`],
    ['Indice general', `${kpis.generalIndex}%`],
    ['Necesidades pendientes', kpis.pendingNeeds],
    ['Checks criticos', kpis.criticalChecks],
  ].map(([label, value]) => `<article class="kpi-card"><span>${label}</span><strong>${value}</strong></article>`).join('');

  document.getElementById('adminTable').innerHTML = summary.map((row) => `
    <tr>
      <td>${escapeHtml(row.brigada)}</td>
      <td>${row.meses_cubiertos} / ${row.meses_esperados}</td>
      <td>${row.encuentros_realizados}</td>
      <td>${row.cantidad_asistencias}</td>
      <td>${row.total_presentes}</td>
      <td>${row.total_ausentes}</td>
      <td>${row.total_justificados}</td>
      <td>${row.porcentaje_asistencia}%</td>
      <td>${row.checks_equipamiento}</td>
      <td>${row.necesidades_pendientes}</td>
      <td><span class="badge ${row.estado_general.toLowerCase()}">${row.estado_general}</span></td>
    </tr>
  `).join('');
  renderAttendanceByPerson(period.from, period.to);
  renderAlerts(fullSummary);
  renderAdminEvents(period.from, period.to);
}

function renderAdminEvents(from, to) {
  const period = from && to ? { from, to } : getSelectedAdminPeriod();
  const rows = getEncuentrosRango(period.from, period.to).sort((a, b) => String(a.fecha).localeCompare(String(b.fecha)));
  document.getElementById('adminEventsTable').innerHTML = rows.map((event) => `
    <tr>
      <td>${escapeHtml(formatDateInput(event.fecha))}</td>
      <td>${escapeHtml(event.hora_inicio || '')}</td>
      <td>${escapeHtml(event.brigada || brigadeName(event.id_brigada))}</td>
      <td>${escapeHtml(event.estado || '')}</td>
      <td>${escapeHtml(event.tema || '')}</td>
      <td>
        <button data-edit-event="${escapeHtml(event.id_encuentro || '')}">Editar</button>
        <button data-delete-event="${escapeHtml(event.id_encuentro || '')}">Eliminar</button>
      </td>
    </tr>
  `).join('');
  document.querySelectorAll('[data-edit-event]').forEach((button) => button.addEventListener('click', () => openScheduleDialog(button.dataset.editEvent)));
  document.querySelectorAll('[data-delete-event]').forEach((button) => button.addEventListener('click', () => deleteCalendarEvent(button.dataset.deleteEvent)));
}

function openScheduleDialog(eventId = '') {
  setupScheduleOptions();
  const editing = eventId ? findMeetingById(eventId) : null;
  state.editingEventId = eventId || '';
  document.getElementById('scheduleBrigade').value = editing?.id_brigada || state.selectedBrigade || getBrigadasActivas()[0]?.id_brigada || '';
  document.getElementById('scheduleDate').value = editing ? formatDateInput(editing.fecha) : new Date().toISOString().slice(0, 10);
  document.getElementById('scheduleTime').value = editing?.hora_inicio || '20:00';
  document.getElementById('scheduleTopic').value = editing?.tema || '';
  document.getElementById('scheduleResponsible').value = editing?.responsable || '';
  document.getElementById('scheduleStatus').value = editing?.estado || 'Programado';
  document.getElementById('scheduleMessage').classList.add('hidden');
  document.getElementById('scheduleDialog').showModal();
}

function createMeetingId() {
  if (window.crypto?.randomUUID) return `enc_${window.crypto.randomUUID()}`;
  return `enc_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function handleScheduleSubmit(event) {
  event.preventDefault();
  const submitButton = document.getElementById('scheduleSubmit');
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === document.getElementById('scheduleBrigade').value);
  const payload = {
    action: state.editingEventId ? 'editar_encuentro' : 'programar_encuentro',
    id_encuentro: state.editingEventId || createMeetingId(),
    fecha: document.getElementById('scheduleDate').value,
    mes_periodo: monthKey(document.getElementById('scheduleDate').value),
    id_brigada: brigade.id_brigada,
    brigada: brigade.nombre_brigada,
    tipo_encuentro: 'Encuentro mensual',
    tema: document.getElementById('scheduleTopic').value,
    responsable: document.getElementById('scheduleResponsible').value,
    lugar: '',
    hora_inicio: document.getElementById('scheduleTime').value,
    hora_fin: '',
    estado: document.getElementById('scheduleStatus').value || 'Programado',
    observaciones: 'Cargado desde modulo Brigadas',
  };
  const message = document.getElementById('scheduleMessage');
  message.classList.add('hidden');
  submitButton.disabled = true;
  document.getElementById('scheduleDialog').close();
  showAppToast('Guardando reunion en Google Sheets...', 'loading', 0);
  try {
    await postToAppsScript(payload);
    upsertLocalMeeting(payload);
    renderCalendar();
    renderAdmin();
    showAppToast('✓ Guardado. El encuentro fue enviado a Google Sheets.', 'success', 4500);
    void refreshFromSheetsAfterSchedule(payload);
  } catch (error) {
    console.warn(error);
    state.localMeetings = state.localMeetings.filter((row) => normalizeRow(row).id_encuentro !== payload.id_encuentro);
    saveStoredMeetings();
    renderCalendar();
    renderAdmin();
    showAppToast('No pude confirmar el guardado, pero el envio fue disparado. Toca Actualizar Sheets para verificar.', 'warning', 6500);
  } finally {
    submitButton.disabled = false;
  }
}

function upsertLocalMeeting(payload) {
  const index = state.localMeetings.findIndex((row) => row.id_encuentro === payload.id_encuentro);
  if (index >= 0) state.localMeetings[index] = payload;
  else state.localMeetings.push(payload);
  saveStoredMeetings();
}

async function deleteCalendarEvent(eventId) {
  if (!eventId) return;
  const ok = window.confirm('Eliminar este encuentro del calendario?');
  if (!ok) return;
  state.localMeetings = state.localMeetings.filter((row) => row.id_encuentro !== eventId);
  saveStoredMeetings();
  if (state.sheets.ENCUENTROS) {
    state.sheets.ENCUENTROS = state.sheets.ENCUENTROS.filter((row) => normalizeRow(row).id_encuentro !== eventId);
  }
  renderCalendar();
  renderAdmin();
  const payload = { action: 'eliminar_encuentro', id_encuentro: eventId };
  await postToAppsScript(payload);
}

function loadStoredMeetings() {
  try {
    return JSON.parse(localStorage.getItem('brigadasLocalMeetings') || '[]');
  } catch (error) {
    return [];
  }
}

function saveStoredMeetings() {
  localStorage.setItem('brigadasLocalMeetings', JSON.stringify(state.localMeetings));
}

function clearSyncedLocalMeetings() {
  if (!state.localMeetings.length || !state.sheets.ENCUENTROS) return;
  const syncedIds = new Set((state.sheets.ENCUENTROS || []).map(normalizeRow).map((row) => row.id_encuentro).filter(Boolean));
  state.localMeetings = state.localMeetings.filter((row) => !syncedIds.has(normalizeRow(row).id_encuentro));
  saveStoredMeetings();
}

async function refreshFromSheetsAfterSchedule(payload) {
  try {
    await waitForCalendarWrite(payload);
  } catch (error) {
    console.warn('No se pudo refrescar Sheets despues de agendar', error);
  }
}

function meetingExistsInSheet(eventId) {
  return (state.sheets.ENCUENTROS || []).map(normalizeRow).some((row) => row.id_encuentro === eventId);
}

let toastTimer = null;

function showAppToast(message, type = 'info', duration = 3200) {
  const toast = document.getElementById('appToast');
  if (!toast) return;
  clearTimeout(toastTimer);
  toast.textContent = message;
  toast.className = `app-toast show ${type}`;
  if (duration > 0) {
    toastTimer = setTimeout(() => {
      toast.classList.remove('show');
    }, duration);
  }
}

function findMeetingById(eventId) {
  return getAllMeetings().find((row) => row.id_encuentro === eventId);
}

async function postToAppsScript(payload) {
  if (['programar_encuentro', 'editar_encuentro', 'eliminar_encuentro'].includes(payload.action)) {
    return sendCalendarAction(payload);
  }
  await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    mode: 'no-cors',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(payload),
  });
}

function buildAppsScriptUrl(payload) {
  const url = new URL(APPS_SCRIPT_URL);
  Object.entries(payload).forEach(([key, value]) => {
    if (value !== undefined && value !== null) url.searchParams.set(key, value);
  });
  return url.toString();
}

function openCalendarSaveWindow(payload) {
  try {
    return window.open(buildAppsScriptUrl(payload), 'brigadasCalendarSave', 'popup,width=560,height=560');
  } catch (error) {
    console.warn('No se pudo abrir ventana de guardado', error);
    return null;
  }
}

async function sendCalendarAction(payload) {
  submitAppsScriptForm(payload);
  return { ok: true, confirmed: false };
}

async function waitForCalendarWrite(payload) {
  const eventId = payload.id_encuentro;
  if (!eventId) return false;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    try {
      const sheets = await fetchSharedCalendar();
      const meetings = (sheets.ENCUENTROS || []).map(normalizeRow);
      const exists = meetings.some((row) => row.id_encuentro === eventId);
      if (payload.action === 'eliminar_encuentro') return !exists;
      if (exists) {
        state.sheets = { ...state.sheets, ...sheets };
        clearSyncedLocalMeetings();
        renderCalendar();
        renderAdmin();
        return true;
      }
    } catch (error) {
      console.warn('No se pudo confirmar escritura en intento', attempt + 1, error);
    }
  }
  return false;
}

function submitAppsScriptForm(payload) {
  const iframeName = `brigadasSubmit_${Date.now()}`;
  const iframe = document.createElement('iframe');
  iframe.name = iframeName;
  iframe.className = 'hidden';
  document.body.appendChild(iframe);

  const form = document.createElement('form');
  form.method = 'GET';
  form.action = APPS_SCRIPT_URL;
  form.target = iframeName;
  form.className = 'hidden';
  Object.entries(payload).forEach(([key, value]) => {
    if (value === undefined || value === null) return;
    const input = document.createElement('input');
    input.type = 'hidden';
    input.name = key;
    input.value = String(value);
    form.appendChild(input);
  });
  document.body.appendChild(form);
  form.submit();
  setTimeout(() => {
    form.remove();
    iframe.remove();
  }, 8000);
}

function renderAlerts(summary) {
  const alerts = [];
  summary.filter((row) => !row.cumple_encuentro_mensual).forEach((row) => alerts.push(`Meses sin encuentro para ${row.brigada}: ${Math.max(row.meses_esperados - row.meses_cubiertos, 0)}`));
  summary.filter((row) => row.total_convocados > 0 && row.porcentaje_asistencia < 75).forEach((row) => alerts.push(`Asistencia menor a 75%: ${row.brigada}`));
  summary.filter((row) => row.checks_criticos > 0).forEach((row) => alerts.push(`Checks criticos de equipamiento: ${row.brigada}`));
  summary.filter((row) => row.necesidades_alta_prioridad > 0).forEach((row) => alerts.push(`Necesidades de alta prioridad: ${row.brigada}`));
  detectRepeatedAbsences().forEach((item) => alerts.push(`Ausencias reiteradas: ${item.nombre} (${item.brigada})`));
  document.getElementById('alertsList').innerHTML = alerts.length
    ? alerts.map((alert) => `<div class="alert">${escapeHtml(alert)}</div>`).join('')
    : '<div class="notice">Sin alertas operativas para el filtro actual.</div>';
}

function filterAdminRow(row) {
  const brigade = document.getElementById('adminBrigadeFilter').value;
  const status = document.getElementById('adminStateFilter').value;
  const onlyMissing = document.getElementById('onlyMissingFilter').checked;
  const onlyHigh = document.getElementById('onlyHighFilter').checked;
  if (brigade && row.id_brigada !== brigade) return false;
  if (status && row.estado_general !== status) return false;
  if (onlyMissing && row.meses_cubiertos >= row.meses_esperados) return false;
  if (onlyHigh && row.necesidades_alta_prioridad === 0) return false;
  return true;
}

function getBrigadasActivas() {
  const rows = state.sheets.CONFIG_BRIGADAS?.length ? state.sheets.CONFIG_BRIGADAS : BRIGADES_FALLBACK;
  return rows
    .map(normalizeBrigade)
    .filter((b) => isYes(b.activa) && b.id_brigada)
    .sort((a, b) => Number(a.orden || 0) - Number(b.orden || 0));
}

function getBibliographyUrl(brigade) {
  const field = brigade.bibliografia_url || brigade.link_bibliografia || brigade.bibliografia;
  if (field) return field;
  return `https://www.google.com/search?q=${encodeURIComponent(`Brigada ${brigade.nombre_brigada} bomberos capacitacion`)}`;
}

function getIntegrantesBrigada(id_brigada) {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === id_brigada);
  const column = brigade?.columna_personal;
  if (!column || !state.sheets.PERSONAL) return [];
  return state.sheets.PERSONAL
    .map(normalizePerson)
    .filter((person) => isYes(person.activo || 'SI') && isMarked(person[column]));
}

function getEquipamientoBrigada(id_brigada) {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === id_brigada);
  return (state.sheets.EQUIPAMIENTO || [])
    .map(normalizeRow)
    .filter((row) => rowBelongsToBrigade(row, brigade));
}

function getEncuentrosMes(mes_periodo) {
  return getAllMeetings().filter((row) => {
    const key = row.mes_periodo || monthKey(parseDate(row.fecha));
    return key === mes_periodo;
  });
}

function getEncuentrosRango(from, to) {
  const fromDate = parseDate(from) || new Date(1900, 0, 1);
  const toDate = parseDate(to) || new Date();
  return getAllMeetings().filter((row) => {
    const date = parseDate(row.fecha);
    return date && date >= fromDate && date <= toDate;
  });
}

function getAllMeetings() {
  const map = new Map();
  const sheetRows = (state.sheets.ENCUENTROS || []).map(normalizeRow);
  const sheetIds = new Set(sheetRows.map((row) => row.id_encuentro).filter(Boolean));
  const pendingLocal = state.localMeetings.map(normalizeRow).filter((row) => !row.id_encuentro || !sheetIds.has(row.id_encuentro));
  [...sheetRows, ...pendingLocal].forEach((row) => {
    const key = row.id_encuentro || `${row.fecha}-${row.id_brigada}-${row.hora_inicio}-${row.tema}`;
    map.set(key, row);
  });
  return Array.from(map.values());
}

function rowBelongsToBrigade(row, brigade) {
  if (!brigade) return false;
  const rowBrigade = normalizeState(row.brigada || row.nombre_brigada || row.id_brigada);
  if (!rowBrigade) return false;
  const aliases = [
    brigade.id_brigada,
    brigade.nombre_brigada,
    `Brigada ${brigade.nombre_brigada}`,
    brigade.columna_personal,
    brigade.logo_file,
  ].map(normalizeState);
  const compactRow = rowBrigade.replace(/[^a-z0-9]/g, '');
  return aliases.some((alias) => {
    const compactAlias = alias.replace(/[^a-z0-9]/g, '');
    return rowBrigade === alias
      || rowBrigade.includes(alias)
      || alias.includes(rowBrigade)
      || compactRow === compactAlias
      || compactRow.includes(compactAlias)
      || compactAlias.includes(compactRow);
  });
}

function getBrigadasSinEncuentro(mes_periodo) {
  const meetings = getEncuentrosMes(mes_periodo).filter((meeting) => VALID_MEETING_STATES.has(normalizeState(meeting.estado)));
  return getBrigadasActivas().filter((brigade) => !meetings.some((meeting) => meeting.id_brigada === brigade.id_brigada));
}

function calcularResumenAdmin(mes_periodo) {
  return getBrigadasActivas().map((brigade) => {
    const validMeetings = getEncuentrosMes(mes_periodo).filter((meeting) => meeting.id_brigada === brigade.id_brigada && VALID_MEETING_STATES.has(normalizeState(meeting.estado)));
    const attendance = calcularPorcentajeAsistencia(brigade.id_brigada, mes_periodo);
    const needs = getNecesidadesPendientes(brigade.id_brigada);
    const equipment = getEstadoEquipamiento(brigade.id_brigada, mes_periodo);
    let estado = 'OK';
    if (!validMeetings.length || equipment.critical > 0) estado = 'Critico';
    else if (attendance.total > 0 && attendance.percent < 75 || needs.pending > 0) estado = 'Observado';
    return {
      mes_periodo,
      id_brigada: brigade.id_brigada,
      brigada: brigade.nombre_brigada,
      encuentros_validos_mes: validMeetings.length,
      cumple_encuentro_mensual: validMeetings.length > 0,
      cantidad_asistencias: attendance.records,
      total_convocados: attendance.total,
      total_presentes: attendance.present,
      total_ausentes: attendance.absent,
      total_justificados: attendance.justified,
      porcentaje_asistencia: attendance.percent,
      checks_equipamiento: equipment.total,
      checks_ok: equipment.ok,
      checks_observados: equipment.observed,
      checks_criticos: equipment.critical,
      necesidades_pendientes: needs.pending,
      necesidades_alta_prioridad: needs.high,
      estado_general: estado,
      ultima_actualizacion: new Date().toISOString(),
    };
  });
}

function calcularResumenAdminRango(from, to, expectedMonths = 1) {
  const meetings = getEncuentrosRango(from, to);
  return getBrigadasActivas().map((brigade) => {
    const validMeetings = meetings.filter((meeting) => meeting.id_brigada === brigade.id_brigada && VALID_MEETING_STATES.has(normalizeState(meeting.estado)));
    const realizedMeetings = meetings.filter((meeting) => meeting.id_brigada === brigade.id_brigada && normalizeState(meeting.estado) === 'realizado');
    const coveredMonths = new Set(validMeetings.map((meeting) => meeting.mes_periodo || monthKey(parseDate(meeting.fecha))).filter(Boolean)).size;
    const attendance = calcularPorcentajeAsistenciaRango(brigade.id_brigada, from, to);
    const needs = getNecesidadesPendientes(brigade.id_brigada);
    const equipment = getEstadoEquipamientoRango(brigade.id_brigada, from, to);
    let estado = 'OK';
    if (!validMeetings.length || equipment.critical > 0) estado = 'Critico';
    else if (attendance.total > 0 && attendance.percent < 75 || needs.pending > 0) estado = 'Observado';
    return {
      id_brigada: brigade.id_brigada,
      brigada: brigade.nombre_brigada,
      encuentros_validos_mes: validMeetings.length,
      encuentros_realizados: realizedMeetings.length,
      meses_cubiertos: coveredMonths,
      meses_esperados: expectedMonths,
      cumple_encuentro_mensual: coveredMonths >= expectedMonths,
      cantidad_asistencias: attendance.records,
      total_convocados: attendance.total,
      total_presentes: attendance.present,
      total_ausentes: attendance.absent,
      total_justificados: attendance.justified,
      porcentaje_asistencia: attendance.percent,
      checks_equipamiento: equipment.total,
      checks_ok: equipment.ok,
      checks_observados: equipment.observed,
      checks_criticos: equipment.critical,
      necesidades_pendientes: needs.pending,
      necesidades_alta_prioridad: needs.high,
      estado_general: estado,
    };
  });
}

function calcularPorcentajeAsistenciaRango(id_brigada, from, to) {
  const fromDate = parseDate(from) || new Date(1900, 0, 1);
  const toDate = parseDate(to) || new Date();
  const assistanceIds = (state.sheets.ASISTENCIAS || [])
    .map(normalizeRow)
    .filter((row) => {
      const date = parseDate(row.fecha);
      return row.id_brigada === id_brigada && date && date >= fromDate && date <= toDate;
    })
    .map((row) => row.id_asistencia)
    .filter(Boolean);
  const details = (state.sheets.DETALLE_ASISTENCIAS || []).map(normalizeRow).filter((row) => assistanceIds.includes(row.id_asistencia));
  const present = details.filter((row) => normalizeState(row.estado_asistencia) === 'p').length;
  const absent = details.filter((row) => normalizeState(row.estado_asistencia) === 'a').length;
  const justified = details.filter((row) => normalizeState(row.estado_asistencia) === 'just.').length;
  const total = present + absent + justified;
  return { records: assistanceIds.length, present, absent, justified, total, percent: total ? Math.round((present / total) * 100) : 0 };
}

function getEstadoEquipamientoRango(id_brigada, from, to) {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === id_brigada);
  const fromDate = parseDate(from) || new Date(1900, 0, 1);
  const toDate = parseDate(to) || new Date();
  const checks = (state.sheets.CHECK_EQUIPAMIENTO || []).map(normalizeRow).filter((row) => {
    const sameBrigade = row.id_brigada === id_brigada || normalizeState(row.brigada) === normalizeState(brigade?.nombre_brigada);
    const date = parseDate(row.fecha);
    return sameBrigade && date && date >= fromDate && date <= toDate;
  });
  return {
    total: checks.length,
    ok: checks.filter((row) => normalizeState(row.cantidad_ok_no) === 'ok' && normalizeState(row.estado_bueno_malo) === 'bueno').length,
    observed: checks.filter((row) => normalizeState(row.cantidad_ok_no) === 'no').length,
    critical: checks.filter((row) => normalizeState(row.estado_bueno_malo) === 'malo').length,
  };
}

function calcularPorcentajeAsistencia(id_brigada, mes_periodo) {
  const assistanceIds = (state.sheets.ASISTENCIAS || [])
    .map(normalizeRow)
    .filter((row) => row.id_brigada === id_brigada && (row.mes_periodo || monthKey(parseDate(row.fecha))) === mes_periodo)
    .map((row) => row.id_asistencia)
    .filter(Boolean);
  const details = (state.sheets.DETALLE_ASISTENCIAS || []).map(normalizeRow).filter((row) => assistanceIds.includes(row.id_asistencia));
  const present = details.filter((row) => normalizeState(row.estado_asistencia) === 'p').length;
  const absent = details.filter((row) => normalizeState(row.estado_asistencia) === 'a').length;
  const justified = details.filter((row) => normalizeState(row.estado_asistencia) === 'just.').length;
  const total = present + absent + justified;
  return { records: assistanceIds.length, present, absent, justified, total, percent: total ? Math.round((present / total) * 100) : 0 };
}

function getNecesidadesPendientes(id_brigada) {
  const rows = (state.sheets.NECESIDADES || []).map(normalizeRow).filter((row) => row.id_brigada === id_brigada);
  const pending = rows.filter((row) => ['pendiente', 'cotizado', 'solicitado'].includes(normalizeState(row.estado))).length;
  const high = rows.filter((row) => normalizeState(row.prioridad) === 'alta' && ['pendiente', 'cotizado', 'solicitado'].includes(normalizeState(row.estado))).length;
  return { pending, high };
}

function getEstadoEquipamiento(id_brigada, mes_periodo) {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === id_brigada);
  const checks = (state.sheets.CHECK_EQUIPAMIENTO || []).map(normalizeRow).filter((row) => {
    const sameBrigade = row.id_brigada === id_brigada || normalizeState(row.brigada) === normalizeState(brigade?.nombre_brigada);
    return sameBrigade && (row.mes_periodo || monthKey(parseDate(row.fecha))) === mes_periodo;
  });
  return {
    total: checks.length,
    ok: checks.filter((row) => normalizeState(row.cantidad_ok_no) === 'ok' && normalizeState(row.estado_bueno_malo) === 'bueno').length,
    observed: checks.filter((row) => normalizeState(row.cantidad_ok_no) === 'no').length,
    critical: checks.filter((row) => normalizeState(row.estado_bueno_malo) === 'malo').length,
  };
}

function detectRepeatedAbsences() {
  const details = (state.sheets.DETALLE_ASISTENCIAS || []).map(normalizeRow);
  const absences = new Map();
  details.filter((row) => normalizeState(row.estado_asistencia) === 'a').forEach((row) => {
    const key = row.legajo || `${row.apellido}-${row.nombre}`;
    const current = absences.get(key) || { count: 0, nombre: [row.apellido, row.nombre].filter(Boolean).join(', '), brigada: 'Brigadas' };
    current.count += 1;
    absences.set(key, current);
  });
  return Array.from(absences.values()).filter((item) => item.count >= 3);
}

async function crearImagenCalendario() {
  const node = document.getElementById('calendarExport');
  node.classList.add('export-mode');
  try {
    await Promise.all(Array.from(node.querySelectorAll('img')).map((image) => image.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
        image.addEventListener('load', resolve, { once: true });
        image.addEventListener('error', resolve, { once: true });
      })));
    const canvas = await html2canvas(node, {
      backgroundColor: '#ffffff',
      scale: 2,
      width: node.scrollWidth,
      height: node.scrollHeight,
      windowWidth: Math.max(node.scrollWidth, 1200),
      windowHeight: node.scrollHeight,
      useCORS: true,
    });
    return await new Promise((resolve, reject) => canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('No se pudo crear la imagen')), 'image/png'));
  } finally {
    node.classList.remove('export-mode');
  }
}

async function exportarCalendarioPNG() {
  setButtonLoading('downloadCalendarButton', true, 'Preparando PNG...');
  try {
    const blob = await crearImagenCalendario();
    downloadBlob(blob, `brigadas-calendario-${monthKey(state.calendarDate)}.png`, 'image/png');
    showAppToast('Calendario completo descargado en PNG.', 'success');
  } catch (error) {
    console.error(error);
    showAppToast('No se pudo generar el PNG del calendario.', 'warning');
  } finally {
    setButtonLoading('downloadCalendarButton', false);
  }
}

async function compartirCalendarioPNG() {
  setButtonLoading('shareCalendarButton', true, 'Preparando imagen...');
  try {
    const blob = await crearImagenCalendario();
    const filename = `brigadas-calendario-${monthKey(state.calendarDate)}.png`;
    const file = new File([blob], filename, { type: 'image/png' });
    if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [file] }))) {
      await navigator.share({ title: 'Calendario de brigadas', text: 'Calendario de encuentros de brigadas', files: [file] });
      showAppToast('Calendario compartido.', 'success');
    } else {
      downloadBlob(blob, filename, 'image/png');
      showAppToast('El dispositivo no permite compartir directamente; se descargó la imagen.', 'warning');
    }
  } catch (error) {
    if (error?.name !== 'AbortError') {
      console.error(error);
      showAppToast('No se pudo compartir la imagen; probá descargarla.', 'warning');
    }
  } finally {
    setButtonLoading('shareCalendarButton', false);
  }
}

function getAvailableMetricYears() {
  const years = new Set([new Date().getFullYear()]);
  ['ENCUENTROS', 'ASISTENCIAS', 'CHECK_EQUIPAMIENTO'].forEach((sheetName) => {
    (state.sheets[sheetName] || []).forEach((item) => {
      const date = parseDate(normalizeRow(item).fecha);
      if (date) years.add(date.getFullYear());
    });
  });
  return Array.from(years).sort((a, b) => b - a);
}

function getSelectedAdminPeriod() {
  const type = document.getElementById('adminPeriodType')?.value || state.adminPeriodType || 'month';
  const year = document.getElementById('adminYear')?.value || state.adminYear || String(new Date().getFullYear());
  const month = document.getElementById('adminMonth')?.value || state.adminMonth.slice(5, 7) || '01';
  if (type === 'year') {
    return { type, year, month, from: `${year}-01-01`, to: `${year}-12-31`, expectedMonths: 12, label: year };
  }
  const lastDay = new Date(Number(year), Number(month), 0).getDate();
  const label = new Date(Number(year), Number(month) - 1, 1).toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
  return { type, year, month, from: `${year}-${month}-01`, to: `${year}-${month}-${lastDay}`, expectedMonths: 1, label };
}

function renderAttendanceByPerson(from, to) {
  const brigadeFilter = document.getElementById('adminBrigadeFilter').value;
  const brigades = getBrigadasActivas().filter((brigade) => !brigadeFilter || brigade.id_brigada === brigadeFilter);
  const rows = brigades.flatMap((brigade) => calcularAsistenciaPorPersona(brigade, from, to));
  document.getElementById('attendanceByPersonTable').innerHTML = rows.length
    ? rows.map((row) => `
      <tr>
        <td>${escapeHtml(row.brigada)}</td>
        <td>${escapeHtml(row.nombre)}</td>
        <td>${row.presentes}</td>
        <td>${row.ausentes}</td>
        <td>${row.justificados}</td>
        <td>${row.total ? `${row.porcentaje}%` : 'Sin registros'}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="6">Todavía no hay integrantes o asistencias registradas para este período.</td></tr>';
}

function calcularAsistenciaPorPersona(brigade, from, to) {
  const fromDate = parseDate(from);
  const toDate = parseDate(to);
  const assistanceIds = new Set((state.sheets.ASISTENCIAS || [])
    .map(normalizeRow)
    .filter((row) => {
      const date = parseDate(row.fecha);
      return row.id_brigada === brigade.id_brigada && date && date >= fromDate && date <= toDate;
    })
    .map((row) => row.id_asistencia)
    .filter(Boolean));
  const totals = new Map();
  getIntegrantesBrigada(brigade.id_brigada).forEach((person) => {
    const nombre = [person.apellido, person.nombre].filter(Boolean).join(', ') || person.bombero || person.legajo || 'Sin nombre';
    totals.set(person.legajo || nombre, { brigada: brigade.nombre_brigada, nombre, presentes: 0, ausentes: 0, justificados: 0 });
  });
  (state.sheets.DETALLE_ASISTENCIAS || []).map(normalizeRow).filter((row) => assistanceIds.has(row.id_asistencia)).forEach((row) => {
    const nombre = [row.apellido, row.nombre].filter(Boolean).join(', ') || row.bombero || row.legajo || 'Sin nombre';
    const key = row.legajo || nombre;
    const total = totals.get(key) || { brigada: brigade.nombre_brigada, nombre, presentes: 0, ausentes: 0, justificados: 0 };
    const status = normalizeState(row.estado_asistencia);
    if (status === 'p') total.presentes += 1;
    if (status === 'a') total.ausentes += 1;
    if (status === 'just.') total.justificados += 1;
    totals.set(key, total);
  });
  return Array.from(totals.values()).map((row) => {
    const total = row.presentes + row.ausentes + row.justificados;
    return { ...row, total, porcentaje: total ? Math.round((row.presentes / total) * 100) : 0 };
  }).sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
}

function setBrigadeActionStatus(message, type = 'info') {
  const status = document.getElementById('brigadeActionStatus');
  if (!status) return;
  status.textContent = message;
  status.classList.toggle('hidden', !message);
  status.classList.toggle('error', type === 'error');
}

function setButtonLoading(buttonId, loading, label) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  if (loading) {
    button.dataset.originalText = button.innerHTML;
    button.disabled = true;
    button.innerHTML = label;
  } else {
    button.disabled = false;
    if (button.dataset.originalText) button.innerHTML = button.dataset.originalText;
  }
}

async function downloadAndSharePdf(doc, filename, title) {
  doc.save(filename);
  const blob = doc.output('blob');
  const file = new File([blob], filename, { type: 'application/pdf' });
  if (navigator.canShare && navigator.canShare({ files: [file] }) && navigator.share) {
    try {
      await navigator.share({
        title,
        text: title,
        files: [file],
      });
      return true;
    } catch (error) {
      console.warn('No se compartio el archivo', error);
    }
  }
  return false;
}

async function generarPDFAsistencia(includeLoaded) {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  const members = getIntegrantesBrigada(state.selectedBrigade);
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) {
    alert('No se pudo cargar jsPDF.');
    return;
  }
  const trainingTopic = document.getElementById('attendanceTopic').value.trim();
  const generalNotes = document.getElementById('attendanceNotes').value.trim();
  const attendanceDetails = members.map((person, index) => ({
    legajo: person.legajo || '',
    apellido: person.apellido || '',
    nombre: person.nombre || '',
    bombero: person.bombero || '',
    jerarquia: person.jerarquia || '',
    estado_asistencia: includeLoaded ? document.querySelector(`input[name="att-${index}"]:checked`)?.value || '' : '',
    observacion_individual: includeLoaded ? document.querySelector(`[data-observation="${index}"]`)?.value || '' : '',
  }));
  if (includeLoaded && attendanceDetails.some((detail) => !detail.estado_asistencia)) {
    alert('Marcá Presente, Ausente o Justificado para todos los integrantes antes de guardar.');
    return;
  }
  const attendanceId = window.crypto?.randomUUID ? `asis_${window.crypto.randomUUID()}` : `asis_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const attendanceDate = formatDateInput(new Date());
  setButtonLoading('saveAttendanceButton', true, 'Generando PDF...');
  setBrigadeActionStatus('Generando PDF de asistencia...');
  try {
    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
    const logo = await imageToDataUrl(logoPath(brigade));
    if (logo) {
      doc.addImage(logo, 'JPEG', 14, 10, 22, 22);
    } else {
      doc.rect(14, 10, 22, 22);
      doc.setFontSize(7);
      doc.text('Logo pendiente', 16, 22);
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text(`Brigada ${brigade.nombre_brigada}`, 42, 20);
    doc.setFontSize(10);
    doc.text(new Date().toLocaleDateString('es-AR'), 170, 20);
    const topicLines = doc.splitTextToSize(trainingTopic || 'Sin tema informado', 135);
    doc.setFont('helvetica', 'bold');
    doc.text('Tema de la capacitación:', 14, 34);
    doc.setFont('helvetica', 'normal');
    doc.text(topicLines, 58, 34);
    const membersTitleY = Math.max(43, 39 + (topicLines.length - 1) * 5);
    doc.text('Integrantes de la Brigada', 14, membersTitleY);
    const body = members.map((person, index) => {
      const name = [person.apellido, person.nombre].filter(Boolean).join(', ') || person.bombero || 'Sin nombre';
      const selected = attendanceDetails[index].estado_asistencia;
      const obs = attendanceDetails[index].observacion_individual;
      return [name, selected === 'P' ? 'X' : '', selected === 'A' ? 'X' : '', selected === 'Just.' ? 'X' : '', obs];
    });
    if (doc.autoTable) {
      doc.autoTable({
        startY: membersTitleY + 5,
        head: [['Integrante', 'P', 'A', 'Just.', 'Obs.']],
        body,
        styles: { fontSize: 9, cellPadding: 2.3 },
        headStyles: { fillColor: [6, 52, 82], textColor: [255, 255, 255] },
        columnStyles: {
          0: { cellWidth: 84 },
          1: { cellWidth: 16, halign: 'center' },
          2: { cellWidth: 16, halign: 'center' },
          3: { cellWidth: 20, halign: 'center' },
          4: { cellWidth: 42 },
        },
        margin: { left: 14, right: 14 },
      });
    }
    let y = (doc.lastAutoTable ? doc.lastAutoTable.finalY : 44) + 10;
    if (y > 242) {
      doc.addPage();
      y = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.text('Observaciones:', 14, y);
    doc.setFont('helvetica', 'normal');
    const notesLines = generalNotes ? doc.splitTextToSize(generalNotes, 182) : [''];
    doc.text(notesLines, 14, y + 6);
    const signatureY = Math.max(y + 22 + (notesLines.length - 1) * 5, 265);
    if (signatureY > 274) {
      doc.addPage();
      doc.text('Responsable / Instructor', 14, 282);
      doc.text('Firma', 150, 282);
      doc.line(14, 274, 78, 274);
      doc.line(135, 274, 196, 274);
    } else {
      doc.text('Responsable / Instructor', 14, signatureY + 8);
      doc.text('Firma', 150, signatureY + 8);
      doc.line(14, signatureY, 78, signatureY);
      doc.line(135, signatureY, 196, signatureY);
    }
    const filename = `asistencia-${brigade.id_brigada}-${new Date().toISOString().slice(0, 10)}.pdf`;
    const base64 = doc.output('datauristring').split(',')[1];
    setBrigadeActionStatus('PDF listo. Enviando a la carpeta de Drive de la brigada...');
    await guardarReporteDrive({
      filename,
      mime_type: 'application/pdf',
      base64,
      id_brigada: brigade.id_brigada,
      brigada: brigade.nombre_brigada,
      tipo_reporte: 'asistencia',
      tema: trainingTopic,
      observaciones: generalNotes,
    });
    await registrarAsistencia({
      id_asistencia: attendanceId,
      fecha: attendanceDate,
      mes_periodo: monthKey(attendanceDate),
      id_brigada: brigade.id_brigada,
      brigada: brigade.nombre_brigada,
      tipo_actividad: trainingTopic || 'Capacitación',
      observaciones_generales: generalNotes,
      detalles: attendanceDetails,
    });
    const shared = await downloadAndSharePdf(doc, filename, `Asistencia ${brigade.nombre_brigada}`);
    setBrigadeActionStatus(shared
      ? 'PDF guardado en la carpeta de la brigada, descargado y abierto para compartir.'
      : 'PDF guardado en la carpeta de la brigada y descargado.');
  } catch (error) {
    console.error(error);
    setBrigadeActionStatus(`No se pudo guardar la asistencia: ${error.message || error}`);
  } finally {
    setButtonLoading('saveAttendanceButton', false);
  }
}

async function guardarReporteDrive(payload) {
  await postToAppsScript({ action: 'guardar_reporte', ...payload });
}

async function registrarAsistencia(payload) {
  await postToAppsScript({ action: 'registrar_asistencia', ...payload, detalles: JSON.stringify(payload.detalles || []) });
  const header = {
    id_asistencia: payload.id_asistencia,
    fecha: payload.fecha,
    mes_periodo: payload.mes_periodo,
    id_brigada: payload.id_brigada,
    brigada: payload.brigada,
    tipo_actividad: payload.tipo_actividad,
    observaciones_generales: payload.observaciones_generales,
    estado_registro: 'Cerrado',
  };
  state.sheets.ASISTENCIAS = [...(state.sheets.ASISTENCIAS || []), header];
  state.sheets.DETALLE_ASISTENCIAS = [
    ...(state.sheets.DETALLE_ASISTENCIAS || []),
    ...(payload.detalles || []).map((detail) => ({ ...detail, id_asistencia: payload.id_asistencia })),
  ];
  renderAdmin();
  setTimeout(loadGoogleSheet, 2500);
}

async function generarPDFCheckEquipamiento(uploadToDrive = true) {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  const rows = getEquipamientoBrigada(state.selectedBrigade);
  if (!rows.length) {
    alert('No hay equipamiento cargado para esta brigada en la hoja EQUIPAMIENTO.');
    return;
  }
  const jsPDF = window.jspdf?.jsPDF;
  if (!jsPDF) return alert('No se pudo cargar jsPDF.');
  setButtonLoading(uploadToDrive ? 'saveEquipmentCheckButton' : 'downloadEquipmentPdfButton', true, 'Generando PDF...');
  setBrigadeActionStatus(uploadToDrive ? 'Generando check de equipamiento...' : 'Preparando descarga de inventario...');
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  doc.setFillColor(6, 52, 82);
  doc.rect(0, 0, 210, 28, 'F');
  doc.setFillColor(223, 52, 56);
  doc.rect(0, 26, 210, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text(`Check de equipamiento - ${brigade.nombre_brigada}`, 14, 12);
  doc.setFontSize(9);
  doc.text(new Date().toLocaleString('es-AR'), 14, 20);
  doc.setTextColor(20, 32, 42);
  const body = rows.map((item, index) => {
    const rowElement = document.querySelectorAll('[data-equipment-row]')[index];
    const cantidad = rowElement?.querySelector('[data-eq-field="cantidad"]')?.value || item.cantidad_ok_no || 'OK';
    const estado = rowElement?.querySelector('[data-eq-field="estado"]')?.value || item.estado_bueno_malo || 'Bueno';
    const obs = rowElement?.querySelector('[data-eq-field="obs"]')?.value || item.observaciones || '';
    return [item.ubicacion || '', item.elemento || '', item.unidades || item.unidad || '', cantidad, estado, obs];
  });
  doc.autoTable({
    startY: 36,
    head: [['Ubicacion', 'Elemento', 'Unidad', 'Cantidad', 'Estado', 'Observaciones']],
    body,
    styles: { fontSize: 8, cellPadding: 2.1 },
    headStyles: { fillColor: [6, 52, 82], textColor: [255, 255, 255] },
    alternateRowStyles: { fillColor: [242, 246, 248] },
    margin: { left: 14, right: 14 },
    columnStyles: {
      0: { cellWidth: 42 },
      1: { cellWidth: 48 },
      2: { cellWidth: 20, halign: 'center' },
      3: { cellWidth: 24, halign: 'center' },
      4: { cellWidth: 24, halign: 'center' },
      5: { cellWidth: 28 },
    },
  });
  const filename = `check-equipamiento-${brigade.id_brigada}-${new Date().toISOString().slice(0, 10)}.pdf`;
  const base64 = doc.output('datauristring').split(',')[1];
  if (uploadToDrive) {
    setBrigadeActionStatus('Check listo. Enviando a la carpeta de Drive...');
    await guardarReporteDrive({
      filename,
      mime_type: 'application/pdf',
      base64,
      id_brigada: brigade.id_brigada,
      brigada: brigade.nombre_brigada,
      tipo_reporte: 'equipamiento',
    });
  }
  const shared = await downloadAndSharePdf(doc, filename, `Check de equipamiento ${brigade.nombre_brigada}`);
  setBrigadeActionStatus(shared
    ? 'PDF descargado, guardado y abierto para compartir.'
    : (uploadToDrive ? 'PDF descargado y enviado al Web App. Si no se abrio compartir, este navegador no lo permite.' : 'PDF de equipamiento descargado.'));
  setButtonLoading(uploadToDrive ? 'saveEquipmentCheckButton' : 'downloadEquipmentPdfButton', false);
}

function descargarEquipamientoExcel() {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  const rows = getEquipamientoBrigada(state.selectedBrigade);
  const data = rows.length ? rows : EQUIPMENT_EXAMPLES.map((item) => ({ ...item, brigada: brigade?.nombre_brigada }));
  const headers = ['brigada', 'ubicacion', 'elemento', 'unidades', 'cantidad_ok_no', 'estado_bueno_malo', 'observaciones'];
  if (window.XLSX) {
    const sheet = XLSX.utils.json_to_sheet(data.map((row) => Object.fromEntries(headers.map((key) => [key, row[key] || '']))));
    const book = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(book, sheet, 'Equipamiento');
    XLSX.writeFile(book, `equipamiento-${brigade.id_brigada}.xlsx`);
    return;
  }
  const csv = [headers.join(','), ...data.map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('\n');
  downloadBlob(csv, `equipamiento-${brigade.id_brigada}.csv`, 'text/csv;charset=utf-8');
}

async function enviarCertificado() {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  const memberValue = document.getElementById('certificateMember').value;
  const title = document.getElementById('certificateTitle').value.trim();
  const file = document.getElementById('certificateFile').files[0];
  if (!memberValue) return alert('SeleccionÃ¡ un integrante.');
  if (!title) return alert('CompletÃ¡ el nombre de la capacitaciÃ³n.');
  if (!file) return alert('AdjuntÃ¡ el certificado.');
  setButtonLoading('sendCertificateButton', true, 'Enviando...');
  setBrigadeActionStatus('Leyendo certificado y preparando envio a Drive...');
  const dataUrl = await fileToDataUrl(file);
  setBrigadeActionStatus('Enviando certificado a la carpeta de Drive...');
  await postToAppsScript({
    action: 'guardar_certificado',
    filename: file.name,
    mime_type: file.type || 'application/octet-stream',
    base64: dataUrl.split(',')[1],
    id_brigada: brigade.id_brigada,
    brigada: brigade.nombre_brigada,
    integrante: memberValue,
    titulo: title,
  });
  setBrigadeActionStatus('Certificado enviado al Web App. Revisar Drive en 03 Certificaciones.');
  setButtonLoading('sendCertificateButton', false);
  document.getElementById('certificateTitle').value = '';
  document.getElementById('certificateFile').value = '';
}

function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function exportAdminCsv() {
  const period = getSelectedAdminPeriod();
  const rows = calcularResumenAdminRango(period.from, period.to, period.expectedMonths).filter(filterAdminRow);
  const headers = Object.keys(rows[0] || { mes_periodo: '', id_brigada: '', brigada: '' });
  const csv = [headers.join(','), ...rows.map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('\n');
  downloadBlob(csv, `admin-brigadas-${period.type === 'year' ? period.year : `${period.year}-${period.month}`}.csv`, 'text/csv;charset=utf-8');
}

function exportAdminPdf() {
  window.print();
}

function descargarIntegrantesBrigada() {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  const members = getIntegrantesBrigada(state.selectedBrigade);
  const headers = ['apellido', 'nombre', 'bombero', 'legajo', 'jerarquia'];
  const csv = [headers.join(','), ...members.map((row) => headers.map((key) => csvCell(row[key])).join(','))].join('\n');
  downloadBlob(csv, `integrantes-${brigade.id_brigada}.csv`, 'text/csv;charset=utf-8');
}

async function descargarLogoBrigada() {
  const brigade = getBrigadasActivas().find((item) => item.id_brigada === state.selectedBrigade);
  const response = await fetch(logoPath(brigade));
  const blob = await response.blob();
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = brigade.logo_file || `logo-${brigade.id_brigada}.jpeg`;
  link.click();
  URL.revokeObjectURL(link.href);
}

function calculateKpis(summary) {
  const active = getBrigadasActivas().length;
  const covered = summary.reduce((sum, row) => sum + row.meses_cubiertos, 0);
  const expected = summary.reduce((sum, row) => sum + row.meses_esperados, 0);
  const realized = summary.reduce((sum, row) => sum + row.encuentros_realizados, 0);
  const attendanceRows = summary.filter((row) => row.total_convocados > 0);
  const avgAttendance = attendanceRows.length ? Math.round(attendanceRows.reduce((sum, row) => sum + row.porcentaje_asistencia, 0) / attendanceRows.length) : 0;
  return {
    active,
    covered,
    expected,
    realized,
    missing: Math.max(expected - covered, 0),
    meetingCompliance: expected ? Math.round((covered / expected) * 100) : 0,
    avgAttendance,
    generalIndex: Math.round((((expected ? covered / expected : 0) * 100) + avgAttendance) / 2),
    pendingNeeds: summary.reduce((sum, row) => sum + row.necesidades_pendientes, 0),
    highNeeds: summary.reduce((sum, row) => sum + row.necesidades_alta_prioridad, 0),
    criticalChecks: summary.reduce((sum, row) => sum + row.checks_criticos, 0),
  };
}

function getDefaultAdminRange() {
  const dates = [
    ...(state.sheets.ENCUENTROS || []).map((row) => parseDate(normalizeRow(row).fecha)),
    ...(state.sheets.ASISTENCIAS || []).map((row) => parseDate(normalizeRow(row).fecha)),
    ...(state.sheets.CHECK_EQUIPAMIENTO || []).map((row) => parseDate(normalizeRow(row).fecha)),
  ].filter(Boolean).sort((a, b) => a - b);
  const from = dates[0] || new Date(new Date().getFullYear(), 0, 1);
  const to = new Date();
  return { from: formatDateInput(from), to: formatDateInput(to) };
}

function changeMonth(delta) {
  state.calendarDate = new Date(state.calendarDate.getFullYear(), state.calendarDate.getMonth() + delta, 1);
  renderCalendar();
}

function calendarWeekdays(date) {
  const first = new Date(date.getFullYear(), date.getMonth(), 1);
  const start = new Date(first);
  const day = first.getDay() || 7;
  start.setDate(first.getDate() - day + 1);
  const days = [];
  let cursor = new Date(start);
  while (days.length < 35 || monthKey(cursor) === monthKey(date)) {
    days.push(new Date(cursor));
    cursor.setDate(cursor.getDate() + 1);
    if (days.length >= 35 && monthKey(cursor) !== monthKey(date) && (cursor.getDay() || 7) === 1) break;
  }
  return days;
}

function normalizeBrigade(row) {
  const normalized = normalizeRow(row);
  if (normalized.id_brigada === 'socorrismo') normalized.columna_personal = 'socorrismo';
  return normalized;
}

function normalizePerson(row) {
  const normalized = normalizeRow(row);
  if (!normalized.id_persona && normalized.legajo) normalized.id_persona = normalized.legajo;
  if (!normalized.activo) normalized.activo = 'SI';
  return normalized;
}

function normalizeRow(row) {
  const result = {};
  Object.entries(row || {}).forEach(([key, value]) => {
    result[normalizeHeader(key)] = value;
  });
  return result;
}

function normalizeHeader(header) {
  return String(header || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function isMarked(value) {
  return ['x', 'si', 'sÃ­', 's', '1', 'true'].includes(normalizeState(value));
}

function isYes(value) {
  return ['si', 'sÃ­', 's', 'x', '1', 'true'].includes(normalizeState(value));
}

function normalizeState(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase();
}

function monthKey(date) {
  const parsed = date instanceof Date ? date : parseDate(date);
  if (!parsed || Number.isNaN(parsed.getTime())) return '';
  return `${parsed.getFullYear()}-${String(parsed.getMonth() + 1).padStart(2, '0')}`;
}

function parseDate(value) {
  if (value instanceof Date && !Number.isNaN(value)) return value;
  if (!value) return null;
  const text = String(value).trim();
  const iso = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return new Date(Number(iso[1]), Number(iso[2]) - 1, Number(iso[3]));
  const local = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
  if (local) return new Date(Number(local[3]), Number(local[2]) - 1, Number(local[1]));
  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function formatDateInput(value) {
  const date = parseDate(value);
  if (!date) return '';
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function sameDay(a, b) {
  return a && b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function brigadeName(id) {
  return getBrigadasActivas().find((b) => b.id_brigada === id)?.nombre_brigada || id || 'Brigada';
}

function logoPath(brigade) {
  return `assets/brigadas/${brigade.logo_file || ''}?v=${APP_VERSION}`;
}

function imageToDataUrl(src) {
  return new Promise((resolve) => {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    image.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext('2d');
      context.drawImage(image, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    image.onerror = () => resolve('');
    image.src = src;
  });
}

function csvCell(value) {
  return `"${String(value ?? '').replace(/"/g, '""')}"`;
}

function downloadBlob(content, filename, type) {
  const blob = content instanceof Blob ? content : new Blob([content], { type });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function setDataStatus(message) {
  const versionedMessage = `${message} · ${APP_VERSION}`;
  const sidebarStatus = document.getElementById('dataStatus');
  const homeStatus = document.getElementById('dataStatusHome');
  if (sidebarStatus) sidebarStatus.textContent = versionedMessage;
  if (homeStatus) homeStatus.textContent = versionedMessage;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }[char]));
}

