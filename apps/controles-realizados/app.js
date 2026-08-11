const CONFIG = {
  spreadsheetId: "1fkfiSwjaFuysUVHaTTaHziDee0Atmrpo-cbH_iqrCuw",
  personnelGid: "0",
  signaturesGid: "1632175139",
  historyDays: 60,
  appsScriptUrl: "",
};

const PLACE_ITEMS = [
  "Sala de maquinas",
  "Baño femenino",
  "Vestuario femenino",
  "Vestuario masculino",
  "Baño Masculino",
  "Cocina",
  "Patio",
  "Casino",
  "Jefatura",
  "Vereda",
];

const VEHICLE_ITEMS = [
  "Móvil N°3",
  "Móvil N°5",
  "Móvil N°6",
  "Móvil N°8",
  "Móvil N°9",
  "Móvil N°11",
  "Móvil N°12",
  "Móvil N°19",
  "Móvil N°24",
  "Móvil N°26",
  "Móvil N°27",
];

const CONDITION_OPTIONS = ["Bueno", "N/A", "Malo"];
const SHEET_STATUS_OPTIONS = ["Completa", "Incompleta"];
const GUARDIA_OPTIONS = ["Presente", "Ausente"];
const LIMPIEZA_OPTIONS = ["Realizo", "No realizo"];
const TASK_OPTIONS = ["Cocinar", "Mandados", "ERA", "Control de móvil"];

const PLANILLA_ITEMS = [
  "Guardia diaria",
  "Limpieza diaria",
  "Check de ERA",
  "Check de móviles",
];

const DRIVER_CHECK_ITEMS = [
  "Check de choferes",
  "Enviado por mail",
  "Registrado en el libro",
];

const STORAGE_KEYS = {
  draft: "sbvp-control-diario-draft-v2",
  history: "sbvp-control-diario-history-v1",
  pendingSignatureUpdates: "sbvp-control-firmas-pending-v1",
};

const state = {
  personnel: [],
  signatures: [],
  manualSignatures: [],
  draftResponsible: "",
  checks: {
    lugares: PLACE_ITEMS.map((name) => ({ name, condition: "Bueno", note: "" })),
    moviles: VEHICLE_ITEMS.map((name) => ({ name, condition: "Bueno", note: "" })),
    planillas: PLANILLA_ITEMS.map((name) => ({ name, condition: "Completa", note: "" })),
    choferes: DRIVER_CHECK_ITEMS.map((name) => ({ name, condition: "Completa", note: "" })),
  },
  attendance: [],
  signatureControl: {},
};

const $ = (selector) => document.querySelector(selector);

document.addEventListener("DOMContentLoaded", init);

async function init() {
  $("#controlDate").value = new Date().toISOString().slice(0, 10);
  bindTabs();
  bindActions();
  loadDraft();
  pruneHistory();
  renderChecks("lugares");
  renderChecks("moviles");
  renderChecks("planillas");
  renderChecks("choferes");
  renderAttendance();
  renderHistory();
  await loadRemoteData();
  await flushPendingSignatureUpdates();
  updateProgress();
}

function bindTabs() {
  document.querySelectorAll(".tab").forEach((button) => {
    button.addEventListener("click", () => openTab(button.dataset.tab));
  });
}

function openTab(tabName) {
  document.querySelectorAll(".tab, .tab-panel").forEach((el) => el.classList.remove("active"));
  const button = document.querySelector(`.tab[data-tab="${tabName}"]`);
  if (button) button.classList.add("active");
  $(`#tab-${tabName}`).classList.add("active");
}

function bindActions() {
  $("#openHistoryTop").addEventListener("click", () => openTab("historico"));
  $("#setAttendanceAmount").addEventListener("click", setAttendanceAmount);
  $("#manualPartForm").addEventListener("submit", addManualPart);
  $("#saveDraft").addEventListener("click", () => {
    saveDraft();
    setStatus("Borrador guardado", "ok");
  });
  $("#finishControl").addEventListener("click", finishControl);
  $("#clearHistory").addEventListener("click", () => {
    localStorage.removeItem(STORAGE_KEYS.history);
    renderHistory();
  });
  ["controlDate", "responsibleSearch"].forEach((id) => {
    $(`#${id}`).addEventListener("change", saveDraft);
  });
}

async function loadRemoteData() {
  setStatus("Leyendo planilla...", "");
  try {
    const [personnel, signatures] = await Promise.all([
      fetchSheet(CONFIG.personnelGid),
      fetchSheet(CONFIG.signaturesGid),
    ]);
    state.personnel = personnel
      .filter((row) => row.apellido_nombre || row.BOMBERO || row.NOMBRE)
      .map((row) => ({
        id: row.persona_id || "",
        label: row.apellido_nombre || row.BOMBERO || `${row.APELLIDO || ""}, ${row.NOMBRE || ""}`.trim(),
        section: row.SECCION || "",
        grade: row.grado || "",
      }))
      .sort((a, b) => a.label.localeCompare(b.label, "es"));
    state.signatures = signatures.filter((row) => !isCompleteSignatureRow(row));
    renderPersonnel();
    renderSignatures();
    setStatus(`Planilla actualizada: ${state.personnel.length} personas`, "ok");
  } catch (error) {
    console.error(error);
    renderSignatures();
    setStatus("No se pudo leer la planilla", "warn");
  }
}

function fetchSheet(gid) {
  return new Promise((resolve, reject) => {
    const callback = `sbvpSheetCallback_${gid}_${Date.now()}`;
    const script = document.createElement("script");
    const timeout = window.setTimeout(() => {
      cleanup();
      reject(new Error(`Tiempo agotado leyendo hoja ${gid}`));
    }, 15000);

    function cleanup() {
      window.clearTimeout(timeout);
      delete window[callback];
      script.remove();
    }

    window[callback] = (payload) => {
      cleanup();
      if (payload.status !== "ok") {
        reject(new Error(payload.errors?.[0]?.detailed_message || `Error leyendo hoja ${gid}`));
        return;
      }
      resolve(parseGviz(payload));
    };

    script.onerror = () => {
      cleanup();
      reject(new Error(`No se pudo cargar hoja ${gid}`));
    };
    script.src = `https://docs.google.com/spreadsheets/d/${CONFIG.spreadsheetId}/gviz/tq?gid=${gid}&headers=1&tqx=responseHandler:${callback};out:json`;
    document.head.appendChild(script);
  });
}

function parseGviz(payload) {
  const table = payload.table;
  const headers = table.cols.map((col, index) => normalizeHeader(col.label || `col_${index}`));
  return table.rows.map((row) => {
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row.c[index]?.f ?? row.c[index]?.v ?? "";
    });
    return item;
  });
}

function normalizeHeader(value) {
  return String(value)
    .trim()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, "_");
}

function renderPersonnel() {
  const responsible = $("#responsibleSearch");
  const datalist = $("#personnelList");
  const current = responsible.value || state.draftResponsible;
  datalist.innerHTML = "";
  state.personnel.forEach((person) => {
    const dataOption = document.createElement("option");
    dataOption.value = person.label;
    dataOption.label = [person.grade, person.section].filter(Boolean).join(" - ");
    datalist.appendChild(dataOption);
  });
  responsible.value = current;
  state.draftResponsible = "";
}

function renderChecks(kind) {
  const containers = {
    lugares: $("#placeChecks"),
    moviles: $("#vehicleChecks"),
    planillas: $("#sheetChecks"),
    choferes: $("#driverChecks"),
  };
  const options = kind === "lugares" || kind === "moviles" ? CONDITION_OPTIONS : SHEET_STATUS_OPTIONS;
  const container = containers[kind];
  container.innerHTML = "";
  state.checks[kind].forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "control-card";
    card.innerHTML = `
      <div class="card-title-row">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="badge">${escapeHtml(item.condition)}</span>
      </div>
      <label>
        Condicion
        <select aria-label="Condicion de ${escapeAttr(item.name)}">
          ${options.map((condition) => `<option value="${condition}" ${item.condition === condition ? "selected" : ""}>${condition}</option>`).join("")}
        </select>
      </label>
      <label>
        Observacion
        <input type="text" value="${escapeAttr(item.note)}" placeholder="Sin observaciones" />
      </label>
    `;
    card.querySelector("select").addEventListener("change", (event) => {
      state.checks[kind][index].condition = event.target.value;
      renderChecks(kind);
      saveDraft();
      updateProgress();
    });
    card.querySelector("input").addEventListener("input", (event) => {
      state.checks[kind][index].note = event.target.value;
      saveDraft();
    });
    container.appendChild(card);
  });
  updateCounts();
}

function setAttendanceAmount() {
  const amount = Math.max(0, Math.min(80, Number($("#attendanceAmount").value) || 0));
  const current = state.attendance.slice(0, amount);
  while (current.length < amount) {
    current.push({
      name: "",
      guardia: "Presente",
      limpieza: "Realizo",
      tasks: [],
      note: "",
    });
  }
  state.attendance = current;
  $("#attendanceAmount").value = String(amount);
  renderAttendance();
  saveDraft();
}

function renderAttendance() {
  const container = $("#attendanceRows");
  $("#attendanceAmount").value = String(state.attendance.length);
  if (!state.attendance.length) {
    container.innerHTML = `<div class="empty-state">Todavia no se agregaron personas a asistencia.</div>`;
    return;
  }
  container.innerHTML = "";
  state.attendance.forEach((item, index) => {
    const card = document.createElement("article");
    card.className = "control-card attendance-card";
    card.innerHTML = `
      <div class="card-title-row">
        <strong>Persona ${index + 1}</strong>
      </div>
      <label>
        Persona
        <input list="personnelList" value="${escapeAttr(item.name)}" placeholder="Buscar persona" />
      </label>
      <label>
        Guardia
        <select>
          ${GUARDIA_OPTIONS.map((status) => `<option value="${status}" ${item.guardia === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </label>
      <label>
        Limpieza
        <select>
          ${LIMPIEZA_OPTIONS.map((status) => `<option value="${status}" ${item.limpieza === status ? "selected" : ""}>${status}</option>`).join("")}
        </select>
      </label>
      <label>
        Tareas
        <select multiple size="4">
          ${TASK_OPTIONS.map((task) => `<option value="${task}" ${(item.tasks || []).includes(task) ? "selected" : ""}>${task}</option>`).join("")}
        </select>
      </label>
      <label>
        Observacion
        <input value="${escapeAttr(item.note)}" placeholder="Sin observaciones" />
      </label>
    `;
    const inputs = card.querySelectorAll("input");
    const selects = card.querySelectorAll("select");
    inputs[0].addEventListener("input", (event) => {
      state.attendance[index].name = event.target.value;
      saveDraft();
    });
    selects[0].addEventListener("change", (event) => {
      state.attendance[index].guardia = event.target.value;
      saveDraft();
    });
    selects[1].addEventListener("change", (event) => {
      state.attendance[index].limpieza = event.target.value;
      saveDraft();
    });
    selects[2].addEventListener("change", (event) => {
      state.attendance[index].tasks = Array.from(event.target.selectedOptions).map((option) => option.value);
      saveDraft();
    });
    inputs[1].addEventListener("input", (event) => {
      state.attendance[index].note = event.target.value;
      saveDraft();
    });
    container.appendChild(card);
  });
}

function renderSignatures() {
  const container = $("#signatureRows");
  const rows = getAllSignatureRows();
  if (!rows.length) {
    container.innerHTML = `<div class="empty-state">No hay partes pendientes para controlar.</div>`;
    return;
  }
  container.innerHTML = "";
  rows.forEach((item) => {
    const id = signatureId(item);
    if (!state.signatureControl[id]) {
      state.signatureControl[id] = {
        firmaPersonaACargo: toBool(item.firma_persona_a_cargo),
        firmaOperador: toBool(item.firma_operador),
      };
    }
    const control = state.signatureControl[id];
    const complete = control.firmaPersonaACargo && control.firmaOperador;
    const card = document.createElement("article");
    card.className = `signature-card ${complete ? "complete" : ""}`;
    card.innerHTML = `
      <div class="card-title-row">
        <div>
          <strong>Parte ${escapeHtml(item.parte_servicio || "-")}</strong>
          <span>${escapeHtml(item.fecha_servicio || "Sin fecha")}</span>
        </div>
        <span class="badge ${complete ? "" : "missing"}">${complete ? "Completo" : "Pendiente"}</span>
      </div>
      <div class="signature-person">
        <span>Persona a cargo</span>
        <strong>${escapeHtml(item.persona_a_cargo || "-")}</strong>
        <label class="checkbox-line">
          <input type="checkbox" ${control.firmaPersonaACargo ? "checked" : ""} aria-label="Firma persona a cargo" />
          Firma registrada
        </label>
      </div>
      <div class="signature-person">
        <span>Operador</span>
        <strong>${escapeHtml(item.operador || "-")}</strong>
        <label class="checkbox-line">
          <input type="checkbox" ${control.firmaOperador ? "checked" : ""} aria-label="Firma operador" />
          Firma registrada
        </label>
      </div>
    `;
    const boxes = card.querySelectorAll("input[type='checkbox']");
    boxes[0].addEventListener("change", () => updateSignature(item, { firmaPersonaACargo: boxes[0].checked }));
    boxes[1].addEventListener("change", () => updateSignature(item, { firmaOperador: boxes[1].checked }));
    container.appendChild(card);
  });
}

function getAllSignatureRows() {
  return [...state.signatures, ...state.manualSignatures];
}

function addManualPart(event) {
  event.preventDefault();
  const parte = $("#manualPartNumber").value.trim();
  if (!parte) {
    setStatus("Falta indicar numero de parte", "warn");
    $("#manualPartNumber").focus();
    return;
  }
  const row = {
    control_id: `manual-${crypto.randomUUID()}`,
    servicio_id: "",
    parte_servicio: parte,
    fecha_servicio: $("#manualPartDate").value || $("#controlDate").value,
    persona_a_cargo: $("#manualPartLeader").value.trim(),
    operador: $("#manualPartOperator").value.trim(),
    firma_persona_a_cargo: false,
    firma_operador: false,
    manual: true,
  };
  state.manualSignatures.push(row);
  state.signatureControl[row.control_id] = {
    firmaPersonaACargo: false,
    firmaOperador: false,
  };
  $("#manualPartForm").reset();
  renderSignatures();
  saveDraft();
  updateProgress();
  setStatus("Parte agregado al control", "ok");
}

function updateSignature(row, patch) {
  const id = signatureId(row);
  state.signatureControl[id] = {
    firmaPersonaACargo: toBool(row.firma_persona_a_cargo),
    firmaOperador: toBool(row.firma_operador),
    ...state.signatureControl[id],
    ...patch,
  };
  const control = state.signatureControl[id];
  const payload = {
    action: "updateSignature",
    control_id: row.control_id,
    firma_persona_a_cargo: control.firmaPersonaACargo,
    firma_operador: control.firmaOperador,
    controlado: control.firmaPersonaACargo && control.firmaOperador,
    controlado_en: new Date().toISOString(),
    controlado_por: $("#responsibleSearch").value,
  };
  if (!row.manual) {
    queueSignatureUpdate(payload);
    sendSignatureUpdate(payload);
  }
  renderSignatures();
  saveDraft();
  updateProgress();
}

function queueSignatureUpdate(payload) {
  const pending = getPendingSignatureUpdates().filter((item) => item.control_id !== payload.control_id);
  pending.push(payload);
  localStorage.setItem(STORAGE_KEYS.pendingSignatureUpdates, JSON.stringify(pending));
}

function getPendingSignatureUpdates() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.pendingSignatureUpdates) || "[]");
  } catch {
    return [];
  }
}

async function flushPendingSignatureUpdates() {
  if (!CONFIG.appsScriptUrl) return;
  const pending = getPendingSignatureUpdates();
  for (const payload of pending) {
    await sendSignatureUpdate(payload, false);
  }
}

async function sendSignatureUpdate(payload, showWarning = true) {
  if (!CONFIG.appsScriptUrl) {
    if (showWarning) setStatus("Firma guardada localmente: falta URL de Apps Script", "warn");
    return;
  }
  try {
    await fetch(CONFIG.appsScriptUrl, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
    const pending = getPendingSignatureUpdates().filter((item) => item.control_id !== payload.control_id);
    localStorage.setItem(STORAGE_KEYS.pendingSignatureUpdates, JSON.stringify(pending));
    setStatus("Firma enviada a CONTROL_FIRMAS", "ok");
  } catch (error) {
    console.error(error);
    if (showWarning) setStatus("No se pudo enviar la firma, queda pendiente", "warn");
  }
}

function updateCounts() {
  ["lugares", "moviles", "planillas", "choferes"].forEach((kind) => {
    const done = state.checks[kind].filter((item) => item.condition).length;
    const total = state.checks[kind].length;
    $(`#${kind}Count`).textContent = `${done}/${total}`;
  });
}

function updateProgress() {
  updateCounts();
  const signatures = getAllSignatureRows();
  const allChecks = [...state.checks.lugares, ...state.checks.moviles];
  const allAdminChecks = [...state.checks.planillas, ...state.checks.choferes];
  const checkDone = allChecks.filter((item) => item.condition).length;
  const adminDone = allAdminChecks.filter((item) => item.condition).length;
  const signatureDone = signatures.filter((row) => {
    const control = state.signatureControl[signatureId(row)] || {};
    return (control.firmaPersonaACargo ?? toBool(row.firma_persona_a_cargo)) && (control.firmaOperador ?? toBool(row.firma_operador));
  }).length;
  const total = allChecks.length + allAdminChecks.length + signatures.length;
  const done = checkDone + adminDone + signatureDone;
  const percent = total ? Math.round((done / total) * 100) : 100;
  $("#overallProgress").textContent = `${percent}% completo`;
  $("#overallDetail").textContent = `${done} de ${total} items controlados.`;
}

function saveDraft() {
  const payload = {
    date: $("#controlDate").value,
    responsible: $("#responsibleSearch").value,
    checks: state.checks,
    attendance: state.attendance,
    manualSignatures: state.manualSignatures,
    signatureControl: state.signatureControl,
    savedAt: new Date().toISOString(),
  };
  localStorage.setItem(STORAGE_KEYS.draft, JSON.stringify(payload));
}

function loadDraft() {
  const raw = localStorage.getItem(STORAGE_KEYS.draft);
  if (!raw) return;
  try {
    const draft = JSON.parse(raw);
    $("#controlDate").value = draft.date || $("#controlDate").value;
    if (draft.checks) state.checks = migrateChecks(draft.checks);
    if (draft.attendance) state.attendance = migrateAttendance(draft.attendance);
    if (draft.manualSignatures) state.manualSignatures = draft.manualSignatures;
    if (draft.signatureControl) state.signatureControl = draft.signatureControl;
    state.draftResponsible = draft.responsible || "";
    $("#responsibleSearch").value = state.draftResponsible;
  } catch (error) {
    console.warn("No se pudo cargar el borrador", error);
  }
}

function migrateChecks(checks) {
  return {
    lugares: migrateCheckGroup(checks.lugares, PLACE_ITEMS, "Bueno"),
    moviles: migrateCheckGroup(checks.moviles, VEHICLE_ITEMS, "Bueno"),
    planillas: migrateCheckGroup(checks.planillas, PLANILLA_ITEMS, "Completa"),
    choferes: migrateCheckGroup(checks.choferes, DRIVER_CHECK_ITEMS, "Completa"),
  };
}

function migrateCheckGroup(saved = [], sourceItems, defaultCondition) {
  return sourceItems.map((name) => {
    const previous = saved.find((item) => item.name === name);
    return {
      name,
      condition: previous?.condition || statusToCondition(previous?.status) || defaultCondition,
      note: previous?.note || "",
    };
  });
}

function migrateAttendance(attendance) {
  return attendance.map((item) => ({
    name: item.name || "",
    guardia: item.guardia || item.status || "Presente",
    limpieza: item.limpieza || "Realizo",
    tasks: item.tasks || [],
    note: item.note || "",
  }));
}

function statusToCondition(status) {
  if (status === "issue") return "Malo";
  return "Bueno";
}

async function finishControl() {
  const responsible = $("#responsibleSearch").value.trim();
  if (!responsible) {
    setStatus("Falta seleccionar responsable", "warn");
    $("#responsibleSearch").focus();
    return;
  }
  saveDraft();
  const record = buildRecord();
  const pdfBlob = generatePdf(record);
  saveHistory(record);
  renderHistory();
  state.signatures = state.signatures.filter((row) => {
    const control = state.signatureControl[signatureId(row)] || {};
    return !((control.firmaPersonaACargo ?? toBool(row.firma_persona_a_cargo)) && (control.firmaOperador ?? toBool(row.firma_operador)));
  });
  state.manualSignatures = state.manualSignatures.filter((row) => {
    const control = state.signatureControl[signatureId(row)] || {};
    return !((control.firmaPersonaACargo ?? toBool(row.firma_persona_a_cargo)) && (control.firmaOperador ?? toBool(row.firma_operador)));
  });
  renderSignatures();
  localStorage.removeItem(STORAGE_KEYS.draft);
  setStatus("PDF generado y control archivado", "ok");
  try {
    await shareOrDownload(pdfBlob, record);
  } finally {
    showCompletion();
    openTab("lugares");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }
}

function buildRecord() {
  return {
    id: crypto.randomUUID(),
    date: $("#controlDate").value,
    responsible: $("#responsibleSearch").value.trim(),
    createdAt: new Date().toISOString(),
    checks: JSON.parse(JSON.stringify(state.checks)),
    attendance: JSON.parse(JSON.stringify(state.attendance)),
    signatures: getAllSignatureRows().map((row) => {
      const control = state.signatureControl[signatureId(row)] || {};
      return {
        parte: row.parte_servicio,
        fecha: row.fecha_servicio,
        aCargo: row.persona_a_cargo,
        operador: row.operador,
        firmaACargo: control.firmaPersonaACargo ?? toBool(row.firma_persona_a_cargo),
        firmaOperador: control.firmaOperador ?? toBool(row.firma_operador),
      };
    }),
  };
}

function generatePdf(record) {
  const { jsPDF } = window.jspdf;
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const page = { w: 210, h: 297, margin: 12 };
  let y = 16;

  const ensure = (height) => {
    if (y + height <= page.h - 16) return;
    doc.addPage();
    y = 16;
    drawHeader(false);
  };

  const colorFor = (value) => {
    if (["Bueno", "Completa", "Presente", "Realizo", "Si"].includes(value)) return [35, 121, 91];
    if (["Malo", "Incompleta", "Ausente", "No realizo", "No"].includes(value)) return [181, 31, 45];
    return [101, 112, 128];
  };

  const drawHeader = (main = true) => {
    doc.setFillColor(21, 26, 34);
    doc.rect(0, 0, page.w, main ? 36 : 18, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(main ? 20 : 10);
    doc.text(main ? "SBVP - Control Diario" : "SBVP - Control Diario", page.margin, main ? 18 : 12);
    if (main) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.text(`Fecha: ${record.date}`, page.margin, 27);
      doc.text(`Responsable: ${record.responsible}`, 82, 27);
      y = 48;
    } else {
      y = 28;
    }
  };

  const section = (title) => {
    ensure(16);
    doc.setFillColor(181, 31, 45);
    doc.roundedRect(page.margin, y, page.w - page.margin * 2, 9, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text(title, page.margin + 4, y + 6);
    y += 13;
  };

  const pill = (text, x, yPos, w) => {
    const [r, g, b] = colorFor(text);
    doc.setFillColor(r, g, b);
    doc.roundedRect(x, yPos - 4, w, 6, 2, 2, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.text(String(text), x + 2, yPos);
  };

  const drawRows = (rows, columns) => {
    rows.forEach((row, index) => {
      const note = row.note ? `Obs.: ${row.note}` : "";
      const h = note ? 15 : 11;
      ensure(h + 2);
      doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
      doc.roundedRect(page.margin, y, page.w - page.margin * 2, h, 1.5, 1.5, "F");
      doc.setTextColor(24, 32, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.text(String(row.name || "-"), page.margin + 3, y + 6);
      pill(row.status || "-", page.margin + columns.statusX, y + 6, columns.statusW);
      if (note) {
        doc.setTextColor(101, 112, 128);
        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.text(doc.splitTextToSize(note, 118), page.margin + 3, y + 12);
      }
      y += h + 2;
    });
  };

  drawHeader(true);

  section("Limpieza de lugares");
  drawRows(record.checks.lugares.map((item) => ({ name: item.name, status: item.condition, note: item.note })), { statusX: 145, statusW: 28 });

  section("Limpieza de moviles");
  drawRows(record.checks.moviles.map((item) => ({ name: item.name, status: item.condition, note: item.note })), { statusX: 145, statusW: 28 });

  section("Planillas firmadas");
  drawRows(record.checks.planillas.map((item) => ({ name: item.name, status: item.condition, note: item.note })), { statusX: 140, statusW: 35 });

  section("Check de choferes");
  drawRows(record.checks.choferes.map((item) => ({ name: item.name, status: item.condition, note: item.note })), { statusX: 140, statusW: 35 });

  section("Asistencia");
  if (!record.attendance.length) {
    drawRows([{ name: "Sin personas cargadas", status: "N/A", note: "" }], { statusX: 145, statusW: 28 });
  } else {
    drawRows(record.attendance.map((item) => ({
      name: item.name || "Sin nombre",
      status: item.guardia,
      note: `Limpieza: ${item.limpieza}. Tareas: ${item.tasks?.length ? item.tasks.join(", ") : "Sin tareas"}${item.note ? `. ${item.note}` : ""}`,
    })), { statusX: 145, statusW: 28 });
  }

  section("Partes sin firmar");
  const pending = record.signatures.filter((item) => !(item.firmaACargo && item.firmaOperador));
  if (!pending.length) {
    drawRows([{ name: "Sin partes pendientes", status: "OK", note: "" }], { statusX: 145, statusW: 28 });
  } else {
    pending.forEach((item, index) => {
      ensure(25);
      doc.setFillColor(index % 2 === 0 ? 248 : 255, index % 2 === 0 ? 250 : 255, index % 2 === 0 ? 252 : 255);
      doc.roundedRect(page.margin, y, page.w - page.margin * 2, 22, 1.5, 1.5, "F");
      doc.setTextColor(24, 32, 42);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.text(`Parte ${item.parte || "-"} (${item.fecha || "sin fecha"})`, page.margin + 3, y + 6);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.text(`A cargo: ${item.aCargo || "-"} | Firma: ${item.firmaACargo ? "Si" : "No"}`, page.margin + 3, y + 13);
      doc.text(`Operador: ${item.operador || "-"} | Firma: ${item.firmaOperador ? "Si" : "No"}`, page.margin + 3, y + 18);
      y += 25;
    });
  }

  const pages = doc.getNumberOfPages();
  for (let page = 1; page <= pages; page += 1) {
    doc.setPage(page);
    doc.setFontSize(9);
    doc.setTextColor(101, 112, 128);
    doc.text(`Pagina ${page} de ${pages}`, 166, 290);
  }
  return doc.output("blob");
}

function showCompletion() {
  const toast = $("#completionToast");
  toast.classList.add("visible");
  window.setTimeout(() => toast.classList.remove("visible"), 2600);
}

async function shareOrDownload(blob, record) {
  const fileName = `SBVP-control-diario-${record.date}.pdf`;
  const file = new File([blob], fileName, { type: "application/pdf" });
  if (navigator.canShare?.({ files: [file] })) {
    await navigator.share({
      title: "SBVP Control Diario",
      text: `Control diario ${record.date} - ${record.responsible}`,
      files: [file],
    });
    return;
  }
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
  const message = encodeURIComponent(`Control diario ${record.date} generado. Archivo: ${fileName}`);
  window.open(`https://wa.me/?text=${message}`, "_blank", "noopener");
}

function saveHistory(record) {
  const history = getHistory();
  history.unshift(record);
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(history));
  pruneHistory();
}

function getHistory() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEYS.history) || "[]");
  } catch {
    return [];
  }
}

function pruneHistory() {
  const cutoff = Date.now() - CONFIG.historyDays * 24 * 60 * 60 * 1000;
  const filtered = getHistory().filter((item) => new Date(item.createdAt).getTime() >= cutoff);
  localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(filtered));
}

function renderHistory() {
  const rows = getHistory();
  const container = $("#historyRows");
  if (!rows.length) {
    container.innerHTML = `<div class="empty-state">Todavia no hay controles finalizados.</div>`;
    return;
  }
  container.innerHTML = "";
  rows.forEach((item) => {
    const checked = [...item.checks.lugares, ...item.checks.moviles, ...item.checks.planillas, ...item.checks.choferes].filter((row) => row.condition).length;
    const pending = item.signatures.filter((row) => !(row.firmaACargo && row.firmaOperador)).length;
    const row = document.createElement("article");
    row.className = "history-row";
    row.innerHTML = `
      <strong>${escapeHtml(item.date)} - ${escapeHtml(item.responsible)}</strong>
      <span>Limpieza: ${checked} items | Partes pendientes: ${pending}</span>
    `;
    container.appendChild(row);
  });
}

function isCompleteSignatureRow(row) {
  return toBool(row.firma_persona_a_cargo) && toBool(row.firma_operador);
}

function signatureId(row) {
  return row.control_id || `${row.servicio_id}-${row.parte_servicio}`;
}

function toBool(value) {
  return value === true || String(value).toUpperCase() === "TRUE" || String(value).toLowerCase() === "si";
}

function setStatus(text, kind) {
  const el = $("#syncStatus");
  el.textContent = text;
  el.className = `status-pill ${kind || ""}`.trim();
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[char]);
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#96;");
}
