---
title: "09 - Instalación y puesta en marcha"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-25
tags:
  - olivicola-lujan
  - mvp
---

# 09 - Instalación y puesta en marcha

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Ejecución local

Desde una terminal:

```bash
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```

Abrir [http://127.0.0.1:5173](http://127.0.0.1:5173). Es una dirección local, no un enlace público para la empresa. Se verificó la compilación usando Node 25.1.0 y npm 11.6.2 en este equipo; falta fijar una versión de Node de soporte estable para el despliegue.

## Comandos del proyecto

```bash
npm test
npm run build
npm run preview -- --host 127.0.0.1
```

El servidor informa el puerto real usado por preview. La salida de compilación está en `dist/`. Los enlaces a rutas internas requieren que el hosting de una SPA redirija las rutas de la app a `index.html`.

## Modo de almacenamiento local

La aplicación opera con persistencia local mediante `localStorage` estructurada a través de la capa de repositorio. Permite alternar entre dos espacios de trabajo:
- **Modo Demostración:** 12 tambores de prueba precargados con catálogos, historial y movimientos para evaluación del circuito.
- **Espacio Empresa:** Espacio limpio para carga directa de lotes e información operativa real.

Además, el sistema incluye funciones de exportación e importación de copias de seguridad completas en formato JSON desde la pantalla de Configuración.

## Autenticación implementada

`AuthProvider` gestiona la sesión local del usuario y permite alternar entre roles operativos (`Operario` y `Administrador`). `ProtectedRoute` protege las pantallas operativas y redirige a `/login` si no existe una sesión activa.

Relacionado: [[Olivícola Luján/06 - Arquitectura y mapa del código|06 - Arquitectura y mapa del código]], [[Olivícola Luján/11 - Riesgos y condiciones del piloto|11 - Riesgos y condiciones del piloto]], [[Olivícola Luján/12 - Pendientes y hoja de ruta|12 - Pendientes y hoja de ruta]].
