# Estructura propuesta para Google Sheets

La opcion mas practica es usar el mismo archivo de PERSONAL como base central y agregar estas hojas.

## PERSONAL
Fuente maestra de integrantes.

Columnas:
- persona_id
- apellido_nombre
- grado
- activo
- orden_impresion

## CATALOGOS
Listas controladas para la app.

Columnas sugeridas:
- tipo_catalogo
- codigo
- descripcion
- activo

Ejemplos de tipo_catalogo:
- TIPO_SERVICIO
- MOVIL
- ROL_DOTACION

## SERVICIOS
Una fila por parte de servicio.

Columnas:
- servicio_id
- parte_numero
- parte_anio
- parte_servicio
- codigo_servicio
- tipo_servicio
- denunciante
- telefono
- ubicacion
- distancia_km
- fecha_llamada
- hora_llamada
- fecha_salida
- hora_salida
- fecha_regreso
- hora_regreso
- duracion_horas
- persona_a_cargo
- operador
- reconocimiento
- disposiciones
- perdidas
- estado
- creado_en
- completado_en

## SERVICIO_DOTACION
Una fila por persona y por servicio.

Columnas:
- servicio_id
- parte_servicio
- fecha_salida
- persona
- rol
- duracion_horas
- codigo_servicio
- tipo_servicio

Esta hoja permite medir asistencia por persona, roles, horas/hombre y participacion por epoca.

## SERVICIO_MOVILES
Una fila por movil y por servicio.

Columnas:
- servicio_id
- parte_servicio
- fecha_salida
- movil
- chofer
- persona_a_cargo
- codigo_servicio
- tipo_servicio
- duracion_horas
- distancia_km

Esta hoja permite filtrar por movil y ver servicios, jefes a cargo, horas acumuladas y km acumulados.

## METRICAS_SERVICIOS_MES
Tabla dinamica o QUERY para graficos por epoca del ano.

Columnas:
- periodo
- codigo_servicio
- tipo_servicio
- cantidad_servicios

Grafico recomendado:
- eje X: periodo o fecha
- eje Y: cantidad_servicios
- serie/color: tipo_servicio

## METRICAS_TORTA_TIPOS
Tabla dinamica para torta filtrable por fecha.

Columnas:
- tipo_servicio
- cantidad_servicios

Usar segmentadores/filtros por fecha_salida, anio, mes y codigo_servicio.

## METRICAS_MOVILES
Tabla dinamica o QUERY desde SERVICIO_MOVILES.

Columnas:
- movil
- periodo
- cantidad_servicios
- horas_totales
- km_totales

Filtros:
- movil
- rango de fechas
- tipo_servicio
- persona_a_cargo

## Vinculacion con la app
Para conectar la app local con Google Sheets hay dos caminos:

1. Google Apps Script publicado como Web App.
   La app envia cada parte a un endpoint y el script agrega filas en SERVICIOS, SERVICIO_DOTACION y SERVICIO_MOVILES.

2. Exportacion/importacion manual.
   La app genera una tabla compatible y se pega/importa en Google Sheets.

La opcion 1 es mejor para uso diario desde una PC, porque evita copiar datos y mantiene las metricas vivas.
