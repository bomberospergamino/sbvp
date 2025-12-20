/* =========================================================
   CONTACTOS (ejemplo mínimo: reemplazalo por tu lista real)
   ========================================================= */
const CONTACTS = [
  { section: "Cuerpo Activo", role: "Bombero", name: "Irina Bottini", phone: "2477-232120" }
];

const FAVORITES_KEY = "agenda_favorites_v1";
const REQUEST_EMAIL = "mejoracontinua.sbvp@gmail.com";

let currentFilter = "ALL";

const cardsEl = document.getElementById("cards");
const emptyEl = document.getElementById("empty");
const searchEl = document.getElementById("search");
const clearSearchEl = document.getElementById("clearSearch");
const statusEl = document.getElementById("status");
const toastEl = document.getElementById("toast");
const sectionButtons = document.querySelectorAll(".section-btn");

// Modal elements
const modalEl = document.getElementById("modal");
const openAddEl = document.getElementById("openAdd");
const closeModalEl = document.getElementById("closeModal");
const cancelAddEl = document.getElementById("cancelAdd");
const addFormEl = document.getElementById("addForm");
const websiteHpEl = document.getElementById("website");

const fSection = document.getElementById("fSection");
const fRole = document.getElementById("fRole");
const fName = document.getElementById("fName");
const fPhone = document.getElementById("fPhone");
const fNotes = document.getElementById("fNotes");

/* ===============================
   Utilidades
   =============================== */
function normalizePhoneForTel(phone) {
  const trimmed = String(phone || "").trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/[^\d]/g, "");
  return plus + digits;
}

function makeId(contact) {
  return `${contact.section}__${contact.role}__${contact.name}__${contact.phone}`.toLowerCase();
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

function escapeLine(s) {
  return String(s || "").replace(/\r?\n/g, " ").trim();
}

/* ===============================
   Render
   =============================== */
function makeCard(contact, favorites) {
  const id = makeId(contact);
  const isFav = favorites.has(id);

  const tel = normalizePhoneForTel(contact.phone);
  const hasPhone = Boolean(tel);

  const card = document.createElement("article");
  card.className = "card";

  const top = document.createElement("div");
  top.className = "card-top";

  const left = document.createElement("div");
  const name = document.createElement("h3");
  name.className = "card-name";
  name.textContent = contact.name || "(Sin nombre)";

  const role = document.createElement("p");
  role.className = "card-role";
  role.textContent = contact.role || "";

  left.appendChild(name);
  if (contact.role) left.appendChild(role);

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = contact.section || "Sección";

  top.appendChild(left);
  top.appendChild(badge);

  const phoneRow = document.createElement("div");
  phoneRow.className = "card-phone";

  const phoneText = document.createElement("div");
  phoneText.className = "phone-text";
  phoneText.textContent = contact.phone ? contact.phone : "Sin teléfono";

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

  phoneRow.appendChild(phoneText);
  phoneRow.appendChild(actions);

  card.appendChild(top);
  card.appendChild(phoneRow);

  card.addEventListener("click", () => {
    if (hasPhone) window.location.href = `tel:${tel}`;
  });

  return card;
}

function applyFilter(list, favorites) {
  const q = (searchEl.value || "").trim().toLowerCase();

  let filtered = list;

  if (currentFilter === "FAV") {
    filtered = filtered.filter(c => favorites.has(makeId(c)));
  } else if (currentFilter !== "ALL") {
    filtered = filtered.filter(c => (c.section || "") === currentFilter);
  }

  if (q) {
    filtered = filtered.filter(c => {
      const s1 = (c.section || "").toLowerCase();
      const s2 = (c.role || "").toLowerCase();
      const s3 = (c.name || "").toLowerCase();
      const s4 = (c.phone || "").toLowerCase();
      return s1.includes(q) || s2.includes(q) || s3.includes(q) || s4.includes(q);
    });
  }

  filtered.sort((a,b) => (a.name||"").localeCompare(b.name||"", "es"));
  return filtered;
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

/* ===============================
   Filtros
   =============================== */
function setFilter(filterKey) {
  currentFilter = filterKey;
  sectionButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.filter === filterKey);
  });
  render();
}

sectionButtons.forEach(btn => {
  if (btn.dataset.filter) {
    btn.addEventListener("click", () => setFilter(btn.dataset.filter));
  }
});

searchEl.addEventListener("input", render);

clearSearchEl.addEventListener("click", () => {
  searchEl.value = "";
  render();
});

/* ===============================
   Modal “Agregar contacto” -> mailto
   =============================== */
function openModal() {
  modalEl.hidden = false;
  modalEl.setAttribute("aria-hidden", "false");
  // default
  fSection.value = "";
  fRole.value = "";
  fName.value = "";
  fPhone.value = "";
  fNotes.value = "";
  websiteHpEl.value = "";
  setTimeout(() => fSection.focus(), 0);
}

function closeModal() {
  modalEl.hidden = true;
  modalEl.setAttribute("aria-hidden", "true");
}

openAddEl.addEventListener("click", openModal);
closeModalEl.addEventListener("click", closeModal);
cancelAddEl.addEventListener("click", closeModal);

modalEl.addEventListener("click", (e) => {
  if (e.target && e.target.dataset && e.target.dataset.close === "1") {
    closeModal();
  }
});

document.addEventListener("keydown", (e) => {
  if (!modalEl.hidden && e.key === "Escape") closeModal();
});

function buildMailto(payload) {
  const now = new Date();
  const ts = now.toLocaleString("es-AR");

  const subject = `Solicitud alta contacto - Agenda Cuartel (${escapeLine(payload.section)} / ${escapeLine(payload.name)})`;

  const bodyLines = [
    "Solicitud de alta de contacto (Agenda interna)",
    "------------------------------------------",
    `Fecha/Hora: ${ts}`,
    "",
    `Sección: ${escapeLine(payload.section)}`,
    `Categoría/Rol: ${escapeLine(payload.role)}`,
    `Nombre: ${escapeLine(payload.name)}`,
    `Teléfono: ${escapeLine(payload.phone)}`,
    payload.notes ? `Observaciones: ${escapeLine(payload.notes)}` : "Observaciones: -",
    "",
    "Acción solicitada: Cargar este contacto en la fuente oficial (Excel/JS) y republicar.",
  ];

  const mailto =
    `mailto:${encodeURIComponent(REQUEST_EMAIL)}` +
    `?subject=${encodeURIComponent(subject)}` +
    `&body=${encodeURIComponent(bodyLines.join("\n"))}`;

  return mailto;
}

addFormEl.addEventListener("submit", (e) => {
  e.preventDefault();

  // Honeypot: si está lleno, no hacemos nada (anti-bot)
  if (websiteHpEl.value && websiteHpEl.value.trim() !== "") {
    showToast("Solicitud bloqueada");
    closeModal();
    return;
  }

  const payload = {
    section: fSection.value,
    role: fRole.value,
    name: fName.value,
    phone: fPhone.value,
    notes: fNotes.value
  };

  // “Trampa”: no agregamos; solo preparamos mail
  const mailto = buildMailto(payload);

  showToast("Preparando email…");
  // Abre el cliente de correo con todo armado
  window.location.href = mailto;

  // Cierra modal (aunque el usuario cancele el envío, no afecta)
  closeModal();
});

/* ===============================
   Arranque
   =============================== */
setFilter("ALL");
