import React from 'react';
import { Download, Sliders, ShieldCheck, Cpu } from 'lucide-react';

export default function Navbar({ latestVersion, onOpenAdmin }) {
  return (
    <header className="sticky top-4 z-40 px-4 max-w-6xl mx-auto">
      <div className="glass-panel border border-white/10 rounded-full px-5 py-3 flex items-center justify-between shadow-2xl backdrop-blur-xl bg-[#0c120c]/80">
        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Cpu className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-wide text-white uppercase">Olivícola Luján</span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] font-semibold tracking-wider">
                v{latestVersion}
              </span>
            </div>
            <p className="text-[11px] text-zinc-400 tracking-tight hidden md:block">Portal Oficial de Distribución de Software</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-zinc-300">
          <a href="#descargas" className="hover:text-emerald-400 transition-colors">Descargas</a>
          <a href="#novedades" className="hover:text-emerald-400 transition-colors">Novedades</a>
          <a href="#instalacion" className="hover:text-emerald-400 transition-colors">Guía de Red LAN</a>
        </nav>

        {/* Action Button: Admin / Manage */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAdmin}
            className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.1] text-xs font-medium text-zinc-300 hover:text-white transition-all active:scale-95"
            title="Administrar o publicar nuevas versiones"
          >
            <Sliders className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">Gestionar Versiones</span>
            <span className="sm:hidden">Admin</span>
          </button>
          
          <a
            href="#descargas"
            className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-xs font-semibold shadow-lg shadow-emerald-500/20 transition-all active:scale-95"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Descargar</span>
          </a>
        </div>
      </div>
    </header>
  );
}
