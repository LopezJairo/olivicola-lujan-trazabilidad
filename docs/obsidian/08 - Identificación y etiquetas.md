---
title: "08 - Identificación y etiquetas"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - etiquetas
  - zebra
  - hprt
  - code128
---

# 08 - Identificación y etiquetas

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Sistema de Identificación de Tambores

Cada tambor cuenta con tres niveles de representación codificada:

```text
1. CÓDIGO DESCRIPTIVO:
   ENT-VDE-ALOR-121/140-PRI
   (Permite al personal leer a simple vista: Entera, Verde, Aloreña, 121/140, Primera)

2. CÓDIGO COMPACTO (BASE CODE 128):
   ENTVDEALOR121140PRI
   (Optimizado sin caracteres especiales para máxima legibilidad óptica)

3. CÓDIGO COMPLETO CON IDENTIFICADOR ÚNICO:
   ENT-VDE-ALOR-121/140-PRI-T000001
   (Valor final encoded en el código de barras y clave única de trazabilidad)
```

---

## Formato Físico de Etiqueta Térmica

La etiqueta física está diseñada y calibrada en base al formato estándar de fábrica:
- **Dimensiones:** **100 mm de ancho × 50 mm de alto** (orientación horizontal apaisada).
- **Esquinas:** Redondeadas estándar con sensor de espacio (Gap) para salto exacto de etiqueta.
- **Distribución Visual:**
  - **Margen Superior:** Código descriptivo en tipografía grotesca bold de alta legibilidad (`ENT-VDE-ALOR-121/140-PRI`).
  - **Subtítulo:** Identificador de marca `OLIVÍCOLA LUJÁN` centrado.
  - **Cuerpo Central:** Código de barras **CODE 128** de alto contraste (altura mínima 22 mm) libre de distorsiones.
  - **Margen Inferior:** Código completo alfanumérico e identificación visible de tambor (`Tambor T000001`).

---

## Integración con Impresora Industrial Zebra GC420t

La impresora oficial de planta es la **Zebra GC420t** (resolución nativa de 203 dpi / 8 dots por mm).

El software ofrece dos mecanismos de impresión directa calibrados a sangre:

### 1. Impresión Directa Web / Driver del Sistema
- Mediante estilos CSS dedicados `@media print` y reglas `@page { size: 100mm 50mm; margin: 0; }`.
- No requiere instalar complementos complejos de navegador: se envía directamente al spooler de impresión de Windows o macOS a escala 100% sin generar desfasajes de papel ni expulsar etiquetas en blanco.

### 2. Generación y Exportación Nativa ZPL II
Para puestos que imprimen por puerto RAW, red directa o a través de *Zebra Setup Utilities / Zebra Browser Print*, el sistema genera código de comandos ZPL II nativo:

```zpl
^XA
^PW800
^LL400
^PON
^FO40,25^A0N,32,32^FDENT-VDE-ALOR-121/140-PRI^FS
^FO40,65^A0N,20,20^FDOLIVICOLA LUJAN^FS
^FO40,100^BY3,3,130^BCN,130,Y,N,N^FDENT-VDE-ALOR-121/140-PRI-T000001^FS
^FO40,285^A0N,28,28^FDTambor T000001^FS
^XZ
```

- Ancho en dots: `800` dots (100 mm).
- Alto en dots: `400` dots (50 mm).
- Desde la pantalla `/etiquetas`, el usuario puede copiar el comando ZPL al portapapeles o descargar el archivo `.zpl` individual o por lote.

---

## Integración con Escáner Inalámbrico HPRT N130BT

El lector de códigos de barras oficial de planta es el **HPRT N130BT** (conectividad inalámbrica 2.4G / Bluetooth / USB HID).

### Modos de Operación Compatibles:
1. **Modo Directo (Real-Time Mode):**
   - El escáner emula un teclado enviando el código leído inmediatamente seguido del sufijo `Enter` (`CR/LF`).
   - Utilizado en la Balanza de Entrada (`/escanear`) para búsqueda y consulta instantánea de tambores.
2. **Modo Almacenamiento Masivo (Batch / Storage Mode):**
   - El operario camina por los patios y naves sin cable y sin cobertura inalámbrica.
   - El lector almacena hasta 50.000 códigos en su memoria interna.
   - Flujo de volcado:
     1. Se escanea el código del sector (ej. `NAV-A1`).
     2. Se escanean todos los tambores de la fila.
     3. Al volver a la PC, se escanea el código de barras de configuración *"Upload Data"*.
     4. La pantalla `/inventario/toma` del software procesa la ráfaga a alta velocidad sin pérdida de caracteres, agrupando y deduplicando existencias en un solo paso.

---

## Códigos de Barra para Señalización de Sectores

El sistema permite imprimir desde `/configuracion` las etiquetas térmicas de los sectores físicos de planta para pegarlos en las columnas, paredes y postes de estiba:
- Formato: 100 mm × 50 mm.
- Contenido: Nombre claro del sector (ej. *Nave A - Fila 1*), código alfanumérico (`NAV-A1`) y código de barras CODE 128 correspondiente.
