// ===============================
// Datos (agenda interna)
// ===============================
const DATA = {
  apoyo: [],
  delegados: [],
  cuerpos: [],
  activo: [
    {
      name: "Irina Bottini",
      role: "Bombero",
      phone: "2477-232120"
    }
  ],
  comision: []
};

const SECTION_LABELS = {
  apoyo: "Servicios de apoyo",
  delegados: "Delegados",
  cuerpos: "Cuerpos de Bomberos",
  activo: "Cuerpo Activo",
  comision: "Comisión Directiva"
};

// Para que puedas probar el contacto al instante, arranca en "Cuerpo Activo"
let currentSection = "activo";

const cardsEl = document.getElementById("cards");
const emptyEl = document.getElementById("empty");
const searchEl = document.getElementById("search");
const sectionButtons = document.querySelectorAll(".section-btn");

function normalizePhoneForTel(phone) {
  const trimmed = String(phone || "").trim();
  const plus = trimmed.startsWith("+") ? "+" : "";
  const digits = trimmed.replace(/[^\d]/g, "");
  return plus + digits;
}

function makeCard(contact, sectionKey) {
  const tel = normalizePhoneForTel(contact.phone);
  const sectionLabel = SECTION_LABELS[sectionKey] || "Sección";

  const card = document.createElement("article");
  card.className = "card";
  card.setAttribute("role", "button");
  card.setAttribute("tabindex", "0");
  card.setAttribute("aria-label", `Llamar a ${contact.name}`);

  const top = document.createElement("div");
  top.className = "card-top";

  const left = document.createElement("div");

  const name = document.createElement("h3");
  name.className = "card-name";
  name.textContent = contact.name;

  const role = document.createElement("p");
  role.className = "card-role";
  role.textContent = contact.role;

  left.appendChild(name);
  left.appendChild(role);

  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = sectionLabel;

  top.appendChild(left);
  top.appendChild(badge);

  const phoneRow = document.createElement("div");
  phoneRow.className = "card-phone";

  const phoneText = document.createElement("div");
  phoneText.className = "phone-text";
  phoneText.textContent = contact.phone;

  const callBtn = document.createElement("button");
  callBtn.className = "call-btn";
  callBtn.type = "button";
  callBtn.textContent = "Llamar";

  callBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    window.location.href = `tel:${tel}`;
  });

  phoneRow.appendChild(phoneText);
  phoneRow.appendChild(callBtn);

  card.appendChild(top);
  card.appendChild(phoneRow);

  // Click en la tarjeta: llama
  card.addEventListener("click", () => {
    window.location.href = `tel:${tel}`;
  });

  // Accesibilidad: Enter/Espacio
  card.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      window.location.href = `tel:${tel}`;
    }
  });

  return card;
}

function render() {
  const q = (searchEl.value || "").trim().toLowerCase();
  const list = DATA[currentSection] || [];

  const filtered = q
    ? list.filter(c =>
        (c.name || "").toLowerCase().includes(q) ||
        (c.role || "").toLowerCase().includes(q) ||
        (c.phone || "").toLowerCase().includes(q)
      )
    : list;

  cardsEl.innerHTML = "";

  if (filtered.length === 0) {
    emptyEl.hidden = false;
    return;
  }

  emptyEl.hidden = true;
  filtered.forEach(c => cardsEl.appendChild(makeCard(c, currentSection)));
}

function setSection(sectionKey) {
  currentSection = sectionKey;

  sectionButtons.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.section === sectionKey);
  });

  // Limpio búsqueda al cambiar sección (queda prolijo en celu)
  searchEl.value = "";
  render();
}

sectionButtons.forEach(btn => {
  btn.addEventListener("click", () => setSection(btn.dataset.section));
});

searchEl.addEventListener("input", render);

// Arranque
setSection(currentSection);
