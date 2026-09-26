import React, { useRef } from 'react';
import JsBarcode from 'jsbarcode';

const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? React.useLayoutEffect : React.useEffect;

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

  useIsomorphicLayoutEffect(() => {
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
      // Asegurar escalabilidad SVG mediante viewBox para evitar recortes en etiquetas térmicas
      const w = svgRef.current.getAttribute('width');
      const h = svgRef.current.getAttribute('height');
      if (w && h && !svgRef.current.getAttribute('viewBox')) {
        svgRef.current.setAttribute('viewBox', `0 0 ${w} ${h}`);
        svgRef.current.style.maxWidth = '100%';
        svgRef.current.style.height = 'auto';
      }
    } catch (err) {
      console.warn('Error al generar código de barras CODE 128:', err);
    }
  }, [value, format, width, height, displayValue, fontSize, margin]);

  if (!value) return null;

  return <svg ref={svgRef} className={className} />;
}

/**
 * Etiqueta física estándar para tambores (100mm × 50mm por defecto en papel térmico).
 * Replica el formato horizontal/apaisado con esquinas redondeadas de la etiqueta física real,
 * incorporando el código descriptivo superior, el logotipo de OLIVÍCOLA LUJÁN, el código de barras
 * CODE 128 de alto contraste y el identificador único de tambor requerido.
 */
export function PhysicalLabel({
  drum,
  widthMm = 100,
  heightMm = 50,
  showBorder = false,
  className = '',
}) {
  if (!drum) return null;

  const uniqueCode =
    drum.codigo ||
    (drum.codigo_descriptivo && drum.tambor_id
      ? `${drum.codigo_descriptivo}-${drum.tambor_id}`
      : drum.tambor_id);
  const barcodeValue = uniqueCode || drum.codigo_compacto || drum.tambor_id;

  return (
    <div
      className={`printable-label-page bg-white text-black font-sans flex flex-col justify-between p-2.5 select-none rounded-xl ${
        showBorder ? 'border border-dashed border-gray-400' : ''
      } ${className}`}
      style={{
        width: `${widthMm}mm`,
        minHeight: `${heightMm}mm`,
        boxSizing: 'border-box',
      }}
    >
      {/* 1. Código Descriptivo + Identificador Único de Tambor + Cabecera de Empresa */}
      <div className="text-center pt-0.5">
        <div className="flex items-center justify-center gap-2 flex-wrap">
          <span className="text-[13px] sm:text-[15px] font-black font-mono tracking-tight text-black uppercase leading-tight">
            {drum.codigo_descriptivo || '—'}
          </span>
          <span className="text-[10px] sm:text-[11px] font-bold font-mono tracking-wider bg-black text-white px-1.5 py-0.5 rounded leading-none shrink-0">
            {`Tambor ${drum.tambor_id}`}
          </span>
        </div>
        <div className="text-[11px] sm:text-[12px] font-bold tracking-[0.22em] uppercase font-sans text-black mt-1">
          OLIVÍCOLA LUJÁN
        </div>
      </div>

      {/* 2. Código de barras CODE 128 limpio y de alto contraste (con valor único por tambor) */}
      <div className="flex flex-col items-center justify-center my-1 bg-white">
        <BarcodeSvg
          value={barcodeValue}
          width={1.5}
          height={44}
          displayValue={false}
          className="max-w-full"
        />
        {/* Texto bajo el código de barras (muestra código completo con ID) */}
        <div className="text-[9.5px] font-mono font-bold tracking-tight text-center mt-0.5 text-black break-all px-1">
          {uniqueCode}
        </div>
        {drum.codigo_compacto && (
          <div className="text-[7.5px] font-mono text-gray-500 tracking-tighter text-center">
            {drum.codigo_compacto}
          </div>
        )}
      </div>

      {/* 3. Metadata operativa esencial en pie compacto */}
      <div className="text-[7.5px] font-mono flex items-center justify-between border-t border-gray-300 pt-1 text-gray-700 px-1">
        <span>
          Lote: <strong className="text-black font-bold">{drum.lote || '—'}</strong>
        </span>
        <span>
          Peso: <strong className="text-black font-bold">{drum.peso} kg</strong>
        </span>
        <span>
          Ubicación: <strong className="text-black font-bold">{drum.ubicacion_nombre || drum.ubicacion || '—'}</strong>
        </span>
      </div>
    </div>
  );
}

/**
 * Etiqueta física de Sector para impresión térmica (100mm × 50mm).
 * Diseñada para ser colocada en columnas, postes y racks de los sectores de la planta.
 */
export function SectorLabel({
  sector,
  widthMm = 100,
  heightMm = 50,
  showBorder = false,
  className = '',
}) {
  if (!sector) return null;
  const sectorCode = sector.codigo || sector.id;
  const sectorName = sector.nombre || sector.codigo || 'Sector';

  return (
    <div
      className={`printable-label-page bg-white text-black font-sans flex flex-col justify-between p-3 select-none rounded-xl ${
        showBorder ? 'border-2 border-dashed border-gray-400' : 'border border-gray-200'
      } ${className}`}
      style={{
        width: `${widthMm}mm`,
        minHeight: `${heightMm}mm`,
        boxSizing: 'border-box',
      }}
    >
      {/* Cabecera */}
      <div className="text-center border-b border-black pb-1">
        <div className="flex items-center justify-between text-[8px] uppercase tracking-wider font-mono text-gray-700">
          <span>Planta Luján de Cuyo</span>
          <span className="font-extrabold text-black font-serif tracking-widest text-[9.5px]">
            OLIVÍCOLA LUJÁN
          </span>
          <span>Control Sector</span>
        </div>
      </div>

      {/* Nombre del Sector */}
      <div className="text-center my-0.5">
        <span className="text-[8px] font-mono uppercase tracking-widest text-gray-500 block">
          Sector de Almacenamiento
        </span>
        <h3 className="text-sm font-black tracking-tight uppercase leading-tight font-mono text-black">
          {sectorName}
        </h3>
      </div>

      {/* Código de barras CODE 128 del Sector */}
      <div className="flex flex-col items-center justify-center my-1 bg-white">
        <BarcodeSvg
          value={sectorCode}
          width={2.0}
          height={44}
          displayValue={false}
          className="max-w-full"
        />
        <div className="text-[11px] font-mono font-black tracking-widest text-center mt-1 text-black">
          * {sectorCode} *
        </div>
      </div>

      {/* Pie instructivo */}
      <div className="text-center border-t border-gray-300 pt-0.5 text-[7.5px] font-mono text-gray-600">
        Escanear este código para registrar inventario en este sector
      </div>
    </div>
  );
}
