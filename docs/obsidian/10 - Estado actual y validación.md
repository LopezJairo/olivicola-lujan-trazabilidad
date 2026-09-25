---
title: "10 - Estado actual y validación"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 10 - Estado actual y validación

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Corte documentado

**24 de septiembre de 2026.** Estado contrastado contra los archivos locales. No hay una validación de producción ni pruebas con usuarios de la empresa.

## Matriz de estado

| Función | Presente en código | Evidencia o pendiente |
|---|---|---|
| Dashboard e inventario | Sí | Compila; revisión visual pendiente. |
| Alta y edición | Sí | Validaciones y cálculo probados a nivel unitario; falta prueba de interfaz. |
| Escáner USB/manual | Sí | Foco y Enter implementados; sin prueba de lector físico. |
| Movimientos | Sí | Código local implementado; sin prueba integral. |
| Historial | Sí | Comparación de campos probada; falta recorrido real completo. |
| Eliminación | Sí | Confirmación textual y conservación de eventos; sin validación integral. |
| Catálogos | Sí | CRUD de opciones y activación implementados. |
| CODE 128 e impresión | Sí | Generación y estilos; impresora/lector sin validar. |
| Autenticación | Sí | Contexto de usuario local y selector de roles implementados. |
| Restricciones por rol | No | Solo presentación de rol; pendiente para uso empresarial. |
| Persistencia demo | Sí | localStorage gestionado por repositorio. |
| Espacio vacío para datos propios | Sí | Implementado (Espacio Empresa) con inicialización sin datos de muestra. |
| Exportación y restauración | Sí | Implementadas funciones de respaldo y restauración JSON y probadas en repositorio. |
| Despliegue público | No verificado | Sin URL confirmada. |

## Pruebas ejecutadas

`npm test` (Vitest) ejecutó **23 pruebas, 23 aprobadas, 0 fallidas** distribuidas en 3 suites:

1. `tests/domain.test.js` (11 pruebas):
   - Generación de ID y prevención de reutilización de identificadores eliminados.
   - Construcción de códigos descriptivos y completos.
   - Normalización de pesaje y lote.
   - Validación de peso positivo y consistencia de fechas (elaboración <= ingreso).
   - Manejo de opciones de catálogo inactivas.
   - Auditoría de diferencias campo a campo.
   - Búsqueda insensible a mayúsculas y diacríticos con filtros combinados.
2. `tests/repository.test.js` (10 pruebas):
   - Carga inicial de datos de demostración (12 tambores, movimientos, historial).
   - Ciclo integral de alta con asignación incremental y registro de evento.
   - Edición de tambor con reconstrucción de códigos y generación de eventos de auditoría.
   - Registro de movimientos de ubicación y actualización de estado.
   - Eliminación con preservación íntegra de historial y movimientos.
   - Administración de catálogos (alta, edición, validación de códigos únicos).
   - Copia de seguridad: exportación e importación completa JSON con restauración de estado.
   - Restablecimiento de base de datos de demostración.
   - Aislamiento de espacios de trabajo: Espacio Demo vs Espacio Empresa.
   - Prevención de colisión de ID entre espacios de trabajo.
3. `tests/ui.test.jsx` (2 pruebas):
   - Generación y renderizado de SVG para códigos de barra CODE 128.
   - Renderizado del componente Dialog de interfaz.

`npm run build` completó con Vite, módulos transformados y generación de `dist/`. Esto verifica que el bundle se construye exitosamente.

## Validación visual

Se intentó abrir la aplicación local con el navegador de automatización. El control automático rechazó la apertura e informó un límite de uso. No se ejecutó un recorrido visual ni se obtuvo una captura validada. No se intentó eludir el bloqueo.

## Dependencias

La consulta de auditoría ejecutada en esta sesión informó **dos hallazgos moderados**, asociados a `react-router` y `react-router-dom`, y ninguna severidad alta o crítica en ese resultado. La auditoría reportó una versión correctiva de otra versión mayor; no se realizó la actualización. Es una fotografía del análisis ejecutado, no una afirmación permanente. Revisar y validar una actualización antes de publicar.

## Pruebas de aceptación pendientes

- [ ] Registrar tambor desde UI, recargar y verificar persistencia.
- [ ] Editar y contrastar cada evento con su antes/después.
- [ ] Mover a otra ubicación y cambiar estado.
- [ ] Buscar por ID, código, producto, variedad, calibre y lote.
- [ ] Escanear código válido e inválido con teclado y lector.
- [ ] Eliminar un registro de prueba y comprobar eventos conservados.
- [ ] Configurar, desactivar y reutilizar catálogos correctamente.
- [ ] Probar control de acceso y selector de roles.
- [ ] Probar altas simultáneas desde dos puestos.
- [ ] Probar fallo de red entre escrituras y recuperación.
- [ ] Imprimir y leer etiquetas físicas.
- [ ] Validar móvil, teclado, foco y accesibilidad con usuarios.
