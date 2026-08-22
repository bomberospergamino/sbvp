const WEB_APP_URL = 'https://script.google.com/macros/s/AKfycbzYiO560Az_Eo_hPzAxeczftZG4h9M3SEPjm-ACtrKzfdtHj_CRiqCCenM3KkIy6vyx/exec';
const DAYS = 7;

const status = document.getElementById('status');
const grid = document.getElementById('checksGrid');
document.getElementById('refreshButton').addEventListener('click', loadChecks);

async function loadChecks() {
  setLoading(true);
  try {
    const url = new URL(WEB_APP_URL);
    url.searchParams.set('action', 'checksSummary');
    url.searchParams.set('days', String(DAYS));
    url.searchParams.set('cacheBust', String(Date.now()));
    const response = await fetch(url);
    if (!response.ok) throw new Error(`El servicio respondió ${response.status}`);
    const data = await response.json();
    if (!data.ok || !Array.isArray(data.items)) throw new Error(data.message || 'Respuesta inválida');
    renderSummary(data);
    renderChecks(data.items);
    status.textContent = `Actualizado ${new Date(data.generatedAt || Date.now()).toLocaleString('es-AR')}`;
    status.className = 'status success';
  } catch (error) {
    console.error(error);
    status.textContent = 'No se pudieron consultar los checks. Tocá Actualizar para reintentar.';
    status.className = 'status error';
    grid.innerHTML = '';
  } finally {
    setLoading(false);
  }
}

function renderSummary(data) {
  const completed = data.items.filter((item) => item.done).length;
  document.getElementById('periodLabel').textContent = `${formatDate(data.from)} al ${formatDate(data.to)}`;
  document.getElementById('completedCount').textContent = `${completed} / ${data.items.length}`;
  document.getElementById('pendingCount').textContent = String(data.items.length - completed);
}

function renderChecks(items) {
  grid.innerHTML = items.map((item) => {
    const responsables = Array.isArray(item.responsables) ? item.responsables.filter(Boolean).join(', ') : '';
    return `
      <article class="check-card ${item.done ? 'done' : 'pending'}">
        <div class="card-head">
          <h2>${escapeHtml(item.activity || 'Control')}</h2>
          <span>${item.done ? '✓ Realizado' : 'Pendiente'}</span>
        </div>
        <dl>
          <div><dt>Fecha</dt><dd>${item.done ? formatDateTime(item.lastControlDate || item.lastLoadDate) : 'Sin control en los últimos 7 días'}</dd></div>
          <div><dt>Realizado por</dt><dd>${escapeHtml(responsables || (item.done ? 'Sin responsable informado' : '—'))}</dd></div>
          ${item.observaciones ? `<div><dt>Observaciones</dt><dd>${escapeHtml(item.observaciones)}</dd></div>` : ''}
        </dl>
        ${item.pdf ? `<a href="${escapeAttr(item.pdf)}" target="_blank" rel="noopener noreferrer">Abrir PDF del control</a>` : ''}
      </article>
    `;
  }).join('');
}

function formatDate(value) {
  if (!value) return '—';
  const [year, month, day] = String(value).slice(0, 10).split('-');
  return year && day ? `${day}/${month}/${year}` : String(value);
}

function formatDateTime(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? formatDate(value) : date.toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' });
}

function setLoading(loading) {
  const button = document.getElementById('refreshButton');
  button.disabled = loading;
  if (loading) {
    status.textContent = 'Consultando los controles de la última semana...';
    status.className = 'status';
  }
}

function escapeHtml(value = '') {
  const node = document.createElement('div');
  node.textContent = value;
  return node.innerHTML;
}

function escapeAttr(value = '') {
  return escapeHtml(value).replace(/"/g, '&quot;');
}

loadChecks();
