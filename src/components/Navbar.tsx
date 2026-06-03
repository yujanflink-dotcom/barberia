/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Scissors, Menu, X, Calendar, Phone } from 'lucide-react';
import { BARBER_CONTACT } from '../data';

interface NavbarProps {
  onScrollTo: (sectionId: string) => void;
  activeSection: string;
  savedAppointmentsCount: number;
  onOpenAppointments: () => void;
}

export default function Navbar({ onScrollTo, activeSection, savedAppointmentsCount, onOpenAppointments }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navItems = [
    { id: 'inicio', label: 'Inicio' },
    { id: 'servicios', label: 'Servicios' },
    { id: 'reservar', label: 'Reservar' },
    { id: 'resenas', label: 'Opiniones' },
    { id: 'contacto', label: 'Contacto' },
  ];

  const handleNavItemClick = (id: string) => {
    setIsOpen(false);
    onScrollTo(id);
  };

  return (
    <nav
      id="main-navbar"
      className={`fixed top-0 left-0 w-full z-50 transition-all duration-300 ${
        isScrolled
          ? 'bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800 shadow-lg py-3'
          : 'bg-gradient-to-b from-neutral-950/80 to-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo Branding */}
          <div
            id="nav-brand"
            className="flex items-center space-x-3 cursor-pointer group"
            onClick={() => handleNavItemClick('inicio')}
          >
            <div className="p-2.5 bg-amber-500 rounded-lg text-neutral-950 transition-transform duration-300 group-hover:rotate-12">
              <Scissors className="w-5 h-5 stroke-[2.5]" />
            </div>
            <div>
              <span className="font-serif text-lg tracking-widest text-[#c5a059] uppercase block leading-none font-bold">
                EL BASTRIOUI
              </span>
              <span className="text-[10px] tracking-[0.2em] text-neutral-400 uppercase block font-sans mt-0.5">
                Artesanía en Peluquería & Barbería • Est. 2023
              </span>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center space-x-8">
            {navItems.map((item) => (
              <button
                key={item.id}
                id={`nav-link-${item.id}`}
                onClick={() => handleNavItemClick(item.id)}
                className={`text-sm tracking-widest uppercase transition-all duration-200 cursor-pointer font-medium hover:text-amber-500 ${
                  activeSection === item.id
                    ? 'text-amber-500 relative after:absolute after:-bottom-2 after:left-0 after:w-full after:h-0.5 after:bg-amber-500'
                    : 'text-neutral-300'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {/* Right Action buttons */}
          <div className="hidden lg:flex items-center space-x-4">
            {savedAppointmentsCount > 0 && (
              <button
                id="view-appointments-badge-btn"
                onClick={onOpenAppointments}
                className="relative p-2 text-neutral-300 hover:text-amber-500 transition-colors"
                title="Ver Mis Citas"
              >
                <Calendar className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-neutral-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center animate-pulse">
                  {savedAppointmentsCount}
                </span>
              </button>
            )}

            <button
              id="cta-call-btn"
              onClick={() => handleNavItemClick('reservar')}
              className="bg-amber-500 hover:bg-amber-400 text-neutral-950 px-5 py-2 rounded-md text-sm font-semibold tracking-wider uppercase transition-all duration-300 shadow-md hover:shadow-amber-500/20 shadow-neutral-950/40"
            >
              Pedir Cita
            </button>
          </div>

          {/* Mobile menu trigger button */}
          <div className="flex items-center md:hidden space-x-4">
            {savedAppointmentsCount > 0 && (
              <button
                id="view-appointments-badge-mobile"
                onClick={onOpenAppointments}
                className="relative p-2 text-neutral-300 hover:text-amber-500"
              >
                <Calendar className="w-5 h-5" />
                <span className="absolute -top-1 -right-1 bg-amber-500 text-neutral-950 text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                  {savedAppointmentsCount}
                </span>
              </button>
            )}
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 text-neutral-400 hover:text-white transition-colors"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Drawer */}
      <div
        id="mobile-drawer"
        className={`md:hidden overflow-hidden transition-all duration-300 absolute w-full bg-neutral-950 border-b border-neutral-800 ${
          isOpen ? 'max-h-96 opacity-100 py-4' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        <div className="px-4 space-y-2">
          {navItems.map((item) => (
            <button
              key={item.id}
              id={`mobile-nav-link-${item.id}`}
              onClick={() => handleNavItemClick(item.id)}
              className={`block w-full text-left px-3 py-2.5 rounded-md text-base font-semibold tracking-wider uppercase transition-colors ${
                activeSection === item.id
                  ? 'bg-neutral-900 text-amber-500'
                  : 'text-neutral-300 hover:bg-neutral-900/60'
              }`}
            >
              {item.label}
            </button>
          ))}
          <div className="pt-4 flex flex-col space-y-2 px-3">
            <button
              id="mobile-cta-reservar"
              onClick={() => handleNavItemClick('reservar')}
              className="w-full bg-amber-500 hover:bg-amber-400 text-neutral-950 py-3 rounded-md text-center font-bold tracking-widest uppercase transition-all duration-200"
            >
              Pedir Cita Ahora
            </button>
            <a
              id="mobile-cta-call"
              href={`tel:${BARBER_CONTACT.phone}`}
              className="w-full border border-neutral-700 text-white text-center py-2.5 rounded-md font-medium flex items-center justify-center space-x-2 text-sm"
            >
              <Phone className="w-4 h-4 text-amber-500" />
              <span>Llamar {BARBER_CONTACT.formattedPhone}</span>
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
}
