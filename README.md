# SBVP · Herramientas operativas

Home central para herramientas del cuartel, optimizado para celular y compatible con GitHub Pages.

## Secciones incluidas

- Controles Diarios
- Reporte Diario
- Registro de Desvíos
- Equipamiento
  - Pizarra de novedades
  - Depósito
  - Ropería
- Soporte Operativo
  - Control de Choferes
- Formación profesional
- Brigadas
- Complementos
  - Agenda de contactos
  - Ubicación de hidrantes
  - Mapas de jurisdicción
  - Compartir APP

## Link ya cargado

Links ya cargados:

Controles Diarios apunta a:

```text
https://bomberospergamino.github.io/Equipamiento/
```

Pizarra de novedades de Equipamiento apunta a:

```text
https://bomberospergamino.github.io/NovedadesEquipamiento/
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
