const CONFIG_KEY = 'sbvpChoferesScriptUrl';
const DATA_KEY = 'sbvpChoferesDataV5';
const HISTORY_KEY = 'sbvpChoferesHistoryV2';
const DEFAULT_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwBLdphfKsY0a7U-FwTh8p8wBwgD9XRorQ_8hKzr9XaUNFVWaAWr1jePXeeXD_LPSNd/exec';
const DAYS = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado', 'Domingo'];
const SECTION_ORDER = ['CABINA', 'BOMBA', 'LUCES', 'NEUMATICOS', 'FLUIDOS', 'FLUIDOS Y NEUMATICOS', 'OBSERVACIONES'];
const BOTIQUIN_EXCLUDED_VEHICLES = ['MOVIL 3'];

const commonMobileQuestions = [
  { section: 'CABINA', question: 'Estado e higiene' },
  { section: 'CABINA', question: 'Instrumentos y VHF' },
  { section: 'CABINA', question: 'Limpia parabrisas' },
  { section: 'CABINA', question: 'Sirena' },
  { section: 'CABINA', question: 'Bocina' },
  { section: 'CABINA', question: 'Puertas' },
  { section: 'CABINA', question: 'Parabrisas' },
  { section: 'CABINA', question: 'Ventanillas' },
  { section: 'CABINA', question: 'Espejos laterales' },
  { section: 'CABINA', question: 'Asiento conductor' },
  { section: 'CABINA', question: 'Asiento acompanante' },
  { section: 'CABINA', question: 'Asiento trasero' },
  { section: 'BOMBA', question: 'Bomba / motobomba' },
  { section: 'LUCES', question: 'Luces cajoneras' },
  { section: 'LUCES', question: 'Cabina delantera' },
  { section: 'LUCES', question: 'Cabina trasera' },
  { section: 'LUCES', question: 'Delantera posicion' },
  { section: 'LUCES', question: 'Delantera baja' },
  { section: 'LUCES', question: 'Delantera alta' },
  { section: 'LUCES', question: 'Delantera giros' },
  { section: 'LUCES', question: 'Delantera baliza' },
  { section: 'LUCES', question: 'Trasera posicion' },
  { section: 'LUCES', question: 'Trasera stop' },
  { section: 'LUCES', question: 'Trasera giros' },
  { section: 'LUCES', question: 'Trasera baliza' },
  { section: 'LUCES', question: 'Reversa' },
  { section: 'LUCES', question: 'Alarma de reversa' },
  { section: 'LUCES', question: 'Balizas' }
];

const fluidQuestions = [
  { section: 'NEUMATICOS', question: 'Presion cubiertas delanteras' },
  { section: 'NEUMATICOS', question: 'Presion cubiertas traseras' },
  { section: 'NEUMATICOS', question: 'Estado cubiertas delanteras' },
  { section: 'NEUMATICOS', question: 'Estado cubiertas traseras' },
  { section: 'FLUIDOS', question: 'Aceite de motor' },
  { section: 'FLUIDOS', question: 'Agua / refrigerante' },
  { section: 'FLUIDOS', question: 'Liquido de frenos' },
  { section: 'FLUIDOS', question: 'Combustible' },
  { section: 'FLUIDOS', question: 'Sapito' }
];

const baseData = {
  driveFolderUrl: 'https://drive.google.com/drive/u/0/folders/1JTrRwKdj86zQ7N0IvZOofb6jKPHhHb9f',
  vehicles: ['MOVIL 3', 'MOVIL 5', 'MOVIL 6', 'MOVIL 7', 'MOVIL 8', 'MOVIL 9', 'MOVIL 11', 'MOVIL 12', 'MOVIL 19', 'MOVIL 24', 'MOVIL 26', 'MOVIL 27'],
  agenda: {
    Lunes: { mobileChecks: ['MOVIL 12', 'MOVIL 19', 'MOVIL 24', 'MOVIL 27', 'MOVIL 3'], fluids: ['MOVIL 3'] },
    Martes: { mobileChecks: [], fluids: [] },
    Miercoles: { mobileChecks: [], fluids: [] },
    Jueves: { mobileChecks: [], fluids: [] },
    Viernes: { mobileChecks: [], fluids: [] },
    Sabado: { mobileChecks: [], fluids: [] },
    Domingo: { mobileChecks: [], fluids: [] }
  },
  questions: {},
  fluidQuestions,
  novedades: {},
  choferes: [],
  lastChecks: {},
  records: {}
};

baseData.vehicles.forEach(vehicle => {
  baseData.questions[vehicle] = commonMobileQuestions.slice();
  baseData.novedades[vehicle] = [];
});

let state = loadData();
let selectedDay = '';
let activeCheck = null;
let allMobilesOpen = false;

const els = {
  syncStatus: document.getElementById('syncStatus'),
  driveArchive: document.getElementById('driveArchive'),
  configPanel: document.getElementById('configPanel'),
  scriptUrl: document.getElementById('scriptUrl'),
  saveConfig: document.getElementById('saveConfig'),
  loadConfig: document.getElementById('loadConfig'),
  clearConfig: document.getElementById('clearConfig'),
  controlDate: document.getElementById('controlDate'),
  responsibleName: document.getElementById('responsibleName'),
  daysGrid: document.getElementById('daysGrid'),
  agendaDetail: document.getElementById('agendaDetail'),
  checksTitle: document.getElementById('checksTitle'),
  taskStack: document.getElementById('taskStack'),
  saveDay: document.getElementById('saveDay'),
  resetData: document.getElementById('resetData'),
  printPage: document.getElementById('printPage'),
  printSheet: document.getElementById('printSheet'),
  saveReport: document.getElementById('saveReport'),
  historyList: document.getElementById('historyList'),
  clearHistory: document.getElementById('clearHistory'),
  toast: document.getElementById('toast')
};

init();

function init() {
  els.controlDate.valueAsDate = new Date();
  els.scriptUrl.value = getScriptUrl();
  els.driveArchive.href = state.driveFolderUrl || baseData.driveFolderUrl;
  bindEvents();
  updateConnectionStatus();
  renderAll();
  if (getScriptUrl()) loadConfigFromScript();
}

function bindEvents() {
  document.querySelectorAll('.tab').forEach(button => {
    button.addEventListener('click', () => openTab(button.dataset.tab));
  });
  els.controlDate.addEventListener('change', () => {
    renderAll();
  });
  els.responsibleName.addEventListener('input', renderReport);
  els.saveConfig.addEventListener('click', saveConfig);
  els.loadConfig.addEventListener('click', loadConfigFromScript);
  els.clearConfig.addEventListener('click', clearConfig);
  els.saveDay.addEventListener('click', saveCompletedChecks);
  els.saveReport.addEventListener('click', saveReport);
  els.printSheet.addEventListener('click', () => {
    openTab('reporte');
    window.print();
  });
  els.resetData.addEventListener('click', resetData);
  els.clearHistory.addEventListener('click', clearHistory);
}

function openTab(name) {
  document.querySelectorAll('.tab').forEach(button => button.classList.toggle('active', button.dataset.tab === name));
  document.querySelectorAll('.tab-panel').forEach(panel => panel.classList.toggle('active', panel.id === `tab-${name}`));
  if (name === 'reporte') renderReport();
}

function renderAll() {
  els.driveArchive.href = state.driveFolderUrl || baseData.driveFolderUrl;
  renderChoferesList();
  renderDays();
  renderAgendaDetail();
  renderChecks();
  renderReport();
  renderHistory();
  saveData();
}

function renderDays() {
  if (selectedDay) {
    const specialDay = !DAYS.includes(selectedDay);
    els.daysGrid.innerHTML = `
      <div class="compact-day-bar">
        <select id="compactDaySelect" aria-label="Cambiar dia">
          ${specialDay ? `<option value="${escapeAttr(selectedDay)}" selected>${escapeHtml(selectedDay)}</option>` : ''}
          ${DAYS.map(day => `<option value="${day}" ${day === selectedDay ? 'selected' : ''}>${day}</option>`).join('')}
        </select>
        <button class="ghost-button" data-back-home type="button">Inicio</button>
      </div>
    `;
    const select = document.getElementById('compactDaySelect');
    select.addEventListener('change', () => {
      selectedDay = select.value;
      activeCheck = null;
      renderAll();
    });
    els.daysGrid.querySelector('[data-back-home]').addEventListener('click', () => {
      selectedDay = '';
      activeCheck = null;
      allMobilesOpen = false;
      openTab('agenda');
      renderAll();
    });
    return;
  }

  els.daysGrid.innerHTML = DAYS.map(day => {
    return `
      <button class="day-button ${day === selectedDay ? 'active' : ''}" data-day="${day}" type="button">
        ${escapeHtml(day)}
      </button>
    `;
  }).join('');
  els.daysGrid.querySelectorAll('[data-day]').forEach(button => {
    button.addEventListener('click', () => {
      selectedDay = button.dataset.day;
      activeCheck = null;
      allMobilesOpen = false;
      renderAll();
    });
  });
}

function renderAgendaDetail() {
  if (!selectedDay) {
    els.agendaDetail.innerHTML = `
      <div class="agenda-home">
        <section class="agenda-box">
          <button class="day-button all-mobiles-button" data-all-mobiles type="button">Todos los moviles</button>
          <div class="all-mobiles-panel ${allMobilesOpen ? '' : 'hidden'}">
            <h3>Checks de moviles</h3>
            <div class="vehicle-list">${renderActionButtons(state.vehicles, 'check-movil', 'Check')}</div>
          </div>
        </section>
        <section class="agenda-box agenda-wide">
          <h3>Agenda</h3>
          <div class="agenda-list">
            ${DAYS.map(day => renderAgendaDay(day)).join('')}
          </div>
        </section>
      </div>
    `;
    const allButton = els.agendaDetail.querySelector('[data-all-mobiles]');
    allButton.addEventListener('click', () => {
      allMobilesOpen = !allMobilesOpen;
      renderAgendaDetail();
    });
    bindDayActions();
    return;
  }

  const agenda = getAgenda(selectedDay);
  els.agendaDetail.innerHTML = `
    <div class="day-actions">
      <section class="agenda-box agenda-wide">
        <h3>${escapeHtml(selectedDay)}</h3>
      </section>
      <section class="agenda-box">
        <h3>Check de moviles</h3>
        <div class="vehicle-list">${renderActionButtons(agenda.mobileChecks, 'check-movil', 'Check')}</div>
      </section>
      <section class="agenda-box">
        <h3>Check de fluidos</h3>
        <div class="vehicle-list">${renderActionButtons(agenda.fluids, 'check-fluidos', 'Fluidos')}</div>
      </section>
      <section class="agenda-box">
        <h3>Check de botiquines</h3>
        <div class="vehicle-list">
          <button class="action-button" data-open-botiquines="1" type="button">Botiquines</button>
        </div>
      </section>
      <section class="agenda-box">
        <h3>Imprimir novedades</h3>
        <div class="vehicle-list">
          <button class="action-button primary-action" data-open-novedades="1" type="button">Imprimir novedades</button>
        </div>
      </section>
    </div>
  `;
  bindDayActions();
}

function renderActionButtons(vehicles, type, label) {
  if (!vehicles.length) return '<span class="subcopy">Sin controles programados</span>';
  return vehicles.map(vehicle => `<button class="action-button" data-open-check="${type}" data-vehicle="${escapeAttr(vehicle)}" type="button">${escapeHtml(label)} ${escapeHtml(vehicle)}</button>`).join('');
}

function bindDayActions() {
  els.agendaDetail.querySelectorAll('[data-open-check]').forEach(button => {
    button.addEventListener('click', () => {
      if (!selectedDay) selectedDay = 'Todos los moviles';
      startFreshCheck(button.dataset.openCheck, button.dataset.vehicle);
      openTab('checks');
      renderAll();
    });
  });
  const botiquines = els.agendaDetail.querySelector('[data-open-botiquines]');
  if (botiquines) botiquines.addEventListener('click', () => {
    activeCheck = { type: 'botiquines', vehicle: '' };
    getBotiquinVehicles().forEach(vehicle => {
      getRecord(selectedDay, vehicle).botiquin = '';
    });
    openTab('checks');
    renderChecks();
  });
  const novedades = els.agendaDetail.querySelector('[data-open-novedades]');
  if (novedades) novedades.addEventListener('click', () => {
    activeCheck = null;
    openTab('reporte');
    renderReport();
  });
}

function renderAgendaDay(day) {
  const agenda = getAgenda(day);
  return `
    <article class="agenda-day-row ${day === selectedDay ? 'active' : ''}">
      <strong>${escapeHtml(day)}</strong>
      <span>${escapeHtml(agenda.mobileChecks.length ? agenda.mobileChecks.map(vehicle => `Check ${vehicle}`).join(', ') : 'Sin checks')}</span>
      <span>${escapeHtml(agenda.fluids.length ? agenda.fluids.map(vehicle => `Fluidos ${vehicle}`).join(', ') : 'Sin fluidos')}</span>
      <span>Kilometros, botiquin y novedades A4</span>
    </article>
  `;
}

function renderChecks() {
  if (!selectedDay) {
    els.checksTitle.textContent = 'Elegir un dia';
    els.taskStack.innerHTML = '<div class="empty-state">Primero elegi Lunes, Martes, Miercoles, Jueves, Viernes, Sabado o Domingo en la pantalla Agenda.</div>';
    return;
  }
  const agenda = getAgenda(selectedDay);
  let vehicles = agenda.mobileChecks.filter(vehicle => state.vehicles.includes(vehicle));
  if (activeCheck?.type === 'check-movil') vehicles = [activeCheck.vehicle];
  if (activeCheck?.type === 'check-fluidos') vehicles = [activeCheck.vehicle];
  if (activeCheck?.type === 'botiquines') vehicles = getBotiquinVehicles();
  els.checksTitle.textContent = activeCheck?.type === 'botiquines' ? `Botiquines - ${selectedDay}` : `Controles de ${selectedDay}`;
  if (!vehicles.length) {
    els.taskStack.innerHTML = '<div class="empty-state">No hay moviles programados para este dia.</div>';
    return;
  }

  if (activeCheck?.type === 'botiquines') {
    els.taskStack.innerHTML = `
      <article class="task-card">
        <div class="task-head">
          <div>
            <h3>Check de botiquines</h3>
            <p class="subcopy">Se completa por movil. El Movil 3 no forma parte de este control.</p>
          </div>
        </div>
        <div class="botiquin-table">
          <div class="botiquin-row botiquin-head"><strong>Movil</strong><strong>Botiquin / precinto</strong></div>
          ${vehicles.map(vehicle => {
            const record = getRecord(selectedDay, vehicle);
            return `
              <div class="botiquin-row">
                <strong>${escapeHtml(vehicle)}</strong>
                <input data-botiquin-vehicle="${escapeAttr(vehicle)}" value="${escapeAttr(record.botiquin || '')}" placeholder="Numero de botiquin" />
              </div>
            `;
          }).join('')}
        </div>
        <div class="button-row botiquin-actions">
          <button class="primary-button" data-save-botiquines type="button">Guardar PDF de botiquines en Drive</button>
        </div>
      </article>
    `;
    els.taskStack.querySelectorAll('[data-botiquin-vehicle]').forEach(input => {
      input.addEventListener('input', event => {
        const record = getRecord(selectedDay, event.target.dataset.botiquinVehicle);
        record.botiquin = event.target.value;
        saveData();
        renderReport();
      });
    });
    els.taskStack.querySelector('[data-save-botiquines]')?.addEventListener('click', saveCompletedChecks);
    return;
  }

  els.taskStack.innerHTML = vehicles.map(vehicle => {
    const record = getRecord(selectedDay, vehicle);
    const hasFluids = activeCheck?.type === 'check-fluidos';
    const checkGroup = hasFluids ? 'fluids' : 'mobile';
    const complete = isRecordComplete(record, checkGroup);
    const outOfService = !hasFluids && Boolean(record.outOfService);
    return `
      <article class="task-card ${complete ? 'complete' : ''} ${outOfService ? 'out-of-service' : ''}" data-task-card="${escapeAttr(vehicle)}">
        <div class="task-head">
          <div>
            <h3>${escapeHtml(vehicle)}</h3>
            <p class="subcopy">${hasFluids ? 'Check de fluidos' : 'Check de movil'}</p>
          </div>
          <span class="done-badge">${complete ? 'Completo' : 'Pendiente'}</span>
        </div>
        ${hasFluids ? '' : `
          <label class="out-of-service-toggle">
            <input data-out-of-service="${escapeAttr(vehicle)}" type="checkbox" ${outOfService ? 'checked' : ''} />
            <span>Movil fuera de servicio</span>
          </label>
        `}
        <div class="check-fields ${outOfService ? 'hidden' : ''}">
        <div class="task-grid">
          <label>Fecha <input data-field="fecha" data-vehicle="${escapeAttr(vehicle)}" type="date" value="${escapeAttr(record.fecha || els.controlDate.value || '')}" /></label>
          <label>Chofer <input data-field="chofer" data-vehicle="${escapeAttr(vehicle)}" list="choferesList" value="${escapeAttr(record.chofer || els.responsibleName.value || '')}" /></label>
          <label>Kilometros <input data-field="km" data-vehicle="${escapeAttr(vehicle)}" inputmode="numeric" value="${escapeAttr(record.km || '')}" /></label>
          <label>Botiquin / precinto <input data-field="botiquin" data-vehicle="${escapeAttr(vehicle)}" value="${escapeAttr(record.botiquin || '')}" /></label>
        </div>
        <div class="question-list">
          ${hasFluids ? '' : renderQuestionRows(vehicle, getQuestions(vehicle), 'mobile')}
          ${hasFluids ? renderQuestionRows(vehicle, state.fluidQuestions || fluidQuestions, 'fluids') : ''}
        </div>
        <label>Observaciones generales
          <textarea data-field="observaciones" data-vehicle="${escapeAttr(vehicle)}" placeholder="Escribir solo si hay novedad">${escapeHtml(record.observaciones || '')}</textarea>
        </label>
        </div>
        <div class="button-row">
          <button class="secondary-button" data-complete="${escapeAttr(vehicle)}" type="button">${outOfService ? 'Enviar movil fuera de servicio' : 'Marcar completo y subir a Drive'}</button>
        </div>
      </article>
    `;
  }).join('');

  els.taskStack.querySelectorAll('[data-field]').forEach(input => {
    input.addEventListener('input', event => {
      const record = getRecord(selectedDay, event.target.dataset.vehicle);
      record[event.target.dataset.field] = event.target.value;
      if (event.target.dataset.field === 'fecha') els.controlDate.value = event.target.value;
      if (event.target.dataset.field === 'chofer') els.responsibleName.value = event.target.value;
      saveData();
      renderReport();
    });
  });

  els.taskStack.querySelectorAll('[data-out-of-service]').forEach(input => {
    input.addEventListener('change', event => {
      const record = getRecord(selectedDay, event.target.dataset.outOfService);
      record.outOfService = event.target.checked;
      record.completed = false;
      record.completedChecks.mobile = false;
      if (record.outOfService) {
        record.km = '';
        record.botiquin = '';
        record.chofer = '';
        record.observaciones = '';
        record.answers.mobile = {};
        record.notes.mobile = {};
      }
      saveData();
      renderChecks();
    });
  });

  els.taskStack.querySelectorAll('[data-question]').forEach(select => {
    select.addEventListener('change', event => {
      const record = getRecord(selectedDay, event.target.dataset.vehicle);
      const group = event.target.dataset.group;
      if (!record.answers[group]) record.answers[group] = {};
      record.answers[group][event.target.dataset.question] = event.target.value;
      if (!record.completedChecks) record.completedChecks = { mobile: false, fluids: false };
      record.completedChecks[group] = false;
      record.completed = Boolean(record.completedChecks.mobile || record.completedChecks.fluids);
      saveData();
      renderReport();
    });
  });

  els.taskStack.querySelectorAll('[data-note]').forEach(input => {
    input.addEventListener('input', event => {
      const record = getRecord(selectedDay, event.target.dataset.vehicle);
      const group = event.target.dataset.group;
      if (!record.notes[group]) record.notes[group] = {};
      record.notes[group][event.target.dataset.note] = event.target.value;
      saveData();
      renderReport();
    });
  });

  els.taskStack.querySelectorAll('[data-complete]').forEach(button => {
    button.addEventListener('click', async () => {
      button.disabled = true;
      button.textContent = 'Subiendo a Drive...';
      await completeAndUploadCheck(button.dataset.complete);
    });
  });
}

function renderQuestionRows(vehicle, questions, group) {
  const record = getRecord(selectedDay, vehicle);
  return groupQuestions(questions).map(section => `
    <section class="question-section">
      <h4>${escapeHtml(section.title)}</h4>
      <table class="question-table">
        <thead>
          <tr>
            <th>Elemento</th>
            <th>Condicion</th>
            <th>Observacion</th>
          </tr>
        </thead>
        <tbody>
        ${section.items.map(item => {
          const question = item.question;
    const value = record.answers[group]?.[question] || '';
    const note = record.notes[group]?.[question] || '';
    return `
      <tr class="question-row">
        <td><strong>${escapeHtml(question)}</strong></td>
        <td>
          <select data-question="${escapeAttr(question)}" data-group="${group}" data-vehicle="${escapeAttr(vehicle)}">
            <option value="" ${value ? '' : 'selected'} disabled>Seleccionar</option>
            ${['Bien', 'Regular', 'Mal', 'N/A'].map(option => `<option value="${option}" ${option === value ? 'selected' : ''}>${option}</option>`).join('')}
          </select>
        </td>
        <td><input data-note="${escapeAttr(question)}" data-group="${group}" data-vehicle="${escapeAttr(vehicle)}" placeholder="Observacion" value="${escapeAttr(note)}" /></td>
      </tr>
    `;
        }).join('')}
        </tbody>
      </table>
    </section>
  `).join('');
}

function renderReport() {
  if (!selectedDay) {
    els.printPage.innerHTML = '<div class="empty-state">Primero elegi un dia en Agenda.</div>';
    return;
  }
  const agenda = getAgenda(selectedDay);
  const vehicles = agenda.mobileChecks.filter(vehicle => state.vehicles.includes(vehicle));
  const rows = getNovedadesRowsForVehicles(vehicles);
  const dateText = formatDate(els.controlDate.value);
  const chofer = els.responsibleName.value.trim() || '................................';

  const noveltyTable = vehicles.length
    ? `
      <table class="print-table">
        <thead><tr>${vehicles.map(vehicle => `<th>${escapeHtml(vehicle)}</th>`).join('')}</tr></thead>
        <tbody>
          ${rows.map(row => `<tr>${vehicles.map(vehicle => `<td>${escapeHtml(row[vehicle] || '')}</td>`).join('')}</tr>`).join('')}
        </tbody>
      </table>
    `
    : '<div class="empty-state">No hay moviles programados para este dia.</div>';

  els.printPage.innerHTML = `
    <div class="print-title">
      <img src="./logo-sbvp.png" alt="Logo SBVP" />
      <h2>Novedades - ${escapeHtml(selectedDay)}</h2>
      <img src="./logo-sbvp.png" alt="" />
    </div>
    <div class="print-meta">
      <div><strong>Fecha:</strong> ${escapeHtml(dateText)}</div>
      <div><strong>Chofer:</strong> ${escapeHtml(chofer)}</div>
      <div><strong>Control de movil:</strong> ${escapeHtml(vehicles.join(', ') || 'Sin moviles')}</div>
      <div><strong>Fluidos:</strong> ${escapeHtml(agenda.fluids.join(', ') || 'Sin fluidos')}</div>
    </div>
    ${noveltyTable}
    <table class="print-table km-table">
      <thead><tr><th>Movil</th><th>Kilometros</th><th>Botiquin</th></tr></thead>
      <tbody>
        ${state.vehicles.map(vehicle => {
          const record = getRecord(selectedDay, vehicle);
          return `<tr><td>${escapeHtml(vehicle)}</td><td>${escapeHtml(record.km || '')}</td><td>${escapeHtml(record.botiquin || '')}</td></tr>`;
        }).join('')}
      </tbody>
    </table>
  `;
}

function getNovedadesRowsForVehicles(vehicles) {
  let maxRows = 1;
  vehicles.forEach(vehicle => {
    maxRows = Math.max(maxRows, getNovedades(vehicle).length || 1);
  });
  return Array.from({ length: maxRows }, (_, index) => {
    const row = {};
    vehicles.forEach(vehicle => row[vehicle] = getNovedades(vehicle)[index] || '');
    return row;
  });
}

function buildNoveltyRows(vehicles) {
  const columns = {};
  let maxRows = 1;
  vehicles.forEach(vehicle => {
    const record = getRecord(selectedDay, vehicle);
    const novelties = [];
    ['mobile', 'fluids'].forEach(group => {
      Object.entries(record.answers[group] || {}).forEach(([question, answer]) => {
        const note = record.notes[group]?.[question] || '';
        if (answer === 'Regular' || answer === 'Mal' || note.trim()) {
          novelties.push(`${question}: ${answer}${note ? ` - ${note}` : ''}`);
        }
      });
    });
    if (record.observaciones) novelties.push(record.observaciones);
    columns[vehicle] = novelties;
    maxRows = Math.max(maxRows, novelties.length || 1);
  });
  return Array.from({ length: maxRows }, (_, index) => {
    const row = {};
    vehicles.forEach(vehicle => row[vehicle] = columns[vehicle][index] || '');
    return row;
  });
}

async function completeAndUploadCheck(vehicle) {
  const record = getRecord(selectedDay, vehicle);
  const checkType = activeCheck?.type || 'check-movil';
  const checkGroup = checkType === 'check-fluidos' ? 'fluids' : 'mobile';
  const validationMessage = validateRecordForCheck(record, vehicle, checkGroup);
  if (validationMessage) {
    showToast(validationMessage);
    renderChecks();
    return;
  }
  if (!record.completedChecks) record.completedChecks = { mobile: false, fluids: false };
  record.completedChecks[checkGroup] = true;
  record.completed = Boolean(record.completedChecks.mobile || record.completedChecks.fluids);
  record.completedAt = new Date().toISOString();
  record.completedAtByType = record.completedAtByType || {};
  record.completedAtByType[checkGroup] = record.completedAt;
  saveData();

  let payload;
  try {
    payload = buildPayload({
      vehicles: [vehicle],
      checkType,
      activeVehicle: vehicle
    });
  } catch (error) {
    showToast(error.message);
    renderAll();
    return;
  }

  pushHistory({ ...payload, pdfUrl: '' });
  renderHistory();
  const data = await saveToScript('saveChecks', payload, `Check subido a Drive: ${vehicle}`);
  applyPdfUrls(data && data.pdfByVehicle);
  if (data) {
    updateLastChecksFromPayload(payload, data.pdfByVehicle);
    delete state.records[selectedDay][vehicle];
    activeCheck = null;
    openTab('agenda');
  }
  renderAll();
}

async function saveCompletedChecks() {
  if (activeCheck?.type === 'botiquines') {
    const missingVehicle = getBotiquinVehicles().find(vehicle => !getRecord(selectedDay, vehicle).botiquin.trim());
    if (missingVehicle) {
      showToast(`Completa el botiquin / precinto de ${missingVehicle}.`);
      return;
    }
  }
  let payload;
  try {
    payload = buildPayload({ checkType: activeCheck?.type || 'day' });
  } catch (error) {
    showToast(error.message);
    return;
  }
  pushHistory({ ...payload, pdfUrl: '' });
  renderHistory();
  const data = await saveToScript('saveChecks', payload, 'Controles guardados en Drive.');
  applyPdfUrls(data && data.pdfByVehicle);
  if (data) {
    if (payload.checkType === 'botiquines') {
      getBotiquinVehicles().forEach(vehicle => { getRecord(selectedDay, vehicle).botiquin = ''; });
      activeCheck = null;
      openTab('agenda');
    } else {
      updateLastChecksFromPayload(payload, data.pdfByVehicle);
    }
  }
  renderAll();
}

async function saveReport() {
  let payload;
  try {
    payload = buildPayload({ checkType: 'day' });
  } catch (error) {
    showToast(error.message);
    return;
  }
  pushHistory({ ...payload, pdfUrl: '' });
  renderHistory();
  const data = await saveToScript('saveReport', payload, 'Reporte guardado.');
  applyPdfUrls(data && data.pdfByVehicle);
  if (data) updateLastChecksFromPayload(payload, data.pdfByVehicle);
  renderAll();
}

async function saveToScript(action, payload, successMessage) {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl) {
    showToast(`${successMessage} Modo local.`);
    return null;
  }
  try {
    setStatus('Guardando...', 'warn');
    const response = await fetch(scriptUrl, {
      method: 'POST',
      body: JSON.stringify({ action, payload }),
      headers: { 'Content-Type': 'text/plain;charset=utf-8' }
    });
    const data = await response.json();
    if (!data.ok) throw new Error(data.message || 'No se pudo guardar.');
    replaceLastHistoryPdf(data.pdfUrl || Object.values(data.pdfByVehicle || {})[0] || '');
    renderHistory();
    setStatus('Conectado', 'ok');
    showToast(successMessage);
    return data;
  } catch (error) {
    setStatus('Revisar conexion', 'warn');
    showToast(error.message);
    return null;
  }
}

function applyPdfUrls(pdfByVehicle) {
  Object.entries(pdfByVehicle || {}).forEach(([vehicle, pdfUrl]) => {
    const record = getRecord(selectedDay, vehicle);
    record.pdfUrl = pdfUrl || record.pdfUrl || '';
    record.uploadedAt = new Date().toISOString();
  });
  saveData();
}

function buildPayload(options = {}) {
  if (!selectedDay) throw new Error('Primero elegi un dia.');
  const agenda = getAgenda(selectedDay);
  let vehicles = agenda.mobileChecks.filter(vehicle => state.vehicles.includes(vehicle));
  const checkType = options.checkType || activeCheck?.type || 'day';
  const activeVehicle = options.activeVehicle || activeCheck?.vehicle || '';
  if (checkType === 'botiquines') vehicles = getBotiquinVehicles();
  if (checkType === 'check-movil' || checkType === 'check-fluidos') vehicles = [activeVehicle];
  if (Array.isArray(options.vehicles)) vehicles = options.vehicles.filter(vehicle => state.vehicles.includes(vehicle));
  const firstRecord = vehicles.map(vehicle => getRecord(selectedDay, vehicle)).find(record => record.fecha || record.chofer) || {};
  return {
    checkType,
    activeVehicle,
    date: firstRecord.fecha || els.controlDate.value,
    dateText: formatDate(firstRecord.fecha || els.controlDate.value),
    day: selectedDay,
    responsible: (firstRecord.chofer || els.responsibleName.value || '').trim(),
    vehicles,
    fluids: agenda.fluids.slice(),
    allVehicles: state.vehicles.slice(),
    questions: Object.fromEntries(vehicles.map(vehicle => [vehicle, getQuestions(vehicle)])),
    fluidQuestions: (state.fluidQuestions || fluidQuestions).slice(),
    records: Object.fromEntries(vehicles.map(vehicle => [vehicle, getRecord(selectedDay, vehicle)])),
    noveltyRows: getNovedadesRowsForVehicles(vehicles),
    checkNoveltyRows: buildNoveltyRows(vehicles),
    driveFolderUrl: state.driveFolderUrl,
    generatedAt: new Date().toISOString()
  };
}

async function loadConfigFromScript() {
  const scriptUrl = getScriptUrl();
  if (!scriptUrl) {
    showToast('Primero pega la URL de Apps Script.');
    return;
  }
  try {
    setStatus('Actualizando agenda...', 'warn');
    const url = new URL(scriptUrl);
    url.searchParams.set('action', 'config');
    const response = await fetch(url.toString());
    const data = await response.json();
    if (!data.ok) throw new Error(data.message || 'No se pudo leer la agenda.');
    state = mergeConfig(data.config || data);
    saveData();
    setStatus('Conectado', 'ok');
    renderAll();
    showToast('Agenda actualizada desde la planilla.');
  } catch (error) {
    setStatus('Revisar conexion', 'warn');
    showToast(error.message);
  }
}

function mergeConfig(config) {
  const next = structuredClone(baseData);
  if (Array.isArray(config.vehicles) && config.vehicles.length) next.vehicles = config.vehicles;
  if (config.agenda) next.agenda = normalizeAgenda(config.agenda, next.vehicles);
  if (config.questions) next.questions = normalizeQuestions(config.questions, next.vehicles);
  if (Array.isArray(config.fluidQuestions) && config.fluidQuestions.length) next.fluidQuestions = config.fluidQuestions;
  if (config.novedades) next.novedades = normalizeNovedades(config.novedades, next.vehicles);
  if (Array.isArray(config.choferes)) next.choferes = config.choferes;
  if (config.lastChecks) next.lastChecks = normalizeLastChecks(config.lastChecks, next.vehicles);
  if (config.driveFolderUrl) next.driveFolderUrl = config.driveFolderUrl;
  next.records = state.records || {};
  return next;
}

function normalizeAgenda(agenda, vehicles) {
  const result = {};
  DAYS.forEach(day => {
    const row = agenda[day] || {};
    result[day] = {
      mobileChecks: (row.mobileChecks || row.checks || []).filter(vehicle => vehicles.includes(vehicle)),
      fluids: (row.fluids || []).filter(vehicle => vehicles.includes(vehicle))
    };
  });
  return result;
}

function normalizeQuestions(questions, vehicles) {
  const result = {};
  vehicles.forEach(vehicle => {
    result[vehicle] = Array.isArray(questions[vehicle]) && questions[vehicle].length
      ? normalizeQuestionItems(questions[vehicle])
      : normalizeQuestionItems(commonMobileQuestions);
  });
  return result;
}

function normalizeNovedades(novedades, vehicles) {
  const result = {};
  vehicles.forEach(vehicle => {
    result[vehicle] = Array.isArray(novedades[vehicle]) ? novedades[vehicle] : [];
  });
  return result;
}

function normalizeLastChecks(lastChecks, vehicles) {
  const result = {};
  vehicles.forEach(vehicle => {
    const source = lastChecks[vehicle] || {};
    result[vehicle] = {
      km: source.km || '',
      botiquin: source.botiquin || '',
      chofer: source.chofer || '',
      mobile: normalizeLastCheckGroup(source.mobile),
      fluids: normalizeLastCheckGroup(source.fluids)
    };
  });
  return result;
}

function normalizeLastCheckGroup(group) {
  return {
    answers: { ...((group && group.answers) || {}) },
    notes: { ...((group && group.notes) || {}) },
    savedAt: (group && group.savedAt) || '',
    pdfUrl: (group && group.pdfUrl) || ''
  };
}

function saveConfig() {
  const url = els.scriptUrl.value.trim();
  if (!url.startsWith('https://script.google.com/')) {
    showToast('Pega una URL valida de Apps Script.');
    return;
  }
  localStorage.setItem(CONFIG_KEY, url);
  updateConnectionStatus();
  loadConfigFromScript();
}

function clearConfig() {
  localStorage.setItem(CONFIG_KEY, '');
  els.scriptUrl.value = '';
  updateConnectionStatus();
  showToast('Modo local activado.');
}

function updateConnectionStatus() {
  const connected = Boolean(getScriptUrl());
  setStatus(connected ? 'Conectado a Apps Script' : 'Modo local', connected ? 'ok' : '');
}

function setStatus(text, mode) {
  els.syncStatus.textContent = text;
  els.syncStatus.classList.toggle('ok', mode === 'ok');
  els.syncStatus.classList.toggle('warn', mode === 'warn');
}

function resetData() {
  if (!confirm('Restaurar datos locales base?')) return;
  state = structuredClone(baseData);
  saveData();
  renderAll();
}

function getAgenda(day) {
  if (!state.agenda[day]) state.agenda[day] = { mobileChecks: [], fluids: [] };
  return state.agenda[day];
}

function getQuestions(vehicle) {
  if (!Array.isArray(state.questions[vehicle])) state.questions[vehicle] = normalizeQuestionItems(commonMobileQuestions);
  state.questions[vehicle] = normalizeQuestionItems(state.questions[vehicle]);
  return state.questions[vehicle];
}

function getNovedades(vehicle) {
  if (!Array.isArray(state.novedades[vehicle])) state.novedades[vehicle] = [];
  return state.novedades[vehicle];
}

function getRecord(day, vehicle) {
  if (!state.records[day]) state.records[day] = {};
  if (!state.records[day][vehicle]) {
    state.records[day][vehicle] = {
      km: '',
      botiquin: '',
      chofer: '',
      fecha: els.controlDate.value || '',
      observaciones: '',
      outOfService: false,
      completed: false,
      completedAt: '',
      completedChecks: { mobile: false, fluids: false },
      completedAtByType: {},
      answers: { mobile: {}, fluids: {} },
      notes: { mobile: {}, fluids: {} }
    };
  }
  if (!state.records[day][vehicle].completedChecks) {
    state.records[day][vehicle].completedChecks = {
      mobile: Boolean(state.records[day][vehicle].completed),
      fluids: false
    };
  }
  if (!state.records[day][vehicle].completedAtByType) state.records[day][vehicle].completedAtByType = {};
  return state.records[day][vehicle];
}

function startFreshCheck(type, vehicle) {
  activeCheck = { type, vehicle };
  if (!state.records[selectedDay]) state.records[selectedDay] = {};
  state.records[selectedDay][vehicle] = createEmptyRecord();
  saveData();
}

function createEmptyRecord() {
  return {
    km: '',
    botiquin: '',
    chofer: '',
    fecha: els.controlDate.value || '',
    observaciones: '',
    outOfService: false,
    completed: false,
    completedAt: '',
    completedChecks: { mobile: false, fluids: false },
    completedAtByType: {},
    answers: { mobile: {}, fluids: {} },
    notes: { mobile: {}, fluids: {} }
  };
}

function getBotiquinVehicles() {
  return state.vehicles.filter(vehicle => !BOTIQUIN_EXCLUDED_VEHICLES.includes(vehicle));
}

function validateRecordForCheck(record, vehicle, group) {
  if (record.outOfService && group === 'mobile') return '';
  if (!record.fecha) return 'Completa la fecha antes de enviar.';
  if (!record.chofer.trim()) return 'Completa el chofer antes de enviar.';
  if (!record.km.trim()) return 'Completa los kilometros antes de enviar.';
  if (!record.botiquin.trim()) return 'Completa el botiquin / precinto antes de enviar.';
  const questions = group === 'fluids' ? (state.fluidQuestions || fluidQuestions) : getQuestions(vehicle);
  const missing = questions.find(item => !record.answers[group]?.[item.question || item]);
  return missing ? `Falta responder: ${missing.question || missing}` : '';
}

function updateLastChecksFromPayload(payload, pdfByVehicle = {}) {
  if (!state.lastChecks) state.lastChecks = {};
  const savedVehicles = Object.keys(pdfByVehicle);
  (savedVehicles.length ? savedVehicles : payload.vehicles || []).forEach(vehicle => {
    const record = payload.records?.[vehicle] || getRecord(payload.day, vehicle);
    const target = state.lastChecks[vehicle] || { mobile: {}, fluids: {} };
    target.km = record.km || target.km || '';
    target.botiquin = record.botiquin || target.botiquin || '';
    target.chofer = record.chofer || target.chofer || '';
    if (payload.checkType !== 'check-fluidos') {
      target.mobile = cloneLastGroup(record.answers?.mobile, record.notes?.mobile, record.pdfUrl);
    }
    if (payload.checkType === 'check-fluidos' || (payload.checkType === 'day' && (payload.fluids || []).includes(vehicle))) {
      target.fluids = cloneLastGroup(record.answers?.fluids, record.notes?.fluids, record.pdfUrl);
    }
    state.lastChecks[vehicle] = target;
  });
  saveData();
}

function cloneLastGroup(answers, notes, pdfUrl) {
  return {
    answers: { ...(answers || {}) },
    notes: { ...(notes || {}) },
    savedAt: new Date().toISOString(),
    pdfUrl: pdfUrl || ''
  };
}

function isRecordComplete(record, group) {
  if (record.completedChecks) return Boolean(record.completedChecks[group]);
  return Boolean(record.completed);
}

function renderChoferesList() {
  let list = document.getElementById('choferesList');
  if (!list) {
    list = document.createElement('datalist');
    list.id = 'choferesList';
    document.body.appendChild(list);
  }
  list.innerHTML = (state.choferes || []).map(name => `<option value="${escapeAttr(name)}"></option>`).join('');
}

function renderPills(items, emptyText) {
  if (!items.length) return `<span class="subcopy">${escapeHtml(emptyText)}</span>`;
  return items.map(item => `<span class="pill">${escapeHtml(item)}</span>`).join('');
}

function getScriptUrl() {
  const saved = localStorage.getItem(CONFIG_KEY);
  return saved === null ? DEFAULT_SCRIPT_URL : saved;
}

function loadData() {
  try {
    const saved = JSON.parse(localStorage.getItem(DATA_KEY));
    if (saved && Array.isArray(saved.vehicles)) return saved;
  } catch (error) {
    console.warn(error);
  }
  return structuredClone(baseData);
}

function saveData() {
  localStorage.setItem(DATA_KEY, JSON.stringify(state));
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch (error) {
    return [];
  }
}

function pushHistory(item) {
  const history = getHistory();
  history.unshift(item);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history.slice(0, 80)));
}

function replaceLastHistoryPdf(pdfUrl) {
  const history = getHistory();
  if (history[0]) history[0].pdfUrl = pdfUrl;
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

function renderHistory() {
  const items = getHistory();
  if (!items.length) {
    els.historyList.innerHTML = '<div class="empty-state">Todavia no hay registros guardados.</div>';
    return;
  }
  els.historyList.innerHTML = items.map(item => `
    <article class="history-card">
      <strong>${escapeHtml(item.day)} - ${escapeHtml(item.dateText || '')}</strong>
      <div>${escapeHtml(item.responsible || 'Sin chofer')}</div>
      <div>${escapeHtml((item.vehicles || []).join(', '))}</div>
      ${item.pdfUrl ? `<a href="${escapeAttr(item.pdfUrl)}" target="_blank" rel="noreferrer">Abrir PDF en Drive</a>` : ''}
    </article>
  `).join('');
}

function clearHistory() {
  if (!confirm('Limpiar historial local?')) return;
  localStorage.removeItem(HISTORY_KEY);
  renderHistory();
}

function normalizeQuestionItems(items) {
  return (items || []).map(item => {
    if (typeof item === 'string') return { section: inferSection(item), question: item };
    const question = item.question || item.pregunta || '';
    const providedSection = item.section || item.seccion || '';
    return {
      section: !providedSection || providedSection === 'Control general' ? inferSection(question) : providedSection,
      question
    };
  }).filter(item => item.question);
}

function inferSection(question) {
  const text = String(question || '').toLowerCase();
  if (/aceite|agua|refrigerante|liquido|combustible|sapito|presion|cubierta|neumatic/.test(text)) return 'FLUIDOS Y NEUMATICOS';
  if (/bomba|motobomba|acople|generador/.test(text)) return 'BOMBA';
  if (/luz|luces|baliza|antiniebla|reflector|reversa|alarma|delantera|trasera|stop|giro|cabina delantera|cabina trasera/.test(text)) return 'LUCES';
  if (/fuera de servicio|observacion/.test(text)) return 'OBSERVACIONES';
  return 'CABINA';
}

function groupQuestions(items) {
  const groups = [];
  normalizeQuestionItems(items).forEach(item => {
    let group = groups.find(entry => entry.title === item.section);
    if (!group) {
      group = { title: item.section, items: [] };
      groups.push(group);
    }
    group.items.push(item);
  });
  return groups.sort((a, b) => sectionRank(a.title) - sectionRank(b.title));
}

function sectionRank(title) {
  const index = SECTION_ORDER.indexOf(title);
  return index >= 0 ? index : SECTION_ORDER.length;
}

function dayNameFromDate(date) {
  const map = ['Domingo', 'Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sabado'];
  return map[date.getDay()];
}

function parseLocalDate(value) {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

function formatDate(value) {
  const date = parseLocalDate(value);
  if (!date) return '';
  return date.toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function showToast(message) {
  els.toast.textContent = message;
  els.toast.classList.remove('hidden');
  clearTimeout(showToast.timer);
  showToast.timer = setTimeout(() => els.toast.classList.add('hidden'), 2600);
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"]/g, ch => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[ch]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/'/g, '&#39;');
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./service-worker.js').catch(() => {});
  });
}
