# Agenda telefónica SBVP

La interfaz consume las columnas `Categoría`, `Nombre y apellido`, `Rol` y `Teléfono` de la pestaña `BASE`. Los datos personales no se copian al repositorio.

## Conectar Google Sheets

1. En la planilla, abrir **Extensiones → Apps Script**.
2. Copiar el contenido de `apps-script/Code.gs` en el editor y guardar.
3. Elegir **Implementar → Nueva implementación → Aplicación web**.
4. Ejecutar como la cuenta propietaria y definir quién puede acceder según la política interna de SBVP.
5. Copiar la URL terminada en `/exec` dentro de `config.js`.

## Habilitar altas y ediciones

En Apps Script, abrir **Configuración del proyecto → Propiedades de la secuencia de comandos**, agregar la propiedad `AGENDA_ADMIN_PIN` y asignarle una clave larga que conozcan solamente las personas autorizadas. La aplicación solicita esa clave antes de agregar o editar y mantiene la sesión administrativa durante un máximo de seis horas.

Los cambios realizados desde la aplicación se escriben directamente en la hoja `BASE`. Los cambios hechos manualmente en Google Sheets aparecen al abrir la agenda nuevamente o al tocar el botón **Actualizar**. La aplicación no guarda una copia persistente de los teléfonos en el navegador.

El botón **Descargar Excel** genera un archivo `.xls` con el resultado visible. Sin filtros descarga la lista completa; con filtros activos descarga solamente los contactos filtrados.

## Privacidad

La portada de SBVP está publicada en Internet. Si la aplicación web de Apps Script se despliega para “cualquier usuario”, la agenda también podrá consultarse mediante su URL aunque no esté enlazada públicamente. Antes de activar la conexión en producción, decidir si el directorio puede ser público o si se incorporará autenticación institucional.
