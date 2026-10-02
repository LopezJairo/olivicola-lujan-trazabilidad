---
title: "00 - Índice general"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - trazabilidad
  - industrial
  - electron
---

# 00 - Índice general

Base de conocimiento oficial del **Sistema de Trazabilidad Industrial de Tambores de OLIVÍCOLA LUJÁN**. Su objetivo primordial es garantizar la trazabilidad integral de planta reduciendo al mínimo la fricción tecnológica para operarios, y proporcionando a Calidad y Gerencia herramientas robustas de auditoría, control de red y gestión de personal.

> [!tip] Estado del Sistema al 1 de Octubre de 2026 (Versión 1.0.6 Estable)
> La aplicación está completamente implementada, probada y empaquetada como software ejecutable nativo de escritorio para **Windows (.exe)** y **macOS (.dmg / .zip)** con Electron 33. Dispone de backend embebido Express + SQLite para red local (LAN Host/Cliente), soporte nativo de hardware industrial (**Zebra GC420t** y **HPRT N130BT**), catálogo oficial del Excel de Gerencia y seguridad operacional por perfiles con ocultamiento estricto de roles administrativos para operarios.
>
> 🌐 **Portal Oficial de Descargas:** [https://portal-topaz-five-74.vercel.app](https://portal-topaz-five-74.vercel.app) (espejo: [portal-lopezjairos-projects.vercel.app](https://portal-lopezjairos-projects.vercel.app))  
> 📦 **Repositorio y Releases:** [https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/tag/v1.0.6](https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/tag/v1.0.6)

---

## Guía de Navegación por Perfil y Tarea

- **Comprensión y Alcance:** [[Olivícola Luján/01 - Visión y alcance del MVP|01 - Visión y alcance del MVP]] y [[Olivícola Luján/02 - Personas y experiencia de uso|02 - Personas y experiencia de uso]].
- **Operación en Planta:** [[Olivícola Luján/04 - Manual del operario|04 - Manual del operario]] y [[Olivícola Luján/08 - Identificación y etiquetas|08 - Identificación y etiquetas]].
- **Control de Calidad y Procesos:** [[Olivícola Luján/03 - Flujos y reglas del negocio|03 - Flujos y reglas del negocio]] y [[Olivícola Luján/07 - Modelo de datos y catálogos|07 - Modelo de datos y catálogos]].
- **Gerencia y Administración:** [[Olivícola Luján/05 - Manual de administración|05 - Manual de administración]], [[Olivícola Luján/09 - Instalación y puesta en marcha|09 - Instalación y puesta en marcha]] y [[Olivícola Luján/15 - Manual de uso y funcionalidades para gerencia|15 - Manual de uso y funcionalidades para gerencia]].
- **Desarrollo y Arquitectura:** [[Olivícola Luján/06 - Arquitectura y mapa del código|06 - Arquitectura y mapa del código]] y [[Olivícola Luján/10 - Estado actual y validación|10 - Estado actual y validación]].
- **Hoja de Ruta y Decisiones:** [[Olivícola Luján/11 - Riesgos y condiciones del piloto|11 - Riesgos y condiciones del piloto]], [[Olivícola Luján/12 - Pendientes y hoja de ruta|12 - Pendientes y hoja de ruta]] y [[Olivícola Luján/13 - Decisiones y preguntas abiertas|13 - Decisiones y preguntas abiertas]].
- **Terminología y Referencias:** [[Olivícola Luján/14 - Glosario y mantenimiento|14 - Glosario y mantenimiento]] y [[Olivícola Luján/99 - Especificación original|99 - Especificación original]].

---

## Estructura Completa de la Bóveda

| Documento | Resumen del Contenido |
|---|---|
| [[Olivícola Luján/01 - Visión y alcance del MVP|01 - Visión y alcance del MVP]] | Propósito, necesidades industriales, arquitectura de escritorio y límites del sistema. |
| [[Olivícola Luján/02 - Personas y experiencia de uso|02 - Personas y experiencia de uso]] | Perfiles de Operario, Calidad y Gerente; principios de baja fricción y seguridad. |
| [[Olivícola Luján/03 - Flujos y reglas del negocio|03 - Flujos y reglas del negocio]] | Registro y pesaje, código compacto CODE 128, inventario por sectores y liberación de lotes. |
| [[Olivícola Luján/04 - Manual del operario|04 - Manual del operario]] | Guía práctica de pesaje, escáner HPRT N130BT, toma por sectores e impresión térmica. |
| [[Olivícola Luján/05 - Manual de administración|05 - Manual de administración]] | Gestión de personal, clave maestra, configuración de red Host/Cliente, catálogos y backups. |
| [[Olivícola Luján/06 - Arquitectura y mapa del código|06 - Arquitectura y mapa del código]] | Stack Electron + React + Express + SQLite, mapa de componentes, rutas y tests. |
| [[Olivícola Luján/07 - Modelo de datos y catálogos|07 - Modelo de datos y catálogos]] | Catálogos oficiales del Excel (Productos, Variedades, Calibres), pesos sugeridos y entidades. |
| [[Olivícola Luján/08 - Identificación y etiquetas|08 - Identificación y etiquetas]] | Impresora Zebra GC420t (ZPL II y 100x50 mm), escáner HPRT N130BT y código CODE 128. |
| [[Olivícola Luján/09 - Instalación y puesta en marcha|09 - Instalación y puesta en marcha]] | Instalación de ejecutables Windows/Mac, configuración LAN, puertos y Firewall. |
| [[Olivícola Luján/10 - Estado actual y validación|10 - Estado actual y validación]] | Reporte de 94 pruebas Vitest aprobadas, builds verificados y despliegues en producción. |
| [[Olivícola Luján/11 - Riesgos y condiciones del piloto|11 - Riesgos y condiciones del piloto]] | Mitigaciones técnicas implementadas, seguridad de red y plan de contingencia. |
| [[Olivícola Luján/12 - Pendientes y hoja de ruta|12 - Pendientes y hoja de ruta]] | Registro de funcionalidades completadas y roadmap de despliegue en fábrica. |
| [[Olivícola Luján/13 - Decisiones y preguntas abiertas|13 - Decisiones y preguntas abiertas]] | Resoluciones acordadas con la dirección (hardware, catálogos, red y roles). |
| [[Olivícola Luján/14 - Glosario y mantenimiento|14 - Glosario y mantenimiento]] | Glosario de términos industriales/técnicos y pautas de actualización documental. |
| [[Olivícola Luján/15 - Manual de uso y funcionalidades para gerencia|15 - Manual de uso y funcionalidades para gerencia]] | Guía de uso de pantallas, KPIs de productividad, hardware y certificación de autoría de Jairo López. |
| [[Olivícola Luján/99 - Especificación original|99 - Especificación original]] | Requerimiento histórico original preservado como línea de base. |

---

## Ubicaciones y Enlaces Clave

- **Código Fuente:** `/Users/jairolopez/Library/CloudStorage/OneDrive-Personal/OlivicolaLujanTrazabilidad`
- **Bóveda de Obsidian:** `/Users/jairolopez/Desktop/Claude by Jairo/Claude by Jairo/Olivícola Luján` y sincronizado en `docs/obsidian/`.
- **Portal de Descargas en Vercel:** [https://portal-topaz-five-74.vercel.app](https://portal-topaz-five-74.vercel.app)
- **GitHub Release Activa:** [v1.0.6 en GitHub](https://github.com/LopezJairo/olivicola-lujan-trazabilidad/releases/tag/v1.0.6)
