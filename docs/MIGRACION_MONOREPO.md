# Migración a repositorio único

Fecha del inventario: 11 de agosto de 2026.

## Criterio de selección

Se compararon los repositorios de `bomberospergamino` con las copias locales encontradas en `Documents` y `Desktop`. Para cada aplicación se eligió la fuente con trabajo más reciente y completo, considerando commit, fecha, archivos adicionales y contenido; no se usó únicamente la fecha de modificación.

## Fuentes seleccionadas

| Aplicación | Fuente seleccionada | Revisión |
| --- | --- | --- |
| Home | GitHub `sbvp` | `15ddb98` |
| Brigadas | GitHub `brigadas` | `d8d8417` |
| Choferes | GitHub `choferes` | `3970e4d` |
| Controles realizados | GitHub `ControlesRealizados` | `c3c7e26` |
| Generador de partes | GitHub `GeneradorPartes` | `cf4f92e` |
| Equipamiento | GitHub `Equipamiento` | `3a0279a` |
| Novedades de equipamiento | GitHub `NovedadesEquipamiento` | `3502f8f` |
| Reporte diario | Copia local `Desktop/HTML/REPORTE DIARIO` | aplicación correcta de reporte de guardia |
| Fichero | Copia local `Desktop/HTML/FICHERO` | cambios hasta 17-03-2026, posteriores a `0f7f40a` |
| Jefatura | GitHub `jefatura` | `21d88eb` |

## Decisiones

- Las aplicaciones se conservaron inicialmente sin reescrituras funcionales dentro de `apps/` para reducir el riesgo de regresiones.
- La portada ahora usa enlaces relativos al mismo despliegue.
- El commit remoto `54a8525` de `ReporteDiarioSBVP` contenía otra aplicación titulada "Control Diario". Se descartó como carga incorrecta y se conservó la implementación local "Reporte de guardia".
- `jefatura` se conserva como módulo legado, pero no se añadió a la navegación porque tampoco estaba conectado desde la portada vigente.
- `outputs/` contiene material de trabajo local y queda excluido de Git.
- Los repositorios anteriores no deben archivarse hasta validar el preview de Vercel, los backends de Apps Script y el comportamiento en celulares.

## Seguridad pendiente

El módulo Brigadas heredó del repositorio público un control administrativo implementado íntegramente en el navegador. Ese mecanismo no constituye autenticación segura y debe migrarse posteriormente a validación del lado del servidor. No se modificó durante esta consolidación para evitar interrumpir el flujo operativo existente.

## Paso posterior a la validación

Una vez integrado este cambio en `main`, el proyecto de Vercel puede continuar conectado a `bomberospergamino/sbvp`. Después de validar producción, los repositorios de módulos pueden archivarse como históricos, dejando un enlace hacia este repositorio.

## Corrección posterior de accesos

La validación operativa posterior confirmó que dos rótulos de la portada habían quedado asociados a conceptos distintos de los esperados:

- **Reporte Diario** debe abrir la aplicación `Control Diario` proveniente de `ControlesRealizados`, utilizada para limpieza, móviles, planillas, asistencia y firmas.
- **Checks realizados** debe mostrar el seguimiento de controles de equipamiento de los últimos siete días, con fecha y responsables, a partir de la hoja `REGISTROS` del módulo Equipamiento.

La aplicación local denominada `Reporte de guardia` se conserva en `apps/reporte-diario/` como antecedente y no se elimina, pero deja de ser el destino principal del acceso **Reporte Diario**.
