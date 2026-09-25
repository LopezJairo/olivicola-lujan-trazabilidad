---
title: "06 - Arquitectura y mapa del código"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 06 - Arquitectura y mapa del código

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Stack

| Capa | Tecnología | Uso |
|---|---|---|
| Interfaz | React 18, JSX y Vite ESM | Pantallas y compilación. |
| Estilos | Tailwind CSS y CSS propio | Tokens, mapeo de colores y diseño adaptable. |
| UI | Componentes de patrón shadcn con Radix, CVA y utilidades | Botón y diálogo en `src/components/ui/`. |
| Iconografía | lucide-react | Acciones y navegación. |
| Rutas | react-router-dom | Navegación y rutas protegidas. |
| Datos | TanStack React Query | Consulta, mutaciones e invalidación. |
| Etiquetas | jsbarcode | CODE 128 en SVG. |
| Plataforma | SDK de Base44 | Autenticación y entidades al configurar App ID. |
| Demo | localStorage y Web Locks cuando existe | Persistencia en un navegador. |

Las versiones solicitadas están en `package.json`; las resueltas se fijan en `package-lock.json`. El proyecto aún no dispone de un despliegue remoto verificado.

## Flujo de dependencias

```mermaid
flowchart TD
    UI[App y pantallas] --> Q[React Query]
    Q --> R[repository.js]
    R --> D[domain.js: validación y códigos]
    R --> L[Demo local: localStorage]
    R --> B[SDK Base44: entidades]
    A[AuthProvider] --> S[Sesión Base44 o identidad demo]
    A --> P[ProtectedRoute]
    P --> UI
```

## Mapa del código

| Archivo o carpeta | Responsabilidad |
|---|---|
| `src/main.jsx` | Montaje, router, QueryClient y límite de errores. |
| `src/App.jsx` | Layout, dashboard y pantallas de todas las rutas. |
| `src/components/Auth.jsx` | Sesión, protección de rutas y entrada a auth. |
| `src/components/Barcode.jsx` | SVG del código y generación del documento de impresión. |
| `src/components/ui/` | Botón y modal reutilizables. |
| `src/api/base44Client.js` | Selección demo/Base44 e inicialización del SDK. |
| `src/api/demo.js` | Ejemplos iniciales y almacenamiento local. |
| `src/api/repository.js` | Lectura de entidades y mutaciones locales/remotas. |
| `src/lib/domain.js` | Reglas, validación, diferencias y búsqueda. |
| `src/lib/utils.js` | Composición de clases CSS. |
| `src/index.css` | Tokens y estilos de escritorio/móvil. |
| `base44/entities/` | Cuatro esquemas JSON. |
| `tests/domain.test.js` | Ocho pruebas unitarias de dominio. |

## Rutas

| Ruta | Pantalla |
|---|---|
| `/` | Inicio y resumen. |
| `/escanear` | Lectura USB o manual. |
| `/inventario` | Listado, búsqueda y filtros. |
| `/historial` | Eventos globales. |
| `/configuracion` | Catálogos. |
| `/tambores/nuevo` | Alta. |
| `/tambores/:id` | Ficha; `id` es el identificador técnico. |
| `/tambores/:id/editar` | Edición. |
| `/tambores/:id/etiqueta` | Etiqueta individual. |
| `/etiquetas` | Selección e impresión múltiple. |
| `/ayuda` | Guía rápida. |
| `/login`, `/register`, `/forgot-password`, `/reset-password` | Entrada común al acceso gestionado por Base44. |

## Lectura y actualización

La consulta principal carga las cuatro entidades. La rama remota pagina la lectura de cada entidad en grupos de 500, pero acumula todos los resultados en el cliente; la interfaz no pagina el inventario. Tras una mutación exitosa se invalida la consulta principal. La caché considera frescos los datos durante 15 segundos; no hay suscripción en tiempo real.

El trabajo futuro debería dividir `App.jsx` por pantallas y agregar pruebas de integración sin cambiar el alcance operativo. Ver [[Olivícola Luján/12 - Pendientes y hoja de ruta|12 - Pendientes y hoja de ruta]].
