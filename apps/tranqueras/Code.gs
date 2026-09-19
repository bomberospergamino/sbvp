const SPREADSHEET_ID = '1sD6t3JQuoUOwfOeyw52ofFFIc9i9IY5vjmpzbMO2FkI';
const SHEET_NAME = 'Tranqueras';

function doGet() {
  try {
    const sheet = SpreadsheetApp.openById(SPREADSHEET_ID).getSheetByName(SHEET_NAME);
    if (!sheet) throw new Error('No se encontró la hoja Tranqueras.');
    const values = sheet.getDataRange().getDisplayValues();
    if (values.length < 2) return jsonOutput_({ok: true, tranqueras: []});

    const headers = values[0].map(normalizeHeader_);
    const column = names => {
      for (const name of names) {
        const index = headers.indexOf(normalizeHeader_(name));
        if (index >= 0) return index;
      }
      return -1;
    };
    const indexes = {
      codigo: column(['Código', 'Codigo']),
      titular: column(['Titular 1', 'Titular']),
      telefono: column(['Tel. titular 1', 'Telefono titular 1', 'Teléfono titular 1']),
      instrucciones: column(['Instrucciones de acceso', 'Instrucciones']),
      longitud: column(['Longitud']),
      latitud: column(['Latitud'])
    };
    Object.keys(indexes).forEach(key => {
      if (indexes[key] < 0) throw new Error('Falta la columna requerida: ' + key);
    });

    const tranqueras = values.slice(1).map(row => ({
      codigo: row[indexes.codigo],
      titular: row[indexes.titular],
      telefono: row[indexes.telefono],
      instrucciones: row[indexes.instrucciones],
      longitud: parseCoordinate_(row[indexes.longitud]),
      latitud: parseCoordinate_(row[indexes.latitud])
    })).filter(item => item.codigo && Number.isFinite(item.longitud) && Number.isFinite(item.latitud));

    return jsonOutput_({ok: true, tranqueras: tranqueras, actualizado: new Date().toISOString()});
  } catch (error) {
    return jsonOutput_({ok: false, error: error.message});
  }
}

function normalizeHeader_(value) {
  return String(value || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();
}

function parseCoordinate_(value) {
  return Number(String(value || '').trim().replace(',', '.'));
}

function jsonOutput_(data) {
  return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);
}
