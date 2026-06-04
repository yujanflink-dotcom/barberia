/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Clock, MapPin, ChevronDown, Check } from 'lucide-react';
import { BARBER_CONTACT } from '../data';
import { getShopStatus } from '../utils';

// @ts-ignore
import HeroImage from '../assets/images/barber_hero_bg_1779554943534.png';

interface HeroProps {
  onScrollTo: (sectionId: string) => void;
}

export default function Hero({ onScrollTo }: HeroProps) {
  const [status, setStatus] = useState(() => getShopStatus());

  useEffect(() => {
    // Refresh shop open status every 30 seconds
    const interval = setInterval(() => {
      setStatus(getShopStatus());
    }, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section
      id="inicio"
      className="relative min-h-[95vh] flex items-center justify-center pt-24 overflow-hidden bg-neutral-950"
    >
      {/* Background Hero Banner Image with atmospheric overlays */}
      <div className="absolute inset-0 z-0 bg-neutral-950">
        <img
          src={HeroImage}
          alt="Barbería El Bastrioui"
          className="w-full h-full object-cover opacity-35"
          referrerPolicy="no-referrer"
          loading="eager"
          fetchPriority="high"
        />
        {/* Gradients to transition smoothly to other sections */}
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/35 to-neutral-950/65" />
        <div className="absolute inset-0 bg-gradient-to-r from-neutral-950/75 via-transparent to-neutral-950/75" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-white py-12 flex flex-col items-center">
        
        {/* Dynamic Shop Hours Badge */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          id="shop-status-badge"
          className={`mb-6 inline-flex items-center space-x-2.5 px-4 py-1.5 rounded-full border text-xs sm:text-sm tracking-wide font-medium bg-neutral-900/90 backdrop-blur ${
            status.isOpen
              ? 'border-emerald-500/40 text-emerald-400'
              : 'border-amber-500/30 text-amber-500'
          }`}
        >
          <span className="relative flex h-2 w-2">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
              status.isOpen ? 'bg-emerald-400' : 'bg-amber-400'
            }`} />
            <span className={`relative inline-flex rounded-full h-2 w-2 ${
              status.isOpen ? 'bg-emerald-500' : 'bg-amber-500'
            }`} />
          </span>
          <span>{status.text}</span>
        </motion.div>

        {/* Vintage Establishment Circle Medallion */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mb-8"
        >
          <div className="w-28 h-28 border border-amber-500 rounded-full mx-auto flex items-center justify-center overflow-hidden bg-neutral-950/90 backdrop-blur p-2 shadow-xl shadow-amber-500/5">
            <div className="w-full h-full border border-neutral-800 rounded-full flex flex-col items-center justify-center p-2">
              <span className="text-[9px] uppercase tracking-[0.3em] text-neutral-500 font-mono">EST.</span>
              <div className="w-10 h-[1.5px] bg-[#c5a059] my-0.5" />
              <span className="font-serif text-amber-500 font-bold text-sm tracking-wider">2023</span>
              <div className="w-10 h-[1.5px] bg-[#c5a059] my-0.5" />
              <span className="text-[7px] uppercase tracking-[0.2em] text-neutral-400 font-semibold font-sans">BARBER</span>
            </div>
          </div>
        </motion.div>

        {/* Brand Main Title */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-serif tracking-normal text-white mb-6 uppercase"
        >
          Barbería <br className="sm:hidden" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-amber-200 to-amber-500 font-bold block mt-2 sm:mt-4">
            El Bastrioui
          </span>
        </motion.h1>

        {/* CTA Button Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.8 }}
          className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto items-center justify-center mb-16"
        >
          <button
            id="hero-reserve-btn"
            onClick={() => onScrollTo('reservar')}
            className="w-full sm:w-auto bg-amber-500 hover:bg-amber-400 text-neutral-950 px-8 py-4 rounded-md font-bold text-sm tracking-widest uppercase transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg hover:shadow-amber-500/20 cursor-pointer"
          >
            Reservar Cita Online
          </button>
          <button
            id="hero-services-btn"
            onClick={() => onScrollTo('servicios')}
            className="w-full sm:w-auto bg-neutral-900/80 hover:bg-neutral-800/80 border border-neutral-700 hover:border-amber-500/50 text-white px-8 py-4 rounded-md font-bold text-sm tracking-widest uppercase transition-all duration-300 blur-none cursor-pointer"
          >
            Nuestros Servicios
          </button>
        </motion.div>

        {/* Fast Address info bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 1 }}
          className="grid grid-cols-1 sm:grid-cols-2 gap-y-4 gap-x-12 p-5 rounded-xl border border-neutral-800/60 bg-neutral-950/65 backdrop-blur max-w-3xl w-full text-left"
        >
          <div className="flex items-center space-x-3 text-sm text-neutral-300">
            <div className="p-2 bg-neutral-900 rounded-lg text-amber-500">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Dirección de la Barbería</p>
              <p className="text-neutral-400 font-mono text-xs mt-0.5">{BARBER_CONTACT.address}</p>
            </div>
          </div>
          <div className="flex items-center space-x-3 text-sm text-neutral-300">
            <div className="p-2 bg-neutral-900 rounded-lg text-amber-500">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="font-semibold text-white">Horario de Apertura</p>
              <p className="text-neutral-400 font-mono text-xs mt-0.5">Lunes a Sábado: 9:00 - 14:00 y 16:00 - 21:00</p>
            </div>
          </div>
        </motion.div>

        {/* Indicator to down-scroll */}
        <motion.div
          animate={{ y: [0, 8, 0] }}
          transition={{ repeat: Infinity, duration: 2 }}
          className="absolute bottom-6 cursor-pointer text-amber-500/80 hover:text-amber-400"
          onClick={() => onScrollTo('servicios')}
        >
          <ChevronDown className="w-8 h-8" />
        </motion.div>
      </div>
    </section>
  );
}
