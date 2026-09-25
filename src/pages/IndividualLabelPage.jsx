import React from 'react';
import { useParams, Navigate } from 'react-router-dom';

/**
 * Redirección de compatibilidad para la antigua ruta de previsualización individual (/tambores/:id/etiqueta).
 * Elimina la pantalla intermedia de previsualización y simplifica el flujo dirigiendo al operador
 * directamente a la ficha técnica del tambor con el parámetro de impresión directa (?print=1).
 */
export function IndividualLabelPage() {
  const { id } = useParams();
  return <Navigate to={`/tambores/${id}?print=1`} replace />;
}

export default IndividualLabelPage;
