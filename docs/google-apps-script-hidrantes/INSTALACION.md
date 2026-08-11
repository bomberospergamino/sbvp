# Instalación del backend de hidrantes

## 1. Crear el proyecto

1. Abrir el proyecto de Apps Script existente.
2. Reemplazar el contenido de `Código.gs` por el archivo `Code.gs` de esta carpeta.
3. Guardar el proyecto con el nombre `SBVP Hidrantes API`.

## 2. Inicializar

1. En la lista de funciones del editor seleccionar `inicializarSistema` y pulsar **Ejecutar**. Aceptar los permisos solicitados.
2. En **Configuración del proyecto → Propiedades de la secuencia de comandos**, agregar temporalmente `ADMIN_PIN_SETUP` con la clave elegida. Seleccionar `configurarClaveAdmin` y pulsar **Ejecutar**. La propiedad temporal se elimina automáticamente después de guardar su versión protegida.
3. Seleccionar `importarGeoJsonDesdeDrive` y pulsar **Ejecutar**.

La inicialización agrega las columnas faltantes sin borrar las existentes, genera un ID estable para cada hidrante y crea su subcarpeta dentro de la carpeta de Drive configurada. Las carpetas anteriores ubicadas fuera de ese destino se ignoran: no se mueven ni se borran. Después de crear la carpeta correcta, la planilla guarda su nuevo enlace y las siguientes ejecuciones la reutilizan sin generar duplicados. También se instalan automatizaciones para revisar carpetas cada seis horas y cuando alguien edita la planilla.

## 3. Importar los detalles existentes de MapHub (opcional pero recomendado)

El ID de `sbvp28-sbvp.geojson` ya está configurado. Ejecutar la función `importarGeoJsonDesdeDrive` desde el selector de funciones del editor.

El importador separa horario, altura, móviles aptos, acople, responsable, contacto y observaciones. También reconoce los puntos fuera de servicio como `Inactivo` y reutiliza las carpetas de Drive que ya estén enlazadas.

## 4. Publicar la API

1. En Apps Script elegir **Implementar → Nueva implementación**.
2. Seleccionar **Aplicación web**.
3. Ejecutar como: **Yo**.
4. Quién tiene acceso: **Cualquier persona**.
5. Implementar y copiar la URL terminada en `/exec`.

Probar en el navegador:

```text
URL_DE_IMPLEMENTACION?action=health
```

Debe responder con `{"ok":true,...}`. Guardar la URL: será la conexión que usará el mapa de SBVP Home.

## Fotos y permisos

`PUBLICAR_FOTOS: true` permite que las imágenes se vean dentro de la aplicación mediante enlaces. Esto hace que las carpetas sean visibles para cualquiera que tenga el enlace, aunque no aparecen en búsquedas. Si las fotos deben ser privadas, cambiar el valor a `false`; en ese caso la futura galería requerirá autenticación con Google.

## Comportamiento de las altas

- Un alta desde el mapa se guarda como `Pendiente` y crea inmediatamente su carpeta de fotos.
- Los hidrantes pendientes no se muestran al público hasta que un administrador los publique.
- Editar, publicar o eliminar requiere una sesión obtenida con la clave administrativa.
- Eliminar es un borrado lógico: conserva la fila y la carpeta para auditoría, pero deja de mostrar el punto.
