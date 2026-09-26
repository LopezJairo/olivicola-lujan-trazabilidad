import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  HelpCircle,
  QrCode,
  PlusCircle,
  Truck,
  Printer,
  AlertTriangle,
  ArrowRight,
  Keyboard,
  CheckCircle2,
  Zap,
  Cpu,
  Radio,
  ExternalLink,
  Download,
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/card.jsx';
import { Button } from '../components/ui/button.jsx';
import { Badge } from '../components/ui/badge.jsx';
import { BarcodeSvg } from '../components/Barcode.jsx';
import { HPRT_N130BT_COMMANDS } from '../lib/scannerBurst.js';
import { generateBatchZPL, downloadZplFile } from '../lib/zpl.js';

export function HelpPage() {
  const steps = [
    {
      title: '1. Consultar o Escanear Tambor',
      icon: QrCode,
      desc: 'Ve a "Escanear Tambor". Apunta el lector USB a la etiqueta del tambor. Al leer el código, el sistema abrirá automáticamente la ficha técnica con su ubicación y peso.',
      tip: 'Si no tienes lector, escribe el número (ej: T000001) y presiona Enter.',
      path: '/escanear',
      btnText: 'Abrir Escáner',
    },
    {
      title: '2. Registrar Nuevo Tambor',
      icon: PlusCircle,
      desc: 'Ve a "Registrar Tambor". El sistema asignará el siguiente número único (ej: T000013) sin duplicar. Selecciona producto, variedad, calibre, escribe el lote y el peso neto en kg.',
      tip: 'Al guardar, se guardará el evento de creación y podrás imprimir su etiqueta.',
      path: '/tambores/nuevo',
      btnText: 'Registrar Tambor',
    },
    {
      title: '3. Registrar Movimiento Físico',
      icon: Truck,
      desc: 'Abre la ficha del tambor. Presiona "Registrar Movimiento". Elige qué ocurrió (ej: Traslado de nave) y la nueva ubicación física. Puedes cambiar el estado si es necesario.',
      tip: 'La ubicación previa y nueva quedan registradas en el historial con fecha y hora.',
      path: '/inventario',
      btnText: 'Buscar en Inventario',
    },
    {
      title: '4. Imprimir Etiquetas Físicas',
      icon: Printer,
      desc: 'Desde la ficha del tambor pulsa "Imprimir Etiqueta" o ve a "Imprimir Etiquetas" para seleccionar varios tambores. El sistema envía las etiquetas directamente a la impresora térmica de 50 × 100 mm.',
      tip: 'Cada etiqueta se imprime en una hoja independiente con el código de barras CODE 128.',
      path: '/etiquetas',
      btnText: 'Impresión de Etiquetas',
    },
  ];

  const troubleshooting = [
    {
      problem: 'El lector USB no escribe en el campo',
      cause: 'El cursor perdió el foco o el lector no está conectado por USB.',
      solution: 'Haz clic dentro del recuadro de escaneo para devolver el foco y comprueba la conexión del cable.',
    },
    {
      problem: 'El lector escribe pero no abre la ficha',
      cause: 'El lector no está configurado para enviar la tecla "Enter" (retorno de carro) al terminar la lectura.',
      solution: 'Presiona el botón "Buscar" manualmente o escanea el código de barras de configuración de tu pistola USB para habilitar el sufijo Enter.',
    },
    {
      problem: 'Código desconocido',
      cause: 'La etiqueta no coincide con ningún tambor activo o el código fue alterado.',
      solution: 'Busca el número de tambor (ej: T000001) directamente en el Inventario para verificar si fue dado de baja.',
    },
    {
      problem: 'Falta una variedad o ubicación en las listas',
      cause: 'La opción aún no fue dada de alta o fue desactivada en Configuración.',
      solution: 'Pide al responsable o administrador que ingrese a Configuración > Catálogos y agregue la opción correspondiente.',
    },
    {
      problem: 'Eliminación accidental',
      cause: 'Un tambor fue eliminado de la planta.',
      solution: 'La eliminación borra la ficha del inventario activo pero todo su historial se conserva intacto como constancia de su existencia previa.',
    },
  ];

  const handleDownloadCalibrationZpl = () => {
    const zpl = generateBatchZPL(HPRT_N130BT_COMMANDS, 'calibration');
    downloadZplFile(zpl, 'calibracion-escaner-hprt-n130bt-zebra-gc420t.zpl');
  };

  return (
    <>
      <div className="no-print space-y-8 animate-in fade-in duration-300 max-w-5xl mx-auto">
        {/* Cabecera */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-bone-200">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] uppercase tracking-[0.2em] font-mono text-olive-800 bg-olive-100/70 px-2.5 py-0.5 rounded-full font-semibold">
              Manual de Planta
            </span>
            <span className="text-bone-400 text-xs font-mono">· Instrucciones de Operación</span>
          </div>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-obsidian">
            Guía de Uso para Operarios y Administración
          </h2>
          <p className="text-sm text-bone-600 mt-0.5">
            Procedimientos paso a paso, atajos de teclado y resolución de problemas comunes.
          </p>
        </div>
      </div>

      {/* ---------------- ATAJOS DE TECLADO ---------------- */}
      <div className="bezel-shell">
        <div className="bezel-core p-4 sm:p-5 bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-bone-100 flex items-center justify-center text-obsidian">
              <Keyboard className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold text-obsidian block">
                Navegación Rápida por Teclado
              </span>
              <p className="text-[11px] text-bone-600">
                Presiona estas teclas en cualquier momento para ir a las pantallas principales:
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>1</kbd> Inicio
            </span>
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>2</kbd> Escanear
            </span>
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>3</kbd> Inventario
            </span>
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>4</kbd> Nuevo Tambor
            </span>
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>5</kbd> Historial
            </span>
            <span className="text-xs flex items-center gap-1 font-mono">
              <kbd>6</kbd> Configuración
            </span>
          </div>
        </div>
      </div>

      {/* ---------------- 4 PASOS PRINCIPALES (BENTO) ---------------- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <Card key={idx} className="flex flex-col justify-between">
              <div>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="w-10 h-10 rounded-xl bg-olive-900 text-bone-50 flex items-center justify-center">
                      <Icon className="w-5 h-5" />
                    </div>
                    <Badge variant="outline" className="font-mono text-[10px]">
                      Paso {idx + 1}
                    </Badge>
                  </div>
                  <CardTitle className="text-base font-bold mt-3">
                    {step.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-xs">
                  <p className="text-bone-700 leading-relaxed">
                    {step.desc}
                  </p>
                  <div className="p-2.5 rounded-lg bg-olive-50/70 border border-olive-200/60 text-olive-950 font-medium">
                    Tip: {step.tip}
                  </div>
                </CardContent>
              </div>

              <div className="p-5 pt-0">
                <Link to={step.path}>
                  <Button variant="outline" size="sm" className="w-full text-xs">
                    {step.btnText} →
                  </Button>
                </Link>
              </div>
            </Card>
          );
        })}
      </div>

      {/* ---------------- HARDWARE DE PLANTA: ESCÁNER HPRT N130BT ---------------- */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-bone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-mono text-olive-800 bg-olive-100/70 px-2 py-0.5 rounded font-semibold">
                Hardware de Captura
              </span>
              <span className="text-xs font-mono text-bone-500">· HPRT N130BT Handheld</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-obsidian mt-1">
              Escáner HPRT N130BT: Códigos de Calibración
            </h3>
            <p className="text-xs text-bone-600 mt-0.5">
              Apunta el lector directamente a los códigos de barras de la pantalla (a 10-15 cm) o imprime esta hoja para la cartelera de planta.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="text-xs font-mono"
              title="Imprimir 8 etiquetas térmicas (100×50 mm) para colocar en planta"
            >
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Imprimir Etiquetas (Zebra 100×50)
            </Button>
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleDownloadCalibrationZpl}
              className="text-xs font-mono"
              title="Descargar archivo .zpl con los 8 comandos para envío directo"
            >
              <Download className="w-3.5 h-3.5 mr-1.5" />
              Descargar .ZPL
            </Button>
          </div>
        </div>

        {/* Rejilla de códigos de configuración del HPRT N130BT */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {HPRT_N130BT_COMMANDS.map((cmd) => (
            <Card key={cmd.id} className="flex flex-col justify-between border-bone-200 hover:border-olive-500/60 transition-all bg-white">
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between gap-1 mb-1">
                  <Badge variant="outline" className="font-mono text-[9px]">
                    {cmd.category}
                  </Badge>
                  <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-olive-100/70 text-olive-900 font-bold">
                    {cmd.badge}
                  </span>
                </div>
                <CardTitle className="text-xs font-bold text-obsidian leading-snug">
                  {cmd.title}
                </CardTitle>
              </CardHeader>

              <CardContent className="p-4 pt-1 flex flex-col items-center justify-between flex-1 space-y-3">
                {/* Código de Barras CODE 128 escaneable */}
                <div className="w-full bg-bone-50/60 p-3 rounded-xl border border-bone-200 flex flex-col items-center justify-center">
                  <BarcodeSvg
                    value={cmd.code}
                    width={1.6}
                    height={46}
                    displayValue={false}
                    className="max-w-full"
                  />
                  <div className="text-[10px] font-mono font-bold text-obsidian tracking-wider mt-1">
                    {cmd.code}
                  </div>
                  <div className="text-[8px] font-mono text-bone-500 tracking-tighter">
                    {cmd.altCode}
                  </div>
                </div>

                <div className="space-y-1.5 text-left w-full text-[11px] text-bone-700">
                  <p className="leading-tight">{cmd.description}</p>
                  <div className="p-1.5 rounded bg-bone-100/70 text-bone-900 text-[10px] font-mono">
                    {cmd.instructions}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* ---------------- HARDWARE DE PLANTA: IMPRESORA ZEBRA GC420t ---------------- */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-bone-200">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] uppercase tracking-widest font-mono text-olive-800 bg-olive-100/70 px-2 py-0.5 rounded font-semibold">
                Hardware de Etiquetado
              </span>
              <span className="text-xs font-mono text-bone-500">· Zebra GC420t Thermal Desktop</span>
            </div>
            <h3 className="font-serif text-2xl font-bold text-obsidian mt-1">
              Impresora Zebra GC420t: Especificaciones y Calibración
            </h3>
            <p className="text-xs text-bone-600 mt-0.5">
              Ajustes calibrados para rollo térmico de 100 mm × 50 mm con sensor de separación (Gap).
            </p>
          </div>

          <Link to="/etiquetas">
            <Button variant="primary" size="sm" className="text-xs font-mono">
              <Printer className="w-3.5 h-3.5 mr-1.5" />
              Centro de Impresión ZPL
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="p-4 pb-2">
              <Badge variant="outline" className="font-mono text-[9px] w-fit mb-1">
                Resolución y Geometría
              </Badge>
              <CardTitle className="text-sm font-bold">
                Medidas de Etiqueta (203 dpi)
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs space-y-2 text-bone-700">
              <ul className="space-y-1.5 font-mono text-[11px]">
                <li>• <strong>Ancho:</strong> 100 mm = 800 dots (^PW800)</li>
                <li>• <strong>Alto:</strong> 50 mm = 400 dots (^LL400)</li>
                <li>• <strong>Orientación:</strong> Horizontal (apaisada)</li>
                <li>• <strong>Sensor:</strong> Gap / Muesca transductor</li>
                <li>• <strong>Lenguaje:</strong> ZPL II nativo con UTF-8 (^CI28)</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <Badge variant="outline" className="font-mono text-[9px] w-fit mb-1">
                Sensor de Gap
              </Badge>
              <CardTitle className="text-sm font-bold">
                Calibración del Sensor de Separación
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs space-y-2 text-bone-700">
              <p className="leading-relaxed">
                Si la impresora expulsa etiquetas en blanco o no frena en el corte:
              </p>
              <ol className="list-decimal pl-4 space-y-1 text-[11px] leading-tight font-sans">
                <li>Enciende la impresora con el rollo cargado.</li>
                <li>Mantén pulsado el botón <strong>FEED</strong> (luz verde).</li>
                <li>Espera a que la luz parpadee: 1 destello y luego <strong>2 destellos seguidos</strong>.</li>
                <li>Suelta el botón: la impresora avanzará 2 etiquetas y calibrará el sensor.</li>
              </ol>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="p-4 pb-2">
              <Badge variant="outline" className="font-mono text-[9px] w-fit mb-1">
                Conectividad ZPL
              </Badge>
              <CardTitle className="text-sm font-bold">
                Opciones de Envío Directo ZPL II
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-1 text-xs space-y-2 text-bone-700">
              <ul className="space-y-1.5 text-[11px] leading-tight">
                <li>
                  • <strong>Zebra Setup Utilities:</strong> Abre "Open Communication with Printer", pega el ZPL y pulsa Send.
                </li>
                <li>
                  • <strong>Archivo .zpl:</strong> Descarga el archivo desde el sistema y envíalo mediante el driver en modo RAW.
                </li>
                <li>
                  • <strong>Impresión Web:</strong> La app incluye reglas <code>@page &#123; size: 100mm 50mm; margin: 0; &#125;</code> para imprimir a sangre sin páginas en blanco.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-bold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Resolución de Problemas Frecuentes en Planta</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-bone-200 bg-bone-50 font-mono text-[11px] text-bone-600 uppercase tracking-wider">
                <th className="p-3.5 font-semibold">Situación / Problema</th>
                <th className="p-3.5 font-semibold">Causa Probable</th>
                <th className="p-3.5 font-semibold">Solución Inmediata</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-bone-100">
              {troubleshooting.map((item, idx) => (
                <tr key={idx} className="hover:bg-bone-50/50">
                  <td className="p-3.5 font-semibold text-obsidian align-top">
                    {item.problem}
                  </td>
                  <td className="p-3.5 text-bone-600 align-top">
                    {item.cause}
                  </td>
                  <td className="p-3.5 text-olive-900 font-medium bg-olive-50/20 align-top">
                    {item.solution}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>

    {/* Contenedor de impresión directa para Zebra GC420t (8 etiquetas térmicas 100mm × 50mm) */}
    <div className="print-only">
      {HPRT_N130BT_COMMANDS.map((cmd) => (
        <div
          key={cmd.id}
          className="printable-label-page bg-white text-black font-sans flex flex-col justify-between p-2.5 select-none"
        >
          <div className="flex items-center justify-between border-b border-black pb-1">
            <span className="font-bold text-[11px] uppercase tracking-wider font-mono">
              HPRT N130BT · CALIBRACIÓN
            </span>
            <span className="font-mono text-[9px] bg-black text-white px-1.5 py-0.5 rounded font-bold">
              {cmd.badge}
            </span>
          </div>

          <div className="text-center font-bold text-[11px] leading-tight pt-1">
            {cmd.title}
          </div>

          <div className="flex flex-col items-center justify-center my-1 bg-white">
            <BarcodeSvg
              value={cmd.code}
              width={1.6}
              height={40}
              displayValue={false}
              className="max-w-full"
            />
            <div className="font-mono font-bold text-[10px] mt-0.5 text-black">
              {cmd.code}
            </div>
          </div>

          <div className="border-t border-black pt-1 flex items-center justify-between text-[8px] font-mono text-gray-800">
            <span className="truncate pr-2">{cmd.instructions}</span>
            <span className="shrink-0 font-bold text-black">OLIVÍCOLA LUJÁN</span>
          </div>
        </div>
      ))}
    </div>
  </>
  );
}
