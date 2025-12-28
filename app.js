/* =========================================================
   AGENDA TELEFÓNICA - Google Sheets (CSV publicado)
   Columnas esperadas (encabezados exactos):
   - Categoría
   - Nombre y apellido
   - Rol
   - Teléfono
   ========================================================= */

const SHEET_CSV_URL =
  "https://docs.google.com/spreadsheets/d/e/2PACX-1vRBuGTqIVZPrjPv3bs8cyQT6wksYR1TlamMXwOaR1t8zZTqITXyqSUfHH5XV6F_2Al5Zzqj8WQ64XKX/pub?gid=798213525&single=true&output=csv";

let CONTACTS = [];

const FAVORITES_KEY = "agenda_favorites_v1";
let currentFilter = "ALL";

// DOM
const cardsEl = document.getElementById("cards");
const emptyEl = document.getElementById("empty");
const searchEl = document.getElementById("search");
const clearSearchEl = document.getElementById("clearSearch");
const statusEl = document.getElementById("status");
const toastEl = document.getElementById("toast");
const dynFiltersEl = document.getElementById("dynFilters");

// -------------------- CSV PARSER (robusto) --------------------
function parseCSV(csvText) {
  const rows = [];
  let row = [];
  let cur = "";
  let inQuotes = false;

  for (let i = 0; i < csvText.length; i++) {
    const ch = csvText[i];
    const next = csvText[i + 1];

    if (inQuotes) {
      if (ch === '"' && next === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        row.push(cur);
        cur = "";
      } else if (ch === "\n") {
        row.push(cur);
        rows.push(row);
        row = [];
        cur = "";
      } else if (ch === "\r") {
        // ignore
      } else {
        cur += ch;
      }
    }
  }

  row.push(cur);
  rows.push(row);

  return rows.filter(r => r.some(cell => String(cell).trim() !== ""));
}

function norm(s) {
  return String(s ?? "").trim();
}

function headerIndex(headers, target) {
  const t = target.toLowerCase();
  return headers.findIndex(h => norm(h).toLowerCase() === t);
}

// -------------------- UTIL --------------------
function normalizePhoneForTel(phone) {
  const trimmed = String(phone || "").trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/[^\d]/g, "");
  return plus + digits;
}

function makeId(contact) {
  return `${(contact.section || "").trim()}__${(contact.role || "").trim()}__${(contact.name || "").trim()}__${(contact.phone || "").trim()}`.toLowerCase();
}

function loadFavorites() {
  try {
    const raw = localStorage.getItem(FAVORITES_KEY);
    const arr = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(arr) ? arr : []);
  } catch {
    return new Set();
  }
}

function saveFavorites(set) {
  try {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

function showToast(msg) {
  toastEl.textContent = msg;
  toastEl.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => { toastEl.hidden = true; }, 1400);
}

async function copyText(text) {
  try {
    await navigator.clipboard.writeText(text);
    showToast("Copiado");
  } catch {
    showToast("No se pudo copiar");
  }
}

// -------------------- CARGA DESDE SHEET --------------------
async function loadContactsFromSheet() {
  statusEl.textContent = "Cargando contactos…";

  try {
    const res = await fetch(SHEET_CSV_URL, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const text = await res.text();
    const rows = parseCSV(text);

    if (!rows.length) throw new Error("CSV vacío");

    const headers = rows[0].map(norm);

    const idxSection = headerIndex(headers, "Categoría");
    const idxName    = headerIndex(headers, "Nombre y apellido");
    const idxRole    = headerIndex(headers, "Rol");
    const idxPhone   = headerIndex(headers, "Teléfono");

    const missing = [];
    if (idxSection < 0) missing.push("Categoría");
    if (idxName < 0) missing.push("Nombre y apellido");
    if (idxRole < 0) missing.push("Rol");
    if (idxPhone < 0) missing.push("Teléfono");

    if (missing.length) {
      throw new Error(
        `No encuentro estas columnas en el CSV: ${missing.join(", ")}. ` +
        `Revisá que la fila 1 tenga exactamente esos encabezados (incluyendo tildes).`
      );
    }

    CONTACTS = rows.slice(1)
      .map(r => ({
        section: norm(r[idxSection]),
        name:    norm(r[idxName]),
        role:    norm(r[idxRole]),
        phone:   norm(r[idxPhone]),
      }))
      .filter(c => c.name !== "" || c.phone !== "");

  } catch (err) {
    console.error("Error cargando Google Sheet:", err);
    CONTACTS = [];
    statusEl.textContent = "No se pudieron cargar los contactos desde Google Sheet.";
    showToast("Error de carga");
  }
}

// -------------------- FILTROS --------------------
function uniqueSections() {
  const set = new Set();
  CONTACTS.forEach(c => set.add(String(c.section || "").trim()));
  const arr = Array.from(set).filter(Boolean);
  arr.sort((a,b) => a.localeCompare(b, "es", { sensitivity: "base" }));
  return arr;
}

function buildFilterButtons() {
  dynFiltersEl.innerHTML = "";

  const sections = uniqueSections();
  sections.forEach(sec => {
    const btn = document.createElement("button");
    btn.className = "section-btn";
    btn.type = "button";
    btn.dataset.filter = sec;
    btn.textContent = sec;
    btn.addEventListener("click", () => setFilter(sec));
    dynFiltersEl.appendChild(btn);
  });
}

function applyFilter(list, favorites) {
  const q = (searchEl.value || "").trim().toLowerCase();
  let filtered = list;

  if (currentFilter === "FAV") {
    filtered = filtered.filter(c => favorites.has(makeId(c)));
  } else if (currentFilter !== "ALL") {
    filtered = filtered.filter(c => String(c.section || "").trim() === currentFilter);
  }

  if (q) {
    filtered = filtered.filter(c => {
      const s1 = String(c.section || "").toLowerCase();
      const s2 = String(c.role || "").toLowerCase();
      const s3 = String(c.name || "").toLowerCase();
      const s4 = String(c.phone || "").toLowerCase();
      return s1.includes(q) || s2.includes(q) || s3.includes(q) || s4.includes(q);
    });
  }

  filtered.sort((a,b) => String(a.name||"").localeCompare(String(b.name||""), "es"));
  return filtered;
}

// -------------------- RENDER --------------------
function makeCard(contact, favorites) {
  const id = makeId(contact);
  const isFav = favorites.has(id);

  const tel = normalizePhoneForTel(contact.phone);
  const hasPhone = Boolean(tel);

  const card = document.createElement("article");
  card.className = "card";

  // Nombre y apellido
  const name = document.createElement("h3");
  name.className = "card-name";
  name.textContent = contact.name || "(Sin nombre)";

  // Rol
  const role = document.createElement("p");
  role.className = "card-role";
  role.textContent = contact.role || "";

  // Categoría
  const category = document.createElement("p");
  category.className = "card-cat";
  category.textContent = contact.section || "";

  // Teléfono + acciones
  const phoneText = document.createElement("div");
  phoneText.className = "phone-text";
  phoneText.textContent = contact.phone ? contact.phone : "—";

  const actions = document.createElement("div");
  actions.className = "actions";

  const starBtn = document.createElement("button");
  starBtn.className = "btn star";
  starBtn.type = "button";
  starBtn.textContent = isFav ? "★" : "☆";
  starBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (favorites.has(id)) {
      favorites.delete(id);
      starBtn.textContent = "☆";
      showToast("Quitado de favoritos");
    } else {
      favorites.add(id);
      starBtn.textContent = "★";
      showToast("Agregado a favoritos");
    }
    saveFavorites(favorites);
    if (currentFilter === "FAV") render();
  });

  const copyBtn = document.createElement("button");
  copyBtn.className = "btn";
  copyBtn.type = "button";
  copyBtn.textContent = "Copiar";
  copyBtn.disabled = !contact.phone;
  copyBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (contact.phone) copyText(contact.phone);
  });

  const callBtn = document.createElement("button");
  callBtn.className = "btn btn-primary";
  callBtn.type = "button";
  callBtn.textContent = "Llamar";
  callBtn.disabled = !hasPhone;
  callBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    if (hasPhone) window.location.href = `tel:${tel}`;
  });

  actions.appendChild(starBtn);
  actions.appendChild(copyBtn);
  actions.appendChild(callBtn);

  const phoneRow = document.createElement("div");
  phoneRow.className = "card-phone";
  phoneRow.appendChild(phoneText);
  phoneRow.appendChild(actions);

  card.appendChild(name);
  if (contact.role) card.appendChild(role);
  if (contact.section) card.appendChild(category);
  card.appendChild(phoneRow);

  card.addEventListener("click", () => {
    if (hasPhone) window.location.href = `tel:${tel}`;
  });

  return card;
}

function render() {
  const favorites = loadFavorites();
  const filtered = applyFilter(CONTACTS, favorites);

  cardsEl.innerHTML = "";

  const label =
    currentFilter === "ALL" ? "Todas" :
    currentFilter === "FAV" ? "Favoritos" :
    currentFilter;

  statusEl.textContent = `${filtered.length} contacto(s) — Filtro: ${label}`;

  if (filtered.length === 0) {
    emptyEl.hidden = false;
    return;
  }

  emptyEl.hidden = true;
  filtered.forEach(c => cardsEl.appendChild(makeCard(c, favorites)));
}

function setFilter(filterKey) {
  currentFilter = filterKey;

  // botones fijos (ALL / FAV)
  document.querySelectorAll(".section-btn[data-filter]").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filterKey);
  });

  // botones dinámicos (categorías)
  dynFiltersEl.querySelectorAll(".section-btn").forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filterKey);
  });

  render();
}

// -------------------- EVENTOS --------------------
searchEl.addEventListener("input", render);
clearSearchEl.addEventListener("click", () => {
  searchEl.value = "";
  render();
});

// FIX: listeners para ALL / FAV (antes no existían)
function wireStaticFilters() {
  document.querySelectorAll(".section-btn[data-filter]").forEach(btn => {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  });
}

// -------------------- INIT --------------------
(async () => {
  wireStaticFilters();           // <- FIX
  await loadContactsFromSheet();
  buildFilterButtons();
  setFilter("ALL");
})();
