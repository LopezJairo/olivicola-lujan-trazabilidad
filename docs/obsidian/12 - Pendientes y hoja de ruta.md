---
title: "12 - Pendientes y hoja de ruta"
proyecto: "Olivícola Luján"
tipo: documentacion
actualizado: 2026-09-24
tags:
  - olivicola-lujan
  - mvp
---

# 12 - Pendientes y hoja de ruta

[[Olivícola Luján/00 - Índice general|← Volver al índice general]]

## Prioridad 1 — Completar una demo comprobable

- [x] Crear estructura React/Vite y pantallas del alcance.
- [x] Implementar reglas de dominio y catálogos.
- [x] Crear esquemas JSON de las cuatro entidades.
- [x] Ejecutar ocho pruebas de dominio y compilación.
- [x] Organizar documentación e índice para Obsidian.
- [ ] Validar visualmente escritorio y móvil cuando esté disponible el navegador.
- [ ] Ejecutar recorridos de alta, edición, movimiento, eliminación y escaneo.
- [ ] Crear un espacio vacío separado para datos propios, preservando la demo.
- [ ] Implementar exportación y restauración validadas.
- [ ] Corregir los hallazgos de dependencias y repetir pruebas afectadas.

## Prioridad 2 — Habilitar un piloto con datos reales

- [ ] Confirmar App ID y acceso al entorno Base44 de la empresa.
- [ ] Configurar entidades y catálogos acordados.
- [ ] Centralizar la secuencia y garantizar unicidad de `tambor_id`.
- [ ] Resolver consistencia de operaciones y reintentos sin duplicar.
- [ ] Definir roles y restringir operaciones de administración en backend.
- [ ] Proteger historial y conservar snapshots suficientes.
- [ ] Verificar auth, registro y recuperación.
- [ ] Probar respaldo/restauración y documentar responsables.
- [ ] Elegir hosting y configurar rutas SPA.
- [ ] Probar impresora y lector de planta.
- [ ] Capacitar y observar a operarios de la empresa.

## Prioridad 3 — Ajustar con evidencia

- [ ] Reducir o reorganizar campos según tareas observadas.
- [ ] Dividir pantallas y lógica de `App.jsx` para facilitar mantenimiento.
- [ ] Ajustar paginación, filtrado remoto y refresco al volumen real.
- [ ] Evaluar alias de códigos anteriores.
- [ ] Agregar pruebas de integración y regresión sobre los errores encontrados.

## Regla para ampliar el alcance

Añadir una función solo si resuelve una necesidad observada durante el piloto o fue solicitada por la empresa. Las ideas de ERP, balanzas, cámara, modo offline o analítica adicional no constituyen compromisos del MVP.

## Cierre del MVP

Se propone declarar el piloto listo cuando se complete el circuito básico con datos de prueba en el entorno que usará la empresa, las etiquetas se lean físicamente, los permisos funcionen y una copia pueda restaurarse. No hay fecha de entrega, presupuesto ni responsable empresarial confirmados.

Relacionado: [[Olivícola Luján/10 - Estado actual y validación|10 - Estado actual y validación]], [[Olivícola Luján/11 - Riesgos y condiciones del piloto|11 - Riesgos y condiciones del piloto]], [[Olivícola Luján/13 - Decisiones y preguntas abiertas|13 - Decisiones y preguntas abiertas]].
