/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from 'motion/react';
import { Clock, Scissors, Award, Sparkles, Check } from 'lucide-react';
import { SERVICES, BARBER_CONTACT } from '../data';
import { Service } from '../types';

interface ServicesProps {
  onSelectService: (serviceId: string) => void;
  selectedServiceIds: string[];
}

export default function Services({ onSelectService, selectedServiceIds }: ServicesProps) {
  
  // Custom helper to render distinct, classy indicators or icons for each service category
  const getServiceIcon = (id: string) => {
    switch (id) {
      case 'corte-pelo':
        return <Scissors className="w-6 h-6 text-amber-500" />;
      case 'afeitar-navaja':
        return (
          <svg className="w-6 h-6 text-amber-500 fill-current" viewBox="0 0 24 24">
            <path d="M19.5 21a2.5 2.5 0 01-2.5-2.5c0-.83.4-1.57 1.03-2.03l-1.92-3.84c-.6.3-1.3.43-2.06.33-1.63-.22-2.92-1.55-3.1-3.19a4 4 0 011.83-3.85L16.43 3h3.07v1.5a1.5 1.5 0 001.5 1.5l.5-.22v2.44c-.78-.4-1.7-.58-2.65-.43a4.015 4.015 0 00-3.1 3.19c-.19 1.48.65 2.82 1.94 3.3l1.81 3.62c1 .4 1.7 1.34 1.7 2.45 0 1.38-1.12 2.5-2.5 2.5zM3 13.5a1.5 1.5 0 011.5-1.5h11a1.5 1.5 0 011.5 1.5v4a1.5 1.5 0 01-1.5 1.5h-11A1.5 1.5 0 013 17.5v-4z" />
          </svg>
        );
      case 'degradado-perfilar-barba':
        return (
          <svg className="w-6 h-6 text-amber-500 fill-current" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2h2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 1.93-.68 3.7-1.1 5.39z" />
          </svg>
        );
      default:
        return <Sparkles className="w-6 h-6 text-amber-500" />;
    }
  };

  return (
    <section id="servicios" className="py-24 bg-neutral-950 text-white scroll-mt-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-[1px] bg-amber-500" />
            <span className="text-amber-500 uppercase tracking-[0.4em] font-mono text-xs font-bold block">
              CUIDADO MASCULINO SIN ATAJOS
            </span>
            <div className="w-12 h-[1px] bg-amber-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white uppercase tracking-tight mb-4">
            Precios y Servicios
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl mt-2">
            Ofrecemos servicios de alta calidad a precios competitivos. Selecciona tus favoritos de nuestra lista y resérvalos al instante para tu próxima visita.
          </p>
        </div>

        {/* Services Grid layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {SERVICES.map((service, index) => {
            const isSelected = selectedServiceIds.includes(service.id);
            return (
              <motion.div
                key={service.id}
                id={`service-card-${service.id}`}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-50px' }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                className={`relative flex flex-col justify-between p-6 rounded-xl border transition-all duration-300 ${
                  isSelected
                    ? 'border-amber-500 bg-neutral-900/90 shadow-lg shadow-amber-500/10 scale-[1.02]'
                    : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700 hover:bg-neutral-900/70'
                }`}
              >
                {/* Highlight Badge removed */}

                <div>
                  {/* Category Icon */}
                  <div className="mb-4 inline-flex items-center justify-center p-3 rounded-lg bg-neutral-950 border border-neutral-800">
                    {getServiceIcon(service.id)}
                  </div>

                  {/* Service Title */}
                  <h3 className="text-lg sm:text-xl font-serif text-white font-bold mb-2">
                    {service.name}
                  </h3>

                  {/* Long descriptive review */}
                  <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed mb-6 font-sans">
                    {service.description}
                  </p>
                </div>

                {/* Duration & Price Footer */}
                <div id="service-metadata" className="mt-auto pt-4 border-t border-neutral-800">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center text-xs text-neutral-400 font-mono">
                      <Clock className="w-4 h-4 text-neutral-500 mr-1.5" />
                      <span>{service.duration} min</span>
                    </div>
                    <div className="text-2xl font-serif font-bold text-amber-500">
                      {service.price}€
                    </div>
                  </div>

                  {/* Selector Toggle Button */}
                  <button
                    id={`btn-select-${service.id}`}
                    onClick={() => onSelectService(service.id)}
                    className={`w-full py-2.5 px-4 rounded font-bold text-xs tracking-wider uppercase transition-all duration-300 ${
                      isSelected
                        ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400 ring-2 ring-amber-500 ring-offset-2 ring-offset-neutral-950'
                        : 'bg-neutral-950 text-neutral-300 hover:text-white border border-neutral-800 hover:border-amber-500/50 hover:bg-neutral-900'
                    }`}
                  >
                    {isSelected ? (
                      <span className="flex items-center justify-center gap-1.5">
                        <Check className="w-3.5 h-3.5 stroke-[3]" /> Seleccionado
                      </span>
                    ) : (
                      'Añadir a la Cita'
                    )}
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

      </div>
    </section>
  );
}
