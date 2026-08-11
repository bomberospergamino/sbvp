# SBVP HOME

Portal unificado de herramientas operativas de la Sociedad de Bomberos Voluntarios de Pergamino.

Este repositorio es el punto de trabajo principal. La portada se publica desde la raíz y las aplicaciones anteriormente separadas viven bajo `apps/`, por lo que un único despliegue puede servir todo el sistema.

## Aplicaciones incluidas

| Ruta | Aplicación | Repositorio de origen |
| --- | --- | --- |
| `apps/brigadas/` | Brigadas | `brigadas` |
| `apps/choferes/` | Control de choferes | `choferes` |
| `apps/controles-realizados/` | Checks realizados | `ControlesRealizados` |
| `apps/equipamiento/` | Controles diarios | `Equipamiento` |
| `apps/fichero/` | Fichero | `FicheroSBVP` + copia local más reciente |
| `apps/generador-partes/` | Generador de partes | `GeneradorPartes` |
| `apps/jefatura/` | Jefatura (legado, sin acceso en portada) | `jefatura` |
| `apps/novedades-equipamiento/` | Novedades de equipamiento | `NovedadesEquipamiento` |
| `apps/reporte-diario/` | Reporte diario | copia local recuperada; el remoto tenía contenido incorrecto |

Los enlaces internos de la portada apuntan a estas rutas. Los mapas de hidrantes y jurisdicción continúan siendo enlaces externos.

## Desarrollo local

No se requiere compilación. Se debe servir la raíz mediante un servidor HTTP para que el service worker y las rutas relativas funcionen correctamente. Por ejemplo:

```powershell
python -m http.server 8000
```

Luego abrir `http://localhost:8000/`.

## Publicación

Vercel debe usar la raíz del repositorio como directorio del proyecto y no necesita comando de compilación para esta aplicación estática. Los cambios se preparan primero en una rama y se integran a `main` después de revisar el preview.

## Fuentes y migración

El criterio utilizado para seleccionar cada versión y los commits de origen se documenta en [`docs/MIGRACION_MONOREPO.md`](docs/MIGRACION_MONOREPO.md).
