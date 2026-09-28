import React from 'react';
import { Cpu, ShieldCheck, Mail, ExternalLink } from 'lucide-react';

export default function Footer({ updatedAt, contactSupport }) {
  return (
    <footer className="border-t border-white/[0.06] mt-20 py-12 px-4 max-w-6xl mx-auto text-xs text-zinc-300">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        
        {/* Left branding */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4" />
          </div>
          <div>
            <div className="font-bold text-white tracking-wide uppercase">Olivícola Luján</div>
            <div className="text-[11px] text-zinc-300">Trazabilidad Industrial &bull; Control de Calidad y Planta</div>
          </div>
        </div>

        {/* Center info */}
        <div className="text-center md:text-left">
          <p className="text-[11px] text-zinc-300">
            Última actualización de compilaciones: <span className="text-zinc-200 font-medium">{updatedAt || 'Septiembre 2026'}</span>
          </p>
          <p className="text-[11px] text-zinc-300 mt-0.5">
            Compatible con balanzas industriales, Zebra GC420t y escáneres inalámbricos HPRT.
          </p>
        </div>

        {/* Right info */}
        <div className="flex items-center gap-4 text-[11px]">
          {contactSupport && (
            <a
              href={`mailto:${contactSupport}`}
              className="text-zinc-400 hover:text-emerald-400 flex items-center gap-1 transition-colors"
            >
              <Mail className="w-3.5 h-3.5" />
              <span>Soporte Interno</span>
            </a>
          )}
          <span className="text-zinc-700">&bull;</span>
          <span className="text-zinc-500">&copy; {new Date().getFullYear()} Olivícola Luján</span>
        </div>

      </div>
    </footer>
  );
}
