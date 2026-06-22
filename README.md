# SBVP · Home PWA

Home central para herramientas del cuartel, optimizado para celular y compatible con GitHub Pages.

## Secciones incluidas

- Partes de servicio
- Controles Diarios
- Reporte Diario
- Registro de Desvíos
- Equipamiento
  - Pizarra de novedades
  - Depósito
  - Ropería
- Soporte Operativo
  - Pizarra de novedades
  - Control de Choferes
- Formación profesional
  - Presentación de certificado
- Ayudantía
  - Licencias ordinarias
  - Salud
  - Presentación de certificados médicos
  - Vacunación
  - Cobertura médica
- Brigadas
- Complementos
  - Agenda de contactos
  - Ubicación de hidrantes
  - Mapas de jurisdicción
  - Compartir APP

## Link ya cargado

Links ya cargados:

Partes de servicio apunta a:

```text
https://bomberospergamino.github.io/GeneradorPartes/
```

Controles Diarios apunta a:

```text
https://bomberospergamino.github.io/Equipamiento/
```

Pizarra de novedades de Equipamiento apunta a:

```text
https://bomberospergamino.github.io/NovedadesEquipamiento/
```

Ubicación de hidrantes apunta a:

```text
https://maphub.net/sbvp28/sbvp
```

Mapas de jurisdicción apunta a:

```text
https://maphub.net/sbvp28/jurisdiccion
```

El resto de los botones queda preparado con aviso de “acceso preparado” hasta que se vinculen los repos correspondientes.

## Publicación en GitHub Pages

1. Crear un repositorio, por ejemplo `Home`.
2. Subir estos archivos a la raíz del repo.
3. Ir a `Settings` → `Pages`.
4. Seleccionar `main` y `/root`.
5. Guardar.

La URL será similar a:

```text
https://bomberospergamino.github.io/Home/
```

## Cambiar links

En `index.html`, reemplazar los `href="#"` por la URL real de cada herramienta cuando esté creada.


## Cambios v2

- Se eliminó el panel superior de Compartir APP.
- El primer bloque visible ahora es Controles y reportes.
- El botón Compartir APP queda solo en Complementos.
- Se agregó banner de instalación de la APP.
- Se agregó `service-worker.js` para habilitar instalación como PWA.
- Se mantiene el logo institucional del cuartel.


## Instalación como APP

La pantalla incluye dos accesos de instalación:

- Banner superior automático cuando el navegador habilita la instalación PWA.
- Botón fijo **Instalar APP** debajo de **Compartir APP**, para que la opción quede siempre visible.

En Android/Chrome puede abrir el instalador directamente. En iPhone/Safari no se puede forzar por código: el botón muestra la indicación para usar **Compartir → Agregar a pantalla de inicio**.


## Cambios v4

- Título principal cambiado a “Bienvenidos”.
- Se eliminó el subtítulo bajo el título.
- “Áreas del cuartel” pasó a “Secciones del cuartel”.
- Brigadas se separó como división operativa independiente.
- Se confirmó el acceso “Pizarra de novedades” dentro de Equipamiento.
- Se actualizó la caché del service worker para forzar actualización en celulares.

## Cambios v5

- La primera opción de Controles y reportes ahora es **Partes de servicio**.
- Se restauró **Controles Diarios** como segunda opción, apuntando a Equipamiento.
- Se cargaron los links reales para hidrantes y jurisdicción.
- Se agregó la pizarra de novedades de Soporte Operativo.
- Se actualizó la caché del service worker.

## Cambios v6

- Se agregó la sección **Ayudantía**.
- Se agregaron los apartados de **Licencias ordinarias** y **Salud**.
- Dentro de Salud se agregaron **Presentación de certificados médicos**, **Vacunación** y **Cobertura médica**.
- En Formación profesional se agregó **Presentación de certificado**.
- Se actualizó la caché del service worker.
