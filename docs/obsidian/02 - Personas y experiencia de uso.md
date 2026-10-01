---
title: "02 - Personas y experiencia de uso"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - perfiles
  - ux
---

# 02 - Personas y experiencia de uso

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Matriz de Perfiles y Jerarquía de Accesos

El sistema implementa una estricta separación de responsabilidades y permisos adaptada a la dinámica industrial de Olivícola Luján:

| Perfil | Responsabilidades | Nivel Tecnológico | Interfaz y Accesibilidad |
|---|---|---|---|
| **Operador de Planta** | Pesaje de tambores en balanza, escaneo rápido continuo con HPRT N130BT, toma de inventario físico por sectores, impresión térmica Zebra GC420t. | Mínimo. No debe lidiar con conceptos informáticos ni configuraciones. | **Modo Operario Protegido:** Interfaz limpia con atajos directos (1 al 7). Las secciones de *Jerarquía de Perfiles*, *Cambio de Roles* y *Gestión de Personal* están **100% ocultas**. No puede modificar contraseñas ni permisos. |
| **Responsable de Calidad** | Autorización y liberación de lotes, muestreos fisicoquímicos de salmuera (pH, salinidad %, acidez, defectos), retención de lotes observados, auditoría de fermentación. | Medio. Enfocado en parámetros de proceso e inocuidad alimentaria. | Acceso al módulo de Control de Calidad (`/calidad`), visualización técnica de fichas de tambor y trazabilidad de lotes. |
| **Gerente / Administrador** | Auditoría operativa en tiempo real, gestión de catálogos oficiales del Excel, copias de seguridad de base de datos, configuración de red LAN (Servidor Host vs Terminales), alta de personal y asignación de rangos. | Avanzado. Supervisión general y toma de decisiones comerciales y técnicas. | Control total del sistema. Visualización y administración de cuentas de usuario, tabla de personal, configuración de red y clave maestra de seguridad. |

---

## Principios de Diseño Industrial y Baja Fricción

1. **Prioridad al Teclado Numérico y Lectores Ópticos:**
   - La pantalla de escaneo (`/escanear`) mantiene foco automático constante sobre el campo de lectura.
   - Atajos numéricos directos disponibles desde cualquier pantalla:
     - `1`: Inicio / Resumen de Planta
     - `2`: Escanear Tambor
     - `3`: Inventario de Tambores
     - `4`: Registrar Nuevo Tambor / Pesaje
     - `5`: Control de Calidad
     - `6`: Historial y Auditoría
     - `7`: Configuración del Sistema
     - `Cmd + L` / `Ctrl + L`: Consola de Diagnóstico y Logs en vivo
2. **Eliminación de la Memorización de Códigos:**
   - El operario solo selecciona nombres claros en listas desplegables (ej. *"Arauco"*, *"Entera"*, *"Verde"*); el software compila en milisegundos los códigos alfanuméricos estandarizados (`ARA`, `ENT`, `VDE`).
3. **Pesos Predeterminados:**
   - Al seleccionar el tipo de producto en el formulario de alta, el sistema precarga el peso sugerido oficial de planta (ej. Descarozada: 140 kg; Entera: 180 kg; Rellenas: 160 kg), permitiendo al operador confirmar o ajustar el pesaje de balanza con solo presionar Enter.
4. **Protección Contra Errores Operativos Involuntarios:**
   - Para eliminar un tambor se requiere escribir explícitamente su código visible (`T000001`), evitando pulsaciones accidentales.
   - La eliminación mantiene un registro de baja lógica auditable en el Historial para prevenir la pérdida de trazabilidad.

---

## Autenticación y Control de Sesión

- Cada miembro del personal cuenta con un número de **Legajo** único (ej. `OP-01`, `OP-02`, `CAL-01`, `ADM-01`) y una contraseña personal.
- La sesión permanece activa en el equipo durante el turno de trabajo y se muestra claramente en el encabezado y en el pie de la barra lateral con el nombre y cargo del operador.
- Al cerrar el turno, el operador puede presionar el botón de desconexión en la esquina inferior izquierda para permitir el ingreso del siguiente turno.
