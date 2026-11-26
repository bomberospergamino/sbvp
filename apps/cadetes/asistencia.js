// URL /exec del despliegue de Apps Script de la Escuela de Cadetes.
const asistenciaUrl = 'https://script.google.com/macros/s/AKfycbxfxw4fGlQMhXMcjTybZxcXCXV2HPaUNqpWjMu_PlXbzTXWy5-bI80EBK4SBLYTOuOJuw/exec';

for (const enlace of document.querySelectorAll('[data-asistencia-nivel]')) {
  if (!asistenciaUrl) continue;
  const url = new URL(asistenciaUrl);
  url.searchParams.set('nivel', enlace.dataset.asistenciaNivel);
  enlace.href = url.href;
  enlace.removeAttribute('aria-disabled');
  enlace.removeAttribute('aria-describedby');
}

document.getElementById('asistencia-pendiente').hidden = Boolean(asistenciaUrl);
