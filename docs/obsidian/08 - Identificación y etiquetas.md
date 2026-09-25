---
title: "08 - Identificación y etiquetas"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 08 - Identificación y etiquetas

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Tres identificadores distintos

- `id`: identificador técnico utilizado por las rutas y el SDK.
- `tambor_id`: número visible y estable durante la vida del registro, por ejemplo `T000001`.
- `codigo`: identificación completa que incluye características del producto y número visible.

## Numeración

`nextTamborId` toma el mayor número encontrado en tambores e historial, suma uno y completa a seis dígitos como mínimo. Los registros eliminados no liberan números mientras sus eventos se conserven. La función admite más de seis dígitos al superar `T999999`.

La secuencia calculada en el cliente no es segura frente a altas simultáneas desde computadoras distintas. Está pendiente una asignación central y una garantía de unicidad.

## Código descriptivo

```text
producto_codigo-presentacion_codigo-variedad_codigo-calibre_codigo-calidad_codigo
ENT-VDE-ALOR-161/200-PRI
```

El ejemplo procede del objetivo original. La implementación obtiene también el calibre desde su código en Catalogo, por lo que se debe configurar como `161/200` si se quiere ese resultado.

## Código completo

```text
ENT-VDE-ALOR-161/200-PRI-T000001
```

Se genera un código de barras **CODE 128** desde esta cadena. El lector debe poder leer la cadena íntegra y enviar Enter.

## Contenido y papel

La etiqueta incluye código descriptivo, marca OLIVÍCOLA LUJÁN, barras, código completo y «Tambor T000001». Las pantallas utilizan **50 mm de ancho × 100 mm de alto** por defecto, equivalente a 5 × 10 cm. Cada etiqueta solicita una hoja independiente mediante CSS de impresión.

La impresión múltiple abre directamente el documento y el diálogo del navegador; no incorpora una pantalla propia de vista previa. La ficha sí permite visualizar una etiqueta individual. El diálogo o vista previa del navegador depende del equipo y no puede omitirse de forma universal desde una página web.

## Procedimiento de prueba física pendiente

1. Confirmar modelo de impresora, consumible, orientación y resolución.
2. Elegir el tamaño exacto del papel y escala 100 %.
3. Imprimir un código corto y uno con la mayor longitud esperada.
4. Verificar márgenes, cortes y que no haya texto fuera del papel.
5. Escanear ambos con el lector real y comprobar la ficha abierta.
6. Evaluar fijación de la etiqueta y resistencia al entorno de planta.

No se imprimieron etiquetas físicas ni se verificó lectura con hardware. Los códigos largos reducidos a 50 mm pueden requerir otro ancho, orientación o contenido; no se ha medido su legibilidad.

## Cuando cambia el producto

Guardar cambios de producto, presentación, variedad, calibre o calidad reconstruye el código completo. El escáner actual busca únicamente el código vigente o el número del tambor; no mantiene alias de códigos anteriores. Si una etiqueta vieja deja de resolver, buscar por `tambor_id` y coordinar su reimpresión.
