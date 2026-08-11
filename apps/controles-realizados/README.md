# SBVP Control Diario

Aplicacion web estatica para realizar el control diario de guardia:

- Limpieza de lugares.
- Limpieza de moviles.
- Asistencia de personas.
- Control de partes sin firmar desde la hoja `CONTROL_FIRMAS`.
- Generacion de PDF al finalizar.
- Compartir desde el navegador si el dispositivo soporta Web Share.
- Historico local con retencion automatica de 60 dias.

## Datos

La app lee el personal y los partes desde esta planilla:

`https://docs.google.com/spreadsheets/d/1fkfiSwjaFuysUVHaTTaHziDee0Atmrpo-cbH_iqrCuw`

GIDs usados:

- Personal: `0`
- CONTROL_FIRMAS: `1632175139`

## Publicacion en GitHub Pages

1. Crear un repositorio en GitHub.
2. Subir estos archivos a la rama principal.
3. En GitHub, ir a `Settings > Pages`.
4. Elegir la rama principal y carpeta raiz.

## Nota sobre historico central

El historico incluido queda guardado en el navegador durante 60 dias. Para que el historico quede centralizado en Google Sheets, conviene sumar un endpoint de Google Apps Script que reciba el control finalizado y lo escriba en una hoja `HISTORICO_CONTROL_DIARIO`.

## Escritura en CONTROL_FIRMAS

Para que los checks de firmas se registren en la hoja `CONTROL_FIRMAS`, usar el Apps Script combinado del proyecto de carga de servicios:

`C:\Users\irina\Desktop\HTML\SBVP_CARGA DE SERVICIOS\apps-script.gs`

Ese archivo ya contiene las acciones de carga de servicios y tambien acepta `updateSignature` para actualizar `CONTROL_FIRMAS`.

Pasos:

1. Abrir el proyecto de Apps Script que usa `SBVP_CARGA DE SERVICIOS`.
2. Reemplazar/actualizar ahi el contenido con `apps-script.gs`.
3. Implementar una nueva version como aplicacion web.
4. Copiar la URL de la aplicacion web.
5. Pegar esa URL en `app.js`, en `CONFIG.appsScriptUrl`.

Si `CONFIG.appsScriptUrl` queda vacio, la app guarda las firmas localmente como pendientes y avisa en pantalla.
