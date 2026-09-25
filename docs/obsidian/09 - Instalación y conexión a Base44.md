---
title: "09 - Instalación y conexión a Base44"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 09 - Instalación y conexión a Base44

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Ejecución local

Desde una terminal:

```bash
cd /Users/jairolopez/Documents/ChatGPT/SoftwareTrazabilidad
npm ci
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

## Modo actual: demo

Sin `VITE_BASE44_APP_ID`, el SDK no se inicializa, se usa un usuario local de ejemplo y se cargan 12 tambores de demostración con catálogos iniciales. Los datos se guardan bajo `olivicola-lujan-demo-v1` en localStorage.

Cambiar de navegador, perfil, equipo, host o puerto puede cambiar el almacenamiento disponible. No hay sincronización ni migración automática a Base44. No debe borrarse el almacenamiento de una sesión con datos valiosos sin una copia válida.

## Conectar Base44: trabajo pendiente

1. Obtener la aplicación y App ID de la empresa.
2. Crear/configurar las cuatro entidades a partir de `base44/entities/` siguiendo el flujo real de la plataforma.
3. Configurar autenticación, usuarios y políticas de acceso en Base44.
4. Resolver unicidad de IDs, consistencia e inmutabilidad del historial en el backend.
5. Crear `.env` usando `.env.example` como referencia:

```dotenv
VITE_BASE44_APP_ID=ID_DE_LA_APLICACION
```

6. Reiniciar Vite para desarrollo o recompilar para publicación.
7. Cargar los catálogos reales: el cambio de modo no copia los ejemplos.
8. Probar autenticación y operaciones con datos de prueba en el entorno conectado.

El App ID es configuración pública del frontend. No poner secretos, contraseñas o tokens de servicio en variables `VITE_*` ni en estas notas.

## Autenticación implementada

`AuthProvider` consulta `base44.auth.me()`. `ProtectedRoute` redirige a `/login` si no hay sesión. Las rutas de login, registro y recuperación comparten una pantalla que deriva al acceso gestionado por Base44. No existen formularios nativos independientes ni pruebas reales del ciclo de recuperación en este proyecto.

## Referencia técnica

La inicialización con `createClient({ appId })` y el uso de `base44.entities` siguen la [documentación oficial del cliente Base44](https://docs.base44.com/sdk-getting-started/client). La disponibilidad de un SDK no confirma que la aplicación, sus permisos o su conexión ya estén desplegados.

Relacionado: [[Olivícola Luján/06 - Arquitectura y mapa del código|06 - Arquitectura y mapa del código]], [[Olivícola Luján/11 - Riesgos y condiciones del piloto|11 - Riesgos y condiciones del piloto]], [[Olivícola Luján/12 - Pendientes y hoja de ruta|12 - Pendientes y hoja de ruta]].
