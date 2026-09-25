import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Clock,
  Search,
  Filter,
  History,
  ArrowRight,
  ShieldCheck,
  Tag,
  AlertOctagon,
  User,
} from 'lucide-react';
import { loadDatabase } from '../api/repository.js';
import { formatDateTime } from '../lib/utils.js';
import { Badge } from '../components/ui/badge.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';

export function HistoryPage() {
  const db = loadDatabase();
  const { historial } = db;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');

  const filteredHistory = useMemo(() => {
    return (historial || [])
      .filter((evt) => {
        if (selectedType !== 'ALL' && evt.tipo !== selectedType) return false;
        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase().trim();
        const idMatch = evt.tambor_id?.toLowerCase().includes(q);
        const descMatch = evt.descripcion?.toLowerCase().includes(q);
        const actorMatch = evt.actor?.toLowerCase().includes(q);
        const obsMatch = evt.observaciones?.toLowerCase().includes(q);

        return idMatch || descMatch || actorMatch || obsMatch;
      })
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  }, [historial, searchQuery, selectedType]);

  const eventTypes = ['ALL', 'Creación', 'Edición', 'Movimiento', 'Eliminación'];

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* ---------------- CABECERA ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-olive-800 bg-olive-100/70 px-2.5 py-0.5 rounded-full font-semibold">
              Auditoría Inalterable
            </span>
            <span className="text-bone-400 text-xs font-mono">· Registro de Eventos</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
            Historial Global de Planta
          </h2>
          <p className="text-sm text-bone-600 mt-0.5">
            Trazabilidad cronológica de altas, modificaciones de datos, movimientos físicos y eliminaciones.
          </p>
        </div>

        <div className="text-right">
          <span className="text-xs font-mono text-bone-500 block">Total de Eventos</span>
          <span className="font-serif text-2xl font-black text-obsidian">
            {historial?.length || 0}
          </span>
        </div>
      </div>

      {/* ---------------- FILTROS Y BÚSQUEDA ---------------- */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
          <input
            type="text"
            placeholder="Buscar por número de tambor (ej: T000001), descripción o responsable..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm rounded-xl border border-bone-300 bg-white text-obsidian placeholder:text-bone-400 focus:outline-none focus:ring-2 focus:ring-olive-700/20 focus:border-olive-700"
          />
        </div>

        {/* Selector de Tipo de Evento */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
          {eventTypes.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => setSelectedType(type)}
              className={`px-3 py-2 rounded-xl text-xs font-medium transition-colors whitespace-nowrap ${
                selectedType === type
                  ? 'bg-obsidian text-bone-50 font-semibold'
                  : 'bg-white border border-bone-300 text-bone-700 hover:bg-bone-100'
              }`}
            >
              {type === 'ALL' ? 'Todos' : type}
            </button>
          ))}
        </div>
      </div>

      {/* ---------------- LISTADO DE EVENTOS ---------------- */}
      <Card>
        <CardContent className="p-0">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-16 text-bone-500 text-sm">
              No se encontraron eventos con los filtros especificados.
            </div>
          ) : (
            <div className="divide-y divide-bone-100">
              {filteredHistory.map((evt) => (
                <div
                  key={evt.id}
                  className="p-4 sm:p-5 hover:bg-bone-50/70 transition-colors flex flex-col sm:flex-row sm:items-start justify-between gap-4 text-xs"
                >
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Link
                        to={`/tambores/${evt.tambor_id}`}
                        className="font-mono font-bold text-xs text-olive-900 bg-olive-100/90 px-2 py-0.5 rounded hover:bg-olive-200 transition-colors"
                      >
                        {evt.tambor_id}
                      </Link>

                      <Badge
                        variant={
                          evt.tipo === 'Creación'
                            ? 'paleGreen'
                            : evt.tipo === 'Movimiento'
                            ? 'paleBlue'
                            : evt.tipo === 'Eliminación'
                            ? 'paleRed'
                            : 'default'
                        }
                        className="text-[10px]"
                      >
                        {evt.tipo}
                      </Badge>

                      {evt.campo && (
                        <span className="font-mono text-bone-500 font-semibold">
                          [{evt.campo}]
                        </span>
                      )}
                    </div>

                    <p className="text-obsidian font-semibold text-sm leading-snug">
                      {evt.descripcion}
                    </p>

                    {/* Comparación de Valores Antes -> Después */}
                    {evt.campo && (
                      <div className="bg-bone-100/60 p-2.5 rounded-xl border border-bone-200 font-mono text-[11px] grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                        <div>
                          <span className="text-red-700 font-bold block text-[10px] uppercase">
                            Valor Anterior:
                          </span>
                          <span className="text-bone-700">{evt.valor_anterior || '(vacío)'}</span>
                        </div>
                        <div>
                          <span className="text-emerald-700 font-bold block text-[10px] uppercase">
                            Valor Nuevo:
                          </span>
                          <span className="text-obsidian font-bold">{evt.valor_nuevo || '(vacío)'}</span>
                        </div>
                      </div>
                    )}

                    {evt.observaciones && (
                      <p className="text-bone-600 italic">
                        «{evt.observaciones}»
                      </p>
                    )}
                  </div>

                  {/* Metadata de Actor y Fecha */}
                  <div className="text-left sm:text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-bone-100">
                    <span className="font-mono text-bone-500 text-xs block">
                      {formatDateTime(evt.created_date)}
                    </span>
                    <span className="text-bone-600 font-medium text-[11px] flex items-center sm:justify-end gap-1 mt-0.5">
                      <User className="w-3 h-3 text-bone-400" />
                      <span>{evt.actor || 'Operario Planta'}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
