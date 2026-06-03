/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Scissors, Phone, Mail, MapPin } from 'lucide-react';
import { BARBER_CONTACT } from '../data';

interface FooterProps {
  onScrollTo: (sectionId: string) => void;
}

export default function Footer({ onScrollTo }: FooterProps) {
  const currentYear = new Date().getFullYear();

  return (
    <footer id="main-footer" className="bg-neutral-950 border-t border-neutral-850 pt-16 pb-8 text-neutral-400">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Main Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
          
          {/* Col 1: Brand Logotype & foundation info */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center space-x-3 cursor-pointer" onClick={() => onScrollTo('inicio')}>
              <div className="p-2 bg-amber-500 rounded text-neutral-950">
                <Scissors className="w-5 h-5 focus:outline-none" />
              </div>
              <span className="font-serif text-lg tracking-widest text-white uppercase font-bold">
                EL BASTRIOUI
              </span>
            </div>
            <p className="text-xs sm:text-sm text-neutral-400 max-w-sm leading-relaxed">
              Artesanos de la barbería clásica y moderna en Rubí. Desde nuestro año de apertura en {BARBER_CONTACT.foundedYear}, nos volcamos diariamente para garantizar la excelencia en cada corte de pelo y perfilado de barba.
            </p>
          </div>

          {/* Col 2: In-page navigation */}
          <div>
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4">Navegar</h4>
            <ul className="space-y-2.5 text-xs sm:text-sm font-medium">
              <li>
                <button onClick={() => onScrollTo('inicio')} className="hover:text-amber-500 transition-colors">
                  Inicio
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('servicios')} className="hover:text-amber-500 transition-colors">
                  Servicios y Precios
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('reservar')} className="hover:text-amber-500 transition-colors">
                  Agendar Cita
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('resenas')} className="hover:text-amber-500 transition-colors">
                  Opiniones de Clientes
                </button>
              </li>
              <li>
                <button onClick={() => onScrollTo('contacto')} className="hover:text-amber-500 transition-colors">
                  Contacto y Cómo llegar
                </button>
              </li>
            </ul>
          </div>

          {/* Col 3: Quick Contact card footer links */}
          <div className="space-y-3.5">
            <h4 className="font-serif text-sm font-bold text-white uppercase tracking-wider mb-4">Contacto Directo</h4>
            <div className="flex items-start space-x-2 text-xs sm:text-sm">
              <MapPin className="w-4.5 h-4.5 text-amber-500 shrink-0 mt-0.5" />
              <span>{BARBER_CONTACT.address}</span>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm">
              <Phone className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <a href={`tel:${BARBER_CONTACT.phone}`} className="hover:text-white transition-colors">
                {BARBER_CONTACT.formattedPhone}
              </a>
            </div>
            <div className="flex items-center space-x-2 text-xs sm:text-sm">
              <Mail className="w-4.5 h-4.5 text-amber-500 shrink-0" />
              <a href={`mailto:${BARBER_CONTACT.email}`} className="hover:text-white transition-colors truncate block max-w-xs">
                {BARBER_CONTACT.email}
              </a>
            </div>
          </div>

        </div>

        {/* Legal and credits stripe */}
        <div className="border-t border-neutral-900 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs font-mono text-neutral-600">
          <p>© {currentYear} Barbería El Bastrioui. Todos los derechos reservados.</p>
          <p className="text-right">Establecido en 2023 por Redouan</p>
        </div>

      </div>
    </footer>
  );
}
