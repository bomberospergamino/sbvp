const PADRON_ID = '1LBNMBbWBKen1DWLyjUUxC1qGZRNtQUWCzd8otdXM8Ig';
const CARPETA_ASISTENCIA_ID = '1r60DYoYX5HYY0EmeY81cP0cpgWA5qbYI';
const ZONA_HORARIA = 'America/Argentina/Buenos_Aires';
const ESTADOS = ['Presente', 'Ausente', 'Justificado'];

function doGet(e) {
  const nivel = validarNivel_(e.parameter.nivel);
  const pagina = HtmlService.createTemplateFromFile('Asistencia');
  pagina.nivel = nivel;
  pagina.fecha = Utilities.formatDate(new Date(), ZONA_HORARIA, 'yyyy-MM-dd');
  return pagina.evaluate().setTitle('Asistencia · Nivel ' + nivel)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function cargarPadron(nivel) {
  return leerPadron_(validarNivel_(nivel));
}

function leerPadron_(nivel) {
  const hoja = SpreadsheetApp.openById(PADRON_ID).getSheetByName('Hoja 1');
  if (!hoja) throw new Error('No se encontró la pestaña Hoja 1.');
  const ultima = hoja.getLastRow();
  const nombres = hoja.getRange(1, 1, ultima, 2).getDisplayValues();
  const niveles = hoja.getRange(1, 5, ultima, 1).getDisplayValues();
  if (nombres[0].join('|').trim().toLowerCase() !== 'nombre|apellido' ||
      niveles[0][0].trim().toLowerCase() !== 'nivel actual') {
    throw new Error('Revisá los encabezados Nombre, Apellido y Nivel actual del padrón.');
  }
  return nombres.slice(1).flatMap(([nombre, apellido], i) => {
    const valor = niveles[i + 1][0].trim().toLowerCase();
    const romano = ['i', 'ii', 'iii'][Number(nivel) - 1];
    if (![nivel, romano, 'nivel ' + nivel, 'nivel ' + romano].includes(valor)) return [];
    const completo = [apellido.trim(), nombre.trim()].filter(Boolean).join(', ');
    return completo ? [{ fila: i + 2, nombre: completo }] : [];
  });
}

function guardarAsistencia(datos) {
  const nivel = validarNivel_(datos.nivel);
  const fecha = String(datos.fecha);
  const [anio, mes, dia] = fecha.split('-');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha) ||
      Number(anio) < 2000 || new Date(fecha + 'T00:00:00Z').toISOString().slice(0, 10) !== fecha) {
    throw new Error('Ingresá una fecha válida.');
  }
  const responsables = String(datos.responsables || '').trim();
  const tema = String(datos.tema || '').trim().replace(/\s+/g, ' ');
  if (!responsables || responsables.length > 250 || !tema || tema.length > 120) {
    throw new Error('Completá responsables y tema de la clase.');
  }
  const padron = leerPadron_(nivel);
  if (!Array.isArray(datos.marcas) || !padron.length || datos.marcas.length !== padron.length ||
      padron.some((persona, i) => persona.fila !== datos.marcas[i].fila ||
        persona.nombre !== datos.marcas[i].nombre || !ESTADOS.includes(datos.marcas[i].estado))) {
    throw new Error('Revisá todas las marcas. Si cambió el padrón, recargá la planilla.');
  }
  const filas = padron.map((persona, i) =>
    '<tr><td>' + escapar_(persona.nombre) + '</td><td>' + datos.marcas[i].estado + '</td></tr>').join('');
  const totales = ESTADOS.map(estado => estado + ': ' + datos.marcas.filter(marca => marca.estado === estado).length);
  const pdf = Utilities.newBlob(
    '<html><head><meta charset="UTF-8"><style>body{font:12pt Arial;color:#183044}' +
    'table{width:100%;border-collapse:collapse}td,th{padding:6px;border:1px solid #b6c4cf;text-align:left}' +
    'thead{display:table-header-group}tr{page-break-inside:avoid}</style></head><body>' +
    '<h1>Escuela de Cadetes · Asistencia</h1><p>Nivel ' + nivel + ' · ' + dia + '/' + mes + '/' + anio +
    '</p><p>Responsables: ' + escapar_(responsables) + '</p><p>Tema: ' + escapar_(tema) + '</p>' +
    '<p>' + totales.join(' · ') + '</p><table><thead><tr><th>Cadete</th><th>Asistencia</th></tr></thead>' +
    '<tbody>' + filas + '</tbody></table></body></html>', 'text/html', 'asistencia.html').getAs(MimeType.PDF);
  const temaArchivo = tema.replace(/[\\/:*?"<>|]/g, '-').trim();
  const nombre = anio.slice(-2) + '.' + mes + '.' + dia + '-NIVEL ' + nivel + '- ' + temaArchivo + '.pdf';
  const bloqueo = LockService.getScriptLock();
  bloqueo.waitLock(15000);
  try {
    const registro = obtenerRegistroAsistencia_();
    const siguienteFila = registro.getLastRow() + 1;
    const raiz = DriveApp.getFolderById(CARPETA_ASISTENCIA_ID);
    const carpetas = raiz.getFoldersByName(anio);
    const carpeta = carpetas.hasNext() ? carpetas.next() : raiz.createFolder(anio);
    if (carpeta.getFilesByName(nombre).hasNext()) {
      throw new Error('Ya existe un PDF con esa fecha, nivel y tema. Revisá la carpeta antes de volver a enviar.');
    }
    const archivo = carpeta.createFile(pdf.setName(nombre));
    const url = archivo.getUrl();
    const fechaClase = Utilities.parseDate(fecha, ZONA_HORARIA, 'yyyy-MM-dd');
    const registrado = new Date();
    const registros = padron.map((persona, i) => [
      fechaClase, Number(nivel), textoRegistro_(persona.nombre), datos.marcas[i].estado,
      textoRegistro_(tema), textoRegistro_(responsables), archivo.getId(), url, registrado,
    ]);
    try {
      registro.getRange(siguienteFila, 1, registros.length, registros[0].length).setValues(registros);
      SpreadsheetApp.flush();
    } catch (error) {
      throw new Error('Se guardó el PDF, pero no se pudo confirmar el registro en Sheets. Revisá ' + nombre + ' antes de reenviar.');
    }
    return { nombre, url };
  } finally {
    bloqueo.releaseLock();
  }
}

function obtenerRegistroAsistencia_() {
  const libro = SpreadsheetApp.openById(PADRON_ID);
  const hoja = libro.getSheetByName('Asistencias') || libro.insertSheet('Asistencias', 1);
  const encabezados = ['Fecha', 'Nivel', 'Cadete', 'Estado', 'Tema', 'Responsables', 'ID PDF', 'PDF', 'Registrado el'];
  const primeraFila = hoja.getRange(1, 1, 1, encabezados.length);
  if (!hoja.getLastRow()) {
    primeraFila.setValues([encabezados]).setFontWeight('bold');
    hoja.setFrozenRows(1);
    hoja.getRange('A:A').setNumberFormat('dd/mm/yyyy');
    hoja.getRange('I:I').setNumberFormat('dd/mm/yyyy hh:mm');
  } else if (primeraFila.getDisplayValues()[0].join('|') !== encabezados.join('|')) {
    throw new Error('La pestaña Asistencias tiene otros encabezados. Revisala antes de guardar.');
  }
  return hoja;
}

function textoRegistro_(valor) {
  return valor.startsWith('=') ? "'" + valor : valor;
}

function validarNivel_(nivel) {
  if (!['1', '2', '3'].includes(nivel)) throw new Error('Elegí Nivel I, II o III desde el portal.');
  return nivel;
}

function escapar_(valor) {
  return valor.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
