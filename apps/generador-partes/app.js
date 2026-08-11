const seed = {
  serviceTypes: [
    "01-INCENDIO", "02-RESCATE", "03-ESPECIALES", "04-DESASTRES",
    "05-COLABORACION", "06-GUARDIA", "07-COMANDO", "08-TECNICO",
    "09-CEREMONIAL", "10-MAT PEL", "11-INCENDIO FORESTAL"
  ],
  roles: ["D", "R", "CH", "G/P"],
  mobiles: ["Movil N° 1", "Movil N° 3", "Movil N° 5", "Movil N° 6", "Movil N° 8", "Movil N° 11", "Movil N° 12", "Movil N° 19", "Movil N° 24", "Movil N° 25", "Movil N° 26", "Movil N° 27"],
  people: [
    ["Morro, Marcos", "Oficial Principal"],
    ["Van Becelaere, David", "Oficial Inspector"],
    ["Puig, Ramiro", "Sub Comandante"],
    ["Cacciatore, Andrea Gisela", "Oficial Inspector"],
    ["Casenave, Eduardo", "Sub oficial Mayor"],
    ["Bustamante, Gustavo Matias", "Sub oficial Principal"],
    ["Cadierno, Lucas", "Sargento Primero"],
    ["Franco, Jose Luis", "Sargento Primero"],
    ["Churin, Luciano", "Sargento"],
    ["Ramirez, Maximiliano Miguel", "Sargento"],
    ["Puchulo, Claudio Alejandro", "Sargento"],
    ["Violante, Fernando", "Sargento"],
    ["Santoro, Juan Ignacio", "Cabo Primero"],
    ["Iglesias, Matias", "Cabo Primero"],
    ["Susenna, David", "Cabo Primero"],
    ["Santucho, Juan Manuel", "Cabo"],
    ["Perrotta, Lucio", "Cabo"],
    ["Gonzalez, Joaquin", "Cabo"],
    ["Ramos, Nicolas", "Bombero"],
    ["Pelourson, Ignacio Martin", "Bombero"],
    ["Echeverria, Luis Daniel", "Bombero"],
    ["Belardo, Agustin", "Bombero"],
    ["Re, German Jesus", "Bombero"],
    ["Otero, Vicente", "Bombero"],
    ["Jaimes, Jaquelin Romina", "Bombero"],
    ["Leide, Mario", "Bombero"],
    ["Ardis, Ricardo Ariel", "Bombero"],
    ["Trotta, Leonardo", "Bombero"],
    ["Bergonzi, Gabriel Enrique", "Bombero"],
    ["Gutierrez, Diego Sebastian", "Bombero"],
    ["Placeres, Pamela Mailen", "Bombero"],
    ["Cladera, Camila Celeste", "Bombero"],
    ["Bottini, Irina", "Bombero"],
    ["Chavero, Sebastian Javier", "Bombero"],
    ["Calzone, Francisco Samuel", "Bombero"],
    ["Panarisi, Leonardo Daniel", "Bombero"],
    ["Gradiche Alevatto Brisa T.", "Bombero"],
    ["Cogno, Ignacio Gabriel", "Bombero"],
    ["Ramirez, Miqueas Joel", "Bombero"],
    ["Taurelli, Ignacio Ezequiel", "Bombero"],
    ["Sainz, Mirna", "Bombero"],
    ["Ceccoli, Ignacio Jesus", "Bombero"],
    ["Juarez, Milagros", "Bombero"],
    ["Pica, Mariano Jose", "Bombero"],
    ["Cascardo, Erika Delfina", "Bombero"],
    ["Mordacci, Luis Ignacio", "Bombero"],
    ["Paura, Fernando Ariel", "Bombero"],
    ["Aviles Fernandez, Marcos H.", "Bombero"],
    ["Ordonez, Yamila Ayelen", "Bombero"],
    ["Seta, Francisco Ezequiel", "Bombero"],
    ["Mazzucco, Mirna Gisela", "Bombero"],
    ["Chavero, Fernanda Sabrina", "Bombero"],
    ["Gonzalez, Bernardo Agustin", "Bombero"],
    ["Ferreira, Lucrecia", "Bombero"],
    ["Longo, Yanina Natalia", "Bombero"],
    ["Ragone, Bernardo Ivan", "Bombero"],
    ["Mirad, Emanuel Adrian", "Bombero"],
    ["Milluzzo, Nahuel Martin", "Bombero"],
    ["Escudero, Sofia Yamile", "Bombero"],
    ["De Angelis, Ezequiel Dilan", "Bombero"],
    ["Frias, Estefania Fernanda", "Bombero"],
    ["Baronio, Lucia Belen", "Bombero"],
    ["Puchulo, Macarena Nahir", "Bombero"],
    ["Siezza, Ramiro", "Bombero"],
    ["Acosta, Marcos Gabriel", "Bombero"],
    ["Guevara, Luz Maria", "Bombero"],
    ["Broemser, Eduardo Ariel", "Bombero"],
    ["Diaz, Karen Ludmila", "Bombero"],
    ["Calderon, Angeles Maria", "Bombero"],
    ["Maldonado, Cesar Javier", "Bombero"],
    ["Abrigo, Matias Daniel", "Bombero"],
    ["Cocimano, Micaela", "Bombero"],
    ["Marcello, Ana Luz", "Bombero"],
    ["Buscalia, Franco", "Bombero"],
    ["Parra, Jeremias", "Bombero"],
    ["Ullua, Julieta", "Bombero"]
  ].map(([name, grade]) => ({ name, grade }))
};

const PERSONAL_SHEET_CSV_URL = "https://docs.google.com/spreadsheets/d/1fkfiSwjaFuysUVHaTTaHziDee0Atmrpo-cbH_iqrCuw/gviz/tq?tqx=out:csv&sheet=PERSONAL";
const DEFAULT_APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbx9TtL5TXjuNKsJbBALfVpPFysSsZZu_o8OMbYZbPy3BA94hsG3eomJNNH0GmRsZl7xvg/exec";
let editingId = null;
let editingReturnStatus = "";
let selectedPendingId = null;
let activeLoadSlot = 0;
let loadSlotSequence = 1;
let loadSlots = [{ id: 1, title: "CARGA 1", draft: null }];
let remoteServices = [];
let roster = seed.people;
let metricView = "general";
let metricFrom = "";
let metricTo = "";
let selectedMobile = "";
let selectedPerson = "";
let personSearch = "";
let pendingSearch = "";
let printSearch = "";
let metricBoundsReady = false;
const typeColors = {};
const defaultTypeColors = ["#123f73", "#1f7a4f", "#c9972d", "#8f1d1d", "#5d5fef", "#167f92", "#9b5d16", "#4c6f2b", "#6a3d9a", "#444"];

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => Array.from(root.querySelectorAll(selector));

function people() {
  return roster;
}

function refreshPeopleControls() {
  renderSelects();
  resetForm();
}

function optionList(values, selected = "") {
  return values.map(value => `<option value="${escapeHtml(value)}"${value === selected ? " selected" : ""}>${escapeHtml(value)}</option>`).join("");
}

function personOptions(selected = "") {
  return `<option value="">Seleccionar</option>` + people().map(p => `<option value="${escapeHtml(p.name)}"${p.name === selected ? " selected" : ""}>${escapeHtml(p.name)}</option>`).join("");
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, char => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[char]));
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function nowTime() {
  return new Date().toTimeString().slice(0, 5);
}

function durationHours(service) {
  if (!service.fechaSalida || !service.horaSalida || !service.fechaRegreso || !service.horaRegreso) return 0;
  const start = new Date(`${service.fechaSalida}T${service.horaSalida}`);
  const end = new Date(`${service.fechaRegreso}T${service.horaRegreso}`);
  const diff = (end - start) / 36e5;
  return Number.isFinite(diff) && diff > 0 ? diff : 0;
}

function uniqueMobiles(service) {
  const byName = new Map();
  (service.mobiles || []).forEach(item => {
    const name = (item.name || "").trim();
    if (!name) return;
    if (!byName.has(name)) byName.set(name, { name, driver: item.driver || "" });
    else if (!byName.get(name).driver && item.driver) byName.get(name).driver = item.driver;
  });
  return [...byName.values()];
}

function activeCrew(service) {
  const byPerson = new Map();
  (service.crew || []).forEach(item => {
    if (item.role !== "D" && item.role !== "CH") return;
    const person = (item.person || "").trim();
    if (!person || byPerson.has(person)) return;
    byPerson.set(person, { person, role: item.role });
  });
  return [...byPerson.values()];
}

function rolePriority(role) {
  if (role === "CH") return 4;
  if (role === "D") return 3;
  if (role === "R") return 2;
  if (role === "G/P") return 1;
  return 0;
}

function rosterRoleMap(service) {
  const roles = new Map();
  (service.crew || []).forEach(item => {
    const person = (item.person || "").trim();
    if (!person) return;
    const current = roles.get(person) || "";
    if (rolePriority(item.role) > rolePriority(current)) roles.set(person, item.role);
  });
  return roles;
}

function generateId(acta) {
  const clean = (acta || "parte").replace(/[^\w-]+/g, "-");
  return `${clean}-${Date.now()}`;
}

function renderSelects() {
  $('[name="codigo"]').innerHTML = `<option value="">Seleccionar</option>${optionList(seed.serviceTypes)}`;
  $('[name="aCargo"]').innerHTML = personOptions();
  $('[name="operador"]').innerHTML = personOptions();
}

function renderCrewPanel(selectedCrew = []) {
  const selected = new Map(selectedCrew.map(item => [item.person, item.role]));
  $("#crewPanel").innerHTML = people().map(person => {
    const role = selected.get(person.name) || "";
    return `
      <div class="crew-person-card ${roleClass(role)}" data-person="${escapeHtml(person.name)}">
        <div>
          <strong>${escapeHtml(person.name)}</strong>
          <span>${escapeHtml(person.grade || "")}</span>
        </div>
        <select class="crew-role" aria-label="Rol ${escapeHtml(person.name)}">
          <option value=""${role === "" ? " selected" : ""}>-</option>
          <option value="D"${role === "D" ? " selected" : ""}>D</option>
          <option value="CH"${role === "CH" ? " selected" : ""}>CH</option>
          <option value="R"${role === "R" ? " selected" : ""}>R</option>
          <option value="G/P"${role === "G/P" ? " selected" : ""}>G/P</option>
        </select>
      </div>
    `;
  }).join("");
  $$(".crew-role", $("#crewPanel")).forEach(select => {
    select.addEventListener("change", event => {
      const card = event.target.closest(".crew-person-card");
      card.className = `crew-person-card ${roleClass(event.target.value)}`;
    });
  });
}

function roleClass(role) {
  if (role === "D" || role === "CH") return "role-duty";
  if (role === "R") return "role-standby";
  if (role === "G/P") return "role-paid";
  return "";
}

function addMobileRow(data = {}) {
  const node = $("#mobileTemplate").content.firstElementChild.cloneNode(true);
  $(".mobile-name", node).innerHTML = `<option value="">Movil</option>${optionList(seed.mobiles, data.name)}`;
  $(".mobile-driver", node).innerHTML = personOptions(data.driver);
  $(".remove", node).addEventListener("click", () => node.remove());
  $("#mobileRows").append(node);
}

function resetForm(clearDraft = true) {
  editingId = null;
  editingReturnStatus = "";
  $("#serviceForm").reset();
  $('[name="parteAnio"]').value = "26";
  $('[name="fechaLlamada"]').value = today();
  $('[name="fechaSalida"]').value = today();
  $('[name="fechaRegreso"]').value = today();
  $('[name="horaLlamada"]').value = nowTime();
  $('[name="horaSalida"]').value = nowTime();
  $("#mobileRows").innerHTML = "";
  addMobileRow();
  renderCrewPanel();
  if (clearDraft) loadSlots[activeLoadSlot].draft = null;
}

function serializeCurrentForm() {
  const form = new FormData($("#serviceForm"));
  const data = Object.fromEntries(form.entries());
  data.mobiles = $$(".mobile-row").map(row => ({
    name: $(".mobile-name", row).value,
    driver: $(".mobile-driver", row).value
  }));
  data.crew = $$(".crew-person-card").map(card => ({
    person: card.dataset.person,
    role: $(".crew-role", card).value
  })).filter(item => item.person && item.role);
  return data;
}

function saveCurrentDraft() {
  loadSlots[activeLoadSlot].draft = serializeCurrentForm();
}

function loadDraft(slotIndex) {
  const data = loadSlots[slotIndex]?.draft;
  resetForm(false);
  activeLoadSlot = slotIndex;
  if (!data) {
    renderLoadTabs();
    return;
  }
  Object.entries(data).forEach(([key, value]) => {
    const field = $(`[name="${key}"]`);
    if (field && typeof value !== "object") field.value = value || "";
  });
  $("#mobileRows").innerHTML = "";
  (data.mobiles?.length ? data.mobiles : [{}]).forEach(addMobileRow);
  renderCrewPanel(data.crew || []);
  renderLoadTabs();
}

function renderLoadTabs() {
  $("#loadTabs").innerHTML = loadSlots.map((slot, index) => `
    <button type="button" class="load-tab ${index === activeLoadSlot ? "active" : ""}" data-load-slot="${index}">
      <span>${escapeHtml(slot.title)}</span>
      <span class="load-close" data-close-load="${index}" title="Cerrar carga">x</span>
    </button>
  `).join("");
}

function addLoadSlot() {
  saveCurrentDraft();
  loadSlotSequence += 1;
  loadSlots.push({ id: loadSlotSequence, title: `CARGA ${loadSlotSequence}`, draft: null });
  activeLoadSlot = loadSlots.length - 1;
  resetForm(false);
  renderLoadTabs();
}

function closeLoadSlot(slotIndex) {
  if (loadSlots.length === 1) {
    loadSlots[0].draft = null;
    activeLoadSlot = 0;
    resetForm(false);
    renderLoadTabs();
    return;
  }
  loadSlots.splice(slotIndex, 1);
  activeLoadSlot = Math.max(0, Math.min(activeLoadSlot, loadSlots.length - 1));
  loadDraft(activeLoadSlot);
}

function collectForm(status = "pending") {
  const form = new FormData($("#serviceForm"));
  const data = Object.fromEntries(form.entries());
  data.parteNumero = (data.parteNumero || "").trim();
  data.parteAnio = (data.parteAnio || "26").trim();
  data.acta = data.parteNumero && data.parteAnio ? `${data.parteNumero}/${data.parteAnio}` : data.parteNumero;
  const mobiles = $$(".mobile-row").map(row => ({
    name: $(".mobile-name", row).value,
    driver: $(".mobile-driver", row).value
  })).filter(item => item.name || item.driver);
  const crew = $$(".crew-person-card").map(card => ({
    person: card.dataset.person,
    role: $(".crew-role", card).value
  })).filter(item => item.person && item.role);
  return {
    id: editingId || generateId(data.acta),
    createdAt: editingId ? undefined : new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status,
    downloadedAt: null,
    ...data,
    mobiles,
    crew
  };
}

async function saveService(status = "pending") {
  const current = collectForm(status);
  const forcedStatus = editingReturnStatus;
  if (forcedStatus) current.status = forcedStatus;
  const duplicate = remoteServices.find(item => item.acta && item.acta === current.acta && item.id !== current.id);
  const replacingDuplicate = !!duplicate;
  if (duplicate) {
    const replace = confirm("Usted esta por reemplazar un parte existente, está seguro?");
    if (!replace) return;
    current.id = duplicate.id;
    editingId = duplicate.id;
  }
  const previous = editingId ? remoteServices.find(item => item.id === editingId) : duplicate || null;
  const service = {
    ...previous,
    ...current,
    status: !forcedStatus && !replacingDuplicate && previous?.status === "complete" ? "complete" : current.status,
    downloadedAt: previous?.downloadedAt || current.downloadedAt,
    createdAt: previous?.createdAt || current.createdAt
  };
  if (forcedStatus === "ready_print") {
    service.printedFrontAt = "";
    service.printedCrewAt = "";
  }
  remoteServices = upsertLocalService(service);
  showToast("Se está guardando, por favor espere.", { persistent: true });
  try {
    await sendToAppsScript(service);
    editingReturnStatus = "";
    resetForm();
    renderLoadTabs();
    await loadRemoteServices();
    showToast(`Parte ${service.acta || "S/N"} guardado correctamente. Hoy también vas a tener un lindo día! 💜`, { duration: 5200 });
    showView(service.status === "ready_print" ? "imprimir" : "pendientes");
  } catch (error) {
    showToast("No se pudo guardar el parte. Revisá la conexión e intentá nuevamente.", { duration: 5200 });
    throw error;
  }
}

async function sendToAppsScript(service, options = {}) {
  const url = DEFAULT_APPS_SCRIPT_URL;
  if (!url) return;
  await fetch(url, {
    method: "POST",
    mode: "no-cors",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({ action: "guardarParte", parte: service, options })
  });
}

function showToast(message, options = {}) {
  const toast = $("#toast");
  if (!toast) return alert(message);
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(showToast.timeout);
  if (!options.persistent) {
    showToast.timeout = setTimeout(() => toast.classList.remove("show"), options.duration || 3200);
  }
}

function upsertLocalService(service) {
  const withoutCurrent = remoteServices.filter(item => item.id !== service.id);
  return [service, ...withoutCurrent];
}

function jsonp(url) {
  return new Promise((resolve, reject) => {
    const callback = `sbvpJsonp_${Date.now()}_${Math.random().toString(36).slice(2)}`;
    const script = document.createElement("script");
    const separator = url.includes("?") ? "&" : "?";
    window[callback] = data => {
      delete window[callback];
      script.remove();
      resolve(data);
    };
    script.onerror = () => {
      delete window[callback];
      script.remove();
      reject(new Error("No se pudo leer la hoja de calculos"));
    };
    script.src = `${url}${separator}action=data&callback=${callback}&t=${Date.now()}`;
    document.body.append(script);
  });
}

async function loadRemoteServices() {
  try {
    const data = await jsonp(DEFAULT_APPS_SCRIPT_URL);
    if (!data?.ok) throw new Error(data?.error || "Respuesta invalida");
    remoteServices = normalizeRemoteData(data);
    metricBoundsReady = false;
  } catch (error) {
    console.warn(error);
  }
  await renderAll();
}

function normalizeRemoteData(data) {
  const crewById = groupRows(data.dotacion || [], "servicio_id");
  const mobileById = groupRows(data.moviles || [], "servicio_id");
  const services = (data.servicios || []).map(row => {
    const id = textValue(row.servicio_id) || generateId(row.parte_servicio);
    const acta = textValue(row.parte_servicio);
    return {
      id,
      parteNumero: textValue(row.parte_numero) || acta.split("/")[0] || "",
      parteAnio: textValue(row.parte_anio) || acta.split("/")[1] || "26",
      acta,
      codigo: textValue(row.codigo_servicio),
      tipo: textValue(row.tipo_servicio),
      denunciante: textValue(row.denunciante),
      telefono: textValue(row.telefono),
      ubicacion: textValue(row.ubicacion),
      distancia: numberValue(row.distancia_km),
      fechaLlamada: dateValue(row.fecha_llamada),
      horaLlamada: timeValue(row.hora_llamada),
      fechaSalida: dateValue(row.fecha_salida),
      horaSalida: timeValue(row.hora_salida),
      fechaRegreso: dateValue(row.fecha_regreso),
      horaRegreso: timeValue(row.hora_regreso),
      aCargo: textValue(row.persona_a_cargo),
      operador: textValue(row.operador),
      reconocimiento: textValue(row.reconocimiento),
      disposiciones: textValue(row.disposiciones),
      perdidas: textValue(row.perdidas),
      propietario1: textValue(row.propietario1) || "N/A",
      dniPropietario1: textValue(row.dni_propietario1) || "N/A",
      compania1: textValue(row.compania1) || "N/A",
      poliza1: textValue(row.poliza1) || "N/A",
      propietario2: textValue(row.propietario2) || "N/A",
      dniPropietario2: textValue(row.dni_propietario2) || "N/A",
      compania2: textValue(row.compania2) || "N/A",
      poliza2: textValue(row.poliza2) || "N/A",
      status: textValue(row.estado) || "pending",
      createdAt: isoDateTime(row.creado_en) || new Date().toISOString(),
      completedAt: isoDateTime(row.completado_en),
      printedFrontAt: isoDateTime(row.frente_impreso_en),
      printedCrewAt: isoDateTime(row.dotacion_impresa_en),
      updatedAt: isoDateTime(row.actualizado_en),
      crew: (crewById[id] || []).map(item => ({ person: textValue(item.persona), role: textValue(item.rol) })).filter(item => item.person),
      mobiles: (mobileById[id] || []).map(item => ({ name: textValue(item.movil), driver: textValue(item.chofer) })).filter(item => item.name || item.driver)
    };
  });
  return latestByParte(services);
}

function latestByParte(services) {
  const byActa = new Map();
  services.forEach(service => {
    if (!service.acta) {
      byActa.set(service.id, service);
      return;
    }
    const previous = byActa.get(service.acta);
    const previousDate = new Date(previous?.updatedAt || previous?.createdAt || 0).getTime();
    const currentDate = new Date(service.updatedAt || service.createdAt || 0).getTime();
    if (!previous || currentDate >= previousDate) byActa.set(service.acta, service);
  });
  return [...byActa.values()];
}

function groupRows(rows, key) {
  return rows.reduce((acc, row) => {
    const value = textValue(row[key]);
    if (!value) return acc;
    acc[value] ||= [];
    acc[value].push(row);
    return acc;
  }, {});
}

function textValue(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function numberValue(value) {
  const number = Number(String(value ?? "").replace(",", "."));
  return Number.isFinite(number) ? number : 0;
}

function dateValue(value) {
  if (!value) return "";
  if (value instanceof Date) return value.toISOString().slice(0, 10);
  const text = String(value).trim();
  if (/^\d{4}-\d{2}-\d{2}/.test(text)) return text.slice(0, 10);
  const match = text.match(/^(\d{1,2})\/(\d{1,2})\/(\d{2,4})/);
  if (!match) return text.slice(0, 10);
  const year = match[3].length === 2 ? `20${match[3]}` : match[3];
  return `${year}-${match[2].padStart(2, "0")}-${match[1].padStart(2, "0")}`;
}

function timeValue(value) {
  if (!value) return "";
  const text = String(value).trim();
  const match = text.match(/(\d{1,2}):(\d{2})/);
  return match ? `${match[1].padStart(2, "0")}:${match[2]}` : "";
}

function isoDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toISOString();
}

function serviceSummary(service) {
  const hours = durationHours(service);
  return `${service.fechaSalida || "Sin fecha"} | ${service.codigo || "Sin codigo"} | ${service.ubicacion || "Sin ubicacion"} | ${hours.toFixed(1)} hs`;
}

function statusText(service) {
  if (service.status === "ready_print") return "Para imprimir";
  if (service.status === "complete") return "Completo";
  return "Para completar";
}

function renderServiceCard(service, actions = "") {
  const statusClass = service.status === "complete" ? "status complete" : "status";
  return `
    <article class="service-item" data-service-id="${service.id}">
      <div>
        <h3>${escapeHtml(service.aCargo || "Sin persona a cargo")} - Parte ${escapeHtml(service.acta || "S/N")} <span class="${statusClass}">${statusText(service)}</span></h3>
        <p>${escapeHtml(serviceSummary(service))}</p>
      </div>
      ${actions ? `<div class="item-actions">${actions}</div>` : ""}
    </article>
  `;
}

function renderPendingCard(service) {
  const card = renderServiceCard(service, `
    <button class="primary" data-action="open-complete" data-id="${service.id}">Seleccionar</button>
    <button class="secondary" data-action="print-incomplete-front" data-id="${service.id}">Imprimir frente</button>
    <button class="secondary" data-action="print-incomplete-crew" data-id="${service.id}">Imprimir dorso</button>
    <button class="ghost" data-action="edit" data-id="${service.id}">Editar</button>
  `);
  return selectedPendingId && selectedPendingId !== service.id ? card.replace('class="service-item"', 'class="service-item hidden-while-zoom"') : card;
}

function renderPrintCard(service) {
  const frontState = service.printedFrontAt ? "Frente impreso" : "Frente pendiente";
  const crewState = service.printedCrewAt ? "Dotacion impresa" : "Dotacion pendiente";
  return renderServiceCard(service, `
    <button class="secondary" data-action="print-front" data-id="${service.id}">Imprimir frente</button>
    <button class="secondary" data-action="print-crew" data-id="${service.id}">Imprimir dotacion</button>
  `).replace("</p>", ` | ${frontState} | ${crewState}</p>`);
}

function renderHistoryCard(service) {
  return renderServiceCard(service, `
    <button class="primary" data-action="edit-history" data-id="${service.id}">Editar</button>
    <button class="ghost" data-action="print-front" data-id="${service.id}">Frente</button>
    <button class="ghost" data-action="print-crew" data-id="${service.id}">Dotacion</button>
  `);
}

function renderCompletionEditor(service) {
  if (!service) {
    $("#completionEditor").innerHTML = `<p class="muted completion-empty">Selecciona una tarjeta para completar el parte.</p>`;
    return;
  }
  const escapeAttr = value => escapeHtml(value).replace(/"/g, "&quot;");
  $("#completionEditor").innerHTML = `
    <div class="completion-panel" data-service-id="${service.id}">
      <div class="panel-title">
        <div>
          <h2>${escapeHtml(service.aCargo || "Sin persona a cargo")} - Parte ${escapeHtml(service.acta || "S/N")}</h2>
          <p>${escapeHtml(serviceSummary(service))}</p>
        </div>
      </div>
      <div class="completion-fields">
        <label>Reconocimiento<textarea data-field="reconocimiento" rows="5">${escapeHtml(service.reconocimiento || "")}</textarea></label>
        <label>Disposiciones<textarea data-field="disposiciones" rows="5">${escapeHtml(service.disposiciones || "")}</textarea></label>
        <label>Perdidas<textarea data-field="perdidas" rows="5">${escapeHtml(service.perdidas || "")}</textarea></label>
      </div>
      <div class="form-block">
        <h3>Propietarios y seguros</h3>
        <div class="grid four">
          <label>Propietario 1<input data-field="propietario1" value="${escapeAttr(service.propietario1 || "N/A")}"></label>
          <label>DNI Propietario 1<input data-field="dniPropietario1" value="${escapeAttr(service.dniPropietario1 || "N/A")}"></label>
          <label>Compania 1<input data-field="compania1" value="${escapeAttr(service.compania1 || "N/A")}"></label>
          <label>Nro de poliza 1<input data-field="poliza1" value="${escapeAttr(service.poliza1 || "N/A")}"></label>
          <label>Propietario 2<input data-field="propietario2" value="${escapeAttr(service.propietario2 || "N/A")}"></label>
          <label>DNI Propietario 2<input data-field="dniPropietario2" value="${escapeAttr(service.dniPropietario2 || "N/A")}"></label>
          <label>Compania 2<input data-field="compania2" value="${escapeAttr(service.compania2 || "N/A")}"></label>
          <label>Nro de poliza 2<input data-field="poliza2" value="${escapeAttr(service.poliza2 || "N/A")}"></label>
        </div>
      </div>
      <div class="actions">
        <button class="ghost" data-action="close-complete" data-id="${service.id}">Cerrar</button>
        <button class="primary" data-action="complete" data-id="${service.id}">Completar y enviar a imprimir</button>
      </div>
    </div>
  `;
}

async function renderAll() {
  const services = [...remoteServices];
  services.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  const last = services[0];
  $("#lastService").textContent = last ? `Parte ${last.acta || "S/N"}` : "Sin partes";
  const pending = services
    .filter(s => !s.status || s.status === "pending")
    .filter(service => matchesSearch(service, pendingSearch));
  pending.sort((a, b) => (a.aCargo || "").localeCompare(b.aCargo || "") || new Date(b.createdAt) - new Date(a.createdAt));
  const printQueue = services
    .filter(s => s.status === "ready_print" || (s.status === "complete" && (!s.printedFrontAt || !s.printedCrewAt)))
    .filter(service => matchesSearch(service, printSearch));
  printQueue.sort((a, b) => (a.aCargo || "").localeCompare(b.aCargo || "") || (a.acta || "").localeCompare(b.acta || ""));
  $("#pendingBadge").textContent = pending.length;
  $("#printBadge").textContent = printQueue.length;
  $("#pendingList").innerHTML = pending.length ? pending.map(s => renderPendingCard(s)).join("") : `<p class="muted">No hay partes para completar.</p>`;
  $("#printList").innerHTML = printQueue.length ? printQueue.map(s => renderPrintCard(s)).join("") : `<p class="muted">No hay partes para imprimir.</p>`;
  const selected = pending.find(s => s.id === selectedPendingId);
  $("#pendingList").classList.toggle("is-zoomed", !!selected);
  renderCompletionEditor(selected);
  renderHistory(services);
  renderMetrics(services);
}

function matchesSearch(service, term) {
  if (!term) return true;
  const haystack = [
    service.acta,
    service.parteNumero,
    service.codigo,
    service.tipo,
    service.ubicacion,
    service.aCargo,
    service.operador,
    service.denunciante,
    ...(service.mobiles || []).flatMap(item => [item.name, item.driver]),
    ...(service.crew || []).map(item => item.person)
  ].join(" ").toLowerCase();
  return haystack.includes(term);
}

function renderHistory(services) {
  const cutoff = new Date();
  cutoff.setMonth(cutoff.getMonth() - 3);
  const term = $("#historySearch").value.toLowerCase().trim();
  const filtered = services.filter(service => {
    const date = new Date(service.createdAt || service.fechaSalida);
    const text = JSON.stringify(service).toLowerCase();
    return date >= cutoff && (!term || text.includes(term));
  });
  $("#historyList").innerHTML = filtered.length ? filtered.map(s => renderHistoryCard(s)).join("") : `<p class="muted">No hay resultados en los ultimos 3 meses.</p>`;
}

function renderMetrics(services) {
  ensureMetricBounds(services);
  const filtered = filterServicesByPeriod(services);
  renderPeriodText();
  const total = filtered.length;
  const hours = filtered.reduce((sum, service) => sum + durationHours(service), 0);
  const crewTotal = filtered.reduce((sum, service) => sum + activeCrew(service).length, 0);
  const mobileNames = new Set(filtered.flatMap(service => uniqueMobiles(service).map(m => m.name)));
  $("#mTotal").textContent = total;
  $("#mHours").textContent = hours.toFixed(1);
  $("#mCrew").textContent = total ? (crewTotal / total).toFixed(1) : "0";
  $("#mMobiles").textContent = mobileNames.size;
  renderCurve(filtered);
  renderBars("#typeMetrics", countBy(filtered, s => s.codigo || "Sin codigo"));
  renderPie("#typePie", countBy(filtered, s => s.codigo || "Sin codigo"));
  renderBars("#kmByMobile", mobileKm(filtered), " km");
  renderMobileCards(filtered);
  renderPeopleCards(filtered);
}

function ensureMetricBounds(services) {
  if (metricBoundsReady) return;
  const dates = services.map(service => service.fechaSalida || service.createdAt?.slice(0, 10)).filter(Boolean).sort();
  metricFrom = dates[0] || "";
  metricTo = today();
  $("#metricFrom").value = metricFrom;
  $("#metricTo").value = metricTo;
  metricBoundsReady = true;
}

function filterServicesByPeriod(services) {
  return services.filter(service => {
    const value = service.fechaSalida || service.createdAt?.slice(0, 10) || "";
    if (metricFrom && value < metricFrom) return false;
    if (metricTo && value > metricTo) return false;
    return true;
  });
}

function renderPeriodText() {
  const from = metricFrom || "el inicio";
  const to = metricTo || "hoy";
  $("#periodText").textContent = `Usted esta viendo el periodo de ${from} a ${to}.`;
}

function countBy(items, getter) {
  return items.reduce((acc, item) => {
    const key = getter(item);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});
}

function mobileHours(services) {
  const totals = {};
  services.forEach(service => {
    const hours = durationHours(service);
    uniqueMobiles(service).forEach(mobile => {
      if (!mobile.name) return;
      totals[mobile.name] = (totals[mobile.name] || 0) + hours;
    });
  });
  return totals;
}

function mobileKm(services) {
  const totals = {};
  services.forEach(service => {
    uniqueMobiles(service).forEach(mobile => {
      if (!mobile.name) return;
      totals[mobile.name] = (totals[mobile.name] || 0) + Number(service.distancia || 0);
    });
  });
  return totals;
}

function renderBars(selector, data, suffix = "") {
  const entries = Object.entries(data).sort((a, b) => b[1] - a[1]).slice(0, 12);
  const max = Math.max(1, ...entries.map(([, value]) => value));
  $(selector).innerHTML = entries.length ? entries.map(([label, value]) => `
    <div class="bar">
      <span>${escapeHtml(label)}</span>
      <div class="bar-track"><div class="bar-fill" style="width:${(value / max) * 100}%"></div></div>
      <strong>${Number(value).toFixed(suffix ? 1 : 0)}${suffix}</strong>
    </div>
  `).join("") : `<p class="muted">Sin datos todavia.</p>`;
}

function renderCurve(services) {
  const periods = [...new Set(services.map(servicePeriod).filter(Boolean))].sort();
  const types = [...new Set(services.map(s => s.codigo || "Sin codigo"))].sort();
  if (!periods.length || !types.length) {
    $("#serviceCurve").innerHTML = `<p class="muted">Sin datos para el periodo.</p>`;
    return;
  }
  const width = 900;
  const height = 260;
  const pad = 34;
  const byTypeDate = {};
  let max = 1;
  types.forEach(type => {
    byTypeDate[type] = periods.map(period => {
      const count = services.filter(s => (s.codigo || "Sin codigo") === type && servicePeriod(s) === period).length;
      max = Math.max(max, count);
      return count;
    });
  });
  types.forEach((type, index) => typeColors[type] ||= defaultTypeColors[index % defaultTypeColors.length]);
  renderTypeColorControls(types);
  const yStep = Math.max(1, Math.ceil(max / 6));
  const yTicks = [];
  for (let value = 0; value <= max; value += yStep) yTicks.push(value);
  if (!yTicks.includes(max)) yTicks.push(max);
  const xLabelStep = Math.max(1, Math.ceil(periods.length / 8));
  const x = index => periods.length === 1 ? width / 2 : pad + index * ((width - pad * 2) / (periods.length - 1));
  const y = value => height - pad - (value / max) * (height - pad * 2);
  const yAxisLabels = yTicks.map(value => `
    <g>
      <line x1="${pad - 5}" y1="${y(value)}" x2="${width - pad}" y2="${y(value)}" stroke="#e1e6eb" stroke-width="1"/>
      <text x="${pad - 10}" y="${y(value) + 4}" text-anchor="end" font-size="12" fill="#4d5864">${value}</text>
    </g>
  `).join("");
  const xAxisLabels = periods.map((period, index) => {
    if (index % xLabelStep !== 0 && index !== periods.length - 1) return "";
    return `
      <g>
        <line x1="${x(index)}" y1="${height - pad}" x2="${x(index)}" y2="${height - pad + 5}" stroke="#9aa4af"/>
        <text x="${x(index)}" y="${height - 8}" text-anchor="middle" font-size="11" fill="#4d5864">${escapeHtml(formatChartPeriod(period))}</text>
      </g>
    `;
  }).join("");
  const paths = types.map((type, typeIndex) => {
    const points = byTypeDate[type].map((value, index) => `${x(index)},${y(value)}`).join(" ");
    const dots = byTypeDate[type].map((value, index) => `<circle cx="${x(index)}" cy="${y(value)}" r="4" fill="${typeColors[type]}"></circle>`).join("");
    return `<g><polyline points="${points}" fill="none" stroke="${typeColors[type]}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><title>${escapeHtml(type)}</title></polyline>${dots}</g>`;
  }).join("");
  const legend = types.map(type => `<span><i style="background:${typeColors[type]}"></i>${escapeHtml(type)}</span>`).join("");
  $("#serviceCurve").innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" role="img" aria-label="Curva de servicios por fecha y tipo">
      ${yAxisLabels}
      <line x1="${pad}" y1="${height - pad}" x2="${width - pad}" y2="${height - pad}" stroke="#9aa4af"/>
      <line x1="${pad}" y1="${pad}" x2="${pad}" y2="${height - pad}" stroke="#9aa4af"/>
      ${xAxisLabels}
      ${paths}
    </svg>
    <div class="chart-legend">${legend}</div>
  `;
}

function servicePeriod(service) {
  const value = service.fechaSalida || service.createdAt?.slice(0, 10) || "";
  return value ? value.slice(0, 7) : "";
}

function formatChartPeriod(period) {
  const [year, month] = String(period).split("-");
  return month && year ? `${month}/${year.slice(-2)}` : period;
}

function renderTypeColorControls(types) {
  const target = $("#typeColorControls");
  if (!target) return;
  target.innerHTML = types.map(type => `
    <label class="color-chip">
      <input type="color" data-type-color="${escapeHtml(type)}" value="${typeColors[type]}">
      <span>${escapeHtml(type)}</span>
    </label>
  `).join("");
}

function renderPie(selector, data) {
  const entries = Object.entries(data).filter(([, value]) => value > 0).sort((a, b) => b[1] - a[1]);
  const total = entries.reduce((sum, [, value]) => sum + value, 0);
  if (!entries.length) {
    $(selector).innerHTML = `<p class="muted">Sin datos para el periodo.</p>`;
    return;
  }
  let angle = 0;
  const stops = entries.map(([label, value], index) => {
    const start = angle;
    angle += (value / total) * 100;
    const color = typeColors[label] || defaultTypeColors[index % defaultTypeColors.length];
    return `${color} ${start}% ${angle}%`;
  }).join(", ");
  const legend = entries.map(([label, value], index) => {
    const color = typeColors[label] || defaultTypeColors[index % defaultTypeColors.length];
    const percent = ((value / total) * 100).toFixed(1);
    return `<span><i style="background:${color}"></i>${escapeHtml(label)} ${percent}%</span>`;
  }).join("");
  $(selector).innerHTML = `<div class="pie" style="background: conic-gradient(${stops})"></div><div class="chart-legend">${legend}</div>`;
}

function renderMobileCards(services) {
  const hours = mobileHours(services);
  const kms = mobileKm(services);
  const mobiles = Object.keys({ ...hours, ...kms }).sort((a, b) => a.localeCompare(b));
  if (!selectedMobile && mobiles.length) selectedMobile = mobiles[0];
  $("#mobileCards").innerHTML = mobiles.length ? mobiles.map(mobile => {
    const active = mobile === selectedMobile ? " active" : "";
    return `<button class="profile-card${active}" data-mobile-profile="${escapeHtml(mobile)}"><strong>${escapeHtml(mobile)}</strong><span>${(kms[mobile] || 0).toFixed(1)} km</span><span>${(hours[mobile] || 0).toFixed(1)} hs</span></button>`;
  }).join("") : `<p class="muted">Sin moviles en el periodo.</p>`;
  renderMobileProfile(services);
}

function renderMobileProfile(services) {
  const target = $("#mobileProfile");
  if (!selectedMobile) {
    target.innerHTML = `<p class="muted">Selecciona un movil para ver el detalle.</p>`;
    return;
  }
  const mobileServices = services
    .filter(service => service.mobiles.some(item => item.name === selectedMobile))
    .sort((a, b) => (b.fechaSalida || "").localeCompare(a.fechaSalida || ""));
  const hours = mobileServices.reduce((sum, service) => sum + durationHours(service), 0);
  const km = mobileServices.reduce((sum, service) => sum + Number(service.distancia || 0), 0);
  target.innerHTML = `
    <div class="profile-head">
      <h3>${escapeHtml(selectedMobile)}</h3>
      <span>${mobileServices.length} servicios</span>
      <span>${hours.toFixed(1)} hs</span>
      <span>${km.toFixed(1)} km</span>
    </div>
    <div class="table-list compact">
      ${mobileServices.length ? mobileServices.map(service => `<article class="service-item"><strong>Parte ${escapeHtml(service.acta || "S/N")}</strong><span>${escapeHtml(service.fechaSalida || "")}</span><span>${escapeHtml(service.codigo || "")}</span><span>A cargo: ${escapeHtml(service.aCargo || "")}</span><span>${Number(service.distancia || 0).toFixed(1)} km</span></article>`).join("") : `<p class="muted">Sin servicios en este periodo.</p>`}
    </div>
  `;
}

function renderPeopleCards(services) {
  const totals = personTotals(services);
  const rows = Object.entries(totals)
    .filter(([name]) => !personSearch || name.toLowerCase().includes(personSearch))
    .sort((a, b) => a[0].localeCompare(b[0]));
  if (!selectedPerson && rows.length) selectedPerson = rows[0][0];
  $("#personCards").innerHTML = rows.length ? rows.map(([name, data]) => {
    const active = name === selectedPerson ? " active" : "";
    return `<button class="profile-card${active}" data-person-profile="${escapeHtml(name)}"><strong>${escapeHtml(name)}</strong><span>D/CH: ${data.d + data.ch}</span><span>R: ${data.r}</span><span>${data.hours.toFixed(1)} hs</span></button>`;
  }).join("") : `<p class="muted">Sin bomberos para esa busqueda.</p>`;
  renderPersonProfile(services);
}

function personTotals(services) {
  const totals = {};
  services.forEach(service => {
    const hours = durationHours(service);
    rosterRoleMap(service).forEach((role, person) => {
      totals[person] ||= { ch: 0, d: 0, r: 0, paid: 0, other: 0, hours: 0 };
      if (role === "CH") totals[person].ch += 1;
      else if (role === "D") totals[person].d += 1;
      else if (role === "R") totals[person].r += 1;
      else if (role === "G/P") totals[person].paid += 1;
      else totals[person].other += 1;
      if (role === "D" || role === "CH") totals[person].hours += hours;
    });
  });
  return totals;
}

function personMetaMap() {
  return new Map(people().map(person => [person.name, person]));
}

function exportPeopleMetrics() {
  const services = filterServicesByPeriod(remoteServices);
  const totals = personTotals(services);
  const metaByName = personMetaMap();
  const names = new Set([...people().map(person => person.name), ...Object.keys(totals)]);
  const rows = [...names].sort((a, b) => a.localeCompare(b)).map(name => {
    const data = totals[name] || { ch: 0, d: 0, r: 0 };
    const total = data.ch + data.d + data.r;
    return {
      bombero: name,
      legajo: metaByName.get(name)?.legajo || "",
      ch: data.ch || 0,
      d: data.d || 0,
      r: data.r || 0,
      total
    };
  });
  const from = metricFrom || "inicio";
  const to = metricTo || today();
  const tableRows = rows.map(row => `
    <tr>
      <td>${escapeHtml(row.bombero)}</td>
      <td>${escapeHtml(row.legajo)}</td>
      <td>${row.ch}</td>
      <td>${row.d}</td>
      <td>${row.r}</td>
      <td>${row.total}</td>
    </tr>
  `).join("");
  const html = `
    <html>
      <head><meta charset="utf-8"></head>
      <body>
        <table>
          <tr><th colspan="6">Metricas por bombero</th></tr>
          <tr><td colspan="6">Periodo: ${escapeHtml(from)} a ${escapeHtml(to)}</td></tr>
          <tr><td colspan="6"></td></tr>
          <tr>
            <th>Bombero</th>
            <th>Legajo</th>
            <th>CH</th>
            <th>D</th>
            <th>R</th>
            <th>Total CH+D+R</th>
          </tr>
          ${tableRows}
        </table>
      </body>
    </html>
  `;
  downloadBlob(`metricas_bomberos_${safeFilePart(from)}_${safeFilePart(to)}.xls`, html, "application/vnd.ms-excel;charset=utf-8");
}

function downloadBlob(filename, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.append(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function safeFilePart(value) {
  return String(value || "").replace(/[^\w-]+/g, "-");
}

function renderPersonProfile(services) {
  const target = $("#personProfile");
  if (!selectedPerson) {
    target.innerHTML = `<p class="muted">Selecciona un bombero para ver el detalle.</p>`;
    return;
  }
  const personServices = services
    .filter(service => service.crew.some(item => item.person === selectedPerson))
    .sort((a, b) => (b.fechaSalida || "").localeCompare(a.fechaSalida || ""));
  const total = personTotals(services)[selectedPerson] || { ch: 0, d: 0, r: 0, paid: 0, other: 0, hours: 0 };
  target.innerHTML = `
    <div class="profile-head">
      <h3>${escapeHtml(selectedPerson)}</h3>
      <span>CH: ${total.ch}</span>
      <span>D: ${total.d}</span>
      <span>R: ${total.r}</span>
      <span>G/P: ${total.paid}</span>
      <span>${total.hours.toFixed(1)} hs</span>
    </div>
    <div class="split">
      <div class="panel inner-panel"><h3>Tipos de servicio</h3><div id="personTypePie"></div></div>
      <div class="panel inner-panel"><h3>Servicios recientes</h3><div class="table-list compact">${personServices.length ? personServices.map(service => `<article class="service-item"><strong>Parte ${escapeHtml(service.acta || "S/N")}</strong><span>${escapeHtml(service.fechaSalida || "")}</span><span>${escapeHtml(service.codigo || "")}</span><span>${escapeHtml(service.ubicacion || "")}</span></article>`).join("") : `<p class="muted">Sin servicios en este periodo.</p>`}</div></div>
    </div>
  `;
  renderPie("#personTypePie", countBy(personServices, service => service.codigo || "Sin codigo"));
}

function makePrintHtml(service, incomplete = false, mode = "all") {
  const hours = durationHours(service);
  const roleByPerson = rosterRoleMap(service);
  const printMobiles = uniqueMobiles(service);
  const printCrew = activeCrew(service);
  const blocks = [
    ["Codigo", service.codigo], ["Tipo", service.tipo], ["Parte de servicio", service.acta],
    ["Denunciante", service.denunciante || "N/A"], ["Telefono", service.telefono || "N/A"], ["Ubicacion", service.ubicacion],
    ["Cantidad moviles", printMobiles.length], ["A cargo", service.aCargo], ["Operador/a", service.operador],
    ["Fecha llamada", service.fechaLlamada], ["Fecha salida", service.fechaSalida], ["Fecha regreso", service.fechaRegreso],
    ["Hora llamada", service.horaLlamada], ["Hora salida", service.horaSalida], ["Hora regreso", service.horaRegreso],
    ["Distancia", service.distancia ? `${service.distancia} km` : ""], ["Duracion", hours ? `${hours.toFixed(1)} hs` : ""], ["Dotacion", printCrew.length]
  ];
  const allPeople = people();
  const leftCount = Math.min(47, Math.ceil(allPeople.length / 2));
  const leftPeople = allPeople.slice(0, leftCount);
  const rightPeople = allPeople.slice(leftCount);
  const attendanceRows = Array.from({ length: Math.max(leftPeople.length, rightPeople.length) }, (_, index) => {
    const left = leftPeople[index];
    const right = rightPeople[index];
    return `
      <tr>
        <td>${escapeHtml(left?.name || "")}</td>
        <td>${escapeHtml(left?.grade || "")}</td>
        <td>${escapeHtml(left ? roleByPerson.get(left.name) || "-" : "")}</td>
        <td>${escapeHtml(right?.name || "")}</td>
        <td>${escapeHtml(right?.grade || "")}</td>
        <td>${escapeHtml(right ? roleByPerson.get(right.name) || "-" : "")}</td>
      </tr>
    `;
  }).join("");
  const mobileRows = printMobiles.map(item => `<tr><td>${escapeHtml(item.name)}</td><td>${escapeHtml(item.driver)}</td></tr>`).join("");
  const frontHtml = `
    <section class="print-sheet ${incomplete ? "print-incomplete-sheet" : ""}">
      <div class="print-title">
        <img src="logo-sbvp.png" alt="">
        <div><p>Sociedad de Bomberos Voluntarios Pergamino</p><h2>Parte de servicio</h2></div>
      </div>
      <div class="print-grid">${blocks.map(([label, value]) => `<div class="print-cell"><b>${label}</b>${escapeHtml(value || "")}</div>`).join("")}</div>
      <div class="print-block"><h3>Reconocimiento</h3>${escapeHtml(service.reconocimiento || "")}</div>
      <div class="print-block"><h3>Disposiciones</h3>${escapeHtml(service.disposiciones || "")}</div>
      <div class="print-block"><h3>Perdidas</h3>${escapeHtml(service.perdidas || "")}</div>
      <div class="print-block"><h3>Unidades moviles</h3><table class="attendance-table"><thead><tr><th>Movil</th><th>Chofer</th></tr></thead><tbody>${mobileRows}</tbody></table></div>
      <table class="insurance-table">
        <tr><th>Propietario 1:</th><td>${escapeHtml(service.propietario1 || "N/A")}</td><th>Propietario 2:</th><td>${escapeHtml(service.propietario2 || "N/A")}</td></tr>
        <tr><th>DNI Propietario 1:</th><td>${escapeHtml(service.dniPropietario1 || "N/A")}</td><th>DNI Propietario 2:</th><td>${escapeHtml(service.dniPropietario2 || "N/A")}</td></tr>
        <tr><th>Compania 1:</th><td>${escapeHtml(service.compania1 || "N/A")}</td><th>Compania 2:</th><td>${escapeHtml(service.compania2 || "N/A")}</td></tr>
        <tr><th>Nro de poliza 1:</th><td>${escapeHtml(service.poliza1 || "N/A")}</td><th>Nro de poliza 2:</th><td>${escapeHtml(service.poliza2 || "N/A")}</td></tr>
      </table>
      <div class="signature-grid">
        <div class="signature-label">Op. Comando:</div>
        <div class="signature-value">${escapeHtml(service.operador || "")}</div>
        <div class="signature-label">Jefe de servicio</div>
        <div class="signature-value">${escapeHtml(service.aCargo || "")}</div>
        <div class="signature-label tall">Firma:</div>
        <div></div>
        <div class="signature-label tall">Firma:</div>
        <div></div>
      </div>
    </section>
  `;
  const crewHtml = `
    <section class="print-sheet">
      <div class="print-title">
        <img src="logo-sbvp.png" alt="">
        <div><h2>Asistencia del cuerpo activo</h2><p>Parte ${escapeHtml(service.acta || "")} | ${escapeHtml(service.codigo || "")}</p></div>
      </div>
      <p><b>Abreviaturas:</b> Dotacion (D) - Retenido (R) - Guardia Paga (G/P) - Chofer (CH)</p>
      <table class="attendance-table full-roster"><thead><tr><th>Apellido / Nombre</th><th>Grado</th><th></th><th>Apellido / Nombre</th><th>Grado</th><th></th></tr></thead><tbody>${attendanceRows}</tbody></table>
    </section>
  `;
  if (mode === "front") return frontHtml;
  if (mode === "crew") return crewHtml;
  return frontHtml + crewHtml;
}

async function printService(id, incomplete = false, mode = "all") {
  const service = remoteServices.find(item => item.id === id);
  if (!service) return;
  $("#printRoot").innerHTML = makePrintHtml(service, incomplete, mode);
  window.print();
  return service;
}

function printDraftFromForm() {
  const service = collectForm("pending");
  $("#printRoot").innerHTML = makePrintHtml(service, true, "all");
  window.print();
}

async function completeService(id) {
  const service = remoteServices.find(item => item.id === id);
  if (!service) return;
  const panel = $("#completionEditor .completion-panel");
  if (panel) {
    service.reconocimiento = $('[data-field="reconocimiento"]', panel)?.value || "";
    service.disposiciones = $('[data-field="disposiciones"]', panel)?.value || "";
    service.perdidas = $('[data-field="perdidas"]', panel)?.value || "";
    ["propietario1", "dniPropietario1", "compania1", "poliza1", "propietario2", "dniPropietario2", "compania2", "poliza2"].forEach(field => {
      service[field] = $(`[data-field="${field}"]`, panel)?.value || "N/A";
    });
  }
  service.status = "ready_print";
  service.completedAt = new Date().toISOString();
  service.updatedAt = new Date().toISOString();
  remoteServices = upsertLocalService(service);
  await sendToAppsScript(service);
  selectedPendingId = null;
  await loadRemoteServices();
  showView("imprimir");
}

async function openCompletion(id) {
  selectedPendingId = id;
  await renderAll();
}

async function markPrinted(id, kind) {
  const service = remoteServices.find(item => item.id === id);
  if (!service) return;
  if (kind === "front") service.printedFrontAt = new Date().toISOString();
  if (kind === "crew") service.printedCrewAt = new Date().toISOString();
  if (service.printedFrontAt && service.printedCrewAt) service.status = "complete";
  service.updatedAt = new Date().toISOString();
  remoteServices = upsertLocalService(service);
  await sendToAppsScript(service, { saveEditable: true, printKind: kind === "front" ? "frente_completo" : "dorso_completo" });
  await loadRemoteServices();
}

async function editService(id, returnStatus = "") {
  const service = remoteServices.find(item => item.id === id);
  if (!service) return;
  editingId = id;
  editingReturnStatus = returnStatus;
  Object.entries(service).forEach(([key, value]) => {
    const field = $(`[name="${key}"]`);
    if (field && typeof value !== "object") field.value = value || "";
  });
  const [parteNumero, parteAnio] = String(service.acta || "").split("/");
  $('[name="parteNumero"]').value = parteNumero || "";
  $('[name="parteAnio"]').value = parteAnio || "26";
  $("#mobileRows").innerHTML = "";
  (service.mobiles.length ? service.mobiles : [{}]).forEach(addMobileRow);
  renderCrewPanel(service.crew || []);
  showView("partes");
}

function showView(id) {
  $$(".tab").forEach(tab => tab.classList.toggle("active", tab.dataset.view === id));
  $$(".view").forEach(view => view.classList.toggle("active", view.id === id));
}

function importPeople() {
  const lines = $("#peopleCsv").value.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
  const imported = parsePeopleRows(lines.map(line => line.includes(";") ? line.split(";") : splitCsvLine(line)));
  if (!imported.length) return;
  roster = imported;
  refreshPeopleControls();
  alert(`Personal importado: ${imported.length}`);
}

function splitCsvLine(line) {
  const values = [];
  let current = "";
  let quoted = false;
  for (const char of line) {
    if (char === '"') quoted = !quoted;
    else if (char === "," && !quoted) {
      values.push(current.trim());
      current = "";
    } else current += char;
  }
  values.push(current.trim());
  return values.map(value => value.replace(/^"|"$/g, ""));
}

function parsePeopleRows(rows) {
  if (!rows.length) return [];
  const header = rows[0].map(cell => String(cell || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim());
  const hasHeader = header.some(cell => cell.includes("nombre") || cell.includes("apellido") || cell.includes("grado"));
  const fullNameIndex = hasHeader ? header.findIndex(cell => cell.includes("apellido_nombre") || cell.includes("apellido y nombre") || cell.includes("nombre completo")) : 0;
  const lastNameIndex = hasHeader ? header.findIndex(cell => cell === "apellido" || cell.includes("apellido")) : -1;
  const firstNameIndex = hasHeader ? header.findIndex(cell => cell === "nombre" || cell.includes("nombre")) : -1;
  const gradeIndex = hasHeader ? header.findIndex(cell => cell.includes("grado") || cell.includes("jerarquia")) : 1;
  const legajoIndex = hasHeader ? header.findIndex(cell => cell === "persona_id" || cell.includes("legajo") || cell === "lp" || cell.includes("nro")) : -1;
  const dataRows = hasHeader ? rows.slice(1) : rows;
  return dataRows.map(row => {
    const fullName = fullNameIndex >= 0 ? String(row[fullNameIndex] || "").trim() : "";
    const lastName = lastNameIndex >= 0 ? String(row[lastNameIndex] || "").trim() : "";
    const firstName = firstNameIndex >= 0 && firstNameIndex !== lastNameIndex ? String(row[firstNameIndex] || "").trim() : "";
    const fallbackName = String(row[0] || "").trim();
    const name = fullName || (lastName && firstName ? `${lastName}, ${firstName}` : lastName || fallbackName);
    return {
      name,
      grade: String(row[gradeIndex] || "").trim(),
      legajo: legajoIndex >= 0 ? String(row[legajoIndex] || "").trim() : ""
    };
  }).filter(item => item.name && item.name.toLowerCase() !== "nombre");
}

async function syncPeopleFromSheet(showProgress = true) {
  const status = $("#peopleSyncStatus");
  if (status && showProgress) status.textContent = "Sincronizando PERSONAL...";
  try {
    const response = await fetch(PERSONAL_SHEET_CSV_URL, { cache: "no-store" });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const text = await response.text();
    const rows = text.split(/\r?\n/).filter(Boolean).map(splitCsvLine);
    const imported = parsePeopleRows(rows);
    if (!imported.length) throw new Error("No se encontraron filas de personal");
    roster = imported;
    refreshPeopleControls();
    if (status) status.textContent = `PERSONAL sincronizado: ${imported.length} personas.`;
  } catch (error) {
    if (status) status.textContent = "No se pudo leer PERSONAL. Revisar permisos/publicacion del Google Sheet.";
  }
}

function bindActions() {
  document.addEventListener("click", async event => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;
    const { action, id } = button.dataset;
    if (action === "open-complete") await openCompletion(id);
    if (action === "close-complete") {
      selectedPendingId = null;
      await renderAll();
    }
    if (action === "print-front") {
      await printService(id, false, "front");
      await markPrinted(id, "front");
    }
    if (action === "print-crew") {
      await printService(id, false, "crew");
      await markPrinted(id, "crew");
    }
    if (action === "print-incomplete-front") {
      const service = await printService(id, true, "front");
      if (service) {
        service.printedFrontAt = new Date().toISOString();
        service.updatedAt = new Date().toISOString();
        remoteServices = upsertLocalService(service);
        await sendToAppsScript(service, { saveEditable: true, printKind: "frente_incompleto" });
        await loadRemoteServices();
      }
    }
    if (action === "print-incomplete-crew") {
      const service = await printService(id, true, "crew");
      if (service) await sendToAppsScript(service, { saveEditable: true, printKind: "dorso_incompleto" });
    }
    if (action === "complete") await completeService(id);
    if (action === "edit") await editService(id);
    if (action === "edit-history") await editService(id, "ready_print");
  });
  $$(".tab").forEach(tab => tab.addEventListener("click", () => showView(tab.dataset.view)));
  document.addEventListener("click", event => {
    const closeButton = event.target.closest("[data-close-load]");
    if (closeButton) {
      event.preventDefault();
      event.stopPropagation();
      closeLoadSlot(Number(closeButton.dataset.closeLoad));
      return;
    }
    const loadButton = event.target.closest("[data-load-slot]");
    if (!loadButton) return;
    saveCurrentDraft();
    loadDraft(Number(loadButton.dataset.loadSlot));
  });
  document.addEventListener("input", event => {
    const colorInput = event.target.closest("[data-type-color]");
    if (!colorInput) return;
    typeColors[colorInput.dataset.typeColor] = colorInput.value;
    renderMetrics(remoteServices);
  });
  document.addEventListener("click", event => {
    const mobileCard = event.target.closest("[data-mobile-profile]");
    if (mobileCard) {
      selectedMobile = mobileCard.dataset.mobileProfile;
      renderMetrics(remoteServices);
      return;
    }
    const personCard = event.target.closest("[data-person-profile]");
    if (personCard) {
      selectedPerson = personCard.dataset.personProfile;
      renderMetrics(remoteServices);
    }
  });
  $$(".subtab").forEach(tab => tab.addEventListener("click", () => {
    metricView = tab.dataset.metricView;
    $$(".subtab").forEach(item => item.classList.toggle("active", item === tab));
    $$(".metric-pane").forEach(item => item.classList.toggle("active", item.id === `metric-${metricView}`));
  }));
  $("#addMobile").addEventListener("click", () => addMobileRow());
  $("#clearCrew").addEventListener("click", () => renderCrewPanel());
  $("#addLoadSlot").addEventListener("click", addLoadSlot);
  $("#newBlank").addEventListener("click", resetForm);
  $("#printDraft").addEventListener("click", printDraftFromForm);
  $("#historySearch").addEventListener("input", renderAll);
  $("#pendingSearch").addEventListener("input", () => {
    pendingSearch = $("#pendingSearch").value.toLowerCase().trim();
    renderAll();
  });
  $("#printSearch").addEventListener("input", () => {
    printSearch = $("#printSearch").value.toLowerCase().trim();
    renderAll();
  });
  $("#applyMetricFilter").addEventListener("click", () => {
    metricFrom = $("#metricFrom").value;
    metricTo = $("#metricTo").value;
    renderAll();
  });
  $("#personSearch").addEventListener("input", () => {
    personSearch = $("#personSearch").value.toLowerCase().trim();
    selectedPerson = "";
    renderMetrics(remoteServices);
  });
  $("#exportPeopleMetrics").addEventListener("click", exportPeopleMetrics);
  $("#serviceForm").addEventListener("input", saveCurrentDraft);
  $("#serviceForm").addEventListener("change", saveCurrentDraft);
  $("#serviceForm").addEventListener("submit", event => {
    event.preventDefault();
    saveService("pending");
  });
}

async function init() {
  bindActions();
  renderSelects();
  loadDraft(0);
  renderLoadTabs();
  await syncPeopleFromSheet(false);
  await loadRemoteServices();
}

init().catch(error => {
  console.error(error);
  alert("No se pudo iniciar la aplicacion. Revisar permisos del navegador.");
});
