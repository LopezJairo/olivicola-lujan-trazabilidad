---
title: "02 - Personas y experiencia de uso"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 02 - Personas y experiencia de uso

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Usuarios

| Persona | Necesidad principal | Experiencia tecnológica |
|---|---|---|
| Operario | Identificar, registrar y mover tambores sin dudas. | Muy baja, según el requerimiento. |
| Gerente o administrador | Revisar inventario, corregir datos y administrar catálogos. | Mayor conocimiento de la operación. |

Los roles son una intención del producto. La interfaz actual muestra un rol, pero no impone una separación de permisos por función. Ver [[Olivícola Luján/11 - Riesgos y condiciones del piloto|11 - Riesgos y condiciones del piloto]].

## Principios de uso

1. Mostrar acciones concretas: «Escanear un tambor», «Registrar tambor», «Guardar movimiento».
2. Dar prioridad al escáner y al alta desde el inicio.
3. Elegir valores mediante listas; no pedir que se memoricen códigos.
4. Generar automáticamente número y código de barras.
5. Mantener visible el número del tambor en su ficha.
6. Informar si una operación se guardó o falló.
7. Conservar el contexto y explicar cómo recuperarse de un error.
8. Pedir confirmación explícita antes de eliminar.

## Implementación actual

El inicio tiene accesos destacados al escáner y al registro. El formulario está dividido entre características del producto y datos de ingreso. El escáner recibe foco automático. Se usan mensajes de resultado, estados de carga y botones deshabilitados durante una operación. Los modales se basan en Radix y las pantallas tienen reglas de adaptación a móvil.

## Validación pendiente con operarios

- Lectura de textos y códigos a la distancia real de trabajo.
- Tamaño de controles con guantes o pantallas táctiles, si se usan.
- Contraste en iluminación de planta.
- Comprensión de términos como presentación, calibre y estado.
- Navegación sin mouse mediante teclado y lector.
- Recuperación después de escanear un código desconocido.
- Conveniencia de una pantalla operativa con menos opciones visibles.

No se realizó una prueba de accesibilidad ni una observación de usuarios. La estética y el tamaño de texto deben validarse en el equipo real.

## Primer uso propuesto

Un responsable configura los catálogos, muestra un tambor de prueba y acompaña un alta y un movimiento. Luego observa a un operario repetir el circuito sin indicaciones y registra las dudas. Esta capacitación aún no se ejecutó.
