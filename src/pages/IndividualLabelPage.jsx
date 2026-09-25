import React, { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Printer, Settings2 } from 'lucide-react';
import { loadDatabase } from '../api/repository.js';
import { resolveCatalogName } from '../lib/domain.js';
import { PhysicalLabel } from '../components/Barcode.jsx';
import { Button } from '../components/ui/button.jsx';

export function IndividualLabelPage() {
  const { id } = useParams();
  const db = loadDatabase();
  const { tambores, catalogos } = db;

  const drum = tambores.find((d) => d.id === id || d.tambor_id === id);

  const [widthMm, setWidthMm] = useState(50);
  const [heightMm, setHeightMm] = useState(100);

  if (!drum) {
    return (
      <div className="text-center py-16">
        <h2 className="text-xl font-bold">Tambor no encontrado</h2>
        <Link to="/inventario">
          <Button variant="primary" className="mt-4">Volver al Inventario</Button>
        </Link>
      </div>
    );
  }

  // Resolver nombre de ubicación para la etiqueta
  const enrichedDrum = {
    ...drum,
    ubicacion_nombre: resolveCatalogName(catalogos, drum.ubicacion, 'ubicacion'),
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-xl mx-auto">
      {/* Barra de Controles (No imprimible) */}
      <div className="no-print flex items-center justify-between pb-4 border-b border-bone-200">
        <Link
          to={`/tambores/${drum.tambor_id}`}
          className="flex items-center gap-2 text-xs font-mono text-bone-600 hover:text-obsidian"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver a Ficha</span>
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-mono text-bone-600">
            <span>Medida:</span>
            <input
              type="number"
              value={widthMm}
              onChange={(e) => setWidthMm(Number(e.target.value))}
              className="w-12 h-7 px-1 text-center rounded border border-bone-300"
            />
            <span>×</span>
            <input
              type="number"
              value={heightMm}
              onChange={(e) => setHeightMm(Number(e.target.value))}
              className="w-12 h-7 px-1 text-center rounded border border-bone-300"
            />
            <span>mm</span>
          </div>

          <Button variant="primary" size="default" onClick={handlePrint} className="text-xs">
            <Printer className="w-4 h-4 mr-1.5" />
            Imprimir Etiqueta
          </Button>
        </div>
      </div>

      {/* Contenedor de la Etiqueta */}
      <div className="flex justify-center p-6 bg-bone-100/50 rounded-2xl border border-bone-200 shadow-inner">
        <div className="shadow-lg bg-white">
          <PhysicalLabel
            drum={enrichedDrum}
            widthMm={widthMm}
            heightMm={heightMm}
            showBorder={true}
          />
        </div>
      </div>

      <div className="no-print text-center text-xs text-bone-500 font-mono">
        Formato predeterminado de planta: 50 mm ancho × 100 mm alto (5 × 10 cm).
      </div>
    </div>
  );
}
