const FOLDER_ID = '1tXfiQ6i3_wRa4-rKgmCeoZ1EjK79O4ek';
const SPREADSHEET_ID = '18I1R36Ug52YSQLTAGnA_d2YkuQ2F1BRCnEw-yq_MRJI';
const SHEET_HISTORIAL = 'Historial';
const SHEET_DETALLE = 'Detalle';

function doPost(e) {
  try {
    const payload = JSON.parse(e.postData.contents || '{}');
    const report = payload.reportData || {};
    const pdfBase64 = payload.pdfBase64 || '';
    const fileName = payload.fileName || `reporte-guardia-${new Date().getTime()}.pdf`;

    if (!pdfBase64) {
      return jsonResponse_({ ok: false, message: 'No se recibió el PDF en base64.' });
    }

    const folder = DriveApp.getFolderById(FOLDER_ID);
    const spreadsheet = SpreadsheetApp.openById(SPREADSHEET_ID);
    const historial = getOrCreateSheet_(spreadsheet, SHEET_HISTORIAL, [
      'Fecha carga',
      'Responsable',
      'Fecha reporte',
      'Link PDF'
    ]);
    const detalle = getOrCreateSheet_(spreadsheet, SHEET_DETALLE, [
      'Fecha carga',
      'Fecha reporte',
      'Responsable',
      'Sección',
      'Ítem',
      'Estado',
      'Fila',
      'Bombero',
      'Guardia',
      'Limpieza',
      'Actividad 1',
      'Actividad 2'
    ]);

    const pdfBlob = Utilities.newBlob(
      Utilities.base64Decode(pdfBase64),
      'application/pdf',
      fileName
    );

    const file = folder.createFile(pdfBlob);
    const fechaCarga = new Date();
    const responsable = report.responsable || '';
    const fechaReporte = report.fechaLabel || report.fechaIso || '';

    historial.appendRow([
      fechaCarga,
      responsable,
      fechaReporte,
      file.getUrl()
    ]);

    appendSeccionRows_(detalle, fechaCarga, fechaReporte, responsable, 'Móviles', report.moviles || []);
    appendSeccionRows_(detalle, fechaCarga, fechaReporte, responsable, 'Dependencias', report.dependencias || []);
    appendSeccionRows_(detalle, fechaCarga, fechaReporte, responsable, 'Planillas', report.planillas || []);
    appendSeccionRows_(detalle, fechaCarga, fechaReporte, responsable, 'Choferes', report.choferes || []);
    appendGuardiaRows_(detalle, fechaCarga, fechaReporte, responsable, report.guardia || []);

    return jsonResponse_({
      ok: true,
      message: 'Reporte guardado correctamente.',
      fileUrl: file.getUrl()
    });
  } catch (error) {
    return jsonResponse_({
      ok: false,
      message: error && error.message ? error.message : String(error)
    });
  }
}

function doGet() {
  return jsonResponse_({ ok: true, message: 'Web App activa' });
}

function getOrCreateSheet_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);

  const currentHeaders = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  const isEmptyHeader = currentHeaders.every(value => String(value).trim() === '');

  if (isEmptyHeader) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  return sheet;
}

function appendSeccionRows_(sheet, fechaCarga, fechaReporte, responsable, seccion, rows) {
  rows.forEach(row => {
    sheet.appendRow([
      fechaCarga,
      fechaReporte,
      responsable,
      seccion,
      row.item || '',
      row.estado || '',
      '',
      '',
      '',
      '',
      '',
      ''
    ]);
  });
}

function appendGuardiaRows_(sheet, fechaCarga, fechaReporte, responsable, rows) {
  rows.forEach((row, index) => {
    sheet.appendRow([
      fechaCarga,
      fechaReporte,
      responsable,
      'Reporte de guardia',
      '',
      '',
      row.orden || index + 1,
      row.bombero || '',
      row.guardia || '',
      row.limpieza || '',
      row.actividad1 || '',
      row.actividad2 || ''
    ]);
  });
}

function jsonResponse_(obj) {
  return ContentService
    .createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
