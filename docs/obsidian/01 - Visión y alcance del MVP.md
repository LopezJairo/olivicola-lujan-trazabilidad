---
title: "01 - Visión y alcance del MVP"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 01 - Visión y alcance del MVP

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Objetivo

Crear un MVP para una empresa olivícola que permita identificar cada tambor, consultar su contenido y ubicación y conservar el registro de los cambios. La empresa debe poder cargar sus propios datos; los ejemplos sirven para probar la experiencia.

## Problema que se busca resolver

Encontrar y actualizar un tambor sin depender de la memoria de una persona. Reducir errores de escritura mediante catálogos y lectura de códigos. Poder reconstruir qué cambió, cuándo y sobre qué tambor.

## Alcance funcional solicitado

- Registro y edición de tambores con producto, presentación, variedad, calibre, calidad, lote, fechas, peso, ubicación, estado y observaciones.
- Identificación secuencial y códigos descriptivos, completos y de barras.
- Escaneo mediante lector USB que funciona como teclado.
- Inventario con búsqueda, filtros, cantidad de tambores y suma de kilogramos.
- Movimientos de ubicación y eventos de historial.
- Historial global y por tambor, conservado tras una eliminación.
- Catálogos administrables sin opciones fijas en los formularios.
- Etiquetas individuales y por selección, con medidas configurables.
- Control de acceso de usuarios y rutas protegidas.
- Ayuda dentro de la aplicación.

## Qué significa MVP en este proyecto

Validar el circuito **registrar → etiquetar → escanear → mover → consultar historial** con usuarios de la empresa. No se ha confirmado volumen de tambores, cantidad de puestos simultáneos ni equipamiento. La sencillez del alcance no elimina la necesidad de conservar correctamente los datos reales.

## Fuera del alcance confirmado

No se solicitaron facturación, contabilidad, compras, integración con balanzas, lectura por cámara, funcionamiento offline sincronizado, gestión de varias empresas, API pública ni integración con un ERP. No existen integraciones con servicios externos de terceros.

## Criterio propuesto de éxito

El operario puede completar el circuito básico con una guía breve, distinguir un guardado exitoso de un error y encontrar un tambor sin asistencia. La administración puede conciliar cantidades y kilos y revisar el historial. Los tiempos objetivo y el tamaño del piloto deben acordarse con la empresa; no hay métricas de uso medidas todavía.

Relacionado: [[Olivícola Luján/02 - Personas y experiencia de uso|02 - Personas y experiencia de uso]], [[Olivícola Luján/10 - Estado actual y validación|10 - Estado actual y validación]], [[Olivícola Luján/12 - Pendientes y hoja de ruta|12 - Pendientes y hoja de ruta]].
