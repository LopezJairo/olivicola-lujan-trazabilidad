---
title: "04 - Manual del operario"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - operario
  - manual
---

# 04 - Manual del operario

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Ingreso al Sistema al Iniciar el Turno

1. Abre la aplicación de escritorio **Olivícola Luján** desde el icono en tu pantalla.
2. Ingresa tu número de **Legajo** (por ejemplo: `OP-01`) y tu **Contraseña**.
3. Presiona **Iniciar Sesión**.
4. En la barra lateral verás tu nombre y cargo confirmando que estás operando bajo tu perfil.

---

## Atajos Rápidos de Teclado

Puedes moverte instantáneamente entre las pantallas principales presionando los números en tu teclado:

- `1`: **Inicio** (Resumen de tambores e indicadores de planta).
- `2`: **Escanear Tambor** (Búsqueda directa por código de barras).
- `3`: **Inventario** (Lista de tambores con filtros rápidos).
- `4`: **Registrar Tambor** (Formulario de pesaje y alta).
- `5`: **Control de Calidad** (Solo lectura para operarios).
- `6`: **Historial** (Registro cronológico de movimientos).

---

## Procedimiento 1: Pesar y Registrar un Nuevo Tambor

1. Presiona `4` o haz clic en **Registrar Tambor**.
2. **Selecciona las características del producto:**
   - Producto (ej. *Entera*, *Descarozada*, *Rodajas*).
   - Presentación (ej. *Verde*, *Negra*, *Clara*).
   - Variedad (ej. *Arauco*, *Aloreña*, *Manzanilla*).
   - Calibre (ej. *121/140*, *161/200*, *Sin Calibre*).
   - Calidad (ej. *Primera*, *Segunda*).
3. **El sistema precargará el peso sugerido automáticamente:**
   - Si es Entera: `180.0 kg`.
   - Si es Descarozada: `140.0 kg`.
   - Si es Rodajas o Rellenas: `160.0 kg`.
   - Corrige el valor si la balanza marca un peso neto diferente.
4. Escribe el código de **Lote** del productor o de la cosecha.
5. Selecciona la **Ubicación** física inicial (ej. *Nave A - Fila 1*).
6. Presiona **Registrar Tambor y Emitir Etiqueta**.
7. La impresora Zebra imprimirá la etiqueta automáticamente. Pégala en el lomo del tambor cuidando que no quede arrugada.

---

## Procedimiento 2: Consultar la Ficha de un Tambor con el Escáner

1. Presiona `2` o entra a **Escanear Tambor**. El cursor estará listo esperando el código.
2. Apunta el lector **HPRT N130BT** a la etiqueta del tambor y presiona el gatillo.
3. El sistema emitirá un sonido de confirmación y abrirá inmediatamente la ficha con:
   - Número de tambor (`T000001`).
   - Descripción completa y peso exacto.
   - Ubicación actual y estado de fermentación.
   - Historial de movimientos previos.

---

## Procedimiento 3: Toma Física de Inventario por Sectores

Este procedimiento se realiza cuando se auditan las filas de tambores en los patios o naves de estiba:

1. Ingresa a **Toma por Sectores** desde el menú lateral (`/inventario/toma`).
2. Configura tu escáner **HPRT N130BT** en modo almacenamiento masivo (Modo Batch).
3. En la planta, **escanea primero el código de barras del cartel del sector** pegado en la columna o poste (ej. `NAV-A1`).
4. A continuación, **camina por la fila escaneando cada tambor** uno tras otro sin necesidad de estar cerca de la computadora. El escáner guardará los códigos en su memoria interna.
5. Al terminar la fila, regresa a la computadora con el lector y **escanea el código de barras "Subir Datos" (Upload Data)** del manual del escáner.
6. El software recibirá la ráfaga de tambores, detectará que pertenecen a `NAV-A1`, agrupará las cantidades y te mostrará el resumen en pantalla (ej: *"18 tambores encontrados en Nave A - Fila 1"*).
7. Presiona **Confirmar e Impactar Inventario** para actualizar todas las ubicaciones en un solo clic.

---

## Procedimiento 4: Mover un Tambor a Otra Ubicación

1. Escanea el tambor para abrir su ficha.
2. Haz clic en **Registrar Movimiento**.
3. Selecciona la **Nueva Ubicación** a donde fue trasladado.
4. Si cambió el estado (por ejemplo, pasó a *Salmuera* o *En Reposo*), selecciónalo.
5. Haz clic en **Guardar Movimiento**.

---

## Solución a Problemas Frecuentes

| Síntoma | Causa Probable | Solución |
|---|---|---|
| El lector no escribe en la pantalla | El cable USB está suelto o el dongle inalámbrico desconectado. | Reconecta el receptor USB y haz clic dentro del campo de texto. |
| La impresora Zebra no saca la etiqueta | Tapa mal cerrada o cinta Ribbon agotada. | Abre la tapa de la Zebra, verifica que el rollo esté alineado y ciérrala hasta escuchar el clic doble. |
| El escáner lee pero no abre la ficha | Falta el sufijo "Enter" en el escáner. | Escanea el código de barras de configuración *"Suffix CR/Enter"* provisto en el manual del escáner. |
| No puedo ver la gestión de usuarios o cambio de rol | Eres Operario de Planta. | Por políticas de seguridad de la empresa, las cuentas operario no tienen acceso a roles ni contraseñas. Si necesitas permisos de Calidad o Gerencia, solicita el inicio de sesión a un supervisor. |
