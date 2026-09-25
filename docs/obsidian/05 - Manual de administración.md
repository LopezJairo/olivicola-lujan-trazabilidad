---
title: "05 - Manual de administración"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 05 - Manual de administración

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Configurar antes del piloto

Acordar con la empresa los nombres y códigos reales de producto, presentación, variedad, calibre, calidad, ubicación, estado y tipo de movimiento. Los ejemplos precargados no constituyen un catálogo aprobado por la empresa.

## Crear una opción de catálogo

1. Abrir **Configuración**.
2. Elegir el tipo de catálogo.
3. Presionar **Agregar opción**.
4. Completar nombre, código y orden.
5. Dejar activa la opción si debe usarse en nuevas cargas.
6. Guardar y comprobar su aparición en el formulario.

El código se convierte a mayúsculas. Se admiten letras latinas sin acento, números, `/` y guiones internos. El sistema rechaza códigos repetidos dentro de un mismo tipo según los datos cargados.

## Editar o desactivar

Desactivar una opción la retira de nuevas selecciones sin borrar las referencias existentes. Cambiar nombres modifica cómo se presentan referencias antiguas. Cambiar códigos afecta la construcción de códigos de nuevos tambores o tambores que vuelvan a guardarse. Para preservar una interpretación histórica estable, conviene crear una nueva opción y desactivar la anterior cuando cambia el significado.

## Control de inventario

Usar búsqueda y filtros para revisar registros y sumar kilos. Comparar los resultados con un recuento físico de una muestra acordada. Los totales reflejan registros del sistema; no hay conexión a balanza ni conciliación física automática.

## Revisión de eventos

Consultar Historial por número de tambor, fecha y descripción. Verificar movimientos contra ubicación actual. La atribución del actor proviene del usuario activo en la sesión.

## Respaldo y uso de datos reales

El sistema dispone de funciones de exportación e importación de copias de seguridad completas en formato JSON desde la pantalla de Configuración. Asimismo, permite alternar entre el Espacio de Demostración (con 12 tambores de prueba) y el Espacio Empresa (espacio limpio listo para producción), evitando mezclar datos de práctica con registros reales.

Relacionado: [[Olivícola Luján/07 - Modelo de datos y catálogos|07 - Modelo de datos y catálogos]], [[Olivícola Luján/11 - Riesgos y condiciones del piloto|11 - Riesgos y condiciones del piloto]], [[Olivícola Luján/12 - Pendientes y hoja de ruta|12 - Pendientes y hoja de ruta]].
