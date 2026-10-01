---
title: "13 - Decisiones y preguntas abiertas"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-10-01
version: "1.0.6"
tags:
  - olivicola-lujan
  - decisiones
  - arquitectura
---

# 13 - Decisiones y preguntas abiertas

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Registro Histórico de Decisiones Acordadas

A lo largo del proyecto, se consensuaron las siguientes definiciones estratégicas y arquitectónicas con el usuario y la dirección de la empresa:

| Decisión Clave | Contexto y Justificación | Estado |
|---|---|---|
| **Aplicación de Escritorio Nativa (Electron)** | La empresa requería un software que operara en las computadoras de planta sin depender de navegadores externos ni servidores en la nube. La web funciona únicamente como portal de descarga de instaladores. | ✅ Implementado (.exe / .dmg) |
| **Arquitectura de Red LAN (Host / Cliente)** | Se descartó depender de bases de datos externas en la nube para garantizar operación continua aún sin internet. La PC de Balanza actúa como Servidor Host (puerto 4000) y las demás terminales se conectan como clientes. | ✅ Implementado |
| **Catálogo Oficial del Excel de Gerencia** | Se reemplazaron todos los datos genéricos por los productos, presentaciones, variedades, calibres y calidades exactas del generador oficial de Olivícola Luján. | ✅ Implementado |
| **Código Compacto para CODE 128** | La densidad de barras en etiquetas de 50 mm provocaba lecturas lentas si se incluían guiones y barras. Se adoptó el formato compacto oficial (`ENTVDEALOR121140PRI`) que garantiza lectura inmediata. | ✅ Implementado |
| **Hardware Oficial: Zebra GC420t y HPRT N130BT** | Se calibró el software para los modelos físicos reales de la fábrica: etiquetas 100x50 mm apaisadas con soporte ZPL II nativo y escáner en modo memoria batch para inventario de sectores. | ✅ Implementado |
| **Aislamiento Total de Operarios (v1.0.6)** | Tras pruebas operativas, se observó que los operarios no debían ver ni poder interactuar con cambio de roles, blanqueo de contraseñas ni gestión de personal. Se ocultaron 100% esas secciones del DOM para perfiles operario. | ✅ Implementado |

---

## Preguntas Previamente Abiertas y su Resolución Definitiva

1. **¿Quién administrará las cuentas y los accesos en el sistema?**  
   *Resolución:* El Gerente General o Administrador designado, protegido mediante su propia contraseña y una Clave Maestra de Autorización.
2. **¿Cuántas personas y computadoras registrarán datos simultáneamente?**  
   *Resolución:* Múltiples computadoras conectadas por red privada LAN mediante la arquitectura Servidor Host (Balanza de Entrada) y Terminales Clientes (Naves, Calidad, Gerencia).
3. **¿Qué formato de etiqueta se utiliza físicamente en fábrica?**  
   *Resolución:* Etiqueta térmica adhesiva apaisada de 100 mm de ancho por 50 mm de alto, con código descriptivo arriba, OLIVÍCOLA LUJÁN centrado, CODE 128 e identificador visible de tambor (`Tambor T000001`).
4. **¿Cómo se realiza el recuento de tambores en los patios de estiba?**  
   *Resolución:* Mediante el lector HPRT N130BT en modo memoria (Batch). El operario escanea el sector y la fila de tambores, y al volver a la terminal descarga toda la ráfaga automáticamente.
5. **¿Qué ocurre si un operario cambia de turno?**  
   *Resolución:* Cierra la sesión en un clic con el botón de desconexión del menú lateral y el siguiente operario ingresa su legajo y contraseña.

---

## Preguntas Operativas Menores para la Puesta en Marcha

1. **Dirección IP de la PC de Balanza:** Definir junto al técnico de planta qué IP estática local se asignará a la computadora principal (ej. `192.168.1.50`).
2. **Ubicaciones de señalización física:** Imprimir las etiquetas de sector para pegar en los postes de cada nave y patio de fermentación antes del primer inventario masivo.
