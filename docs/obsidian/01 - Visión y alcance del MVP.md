---
title: "01 - Visión y alcance del MVP"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - vision
  - alcance
---

# 01 - Visión y alcance del MVP

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Problema que resuelve

En la planta de **Olivícola Luján**, el manejo físico de tambores de aceitunas (variedades Aloreña, Arauco, Manzanilla, Picual, Empeltre; calibres desde 80/120 hasta 321/450; presentaciones entera, descarozada, rodajas, griegas, rellenas y rotas) requiere un control riguroso de trazabilidad sin entorpecer el ritmo de trabajo de los operarios en los sectores de pesado, calibrado, fermentación y estiba.

Los operarios de planta suelen contar con conocimientos tecnológicos mínimos. Por lo tanto, el software no debe requerir configuraciones complejas, menús confusos ni decisiones informáticas. El sistema proporciona una interfaz limpia, veloz y directa basada en atajos y lectores ópticos, mientras que las tareas complejas de auditoría, gestión de catálogos y administración de usuarios quedan reservadas a los puestos de Gerencia y Calidad.

## Forma del producto: Aplicación de Escritorio Nativa

> [!important] Definición Arquitectónica
> La solución es una **aplicación de escritorio ejecutable nativa (Electron)** para Windows (`.exe`) y macOS (`.dmg`), no una aplicación web de uso general. El portal web público existe única y exclusivamente como punto centralizado de descarga y actualización de las versiones de los ejecutables.

El sistema opera en la red local de la empresa (LAN) conectando múltiples puestos:
1. **Modo Servidor Host:** Ejecutado en la computadora principal (ej. Balanza de Entrada), gestiona la base de datos SQLite y sirve la API local en el puerto 4000.
2. **Modo Terminal Cliente:** Ejecutado en los demás puestos (Balanza Secundaria, Nave A, Laboratorio de Calidad, Gerencia), conectándose por IP a la PC Host con sincronización reactiva en tiempo real.
3. **Modo Autónomo / Offline:** Permite trabajar de manera local e ininterrumpida ante eventuales caídas de red LAN.

## Alcance Implementado

1. **Gestión de Tambores y Pesaje:**
   - Alta de tambores con cálculo automático de número visible (`T000001` en adelante).
   - Generación automática de **Código Descriptivo** (`ENT-VDE-ALOR-121/140-PRI`), **Código Compacto** (`ENTVDEALOR121140PRI`) y **Código Completo con Tambor ID** (`ENT-VDE-ALOR-121/140-PRI-T000001`).
   - Pesos netos sugeridos por tipo de producto (Descarozada 140 kg, Entera/Griega 180 kg, Rodajas/Rellenas/Rotas 160 kg) para agilizar la carga.
   - Edición de información con trazabilidad de cambios en el historial.
2. **Identificación y Hardware Oficial de Planta:**
   - Compatibilidad nativa con la impresora térmica **Zebra GC420t** (etiqueta apaisada 100 mm × 50 mm, ZPL II y CSS print a sangre).
   - Integración con el lector de códigos de barras inalámbrico **HPRT N130BT** (USB / 2.4G / Bluetooth, emulación de teclado con soporte para modo almacenamiento masivo).
3. **Toma de Inventario Físico por Sectores:**
   - Flujo optimizado para escanear el poste/columna del sector (ej. `NAV-A1`) y luego la ráfaga de tambores en memoria del escáner.
   - Deduplicación automática por `tambor_id`, recuento por tipo de producto y asignación instantánea de ubicación.
4. **Control de Calidad y Liberación de Lotes:**
   - Módulo exclusivo de Calidad para registro de análisis fisicoquímicos (pH, salinidad %, temperatura, acidez).
   - Estados de lote: En Fermentación, Observado / Retenido, Liberado para Despacho.
5. **Auditoría e Historial Inmutable:**
   - Registro cronológico detallado de creación, edición, movimiento, pesaje y eliminación por actor.
6. **Seguridad y Jerarquía de Usuarios (v1.0.6):**
   - 3 Perfiles definidos: **Operador de Planta**, **Responsable de Calidad** y **Gerente / Administrador**.
   - Acceso con Legajo y Contraseña.
   - **Aislamiento Estricto:** Para el personal con rol de Operario, las secciones de cambio de rol, jerarquía de permisos y gestión de personal quedan **100% ocultas e inaccesibles**.
   - Clave Maestra de Autorización para Gerencia requerida para otorgar permisos elevados.

## Criterios de Éxito Cumplidos

- Cero errores de ejecución en pruebas automatizadas (**94 tests pasando** en Vitest).
- Compilación limpia de ejecutables para Windows y macOS.
- Compatibilidad exacta con las planillas y catálogos oficiales provistos por la Gerencia General de Olivícola Luján.
- Reducción del tiempo de registro por tambor a menos de 5 segundos.
