import React, { useEffect, useRef } from 'react';
import JsBarcode from 'jsbarcode';

/**
 * Componente generador de código de barras CODE 128 en SVG.
 */
export function BarcodeSvg({
  value,
  format = 'CODE128',
  width = 1.6,
  height = 54,
  displayValue = false,
  fontSize = 12,
  margin = 0,
  className = '',
}) {
  const svgRef = useRef(null);

  useEffect(() => {
    if (!svgRef.current || !value) return;
    try {
      JsBarcode(svgRef.current, String(value), {
        format,
        width,
        height,
        displayValue,
        fontSize,
        margin,
        lineColor: '#000000',
        background: 'transparent',
      });
    } catch (err) {
      console.warn('Error al generar código de barras CODE 128:', err);
    }
  }, [value, format, width, height, displayValue, fontSize, margin]);

  if (!value) return null;

  return <svg ref={svgRef} className={className} />;
}

/**
 * Etiqueta física estándar (50mm × 100mm / 5 × 10 cm)
 * Diseñada para impresión térmica en planta con máxima legibilidad para operarios y escáneres.
 */
export function PhysicalLabel({
  drum,
  widthMm = 50,
  heightMm = 100,
  showBorder = false,
  className = '',
}) {
  if (!drum) return null;

  return (
    <div
      className={`printable-label-page bg-white text-black font-sans flex flex-col justify-between p-3 select-none ${
        showBorder ? 'border border-dashed border-gray-400' : ''
      } ${className}`}
      style={{
        width: `${widthMm}mm`,
        minHeight: `${heightMm}mm`,
        boxSizing: 'border-box',
      }}
    >
      {/* Cabecera de Empresa */}
      <div className="text-center border-b border-black pb-1.5 mb-1.5">
        <h2 className="text-[11px] font-extrabold tracking-widest uppercase leading-tight font-serif">
          OLIVÍCOLA LUJÁN
        </h2>
        <p className="text-[7.5px] uppercase tracking-wider text-gray-700 font-mono">
          Planta Luján de Cuyo · Mendoza
        </p>
      </div>

      {/* Código Descriptivo */}
      <div className="text-center my-1">
        <span className="text-[8px] font-bold text-gray-500 block uppercase tracking-wider">
          Código Descriptivo
        </span>
        <span className="text-[10px] font-mono font-bold tracking-tight block">
          {drum.codigo_descriptivo || '—'}
        </span>
      </div>

      {/* Código de barras CODE 128 */}
      <div className="flex flex-col items-center justify-center my-1 bg-white">
        <BarcodeSvg
          value={drum.codigo || drum.tambor_id}
          width={1.2}
          height={48}
          displayValue={false}
          className="max-w-full"
        />
        <div className="text-[8.5px] font-mono tracking-tighter text-center mt-1 text-black font-semibold break-all px-1">
          {drum.codigo || drum.tambor_id}
        </div>
      </div>

      {/* Identificador Principal */}
      <div className="text-center my-1 border-t border-b border-black py-1.5 bg-gray-50">
        <span className="text-[9px] uppercase tracking-wider text-gray-600 block">
          Identificación
        </span>
        <span className="text-[16px] font-mono font-black tracking-wider block">
          {`Tambor ${drum.tambor_id}`}
        </span>
      </div>

      {/* Metadata operativa esencial */}
      <div className="text-[8px] font-mono grid grid-cols-2 gap-x-1 gap-y-0.5 pt-1 text-gray-900 border-t border-gray-300">
        <div>
          <span className="font-bold text-gray-600">Lote: </span>
          <span>{drum.lote || '—'}</span>
        </div>
        <div>
          <span className="font-bold text-gray-600">Peso: </span>
          <span className="font-bold">{drum.peso} kg</span>
        </div>
        <div>
          <span className="font-bold text-gray-600">Ingreso: </span>
          <span>{drum.fecha_ingreso || '—'}</span>
        </div>
        <div>
          <span className="font-bold text-gray-600">Ubicación: </span>
          <span className="truncate">{drum.ubicacion_nombre || drum.ubicacion || '—'}</span>
        </div>
      </div>
    </div>
  );
}
