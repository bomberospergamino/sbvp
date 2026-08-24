const API_URL = String(window.SBVP_AGENDA_API_URL || '').trim();
const $ = (id) => document.getElementById(id);
const collator = new Intl.Collator('es', { sensitivity: 'base' });
let contacts = [];
let adminToken = sessionStorage.getItem('sbvpAgendaAdminToken') || '';

$('searchInput').addEventListener('input', render);
$('categoryFilter').addEventListener('change', render);
$('roleFilter').addEventListener('change', render);
$('clearFiltersBtn').addEventListener('click', clearFilters);
$('refreshBtn').addEventListener('click', () => loadContacts(true));
$('downloadBtn').addEventListener('click', downloadExcel);
$('addContactBtn').addEventListener('click', () => openContactEditor());
$('closeDialogBtn').addEventListener('click', closeContactEditor);
$('cancelDialogBtn').addEventListener('click', closeContactEditor);
$('contactForm').addEventListener('submit', saveContact);

async function loadContacts(notify = false) {
  if (!API_URL) {
    showStatus('La agenda está lista, pero falta conectar la URL del servicio de Google Sheets.', 'setup');
    $('summary').textContent = 'Pendiente de conexión con Google Sheets';
    return;
  }
  setLoading(true);
  try {
    const url = new URL(API_URL);
    url.searchParams.set('action', 'list');
    url.searchParams.set('_', Date.now());
    const response = await fetch(url, { redirect: 'follow', cache: 'no-store' });
    if (!response.ok) throw new Error('La agenda no respondió correctamente.');
    const result = await response.json();
    if (!result.ok || !Array.isArray(result.contacts)) throw new Error(result.error || 'La respuesta de la agenda no es válida.');
    contacts = result.contacts.map(normalizeContact).filter((contact) => contact.name && contact.phone).sort((a, b) => collator.compare(a.name, b.name));
    populateFilters();
    render();
    if (notify) showToast('Agenda actualizada.');
  } catch (error) {
    console.error(error);
    showStatus('No se pudo cargar la agenda. Revisá la conexión e intentá nuevamente.', 'error');
    $('summary').textContent = 'Agenda no disponible';
  } finally {
    setLoading(false);
  }
}

function normalizeContact(raw) {
  return { id: String(raw.id || '').trim(), name: String(raw.name || '').trim(), category: String(raw.category || '').trim(), role: String(raw.role || '').trim(), phone: String(raw.phone || '').trim() };
}

function populateFilters() {
  const categories = uniqueValues('category');
  const roles = uniqueValues('role');
  setOptions($('categoryFilter'), categories);
  setOptions($('roleFilter'), roles);
  setDatalist($('categoryOptions'), categories);
  setDatalist($('roleOptions'), roles);
}

function uniqueValues(field) {
  return [...new Set(contacts.map((contact) => contact[field]).filter(Boolean))].sort(collator.compare);
}

function setOptions(select, values) {
  const current = select.value;
  const firstLabel = select.id === 'categoryFilter' ? 'Todas' : 'Todos';
  select.replaceChildren(new Option(firstLabel, ''), ...values.map((value) => new Option(value, value)));
  if (values.includes(current)) select.value = current;
}

function setDatalist(list, values) {
  list.replaceChildren(...values.map((value) => new Option(value, value)));
}

function filteredContacts() {
  const term = normalizeText($('searchInput').value);
  const category = $('categoryFilter').value;
  const role = $('roleFilter').value;
  return contacts.filter((contact) => {
    const haystack = normalizeText([contact.name, contact.category, contact.role, contact.phone].join(' '));
    return (!term || haystack.includes(term)) && (!category || contact.category === category) && (!role || contact.role === role);
  });
}

function render() {
  if (!contacts.length) return;
  const filtered = filteredContacts();
  $('contactList').replaceChildren(...filtered.map(createContactCard));
  $('statusPanel').hidden = filtered.length > 0;
  if (!filtered.length) showStatus('No encontramos contactos con esos filtros.', 'empty');
  $('summary').textContent = `${filtered.length} ${filtered.length === 1 ? 'contacto' : 'contactos'}${filtered.length !== contacts.length ? ` de ${contacts.length}` : ''}`;
}

function createContactCard(contact) {
  const card = $('contactTemplate').content.firstElementChild.cloneNode(true);
  const tel = phoneForCall(contact.phone);
  const whatsApp = phoneForWhatsApp(contact.phone);
  card.querySelector('.avatar').textContent = initials(contact.name);
  card.querySelector('h3').textContent = contact.name;
  const badges = card.querySelector('.badges');
  [contact.category, contact.role].filter(Boolean).forEach((value) => { const badge = document.createElement('span'); badge.textContent = value; badges.append(badge); });
  const phone = card.querySelector('.phone-number');
  phone.textContent = contact.phone;
  phone.href = `tel:${tel}`;
  const call = card.querySelector('.call');
  call.href = `tel:${tel}`;
  call.setAttribute('aria-label', `Llamar a ${contact.name}`);
  const whatsapp = card.querySelector('.whatsapp');
  if (whatsApp) {
    whatsapp.href = `https://wa.me/${whatsApp}`;
    whatsapp.setAttribute('aria-label', `Escribir a ${contact.name} por WhatsApp`);
  } else whatsapp.remove();
  const edit = card.querySelector('.edit');
  edit.setAttribute('aria-label', `Editar a ${contact.name}`);
  edit.addEventListener('click', () => openContactEditor(contact));
  return card;
}

async function openContactEditor(contact = null) {
  if (!API_URL) return showToast('Primero hay que conectar Google Sheets.');
  if (!(await ensureAdmin())) return;
  $('contactForm').reset();
  $('dialogTitle').textContent = contact ? 'Editar contacto' : 'Nuevo contacto';
  $('contactId').value = contact?.id || '';
  $('sourceName').value = contact?.name || '';
  $('sourcePhone').value = contact?.phone || '';
  $('contactName').value = contact?.name || '';
  $('contactCategory').value = contact?.category || '';
  $('contactRole').value = contact?.role || '';
  $('contactPhone').value = contact?.phone || '';
  $('contactDialog').showModal();
  setTimeout(() => $('contactName').focus(), 40);
}

function closeContactEditor() { $('contactDialog').close(); }

async function ensureAdmin() {
  if (adminToken) return true;
  const pin = prompt('Ingresá la clave administrativa de la agenda:');
  if (pin === null) return false;
  try {
    const result = await apiPost({ action: 'adminLogin', pin });
    if (!result.ok || !result.token) throw new Error(result.error || 'Clave incorrecta.');
    adminToken = result.token;
    sessionStorage.setItem('sbvpAgendaAdminToken', adminToken);
    return true;
  } catch (error) {
    showToast(error.message);
    return false;
  }
}

async function saveContact(event) {
  event.preventDefault();
  const data = { id: $('contactId').value, sourceName: $('sourceName').value, sourcePhone: $('sourcePhone').value, name: $('contactName').value.trim(), category: $('contactCategory').value.trim(), role: $('contactRole').value.trim(), phone: $('contactPhone').value.trim() };
  setFormBusy(true);
  try {
    const result = await apiPost({ action: data.id ? 'update' : 'add', token: adminToken, data });
    if (!result.ok) {
      if (result.code === 'UNAUTHORIZED') { adminToken = ''; sessionStorage.removeItem('sbvpAgendaAdminToken'); }
      throw new Error(result.error || 'No se pudo guardar el contacto.');
    }
    closeContactEditor();
    await loadContacts();
    showToast(data.id ? 'Contacto actualizado.' : 'Contacto agregado.');
  } catch (error) {
    showToast(error.message);
  } finally { setFormBusy(false); }
}

async function apiPost(payload) {
  const response = await fetch(API_URL, { method: 'POST', redirect: 'follow', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
  if (!response.ok) throw new Error('No se pudo conectar con la agenda.');
  return response.json();
}

function downloadExcel() {
  if (!contacts.length) return showToast('Todavía no hay contactos para descargar.');
  const rows = filteredContacts();
  const cells = (values) => `<Row>${values.map((value) => `<Cell><Data ss:Type="String">${escapeXml(value)}</Data></Cell>`).join('')}</Row>`;
  const workbook = `<?xml version="1.0" encoding="UTF-8"?><?mso-application progid="Excel.Sheet"?><Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"><Worksheet ss:Name="Agenda"><Table>${cells(['Categoría', 'Nombre y apellido', 'Rol', 'Teléfono'])}${rows.map((contact) => cells([contact.category, contact.name, contact.role, contact.phone])).join('')}</Table></Worksheet></Workbook>`;
  const blob = new Blob([workbook], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `agenda-sbvp-${new Date().toISOString().slice(0, 10)}.xls`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(link.href), 1000);
  showToast(`Excel generado con ${rows.length} contactos.`);
}

function phoneForCall(value) { const trimmed = String(value).trim(); return (trimmed.startsWith('+') ? '+' : '') + trimmed.replace(/\D/g, ''); }
function phoneForWhatsApp(value) { let digits = String(value).replace(/\D/g, ''); if (digits.length < 10) return ''; if (digits.startsWith('00')) digits = digits.slice(2); if (digits.startsWith('0')) digits = digits.slice(1); if (digits.startsWith('247715') && digits.length === 12) digits = `2477${digits.slice(6)}`; if (!digits.startsWith('54')) digits = `54${digits}`; return digits; }
function initials(name) { return name.split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join('').toUpperCase(); }
function normalizeText(value) { return String(value).normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim(); }
function escapeXml(value) { return String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[char])); }
function clearFilters() { $('searchInput').value = ''; $('categoryFilter').value = ''; $('roleFilter').value = ''; render(); $('searchInput').focus(); }
function setLoading(loading) { $('refreshBtn').classList.toggle('spinning', loading); $('refreshBtn').disabled = loading; }
function setFormBusy(busy) { $('contactForm').querySelectorAll('input,button').forEach((element) => { element.disabled = busy; }); }
function showStatus(message, type) { const panel = $('statusPanel'); panel.hidden = false; panel.className = `status-panel ${type || ''}`; panel.textContent = message; }
function showToast(message) { const toast = $('toast'); toast.textContent = message; toast.classList.add('show'); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => toast.classList.remove('show'), 3600); }

loadContacts();
