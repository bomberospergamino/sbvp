# Generador de partes de servicio SBVP

Aplicacion estatica para generar, completar, imprimir y consultar partes de servicio.

## Archivos para GitHub Pages

Subir estos archivos al repositorio:

- `index.html`
- `styles.css`
- `app.js`
- `logo-sbvp.png`

GitHub Pages puede servir la app directamente desde la rama principal o desde `/docs`.

## Apps Script

El frontend apunta a:

`https://script.google.com/macros/s/AKfycbx9TtL5TXjuNKsJbBALfVpPFysSsZZu_o8OMbYZbPy3BA94hsG3eomJNNH0GmRsZl7xvg/exec`

En Apps Script copiar:

- `apps-script.gs` como codigo principal.
- `appsscript.json` como manifiesto del proyecto.

Para ver/editar el manifiesto en Apps Script:

1. Ir a Configuracion del proyecto.
2. Activar "Mostrar el archivo de manifiesto appsscript.json en el editor".
3. Pegar el contenido de `appsscript.json`.

## Autorizacion necesaria

Antes de usar la app publicada, ejecutar desde Apps Script:

`autorizarServiciosGoogle()`

Aceptar los permisos de Google Sheets, Drive y Docs. Esto es necesario para que se creen las copias editables en Drive.

Luego ejecutar:

`probarCarpetaDrive()`

Debe crear un documento de prueba en la carpeta configurada.

## Carpeta Drive actual

Las copias editables se guardan en:

`https://drive.google.com/drive/folders/1-IkiEXQSUdiXDnlfYxGPTSOPr8_sWjhB`

Si la cuenta que ejecuta el Apps Script no tiene permisos sobre esa carpeta, el script usa una carpeta fallback llamada `SBVP_PARTES_EDITABLES` y deja el detalle en la hoja `ERRORES`.

## Control de firmas

Cuando se genera un parte, Apps Script crea o actualiza una fila en la hoja `CONTROL_FIRMAS`.
Cuando se imprime el frente, completo o incompleto, esa misma fila pasa de `pendiente_impresion` a `frente_impreso`.

Columnas principales:

- `control_id`
- `servicio_id`
- `parte_servicio`
- `fecha_servicio`
- `fecha_generacion`
- `fecha_impresion_frente`
- `tipo_ultima_impresion`
- `estado_impresion`
- `persona_a_cargo`
- `operador`
- `firma_persona_a_cargo`
- `firma_operador`
- `controlado`
- `controlado_en`
- `controlado_por`
- `observaciones`

El futuro panel de control debe leer `action=data`, usar `controlFirmas`, mostrar pendientes no controlados y actualizar firmas con `action=actualizarControlFirma`.
Estados esperados:

- `pendiente_impresion`: falta imprimir y firmar.
- `frente_impreso`: falta controlar firmas o marcarlo controlado.
