/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion } from 'motion/react';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  ExternalLink,
  Copy,
  Check,
  CalendarDays
} from 'lucide-react';
import { BARBER_CONTACT } from '../data';

export default function MapAndContact() {
  const [copiedText, setCopiedText] = useState('');

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(label);
    setTimeout(() => setCopiedText(''), 2000);
  };

  const scheduleHours = [
    { span: 'Lunes a Sábado (Mañanas)', hours: '09:00 - 14:00', status: 'Cita Recomendada' },
    { span: 'Lunes a Sábado (Tardes)', hours: '16:00 - 21:00', status: 'Horas de alta demanda' },
    { span: 'Domingos y Festivos', hours: 'Cerrado', status: 'Descanso del personal' },
  ];

  return (
    <section id="contacto" className="py-24 bg-neutral-900 text-white scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-[1px] bg-amber-500" />
            <span className="text-amber-500 uppercase tracking-[0.4em] font-mono text-xs font-bold block">
              DÓNDE ENCONTRARNOS
            </span>
            <div className="w-12 h-[1px] bg-amber-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white uppercase tracking-tight mb-4">
            Ubicación y Contacto
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl mt-2">
            Estamos ubicados en una zona accesible de Rubí. Ven a visitarnos o ponte en contacto con Redouan para solventar cualquier consulta.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-stretch">
          
          {/* Contact Methods Cards Grid (Left cols: 5) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* Quick action Cards */}
            <div className="space-y-4">
              <h3 className="text-xl font-serif text-white uppercase tracking-wider mb-2 font-bold">Datos Directos</h3>
              
              {/* Address detail card */}
              <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950/70 relative">
                <div className="flex items-start space-x-3.5">
                  <div className="p-3 bg-neutral-900 rounded-lg text-amber-500">
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-neutral-500 block text-[10px] uppercase font-mono tracking-widest">Dirección</span>
                    <p className="text-white text-xs sm:text-sm font-semibold mt-0.5 truncate pr-8">{BARBER_CONTACT.address}</p>
                    <span className="text-neutral-400 text-[11px] block mt-0.5 font-sans">local 5, Carrer de Lumière, Rubí</span>
                  </div>
                </div>
                {/* Copier link */}
                <button
                  id="copy-address-btn"
                  onClick={() => handleCopy(BARBER_CONTACT.address, 'address')}
                  className="absolute top-5 right-5 text-neutral-500 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Copiar dirección"
                >
                  {copiedText === 'address' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Phone detail card */}
              <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950/70 relative">
                <div className="flex items-start space-x-3.5">
                  <div className="p-3 bg-neutral-900 rounded-lg text-amber-500">
                    <Phone className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-neutral-500 block text-[10px] uppercase font-mono tracking-widest">Llamada / WhatsApp</span>
                    <a
                      id="call-phone-link"
                      href={`tel:${BARBER_CONTACT.phone}`}
                      className="text-white text-base font-bold font-mono hover:text-amber-500 transition-colors block mt-0.5"
                    >
                      {BARBER_CONTACT.formattedPhone}
                    </a>
                  </div>
                </div>
                {/* Copier link */}
                <button
                  id="copy-phone-btn"
                  onClick={() => handleCopy(BARBER_CONTACT.phone, 'phone')}
                  className="absolute top-5 right-5 text-neutral-500 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Copiar teléfono"
                >
                  {copiedText === 'phone' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>

              {/* Email detail card */}
              <div className="p-5 rounded-xl border border-neutral-800 bg-neutral-950/70 relative">
                <div className="flex items-start space-x-3.5">
                  <div className="p-3 bg-neutral-900 rounded-lg text-amber-500">
                    <Mail className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-neutral-500 block text-[10px] uppercase font-mono tracking-widest">Correo de Contacto</span>
                    <a
                      id="mailto-link-card"
                      href={`mailto:${BARBER_CONTACT.email}`}
                      className="text-white text-xs sm:text-sm font-semibold hover:text-amber-500 transition-colors block mt-0.5 truncate"
                    >
                      {BARBER_CONTACT.email}
                    </a>
                  </div>
                </div>
                {/* Copier link */}
                <button
                  id="copy-email-btn"
                  onClick={() => handleCopy(BARBER_CONTACT.email, 'email')}
                  className="absolute top-5 right-5 text-neutral-500 hover:text-amber-500 transition-colors cursor-pointer"
                  title="Copiar email"
                >
                  {copiedText === 'email' ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Structured Shift Schedule timeline Card */}
            <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
              <h4 className="font-serif text-md text-white font-bold uppercase tracking-wider flex items-center gap-2">
                <Clock className="w-4.5 h-4.5 text-amber-500" />
                <span>Horarios de Atención Completa</span>
              </h4>
              <div className="space-y-3.5">
                {scheduleHours.map((sh, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs sm:text-sm py-1.5 border-b border-neutral-900 last:border-0 last:pb-0">
                    <div>
                      <span className="text-neutral-300 font-semibold block">{sh.span}</span>
                      <span className="text-[11px] text-neutral-500 block font-mono">{sh.status}</span>
                    </div>
                    <span className="text-amber-500 font-mono font-bold shrink-0">{sh.hours}</span>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* Map Representation & Navigation coordinates (Right cols: 7) */}
          <div className="lg:col-span-7 bg-neutral-950 p-6 rounded-2xl border border-neutral-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xl font-serif text-white uppercase tracking-wider font-bold">Mapa e Indicaciones</h3>
                <a
                  id="maps-navigation-anchor"
                  href={`https://www.google.com/maps/search/?api=1&query=Carrer+de+Lumi%C3%A8re+6+Rubi+Barcelona`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-amber-500 hover:underline flex items-center space-x-1.5 font-mono"
                >
                  <span>Abrir Maps</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>

              {/* Aesthetic Custom Vector Blueprint simulation map */}
              <div className="h-64 sm:h-80 w-full rounded-lg bg-neutral-900 border border-neutral-800 relative overflow-hidden flex items-center justify-center p-4">
                
                {/* Faux grid lines */}
                <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f1f_1px,transparent_1px),linear-gradient(to_bottom,#1f1f1f_1px,transparent_1px)] bg-[size:24px_24px] opacity-40 z-0" />
                
                {/* Graphic Simulated Carrers layout */}
                <div className="absolute inset-0 z-0 flex flex-col justify-around py-4">
                  <div className="h-4 bg-neutral-950/40 w-full transform -rotate-6 flex items-center justify-center">
                    <span className="text-[9px] font-mono text-neutral-600 tracking-widest uppercase">Av. de Mònaco</span>
                  </div>
                  <div className="h-10 bg-neutral-950/80 w-full transform -rotate-12 flex items-center px-12 border-y border-neutral-850">
                    <span className="text-[10px] font-mono text-amber-500/70 tracking-widest uppercase font-semibold">Carrer de Lumière</span>
                  </div>
                  <div className="h-4 bg-neutral-950/40 w-full transform -rotate-6 flex items-center justify-center">
                    <span className="text-[9px] font-mono text-neutral-600 tracking-widest uppercase">Carrer de París</span>
                  </div>
                </div>

                {/* Vertical crossing street representation */}
                <div className="absolute left-1/3 top-0 bottom-0 w-8 bg-neutral-950/60 transform rotate-12 z-0 border-x border-neutral-850/45 flex items-center justify-center">
                  <span className="text-[8px] font-mono text-neutral-600 uppercase tracking-[0.2em] transform -rotate-90">Carrer d'Itàlia</span>
                </div>

                {/* Pin layout visual pointer */}
                <div className="absolute top-[48%] left-[72%] z-10 flex flex-col items-center">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="p-1 px-3.5 bg-neutral-950 border border-amber-500 text-amber-500 rounded-md font-mono text-[10px] font-bold shadow-lg flex items-center gap-1 leading-none"
                  >
                    <span className="relative flex h-1.5 w-1.5">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-amber-500" />
                    </span>
                    <span>LOCAL 5</span>
                  </motion.div>
                  <div className="w-2.5 h-2.5 bg-amber-500 transform rotate-45 -mt-1 shadow-lg border-r border-b border-amber-500" />
                </div>

                {/* Info Overlay Box */}
                <div className="absolute bottom-3 left-3 bg-neutral-950/90 border border-neutral-800 p-3 rounded text-[11px] font-mono space-y-1 z-10 max-w-xs shadow-xl">
                  <p className="font-bold text-white uppercase tracking-wider">Barbería El Bastrioui</p>
                  <p className="text-neutral-400">Piso Local 5, Carrer de Lumière 6</p>
                  <p className="text-amber-500 text-[10px]">A 2 min de la estación de autobuses</p>
                </div>
              </div>
            </div>

            <div className="mt-6 p-4 rounded-xl border border-dashed border-neutral-800 text-xs text-neutral-400 flex items-start gap-3">
              <CalendarDays className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-white">¿Cómo llegar cómodamente?</p>
                <p className="mt-0.5 leading-relaxed">
                  El local nº 5 está situado en la planta baja comercial. Hay amplias zonas de aparcamiento en las inmediaciones y paradas de transporte público a pocos metros del Carrer de Lumière.
                </p>
              </div>
            </div>
          </div>

        </div>

      </div>
    </section>
  );
}
