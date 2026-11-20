// URL /exec del despliegue de Apps Script de la Escuela de Cadetes.
const asistenciaUrl = '';

for (const enlace of document.querySelectorAll('[data-asistencia-nivel]')) {
  if (!asistenciaUrl) continue;
  const url = new URL(asistenciaUrl);
  url.searchParams.set('nivel', enlace.dataset.asistenciaNivel);
  enlace.href = url.href;
  enlace.removeAttribute('aria-disabled');
  enlace.removeAttribute('aria-describedby');
}

document.getElementById('asistencia-pendiente').hidden = Boolean(asistenciaUrl);
