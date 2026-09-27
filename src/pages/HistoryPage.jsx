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
  Download,
  Users,
  Activity,
  CheckCircle2,
} from 'lucide-react';
import { loadDatabase } from '../api/repository.js';
import { useAuth, ROLES, PERMISOS } from '../components/Auth.jsx';
import { formatDateTime } from '../lib/utils.js';
import { Badge } from '../components/ui/badge.jsx';
import { Button } from '../components/ui/button.jsx';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';

export function HistoryPage() {
  const { user, role, can } = useAuth();
  const db = loadDatabase();
  const { historial } = db;

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('ALL');
  const [selectedActor, setSelectedActor] = useState('ALL');

  // Extraer lista única de operadores / actores registrados
  const distinctActors = useMemo(() => {
    const set = new Set();
    (historial || []).forEach((h) => {
      if (h.actor) set.add(h.actor.trim());
    });
    return Array.from(set).sort();
  }, [historial]);

  const filteredHistory = useMemo(() => {
    return (historial || [])
      .filter((evt) => {
        if (selectedType !== 'ALL' && evt.tipo !== selectedType) return false;
        if (selectedActor !== 'ALL' && evt.actor !== selectedActor) return false;
        if (!searchQuery.trim()) return true;

        const q = searchQuery.toLowerCase().trim();
        const idMatch = evt.tambor_id?.toLowerCase().includes(q);
        const descMatch = evt.descripcion?.toLowerCase().includes(q);
        const actorMatch = evt.actor?.toLowerCase().includes(q);
        const obsMatch = evt.observaciones?.toLowerCase().includes(q);

        return idMatch || descMatch || actorMatch || obsMatch;
      })
      .sort((a, b) => new Date(b.created_date || 0) - new Date(a.created_date || 0));
  }, [historial, searchQuery, selectedType, selectedActor]);

  const eventTypes = ['ALL', 'Creación', 'Edición', 'Movimiento', 'Calidad', 'Inventario', 'Eliminación'];

  // Estadísticas de auditoría para gerencia
  const auditMetrics = useMemo(() => {
    const actorCounts = {};
    (historial || []).forEach((h) => {
      const act = h.actor || 'Desconocido';
      actorCounts[act] = (actorCounts[act] || 0) + 1;
    });

    const todayStr = new Date().toISOString().split('T')[0];
    const todayEvents = (historial || []).filter(
      (h) => h.created_date && h.created_date.startsWith(todayStr)
    ).length;

    return { actorCounts, todayEvents };
  }, [historial]);

  // Exportar auditoría a CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Fecha', 'Tambor ID', 'Tipo', 'Campo', 'Valor Anterior', 'Valor Nuevo', 'Descripción', 'Observaciones', 'Operador Responsable'];
    const rows = filteredHistory.map((e) => [
      `"${e.id}"`,
      `"${e.created_date || ''}"`,
      `"${e.tambor_id || ''}"`,
      `"${e.tipo || ''}"`,
      `"${e.campo || ''}"`,
      `"${e.valor_anterior || ''}"`,
      `"${e.valor_nuevo || ''}"`,
      `"${(e.descripcion || '').replace(/"/g, '""')}"`,
      `"${(e.observaciones || '').replace(/"/g, '""')}"`,
      `"${e.actor || ''}"`,
    ]);

    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((r) => r.join(','))].join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `auditoria-trazabilidad-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 max-w-5xl mx-auto">
      {/* ---------------- CABECERA ---------------- */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-olive-800 bg-olive-100/70 px-2.5 py-0.5 rounded-full font-semibold flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Auditoría en Tiempo Real
            </span>
            <span className="text-bone-400 text-xs font-mono">· Registro Inalterable</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
            Historial y Auditoría de Operaciones
          </h2>
          <p className="text-sm text-bone-600 mt-0.5">
            Registro cronológico inmutable de pesajes, altas, modificaciones, dictámenes de calidad y traslados físicos en planta.
          </p>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" onClick={handleExportCSV} className="text-xs">
            <Download className="w-3.5 h-3.5 mr-1.5" />
            Exportar Auditoría CSV
          </Button>
          <div className="text-right">
            <span className="text-xs font-mono text-bone-500 block">Total Eventos</span>
            <span className="font-serif text-2xl font-black text-obsidian">
              {historial?.length || 0}
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- PANEL RESUMEN PARA GERENCIA / ADMINISTRADOR ---------------- */}
      {role === ROLES.ADMINISTRADOR && (
        <div className="p-4 rounded-2xl bg-white border border-bone-200 shadow-soft-sm space-y-3">
          <div className="flex items-center justify-between border-b border-bone-100 pb-2">
            <span className="font-mono text-xs uppercase font-bold text-obsidian flex items-center gap-2">
              <Users className="w-4 h-4 text-olive-800" />
              Auditoría de Actividad por Operador
            </span>
            <span className="text-xs font-mono text-bone-500">
              {distinctActors.length} operadores registrados
            </span>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedActor('ALL')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                selectedActor === 'ALL'
                  ? 'bg-obsidian text-white font-bold'
                  : 'bg-bone-100 text-bone-700 hover:bg-bone-200'
              }`}
            >
              Todos los operarios ({historial?.length || 0})
            </button>
            {distinctActors.map((act) => (
              <button
                key={act}
                onClick={() => setSelectedActor(act)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  selectedActor === act
                    ? 'bg-olive-900 text-white font-bold'
                    : 'bg-bone-100 text-bone-700 hover:bg-bone-200'
                }`}
              >
                <span>{act}</span>
                <span className="text-[10px] opacity-75 font-mono">
                  ({auditMetrics.actorCounts[act] || 0})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ---------------- FILTROS Y BÚSQUEDA ---------------- */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-bone-400" />
          <input
            type="text"
            placeholder="Buscar por tambor (ej: T000001), descripción, operador o nota..."
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
                      {evt.tambor_id && (
                        <Link
                          to={`/tambores/${evt.tambor_id}`}
                          className="font-mono font-bold text-xs text-olive-900 bg-olive-100/90 px-2 py-0.5 rounded hover:bg-olive-200 transition-colors"
                        >
                          {evt.tambor_id}
                        </Link>
                      )}

                      <Badge
                        variant={
                          evt.tipo === 'Creación'
                            ? 'paleGreen'
                            : evt.tipo === 'Movimiento'
                            ? 'paleBlue'
                            : evt.tipo === 'Calidad'
                            ? 'paleGreen'
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

                    {evt.campo && (
                      <div className="flex items-center gap-2 text-bone-600 font-mono text-[11px] bg-bone-100/70 px-2.5 py-1 rounded-md max-w-fit">
                        <span className="line-through text-bone-500">{evt.valor_anterior || '—'}</span>
                        <ArrowRight className="w-3 h-3 text-bone-400" />
                        <span className="font-bold text-obsidian">{evt.valor_nuevo || '—'}</span>
                      </div>
                    )}

                    {evt.observaciones && (
                      <p className="text-bone-600 italic text-[11px] bg-white border border-bone-200 p-2 rounded-lg">
                        "{evt.observaciones}"
                      </p>
                    )}
                  </div>

                  <div className="sm:text-right shrink-0 flex sm:flex-col items-center sm:items-end justify-between gap-1 text-[11px] text-bone-500 font-mono pt-1 sm:pt-0 border-t sm:border-t-0 border-bone-100">
                    <span className="text-obsidian font-medium font-sans flex items-center gap-1.5">
                      <User className="w-3.5 h-3.5 text-bone-400" />
                      {evt.actor || 'Operario Planta'}
                    </span>
                    <span>{formatDateTime(evt.created_date)}</span>
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
