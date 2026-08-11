# SBVP Control de Choferes

App simple para controles de choferes y novedades.

## Flujo de uso

1. Abrir la app.
2. Elegir el dia: Lunes, Martes, Miercoles, Jueves, Viernes, Sabado o Domingo.
3. Entrar a `Controles` y completar los checks de los moviles que indique la agenda.
4. Completar siempre `Km`, `Botiquin / precinto` y `Chofer` para cada movil.
5. Entrar a `Novedades` para imprimir o guardar la hoja A4 horizontal.

## Excel usado

El Apps Script esta configurado para este Google Sheet:

```text
1liMVXb48E4O271C0xxv_4pT_N00xdr2xNrX61A221Jg
```

## Hojas que crea `setupWorkbook()`

- `AGENDA`: define que moviles toca cada dia y cuales tienen fluidos.
- `PREGUNTAS_MOVILES`: preguntas de cada movil y preguntas de fluidos, separadas por seccion.
- `NOVEDADES`: hoja donde se pega la planilla de novedades original.
- `REGISTROS_CHECKS`: guarda cada pregunta completada.
- `REGISTROS_REPORTES`: guarda cada PDF de novedades.
- `NOVEDADES_CHOFERES`: guarda solo lo marcado como Regular, Mal u observaciones.

## Agenda inicial

Lunes:

- Check movil 12
- Check movil 19
- Check movil 24
- Check movil 27
- Check movil 3
- Fluidos movil 3
- Botiquines y kilometros siempre
- Novedades A4

## PDFs

Cuando se guardan controles completados, el Apps Script crea:

```text
Control de Choferes / MOVIL 12
Control de Choferes / MOVIL 19
Control de Choferes / MOVIL 24
...
```

Dentro de cada carpeta guarda el PDF del check de ese movil.

La hoja `Novedades` genera un PDF horizontal en:

```text
Control de Choferes / NOVEDADES
```

## Primer uso en Apps Script

1. Abrir Apps Script desde el Google Sheet.
2. Copiar el contenido de `Code.gs`.
3. Ejecutar manualmente `setupWorkbook()`.
4. Aceptar permisos.
5. Pegar o revisar la hoja `NOVEDADES`.
6. Implementar como Web App.
7. Pegar la URL `/exec` en la app.

## Sobre las preguntas por movil

No hace falta una hoja por movil. Para que sea simple, todo queda en `PREGUNTAS_MOVILES`:

```text
Tipo | Movil | Seccion | Orden | Pregunta
```

Ejemplo:

```text
MOVIL | MOVIL 12 | CABINA | 1 | Estado e higiene
MOVIL | MOVIL 12 | BOMBA  | 2 | Bomba
MOVIL | MOVIL 12 | LUCES  | 3 | Delantera baja
FLUIDOS | TODOS | FLUIDOS | 1 | Aceite de motor
```

Esa hoja ya se genera con preguntas base tomadas de los PDFs iniciales. En la app y en el PDF, cada seccion sale como una tabla con su titulo.
