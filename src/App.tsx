/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Scissors, Calendar, X, Trash2, ExternalLink, RefreshCw, Sparkles, MessageSquare } from 'lucide-react';

import Navbar from './components/Navbar';
import Hero from './components/Hero';
import Services from './components/Services';
import BookingForm from './components/BookingForm';
import Reviews from './components/Reviews';
import MapAndContact from './components/MapAndContact';
import Footer from './components/Footer';

import { SERVICES, BARBER_CONTACT } from './data';
import { Booking } from './types';
import { getWhatsAppBookingLink } from './utils';
import { fetchAllBookings, deleteBookingById } from './api';

export default function App() {
  const [viewMode, setViewMode] = useState<'client' | 'admin'>('client');
  const [activeSection, setActiveSection] = useState('inicio');
  const [isIntroActive, setIsIntroActive] = useState(true);
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([]);
  const [appointmentsCount, setAppointmentsCount] = useState(0);
  const [isAppointmentsOpen, setIsAppointmentsOpen] = useState(false);
  const [bookingsList, setBookingsList] = useState<Booking[]>([]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsIntroActive(false);
    }, 1800);
    return () => clearTimeout(timer);
  }, []);

  const [myBookingIds, setMyBookingIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('elbastrioui_my_booking_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Keep myBookingIds reactive state in sync with localStorage updates
  useEffect(() => {
    const syncLocalIds = () => {
      try {
        const saved = localStorage.getItem('elbastrioui_my_booking_ids');
        setMyBookingIds(saved ? JSON.parse(saved) : []);
      } catch (e) {
        console.error(e);
      }
    };
    window.addEventListener('storage', syncLocalIds);
    const interval = setInterval(syncLocalIds, 800);
    return () => {
      window.removeEventListener('storage', syncLocalIds);
      clearInterval(interval);
    };
  }, []);

  // Compute appointments icon red badge reactive indicator
  useEffect(() => {
    setAppointmentsCount(myBookingIds.length);
  }, [myBookingIds]);

  // Check on mount and URL changes
  useEffect(() => {
    const checkUserRoleAndPath = () => {
      const hash = window.location.hash.toLowerCase();
      const search = window.location.search.toLowerCase();
      const path = window.location.pathname.toLowerCase();

      if (
        hash.includes('jefe') || 
        hash.includes('admin') || 
        search.includes('jefe') || 
        search.includes('admin') || 
        path.startsWith('/jefe') || 
        path.startsWith('/admin')
      ) {
        setViewMode('admin');
      } else {
        setViewMode('client');
      }
    };

    checkUserRoleAndPath();
    window.addEventListener('hashchange', checkUserRoleAndPath);

    const handleScroll = () => {
      const sections = ['inicio', 'servicios', 'reservar', 'contacto'];
      const scrollPos = window.scrollY + 200;

      for (const sectionId of sections) {
        const el = document.getElementById(sectionId);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener('scroll', handleScroll);
    updateAppointmentsList();
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('hashchange', checkUserRoleAndPath);
    };
  }, []);

  const updateAppointmentsList = async () => {
    try {
      const data = await fetchAllBookings();
      setBookingsList(data);
    } catch (e) {
      console.error(e);
    }
  };

  // Periodic background polling loop to synchronize bookings in real-time
  useEffect(() => {
    const intervalId = setInterval(() => {
      updateAppointmentsList();
    }, 5000); // Polling every 5 seconds is perfectly lightweight and keeps reservations 100% in sync
    return () => clearInterval(intervalId);
  }, []);

  const handleScrollTo = (sectionId: string) => {
    const el = document.getElementById(sectionId);
    if (el) {
      const offset = 80; // height of the fixed navbar
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = el.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
      setActiveSection(sectionId);
    }
  };

  // Toggle selection of service and auto-scroll to form to complete scheduling
  const handleToggleService = (serviceId: string) => {
    setSelectedServiceIds((prev) => {
      const isCurrentlySelected = prev.includes(serviceId);
      let updated: string[];
      if (isCurrentlySelected) {
        updated = prev.filter(id => id !== serviceId);
      } else {
        updated = [...prev, serviceId];
      }
      return updated;
    });
  };

  const handleQuickSelectAndScroll = (serviceId: string) => {
    // Add if not already selected
    setSelectedServiceIds((prev) => {
      if (!prev.includes(serviceId)) {
        return [...prev, serviceId];
      }
      return prev;
    });
    // Scroll directly to the booking form
    setTimeout(() => {
      handleScrollTo('reservar');
    }, 100);
  };

  const handleDeleteBookingInDrawer = async (id: string) => {
    if (window.confirm('¿Deseas cancelar definitivamente esta reserva de cita?')) {
      try {
        await deleteBookingById(id);
        const saved = localStorage.getItem('elbastrioui_my_booking_ids');
        const currentIds = saved ? JSON.parse(saved) : [];
        const updated = currentIds.filter((itemId: string) => itemId !== id);
        localStorage.setItem('elbastrioui_my_booking_ids', JSON.stringify(updated));
        setMyBookingIds(updated);
        await updateAppointmentsList();
      } catch (err) {
        console.error(err);
      }
    }
  };

  const getServiceNamesText = (servicesIds: string[]) => {
    return SERVICES.filter(s => servicesIds.includes(s.id))
      .map(s => s.name)
      .join(', ');
  };

  if (viewMode === 'admin') {
    return (
      <div className="bg-neutral-950 font-sans min-h-screen text-white flex flex-col selection:bg-amber-500 selection:text-neutral-950">
        {/* Isolated standalone Admin Header */}
        <header className="bg-neutral-900 border-b border-neutral-800 py-4.5 px-6 sticky top-0 z-40 shadow-md">
          <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center space-x-3">
              <div className="bg-amber-500 text-neutral-950 p-2.5 rounded-lg">
                <Scissors className="w-5 h-5" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-base sm:text-lg font-bold font-serif uppercase tracking-wider text-white">Barbería El Bastrioui</h1>
                <p className="text-[10px] text-amber-500 font-mono tracking-widest uppercase font-semibold">Panel de Control Profesional • Redouan</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <a 
                href="/" 
                onClick={(e) => { 
                  e.preventDefault(); 
                  window.location.hash = '';
                  setViewMode('client'); 
                }}
                className="text-xs font-mono font-bold uppercase tracking-wider text-neutral-400 hover:text-white px-3 py-2 bg-neutral-800 hover:bg-neutral-750 rounded transition-all border border-neutral-700"
              >
                Volver a la Web
              </a>
              <div className="hidden sm:flex items-center space-x-1.5 text-xs text-neutral-500 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-850">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span className="font-mono">Servidor Activo (Rubí)</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard content wrapper */}
        <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8">
          <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4.5 text-xs text-neutral-300 flex items-start gap-3">
            <span className="text-amber-500 text-lg">📱</span>
            <div className="space-y-1">
              <p className="font-semibold text-white uppercase font-mono text-[11px] tracking-wider text-amber-500">Consejo para Redouan:</p>
              <p>Puedes instalar este panel como una **App independiente** en tu móvil o tableta. Abre este enlace en Safari o Chrome desde tu móvil, presiona el botón **Compartir** y selecciona **"Añadir a pantalla de inicio"**.</p>
            </div>
          </div>

          <BookingForm
            selectedServiceIds={selectedServiceIds}
            onToggleService={handleToggleService}
            onBookingCreated={updateAppointmentsList}
            bookingsList={bookingsList}
            forceAdminView={true}
          />
        </main>

        <footer className="bg-neutral-900/60 border-t border-neutral-850 py-4 px-6 text-center text-[10px] font-mono text-neutral-500">
          <span>Barbería El Bastrioui • Canal de Control Exclusivo para el Jefe Redouan (Rubí) • Est. 2023 ©</span>
        </footer>
      </div>
    );
  }

  const clientBookings = bookingsList.filter(b => myBookingIds.includes(b.id));

  return (
    <div className="bg-neutral-950 font-sans min-h-screen selection:bg-amber-500 selection:text-neutral-950">
      
      {/* Intro/Splash Loading screen with elegant logo background */}
      <AnimatePresence>
        {isIntroActive && (
          <motion.div
            id="intro-loader"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.6, ease: 'easeIn' } }}
            className="fixed inset-0 bg-neutral-950 z-[100] flex flex-col items-center justify-center text-white px-6 pointer-events-none"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: 'easeOut' }}
              className="text-center flex flex-col items-center"
            >
              <div className="p-5 bg-neutral-900 border border-amber-500/30 text-amber-500 rounded-full mb-6 shadow-xl shadow-amber-500/5 flex items-center justify-center">
                <Scissors className="w-12 h-12 stroke-[2] animate-pulse" />
              </div>
              <h1 className="font-serif text-3xl sm:text-4xl tracking-[0.3em] text-[#c5a059] uppercase font-bold text-center leading-none">
                EL BASTRIOUI
              </h1>
              <div className="w-20 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500 to-transparent my-4" />
              <p className="text-xs tracking-[0.25em] text-neutral-400 uppercase font-mono font-medium">
                Peluquería & Barbería
              </p>
              <p className="text-[9px] tracking-[0.1em] text-neutral-500 uppercase font-mono mt-3">
                Est. 2023 • Rubí
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation Layer */}
      <Navbar
        onScrollTo={handleScrollTo}
        activeSection={activeSection}
        savedAppointmentsCount={appointmentsCount}
        onOpenAppointments={() => setIsAppointmentsOpen(true)}
      />

      {/* Hero Display */}
      <Hero onScrollTo={handleScrollTo} />

      {/* Services Grid Display */}
      <Services
        onSelectService={handleQuickSelectAndScroll}
        selectedServiceIds={selectedServiceIds}
      />

      {/* Booking Form Scheduler */}
      <BookingForm
        selectedServiceIds={selectedServiceIds}
        onToggleService={handleToggleService}
        onBookingCreated={updateAppointmentsList}
        bookingsList={bookingsList}
      />

      {/* Map, Directions and Working Hours */}
      <MapAndContact />

      {/* Professional Footer */}
      <Footer onScrollTo={handleScrollTo} />

      {/* SIDE DRAWER FOR ACTIVE APPOINTMENTS (SLIDE-OVER UI) */}
      <AnimatePresence>
        {isAppointmentsOpen && (
          <>
            {/* Backdrop cover overlay */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsAppointmentsOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 cursor-pointer"
            />

            {/* Slide over layout container */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 h-full w-full sm:max-w-md bg-neutral-950 border-l border-neutral-800 p-6 shadow-2xl z-50 text-white flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between border-b border-neutral-800 pb-4 mb-6">
                  <div className="flex items-center space-x-2">
                    <Calendar className="w-5 h-5 text-amber-500 animate-bounce" />
                    <h3 className="text-xl font-serif text-white font-bold uppercase tracking-wider">Mis Citas Agendadas</h3>
                  </div>
                  <button
                    id="close-appointments-drawer"
                    onClick={() => setIsAppointmentsOpen(false)}
                    className="p-1 px-2 hover:bg-neutral-900 border border-neutral-800 rounded text-neutral-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                 {clientBookings.length === 0 ? (
                  <div className="text-center py-16 space-y-4">
                    <p className="text-neutral-500 text-sm italic">No tienes ninguna cita agendada todavía.</p>
                    <button
                      id="drawer-book-link"
                      onClick={() => {
                        setIsAppointmentsOpen(false);
                        handleScrollTo('reservar');
                      }}
                      className="bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs uppercase font-bold tracking-widest px-4 py-2.5 rounded transition-all"
                    >
                      Reservar Ahora
                    </button>
                  </div>
                ) : (
                  <p className="text-neutral-400 text-xs mb-4">
                    Mostrando citas guardadas en este navegador. Se aconseja re-confirmar tu cita presionando el enlace de WhatsApp.
                  </p>
                )}

                {/* Tickets listing stream */}
                <div className="space-y-4 overflow-y-auto max-h-[70vh] pr-1">
                  {clientBookings.map((bk) => (
                    <div
                      key={bk.id}
                      className="p-4 rounded-xl bg-neutral-900 border border-neutral-850 relative space-y-3"
                    >
                      <button
                        id={`drawer-delete-btn-${bk.id}`}
                        onClick={() => handleDeleteBookingInDrawer(bk.id)}
                        className="absolute top-4 right-4 text-neutral-500 hover:text-red-400 p-1 rounded hover:bg-neutral-800 transition-colors"
                        title="Cancelar cita"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <div>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest block">Código #{bk.id.toUpperCase()}</span>
                        <h4 className="text-sm font-semibold text-white mt-1 pr-6 leading-normal">
                          {getServiceNamesText(bk.services)}
                        </h4>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-xs border-y border-neutral-850 py-2 font-mono">
                        <div>
                          <span className="text-[9px] text-neutral-500 uppercase block">fecha</span>
                          <span className="text-white font-medium">{bk.date}</span>
                        </div>
                        <div>
                          <span className="text-[9px] text-neutral-500 uppercase block">hora</span>
                          <span className="text-white font-medium">{bk.time}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs font-mono">
                        <span className="text-neutral-400">Precio Total Estimado:</span>
                        <span className="text-amber-500 font-serif text-sm font-bold">{bk.totalPrice}€</span>
                      </div>

                      <div className="pt-1.5 flex gap-2.5">
                        <a
                          id={`drawer-whatsapp-confirm-${bk.id}`}
                          href={getWhatsAppBookingLink({
                            name: bk.name,
                            phone: bk.phone,
                            date: bk.date,
                            time: bk.time,
                            servicesText: getServiceNamesText(bk.services),
                            price: bk.totalPrice,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center space-x-1.5 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 rounded text-[10px] uppercase font-bold tracking-wider text-white transition-colors cursor-pointer"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>Confirmar WhatsApp</span>
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Drawer footer details */}
              <div className="border-t border-neutral-800 pt-4 mt-6 text-center text-[10px] font-mono text-neutral-600">
                <span className="block font-semibold">Barbería El Bastrioui</span>
                <span className="block mt-0.5">Est. 2023 • Carrer de Lumière, 6 local 5</span>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}
