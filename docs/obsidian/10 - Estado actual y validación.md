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
| Movimientos | Sí | Código local y remoto; sin prueba integral. |
| Historial | Sí | Comparación de campos probada; falta recorrido real completo. |
| Eliminación | Sí | Confirmación textual y conservación de eventos; sin validación integral. |
| Catálogos | Sí | CRUD de opciones y activación; unicidad remota no garantizada. |
| CODE 128 e impresión | Sí | Generación y estilos; impresora/lector sin validar. |
| Auth Base44 | Parcial | Cliente y redirección implementados; conexión sin configurar. |
| Restricciones por rol | No | Solo presentación de rol; pendiente para uso empresarial. |
| Persistencia demo | Sí | localStorage; no prueba de respaldo/restauración. |
| Espacio vacío para datos propios | No | Propuesto durante la conversación; pendiente. |
| Exportación y restauración | No | Propuestas; pendientes. |
| Despliegue público | No verificado | Sin URL confirmada. |

## Pruebas ejecutadas

`npm test` ejecutó **8 pruebas, 8 aprobadas, 0 fallidas**:

1. No reutilizar ID de un tambor eliminado si permanece en historial.
2. Primer ID y crecimiento a siete dígitos.
3. Código construido desde catálogos.
4. Normalización de lote y peso.
5. Rechazo de pesos inválidos y elaboración posterior al ingreso.
6. Conservación de opciones inactivas en edición y rechazo en alta.
7. Valores anteriores/nuevos por campo modificado.
8. Búsqueda sin acentos y combinación con filtros.

`npm run build` completó con **Vite 6.4.3**, 1938 módulos transformados y generación de `dist/`. Esto verifica que el bundle se construye; no prueba que cada interacción funcione.

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
- [ ] Probar auth y acceso no autorizado en Base44.
- [ ] Probar altas simultáneas desde dos puestos.
- [ ] Probar fallo de red entre escrituras y recuperación.
- [ ] Imprimir y leer etiquetas físicas.
- [ ] Validar móvil, teclado, foco y accesibilidad con usuarios.
