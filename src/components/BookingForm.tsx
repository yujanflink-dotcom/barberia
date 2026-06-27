/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Calendar,
  Clock,
  User,
  Phone,
  FileText,
  AlertCircle,
  CheckCircle2,
  Trash2,
  ExternalLink,
  MessageSquare,
  Mail,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  Lock,
  Unlock,
  Settings,
  Search,
  Users,
  BarChart3,
  Plus,
  QrCode,
  Download,
  Share2,
  Copy
} from 'lucide-react';
import { SERVICES, BARBER_CONTACT } from '../data';
import { Booking, Service } from '../types';
import { generateTimeSlots, getWhatsAppBookingLink, getMailtoBookingLink } from '../utils';
import { fetchAllBookings, createNewBooking, deleteBookingById } from '../api';

interface BookingFormProps {
  selectedServiceIds: string[];
  onToggleService: (id: string) => void;
  onBookingCreated: () => void;
  bookingsList: Booking[];
  forceAdminView?: boolean;
}

export default function BookingForm({ selectedServiceIds, onToggleService, onBookingCreated, bookingsList, forceAdminView = false }: BookingFormProps) {
  // Input Form States
  const [userName, setUserName] = useState('');
  const [userPhone, setUserPhone] = useState('');
  const [bookingDate, setBookingDate] = useState('');
  const [bookingTime, setBookingTime] = useState('');
  const [notes, setNotes] = useState('');
  const [rgpdConsent, setRgpdConsent] = useState(false);

  // UI Error & Receipt States
  const [errorMessage, setErrorMessage] = useState('');
  const [successBooking, setSuccessBooking] = useState<Booking | null>(null);
  const [allBookings, setAllBookings] = useState<Booking[]>([]);

  // Track client's own booking IDs locally for privacy in "Mis Reservas"
  const [myBookingIds, setMyBookingIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem('elbastrioui_my_booking_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Backward compatibility migration for users who have old test booking keys in localStorage
  useEffect(() => {
    try {
      if (!localStorage.getItem('elbastrioui_my_booking_ids')) {
        const localBookings = localStorage.getItem('elbastrioui_bookings');
        if (localBookings) {
          const parsed = JSON.parse(localBookings);
          if (Array.isArray(parsed)) {
            const ids = parsed.map((b: any) => b.id);
            localStorage.setItem('elbastrioui_my_booking_ids', JSON.stringify(ids));
            setMyBookingIds(ids);
          }
        }
      }
    } catch (e) {
      console.error("Migration check failed:", e);
    }
  }, []);

  const saveMyBookingId = (id: string) => {
    try {
      const saved = localStorage.getItem('elbastrioui_my_booking_ids');
      const currentIds = saved ? JSON.parse(saved) : [];
      if (!currentIds.includes(id)) {
        const updated = [...currentIds, id];
        setMyBookingIds(updated);
        localStorage.setItem('elbastrioui_my_booking_ids', JSON.stringify(updated));
      }
    } catch (e) {
      console.error("Error saving booking id locally:", e);
    }
  };

  const removeMyBookingId = (id: string) => {
    try {
      const saved = localStorage.getItem('elbastrioui_my_booking_ids');
      const currentIds = saved ? JSON.parse(saved) : [];
      const updated = currentIds.filter((item: string) => item !== id);
      setMyBookingIds(updated);
      localStorage.setItem('elbastrioui_my_booking_ids', JSON.stringify(updated));
    } catch (e) {
      console.error("Error removing booking id locally:", e);
    }
  };

  // Owner/Admin Panel States
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(() => {
    try {
      return localStorage.getItem('elbastrioui_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [adminActiveTab, setAdminActiveTab] = useState<'list' | 'block' | 'manual' | 'stats' | 'qr'>('list');
  const [adminSearch, setAdminSearch] = useState('');
  const [adminError, setAdminError] = useState('');
  const [adminSuccess, setAdminSuccess] = useState('');
  const [adminDateFilter, setAdminDateFilter] = useState<'all' | 'today' | 'tomorrow' | 'upcoming'>('all');

  useEffect(() => {
    if (forceAdminView && localStorage.getItem('elbastrioui_admin_auth') === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, [forceAdminView]);

  // Form states inside owner console for manual appointments & blocks
  const [manName, setManName] = useState('');
  const [manPhone, setManPhone] = useState('');
  const [manDate, setManDate] = useState('');
  const [manTime, setManTime] = useState('');
  const [manSelectedServices, setManSelectedServices] = useState<string[]>([]);
  const [manNotes, setManNotes] = useState('');
  const [blockDuration, setBlockDuration] = useState(30);

  // Helper inside Component body to compute booking duration and overlaps
  const getBookingDuration = (b: Booking) => {
    const isBlock = b.phone === 'ORGANIZACIÓN' || (b.id && b.id.startsWith('block-'));
    if (isBlock && b.totalDuration && b.totalDuration > 0) {
      return b.totalDuration;
    }
    // Normal client appointments are restricted to 30 min (1 square/slot)
    return 30;
  };

  const isSlotBooked = (slotTime: string, checkDate: string = bookingDate) => {
    if (!checkDate) return false;
    
    const [slotH, slotM] = slotTime.split(':').map(Number);
    const slotMinutes = slotH * 60 + slotM;

    return allBookings.some((b) => {
      if (b.date !== checkDate) return false;
      
      const [bH, bM] = b.time.split(':').map(Number);
      const bStartMinutes = bH * 60 + bM;
      const bDuration = getBookingDuration(b);
      const bEndMinutes = bStartMinutes + bDuration;

      return slotMinutes >= bStartMinutes && slotMinutes < bEndMinutes;
    });
  };

  const requestedServicesStats = () => {
    const counts: Record<string, number> = {};
    allBookings.forEach((b) => {
      if (b.services) {
        b.services.forEach((sId) => {
          counts[sId] = (counts[sId] || 0) + 1;
        });
      }
    });
    let maxId = '';
    let maxCount = 0;
    SERVICES.forEach((s) => {
      const c = counts[s.id] || 0;
      if (c > maxCount) {
        maxCount = c;
        maxId = s.name;
      }
    });
    return maxCount > 0 ? `${maxId} (${maxCount} veces)` : 'Ninguno aún';
  };

  const handleToggleManualService = (id: string) => {
    setManSelectedServices((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleQuickBlock = async (dayTarget: 'today' | 'tomorrow' | 'manual', type: 'full' | 'morning_only') => {
    setAdminError('');
    setAdminSuccess('');

    let targetDateStr = '';
    const today = new Date();
    
    if (dayTarget === 'today') {
      targetDateStr = formatDateString(today);
    } else if (dayTarget === 'tomorrow') {
      const tomorrow = new Date(Date.now() + 86450000);
      targetDateStr = formatDateString(tomorrow);
    } else {
      if (!manDate) {
        setAdminError('Por favor, selecciona primero un día en el campo "Día del Bloqueo" abajo.');
        return;
      }
      targetDateStr = manDate;
    }

    const defaultReason = type === 'full' 
      ? 'Estamos Cerrados por Imprevisto 🚫' 
      : 'Abrimos Más Tarde hoy ⏳';

    const reasonPrompt = window.prompt(
      type === 'full'
        ? `¿Confirmas cerrar este día completo (${targetDateStr})? Inserta un motivo si quieres:`
        : `¿Confirmas cerrar solo por la mañana para abrir tarde (${targetDateStr})? Inserta un motivo si quieres:`,
      defaultReason
    );

    if (reasonPrompt === null) {
      // User cancelled
      return;
    }

    const finalMotive = reasonPrompt.trim() || defaultReason;

    if (type === 'full') {
      // Create a 12 hour block starting at 09:00 (covers 09:00 to 21:00)
      const fullDayBlock: Booking = {
        id: 'block-full-' + Math.random().toString(36).substring(2, 6),
        name: `🚫 ${finalMotive}`,
        phone: 'ORGANIZACIÓN',
        date: targetDateStr,
        time: '09:00',
        services: [],
        notes: 'Cierre total de jornada por un imprevisto administrativo.',
        totalPrice: 0,
        totalDuration: 720, // 12 hours
        createdAt: Date.now()
      };

      try {
        await createNewBooking(fullDayBlock);
        onBookingCreated();
        setAdminSuccess(`¡Día ${targetDateStr} marcado como CERRADO COMPLETO correctamente!`);
      } catch (err: any) {
        setAdminError(err?.message || 'Error al guardar el cierre total del día.');
      }
    } else {
      // 5 hours block (09:00 - 14:00)
      const morningBlock: Booking = {
        id: 'block-morning-' + Math.random().toString(36).substring(2, 6),
        name: `⏳ ${finalMotive}`,
        phone: 'ORGANIZACIÓN',
        date: targetDateStr,
        time: '09:00',
        services: [],
        notes: 'Cargado vía panel para cerrar la mañana. Abrimos a las 16:00 h.',
        totalPrice: 0,
        totalDuration: 300, // 5 hours block (09:00 - 14:00)
        createdAt: Date.now()
      };

      try {
        await createNewBooking(morningBlock);
        onBookingCreated();
        setAdminSuccess(`¡Mañana del ${targetDateStr} cerrada correctamente! Abriremos a partir de las 16:00 h.`);
      } catch (err: any) {
        setAdminError(err?.message || 'Error al guardar el cierre de la mañana.');
      }
    }
  };

  // Calculate current date constraint (min values)
  const [minDateString, setMinDateString] = useState('');

  // Calendar constants and localized headings
  const monthsNames = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const weekdays = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];

  // Calendar Navigation States
  const [viewDate, setViewDate] = useState(() => {
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  });

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isPrevMonthDisabled = () => {
    const today = new Date();
    return viewDate.getFullYear() <= today.getFullYear() && viewDate.getMonth() <= today.getMonth();
  };

  const getCalendarDays = () => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // 1st day of month day of week: Sunday = 0, Monday = 1, ..., Saturday = 6
    const firstDayOfWeek = new Date(year, month, 1).getDay();
    // Shift so Monday is 0, Sunday is 6
    const startOffset = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const result = [];

    // Prev Month Days Padding
    for (let i = startOffset - 1; i >= 0; i--) {
      const prevDate = new Date(year, month - 1, daysInPrevMonth - i);
      result.push({
        date: prevDate,
        isCurrentMonth: false,
        dayNum: daysInPrevMonth - i,
      });
    }

    // Current Month Days
    for (let i = 1; i <= daysInMonth; i++) {
      const currDate = new Date(year, month, i);
      result.push({
        date: currDate,
        isCurrentMonth: true,
        dayNum: i,
      });
    }

    // Next Month Days Padding
    const remaining = 42 - result.length;
    for (let i = 1; i <= remaining; i++) {
      const nextDate = new Date(year, month + 1, i);
      result.push({
        date: nextDate,
        isCurrentMonth: false,
        dayNum: i,
      });
    }

    return result;
  };

  const formatDateString = (dt: Date) => {
    const yyyy = dt.getFullYear();
    const mm = String(dt.getMonth() + 1).padStart(2, '0');
    const dd = String(dt.getDate()).padStart(2, '0');
    return `${yyyy}-${mm}-${dd}`;
  };

  const isPastDate = (dt: Date) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(dt.getFullYear(), dt.getMonth(), dt.getDate());
    return checkDate < today;
  };

  const isDateSunday = (dt: Date) => {
    return dt.getDay() === 0;
  };

  const handleDaySelect = (dt: Date) => {
    const dStr = formatDateString(dt);
    setBookingDate(dStr);
    setBookingTime(''); // Reset time selection in case date is changed
    setErrorMessage('');
  };

  useEffect(() => {
    // Prevent booking in the past
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    setMinDateString(`${yyyy}-${mm}-${dd}`);
  }, []);

  useEffect(() => {
    setAllBookings(bookingsList);
  }, [bookingsList]);

  // Compute stats of selected services
  const selectedServices = SERVICES.filter(s => selectedServiceIds.includes(s.id));
  const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
  const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

  // Check if date represents Sunday
  const isSunday = (dateStr: string) => {
    if (!dateStr) return false;
    const dateParsed = new Date(dateStr);
    return dateParsed.getDay() === 0; // Sunday index is 0
  };

  const timeSlots = generateTimeSlots();

  // Split time slots into morning shifts and afternoon shifts
  const morningSlots = timeSlots.filter(t => parseInt(t.split(':')[0]) < 15);
  const afternoonSlots = timeSlots.filter(t => parseInt(t.split(':')[0]) >= 15);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    if (selectedServiceIds.length === 0) {
      setErrorMessage('Debes seleccionar al menos un servicio para reservarlo.');
      return;
    }
    if (!bookingDate) {
      setErrorMessage('Es obligatorio elegir una fecha para tu cita.');
      return;
    }
    if (isSunday(bookingDate)) {
      setErrorMessage('La barbería cierra los domingos. Por favor selecciona otro día.');
      return;
    }
    if (!bookingTime) {
      setErrorMessage('Por favor, selecciona una hora para la cita.');
      return;
    }
    if (isSlotBooked(bookingTime)) {
      setErrorMessage('Lo sentimos, este horario ya está reservado por otro cliente. Por favor, selecciona otra hora o cambia de fecha.');
      return;
    }
    if (!userName.trim()) {
      setErrorMessage('Es obligatorio indicar tu nombre.');
      return;
    }
    const phoneRegex = /^[0-9\s+]{9,15}$/;
    if (!phoneRegex.test(userPhone.trim())) {
      setErrorMessage('Por favor introduce un número de móvil válido (mínimo 9 dígitos).');
      return;
    }
    if (!rgpdConsent) {
      setErrorMessage('Debes aceptar la política de privacidad y el tratamiento de datos para poder reservar de forma segura.');
      return;
    }

    // Save Booking
    const newBooking: Booking = {
      id: Math.random().toString(36).substring(2, 9),
      name: userName.trim(),
      phone: userPhone.trim(),
      date: bookingDate,
      time: bookingTime,
      services: selectedServiceIds,
      notes: notes.trim(),
      totalPrice,
      totalDuration,
      createdAt: Date.now(),
    };

    createNewBooking(newBooking).then((saved) => {
      saveMyBookingId(saved.id);
      setSuccessBooking(saved);
      onBookingCreated(); // alert App.tsx
    }).catch((err) => {
      setErrorMessage(err?.message || 'No pudimos guardar tu cita en el servidor, por favor inténtalo de nuevo.');
    });
  };

  const handleDeleteBooking = async (id: string, e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    if (window.confirm('¿Estás seguro de que deseas cancelar esta cita?')) {
      await deleteBookingById(id);
      removeMyBookingId(id);
      onBookingCreated(); // alert App.tsx
    }
  };

  const getServicesNames = (servicesIds: string[]) => {
    return SERVICES.filter(s => servicesIds.includes(s.id))
      .map(s => s.name)
      .join(', ');
  };

  const resetFormAfterSuccess = () => {
    setSuccessBooking(null);
    setUserName('');
    setUserPhone('');
    setBookingDate('');
    setBookingTime('');
    setNotes('');
    setRgpdConsent(false);
    // clear selected services in App
    selectedServiceIds.forEach(id => onToggleService(id));
  };

  if (forceAdminView) {
    return (
      <div id="owner-administration-panel" className="max-w-5xl mx-auto py-2 text-white">
        {adminError && (
          <div className="mb-6 p-4 bg-red-950/40 border border-red-500/20 text-red-350 rounded-lg text-xs font-mono flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{adminError}</span>
          </div>
        )}
        {adminSuccess && (
          <div className="mb-6 p-4 bg-emerald-950/40 border border-emerald-500/20 text-emerald-355 rounded-lg text-xs font-mono flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{adminSuccess}</span>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl"
        >
          <div className="flex flex-wrap border-b border-neutral-850 bg-neutral-900/40 font-mono text-xs overflow-x-auto">
            <button
              type="button"
              onClick={() => { setAdminActiveTab('list'); setAdminError(''); setAdminSuccess(''); }}
              className={`flex-1 min-w-[120px] py-4 px-4 text-center font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                adminActiveTab === 'list'
                  ? 'border-amber-500 text-amber-500 bg-neutral-950 px-2'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              📂 Listado Citas ({allBookings.length})
            </button>
            <button
              type="button"
              onClick={() => { setAdminActiveTab('block'); setAdminError(''); setAdminSuccess(''); }}
              className={`flex-1 min-w-[120px] py-4 px-4 text-center font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                adminActiveTab === 'block'
                  ? 'border-amber-500 text-amber-500 bg-neutral-950 px-2'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              🚫 Bloquear Horas
            </button>
            <button
              type="button"
              onClick={() => { setAdminActiveTab('manual'); setAdminError(''); setAdminSuccess(''); }}
              className={`flex-1 min-w-[120px] py-4 px-4 text-center font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                adminActiveTab === 'manual'
                  ? 'border-amber-500 text-amber-500 bg-neutral-950 px-2'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              ➕ Cita Manual
            </button>
            <button
              type="button"
              onClick={() => { setAdminActiveTab('stats'); setAdminError(''); setAdminSuccess(''); }}
              className={`flex-1 min-w-[120px] py-4 px-4 text-center font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                adminActiveTab === 'stats'
                  ? 'border-amber-500 text-amber-500 bg-neutral-950 px-2'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              📊 Estadísticas
            </button>
            <button
              type="button"
              onClick={() => { setAdminActiveTab('qr'); setAdminError(''); setAdminSuccess(''); }}
              className={`flex-1 min-w-[120px] py-4 px-4 text-center font-bold uppercase tracking-wider transition-all border-b-2 cursor-pointer ${
                adminActiveTab === 'qr'
                  ? 'border-amber-500 text-amber-500 bg-neutral-950 px-2'
                  : 'border-transparent text-neutral-400 hover:text-white hover:bg-neutral-900/50'
              }`}
            >
              📱 Código QR / Compartir
            </button>
          </div>

          <div className="p-6 sm:p-8">
            {adminActiveTab === 'list' && (() => {
              const todayStr = formatDateString(new Date());
              const tomorrowStr = formatDateString(new Date(Date.now() + 86450000));
              
              const filteredList = allBookings
                .filter((bk) => {
                  const term = adminSearch.toLowerCase();
                  const matchesSearch = 
                    bk.name.toLowerCase().includes(term) ||
                    bk.phone.toLowerCase().includes(term) ||
                    bk.id.toLowerCase().includes(term);
                    
                  if (!matchesSearch) return false;
                  
                  if (adminDateFilter === 'today') {
                    return bk.date === todayStr;
                  } else if (adminDateFilter === 'tomorrow') {
                    return bk.date === tomorrowStr;
                  } else if (adminDateFilter === 'upcoming') {
                    return bk.date >= todayStr;
                  }
                  return true;
                })
                .sort((a, b) => {
                  if (a.date !== b.date) {
                    return a.date.localeCompare(b.date);
                  }
                  return a.time.localeCompare(b.time);
                });

              const countTotal = allBookings.length;
              const countToday = allBookings.filter(b => b.date === todayStr).length;
              const countTomorrow = allBookings.filter(b => b.date === tomorrowStr).length;
              const countUpcoming = allBookings.filter(b => b.date >= todayStr).length;

              return (
                <div className="space-y-6">
                  {/* Top Bar: Search and Backup */}
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-neutral-850 pb-4">
                    <div className="relative w-full md:max-w-xs">
                      <input
                        type="text"
                        value={adminSearch}
                        onChange={(e) => setAdminSearch(e.target.value)}
                        placeholder="Buscar cliente, móvil o ID..."
                        className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-2.5 pl-9 text-xs font-mono text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                      />
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                    </div>
                    
                    <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto justify-end">
                      <button
                        type="button"
                        onClick={() => {
                          try {
                            const dataStr = JSON.stringify(allBookings, null, 2);
                            const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
                            const exportFileDefaultName = `backup-citas-bastrioui-${new Date().toISOString().split('T')[0]}.json`;
                            
                            const linkElement = document.createElement('a');
                            linkElement.setAttribute('href', dataUri);
                            linkElement.setAttribute('download', exportFileDefaultName);
                            linkElement.click();
                            setAdminSuccess('¡Copia de seguridad descargada correctamente! Tienes todas las citas a salvo.');
                          } catch (e) {
                            setAdminError('Error al exportar la copia de seguridad.');
                          }
                        }}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-350 hover:text-white rounded text-xs transition-all font-mono font-bold cursor-pointer"
                      >
                        <Download className="w-3.5 h-3.5" />
                        Copia de Seguridad (JSON)
                      </button>
                      <button
                        type="button"
                        onClick={() => onBookingCreated()}
                        className="p-1.5 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-amber-500 rounded hover:bg-neutral-850 cursor-pointer transition-all"
                        title="Sincronizar ahora"
                      >
                        <RefreshCw className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs by Date with Badges */}
                  <div className="flex flex-wrap gap-2 p-1 bg-neutral-900/60 rounded-xl border border-neutral-850 max-w-full">
                    <button
                      type="button"
                      onClick={() => setAdminDateFilter('all')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        adminDateFilter === 'all'
                          ? 'bg-amber-500 text-neutral-950 shadow'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      <span>Todas</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans ${adminDateFilter === 'all' ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>{countTotal}</span>
                    </button>
                    
                    <button
                      type="button"
                      onClick={() => setAdminDateFilter('today')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        adminDateFilter === 'today'
                          ? 'bg-amber-500 text-neutral-950 shadow'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      <span className="flex items-center gap-1">🕒 Hoy</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans ${adminDateFilter === 'today' ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>{countToday}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminDateFilter('tomorrow')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        adminDateFilter === 'tomorrow'
                          ? 'bg-amber-500 text-neutral-950 shadow'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      <span>Mañana</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans ${adminDateFilter === 'tomorrow' ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>{countTomorrow}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setAdminDateFilter('upcoming')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer ${
                        adminDateFilter === 'upcoming'
                          ? 'bg-amber-500 text-neutral-950 shadow'
                          : 'text-neutral-400 hover:text-white hover:bg-neutral-800'
                      }`}
                    >
                      <span>Futuras</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-sans ${adminDateFilter === 'upcoming' ? 'bg-neutral-950/20 text-neutral-950' : 'bg-neutral-800 text-neutral-400'}`}>{countUpcoming}</span>
                    </button>
                  </div>

                  {filteredList.length === 0 ? (
                    <div className="text-center py-12 bg-neutral-900/10 border border-dashed border-neutral-800 rounded-xl">
                      <p className="text-neutral-500 italic text-sm">No se encontraron citas con el filtro seleccionado.</p>
                    </div>
                  ) : (
                    <>
                      {/* MOBILE GRID VIEW (Highly visual cards, perfect for Redouan on mobile) */}
                      <div className="block sm:hidden space-y-4">
                        {filteredList.map((bk) => {
                          const isBlock = bk.name.startsWith('🚫');
                          const isToday = bk.date === todayStr;
                          const isTomorrow = bk.date === tomorrowStr;

                          return (
                            <div
                              key={bk.id}
                              className={`p-4 rounded-xl border relative flex flex-col space-y-3 shadow-md ${
                                isBlock
                                  ? 'bg-red-950/15 border-red-900/50 text-red-100'
                                  : 'bg-neutral-900/90 border-neutral-800 text-neutral-200'
                              }`}
                            >
                              {/* Header Card: date & time badge */}
                              <div className="flex items-center justify-between border-b border-neutral-800 pb-2.5">
                                <span className="font-mono text-[10px] text-neutral-500 font-bold uppercase">
                                  #{bk.id.substring(0, 5).toUpperCase()}
                                </span>
                                <div className="flex items-center space-x-1.5">
                                  {isToday && (
                                    <span className="bg-amber-500 text-neutral-950 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded animate-pulse">
                                      HOY
                                    </span>
                                  )}
                                  {isTomorrow && (
                                    <span className="bg-blue-600 text-white text-[9px] font-mono font-bold px-1.5 py-0.5 rounded">
                                      MAÑA
                                    </span>
                                  )}
                                  <span className="bg-amber-500/10 text-amber-500 text-xs font-mono font-bold px-2 py-0.5 rounded border border-amber-500/20">
                                    {bk.date}
                                  </span>
                                  <span className="bg-white text-neutral-950 text-xs font-mono font-black px-2 py-0.5 rounded">
                                    {bk.time}
                                  </span>
                                </div>
                              </div>

                              {/* Customer and phone info */}
                              <div className="space-y-1">
                                <div className="font-serif font-bold text-white text-base">
                                  {bk.name}
                                </div>
                                <div className="text-xs text-neutral-400 font-mono flex items-center justify-between gap-2">
                                  <span>📞 {bk.phone}</span>
                                  {!isBlock && (
                                    <div className="flex gap-2">
                                      <a
                                        href={`tel:${bk.phone}`}
                                        className="p-1 px-2 bg-neutral-800 hover:bg-neutral-750 text-neutral-300 rounded hover:text-white flex items-center gap-1 text-[10px] border border-neutral-700"
                                      >
                                        Llamar
                                      </a>
                                      <a
                                        href={getWhatsAppBookingLink({
                                          name: bk.name,
                                          phone: bk.phone,
                                          date: bk.date,
                                          time: bk.time,
                                          servicesText: getServicesNames(bk.services),
                                          price: bk.totalPrice,
                                        })}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-1 px-2 bg-emerald-600/20 border border-emerald-500/35 hover:bg-emerald-600/30 text-emerald-400 font-semibold rounded flex items-center gap-1 text-[10px]"
                                      >
                                        Chat
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Services info & amount */}
                              <div className="bg-neutral-950/60 p-2.5 rounded-lg border border-neutral-850/60 space-y-1 text-xs">
                                <span className="text-neutral-500 text-[10px] uppercase font-mono block">Servicios Elegidos</span>
                                <div className="text-white font-medium">
                                  {isBlock ? (
                                    <span className="text-amber-500 font-mono font-bold uppercase text-[10px]">🚫 Horario Bloqueado</span>
                                  ) : (
                                    getServicesNames(bk.services)
                                  )}
                                </div>
                                {bk.notes && (
                                  <div className="text-[10px] text-neutral-400 pt-1.5 mt-1 border-t border-neutral-900 italic text-neutral-350">
                                    Nota: "{bk.notes}"
                                  </div>
                                )}
                              </div>

                              {/* Footer control buttons */}
                              <div className="flex items-center justify-between pt-1 font-mono text-xs">
                                <div className="flex items-center space-x-1">
                                  <span className="text-[10px] text-neutral-500 uppercase">Caja:</span>
                                  <span className="font-serif font-black text-sm text-emerald-400">{bk.totalPrice}€</span>
                                </div>
                                
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (window.confirm(`¿Seguro que deseas ELIMINAR/CANCELAR esta reserva de ${bk.name}? Se liberará el horario de forma inmediata.`)) {
                                      await deleteBookingById(bk.id);
                                      onBookingCreated();
                                      setAdminSuccess(`¡La reserva de ${bk.name} ha sido eliminada con éxito! Horas liberadas.`);
                                    }
                                  }}
                                  className="py-1.5 px-3 bg-red-600/10 hover:bg-red-650/20 text-red-400 border border-red-500/20 rounded flex items-center gap-1 font-bold text-[10px]"
                                  title="Liberar hora"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                  <span>Liberar Hora</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>

                      {/* DESKTOP TABLE VIEW (Shown on tablet and computer) */}
                      <div className="hidden sm:block overflow-x-auto rounded-xl border border-neutral-850">
                        <table className="w-full text-left text-xs sm:text-sm font-sans">
                          <thead>
                            <tr className="border-b border-neutral-850 bg-neutral-900/20 text-neutral-500 text-[10px] uppercase font-mono tracking-widest">
                              <th className="py-3.5 px-3">ID</th>
                              <th className="py-3.5 px-3">Cliente / Móvil</th>
                              <th className="py-3.5 px-3">Servicios</th>
                              <th className="py-3.5 px-3 text-center">Hora</th>
                              <th className="py-3.5 px-3">Fecha</th>
                              <th className="py-3.5 px-3 text-right">Monto</th>
                              <th className="py-3.5 px-3 text-center">Acciones</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-neutral-900 font-mono text-[11px] sm:text-xs">
                            {filteredList.map((bk) => {
                              const isBlock = bk.name.startsWith('🚫');
                              const isToday = bk.date === todayStr;

                              return (
                                <tr
                                  key={bk.id}
                                  className={`hover:bg-neutral-900/40 transition-colors ${
                                    isBlock ? 'bg-red-950/5 text-red-300/90' : 'text-neutral-300'
                                  }`}
                                >
                                  <td className="py-3.5 px-3 font-bold font-mono text-neutral-500">
                                    #{bk.id.substring(0, 5).toUpperCase()}
                                  </td>
                                  <td className="py-3.5 px-3">
                                    <div className="font-semibold text-white text-xs font-sans flex items-center gap-1.5">
                                      {bk.name}
                                      {isToday && (
                                        <span className="bg-amber-500 text-neutral-950 text-[8px] font-mono font-extrabold px-1.5 py-0.2 rounded animate-pulse">HOY</span>
                                      )}
                                    </div>
                                    <div className="text-[10px] text-neutral-400 mt-0.5 flex items-center gap-2">
                                      <span>{bk.phone}</span>
                                      {!isBlock && (
                                        <>
                                          •
                                          <a href={`tel:${bk.phone}`} className="text-neutral-500 hover:text-white underline">Llamar</a>
                                          •
                                          <a
                                            href={getWhatsAppBookingLink({
                                              name: bk.name,
                                              phone: bk.phone,
                                              date: bk.date,
                                              time: bk.time,
                                              servicesText: getServicesNames(bk.services),
                                              price: bk.totalPrice,
                                            })}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="text-emerald-500 hover:text-emerald-400"
                                          >WhatsApp</a>
                                        </>
                                      )}
                                    </div>
                                    {bk.notes && (
                                      <div className="text-[10px] text-neutral-550 mt-1 italic max-w-[200px] truncate leading-tight" title={bk.notes}>
                                        "{bk.notes}"
                                      </div>
                                    )}
                                  </td>
                                  <td className="py-3.5 px-3 max-w-[150px] truncate-2-lines font-sans">
                                    {isBlock ? (
                                      <span className="text-amber-500 font-semibold uppercase text-[10px]">Bloqueo Administrativo</span>
                                    ) : (
                                      getServicesNames(bk.services)
                                    )}
                                  </td>
                                  <td className="py-3.5 px-3 text-center text-white font-bold">
                                    {bk.time}
                                  </td>
                                  <td className="py-3.5 px-3 font-bold">
                                    <span className="text-amber-500">{bk.date}</span>
                                  </td>
                                  <td className="py-3.5 px-3 text-right text-emerald-400 font-bold text-sm">
                                    {bk.totalPrice}€
                                  </td>
                                  <td className="py-3.5 px-3 text-center">
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (window.confirm(`¿Seguro que deseas ELIMINAR/CANCELAR esta reserva de ${bk.name}? Se liberará el horario de forma inmediata.`)) {
                                          await deleteBookingById(bk.id);
                                          onBookingCreated();
                                          setAdminSuccess(`¡La reserva de ${bk.name} ha sido eliminada con éxito! Horas liberadas.`);
                                        }
                                      }}
                                      className="p-1.5 text-neutral-500 hover:text-red-400 hover:bg-neutral-900 rounded cursor-pointer transition-colors"
                                      title="Eliminar o cancelar cita"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </button>
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </>
                  )}
                </div>
              );
            })()}

            {adminActiveTab === 'block' && (
              <div className="space-y-8 max-w-xl mx-auto">
                {/* Panel de Incidencias y Bloqueos de Emergencia (Quick Closures) */}
                <div className="bg-gradient-to-br from-red-950/20 via-neutral-900 to-neutral-950 border border-red-900/40 rounded-xl p-5 space-y-4 shadow-xl">
                  <div className="flex items-center gap-2 pb-1 border-b border-neutral-800">
                    <span className="text-lg">⚠️</span>
                    <div>
                      <h4 className="text-xs uppercase font-mono font-bold tracking-wider text-red-300">
                        Cierre rápido por imprevistos (Redouan)
                      </h4>
                      <p className="text-[10px] text-neutral-500 font-mono">Panel del Jefe • Estado Especial</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-neutral-350 leading-relaxed">
                    Si ocurre cualquier imprevisto personal u familiar, pulsa abajo para cerrar el día entero o demorar la apertura. La agenda de cara al cliente se desactivará de inmediato.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                    {/* Cierres Completos */}
                    <div className="bg-neutral-900/40 border border-neutral-850 p-3.5 rounded-lg flex flex-col justify-between space-y-3">
                      <div>
                        <div className="font-sans font-bold text-xs text-red-400 flex items-center gap-1.5">
                          🚫 CERRAR DÍA ENTERO
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-tight mt-1">
                          Bloquea todas las horas disponibles de la fecha de corrido.
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickBlock('today', 'full')}
                          className="w-full text-center py-2 bg-red-650 hover:bg-red-650/80 font-bold font-mono text-[10px] text-white rounded-lg cursor-pointer transition-all active:scale-[0.98] border border-red-500/10 shadow shadow-red-950/50"
                        >
                          Cerrar TODO Hoy 🚫
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickBlock('tomorrow', 'full')}
                          className="w-full text-center py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 font-bold font-mono text-[10px] text-neutral-300 hover:text-white rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                        >
                          Cerrar TODO Mañana
                        </button>
                      </div>
                    </div>

                    {/* Aperturas Tardías */}
                    <div className="bg-neutral-900/40 border border-neutral-850 p-3.5 rounded-lg flex flex-col justify-between space-y-3">
                      <div>
                        <div className="font-sans font-bold text-xs text-amber-500 flex items-center gap-1.5">
                          ⏳ RETRASAR APERTURA
                        </div>
                        <p className="text-[10px] text-neutral-500 leading-tight mt-1">
                          Cierra el turno de mañana (9:00 a 14:00). Abre por la tarde (16:00 h).
                        </p>
                      </div>
                      <div className="flex flex-col gap-2">
                        <button
                          type="button"
                          onClick={() => handleQuickBlock('today', 'morning_only')}
                          className="w-full text-center py-2 bg-amber-600 hover:bg-amber-500/80 font-bold font-mono text-[10px] text-white rounded-lg cursor-pointer transition-all active:scale-[0.98] border border-amber-500/10 shadow shadow-amber-950/50"
                        >
                          Abrir de Tarde Hoy ⏳
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickBlock('tomorrow', 'morning_only')}
                          className="w-full text-center py-2 bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 font-bold font-mono text-[10px] text-neutral-300 hover:text-white rounded-lg cursor-pointer transition-all active:scale-[0.98]"
                        >
                          Abrir de Tarde Mañana
                        </button>
                      </div>
                    </div>
                  </div>

                  {manDate && (
                    <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-2.5 text-[11px] bg-neutral-950 text-neutral-400 p-3 rounded-lg border border-neutral-850">
                      <span>Día seleccionado abajo: <strong className="text-amber-500 font-mono">{manDate}</strong></span>
                      <div className="flex flex-wrap gap-2 w-full sm:w-auto justify-end">
                        <button
                          type="button"
                          onClick={() => handleQuickBlock('manual', 'full')}
                          className="px-2.5 py-1.5 bg-red-650/20 hover:bg-red-650/30 border border-red-500/20 rounded font-mono text-[10px] font-bold text-white cursor-pointer transition-colors"
                        >
                          🚫 Cerrar este día completo
                        </button>
                        <button
                          type="button"
                          onClick={() => handleQuickBlock('manual', 'morning_only')}
                          className="px-2.5 py-1.5 bg-amber-600/20 hover:bg-amber-600/30 border border-amber-500/20 rounded font-mono text-[10px] font-bold text-white cursor-pointer transition-colors"
                        >
                          ⏳ Abrir tarde este día
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="relative flex py-2 items-center">
                  <div className="flex-grow border-t border-neutral-850"></div>
                  <span className="flex-shrink mx-4 text-[9px] uppercase font-mono tracking-widest text-neutral-600">O BLOQUEO MANUAL DE HORAS</span>
                  <div className="flex-grow border-t border-neutral-850"></div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    setAdminError('');
                    setAdminSuccess('');

                    if (!manDate) {
                      setAdminError('Por favor introduce una fecha para realizar el bloqueo.');
                      return;
                    }
                    if (!manTime) {
                      setAdminError('Por favor selecciona la hora de inicio.');
                      return;
                    }

                    const newBlock: Booking = {
                      id: 'block-' + Math.random().toString(36).substring(2, 5),
                      name: `🚫 Bloqueo: ${manNotes.trim() || 'Hora no disponible'}`,
                      phone: 'ORGANIZACIÓN',
                      date: manDate,
                      time: manTime,
                      services: [],
                      notes: 'Bloqueado por el administrador.',
                      totalPrice: 0,
                      totalDuration: blockDuration,
                      createdAt: Date.now()
                    };

                    createNewBooking(newBlock).then(() => {
                      onBookingCreated();
                      setAdminSuccess('¡Horario bloqueado correctamente! Ya no saldrá disponible para los clientes.');
                      setManNotes('');
                      setManTime('');
                    });
                  }}
                  className="space-y-6"
                >
                  <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-850/60 font-mono">
                    <p className="text-[11px] text-neutral-400 leading-relaxed">
                      🛡️ <strong>Uso del Bloqueador Personalizado:</strong> Ideal si te vas a ausentar un tramo corto (almuerzo, recado o descanso de café). Selecciona la fecha, la hora exacta de inicio y el tiempo.
                    </p>
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-bold uppercase tracking-wider font-mono">Día del Bloqueo *</label>
                    <input
                      type="date"
                      value={manDate}
                      onChange={(e) => setManDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-bold uppercase tracking-wider font-mono">Inicio del Bloqueo *</label>
                    <select
                      value={manTime}
                      onChange={(e) => setManTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                      required
                    >
                      <option value="">-- Elige Hora --</option>
                      {generateTimeSlots().map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-bold uppercase tracking-wider font-mono">Duración del bloqueo *</label>
                    <select
                      value={blockDuration}
                      onChange={(e) => setBlockDuration(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white font-mono text-sm focus:outline-none focus:border-amber-500"
                      required
                    >
                      <option value={15}>15 Minutos (ej. Recado rápido)</option>
                      <option value={30}>30 Minutos (ej. Corte simple bloqueado)</option>
                      <option value={45}>45 Minutos (ej. Descanso de café)</option>
                      <option value={60}>60 Minutos (1 Hora)</option>
                      <option value={120}>120 Minutos (2 Horas)</option>
                      <option value={300}>300 Medios días</option>
                      <option value={720}>720 Minutos (12 Horas - Todo el Día)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-bold uppercase tracking-wider font-mono">Motivo del Bloqueo (opcional)</label>
                    <input
                      type="text"
                      value={manNotes}
                      onChange={(e) => setManNotes(e.target.value)}
                      placeholder="Ej. Almuerzo, Trámite personal, Descanso..."
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-red-650 hover:bg-red-500 active:scale-[0.99] text-white text-xs uppercase tracking-widest font-bold rounded-lg cursor-pointer transition-colors shadow-lg shadow-red-500/10"
                >
                  Confirmar Bloqueo de Horario
                </button>
              </form>
            </div>
          )}

            {adminActiveTab === 'manual' && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setAdminError('');
                  setAdminSuccess('');

                  if (!manName.trim()) {
                    setAdminError('Indica el nombre del cliente.');
                    return;
                  }
                  if (!manDate) {
                    setAdminError('Selecciona la fecha para la cita.');
                    return;
                  }
                  if (!manTime) {
                    setAdminError('Selecciona la hora de la cita.');
                    return;
                  }
                  if (manSelectedServices.length === 0) {
                    setAdminError('Debes seleccionar al menos un servicio.');
                    return;
                  }

                  const selectedS = SERVICES.filter(s => manSelectedServices.includes(s.id));
                  const priceSum = selectedS.reduce((sum, s) => sum + s.price, 0);
                  const durSum = selectedS.reduce((sum, s) => sum + s.duration, 0);

                  const manualB: Booking = {
                    id: 'man-' + Math.random().toString(36).substring(2, 7),
                    name: `👤 (Manual) ${manName.trim()}`,
                    phone: manPhone.trim() || 'No provisto',
                    date: manDate,
                    time: manTime,
                    services: manSelectedServices,
                    notes: manNotes.trim() ? `Cita de teléfono. Notas: ${manNotes.trim()}` : 'Cita creada telefónicamente/en local.',
                    totalPrice: priceSum,
                    totalDuration: durSum,
                    createdAt: Date.now(),
                    force: true
                  };

                  const [h, m] = manTime.split(':').map(Number);
                  const startMinutes = h * 60 + m;
                  const isOverlapping = allBookings.some((b) => {
                    if (b.date !== manDate) return false;
                    const [bH, bM] = b.time.split(':').map(Number);
                    const bStart = bH * 60 + bM;
                    const bDur = getBookingDuration(b);
                    const bEnd = bStart + bDur;
                    return startMinutes >= bStart && startMinutes < bEnd;
                  });

                  if (isOverlapping) {
                    if (!window.confirm('⚠️ ALERTA: Esta hora ya está reservada por otro cliente. ¿Estás seguro de que deseas forzar el registro de esta cita?')) {
                      return;
                    }
                  }

                  createNewBooking(manualB).then(() => {
                    onBookingCreated();
                    setAdminSuccess(`¡Cita manual para ${manName} añadida con éxito!`);
                    setManName('');
                    setManPhone('');
                    setManTime('');
                    setManSelectedServices([]);
                    setManNotes('');
                  });
                }}
                className="space-y-6 max-w-xl mx-auto"
              >
                <div className="bg-neutral-900/50 p-4 rounded-xl border border-neutral-850/60 mb-6">
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    📞 <strong>Cita Telefónica / Local:</strong> Úsala cuando un cliente te llame a tu móvil <strong>{BARBER_CONTACT.phone}</strong> para asegurar un trozo de tiempo inmediatamente.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-bold uppercase tracking-wider font-mono">Nombre del Cliente *</label>
                    <input
                      type="text"
                      value={manName}
                      onChange={(e) => setManName(e.target.value)}
                      placeholder="Ej. Juan Pérez"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-bold uppercase tracking-wider font-mono">Número de Teléfono</label>
                    <input
                      type="tel"
                      value={manPhone}
                      onChange={(e) => setManPhone(e.target.value)}
                      placeholder="Ej. 6XX XX XX XX"
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-bold uppercase tracking-wider font-mono">Fecha Cita *</label>
                    <input
                      type="date"
                      value={manDate}
                      onChange={(e) => setManDate(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs text-neutral-400 block mb-1.5 font-bold uppercase tracking-wider font-mono">Hora Cita *</label>
                    <select
                      value={manTime}
                      onChange={(e) => setManTime(e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white text-sm font-mono focus:outline-none focus:border-amber-500"
                      required
                    >
                      <option value="">-- Elige Hora --</option>
                      {generateTimeSlots().map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-2 font-bold uppercase tracking-wider font-mono">Selecciona Servicios para esta Cita *</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {SERVICES.map((serv) => {
                      const selected = manSelectedServices.includes(serv.id);
                      return (
                        <button
                          key={serv.id}
                          type="button"
                          onClick={() => handleToggleManualService(serv.id)}
                          className={`p-2.5 rounded text-left text-xs border transition-colors cursor-pointer ${
                            selected
                              ? 'bg-amber-500/10 border-amber-500 text-amber-500 font-bold'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:border-neutral-700'
                          }`}
                        >
                          <div className="truncate">{serv.name}</div>
                          <div className="text-[10px] text-neutral-500 font-mono mt-0.5">{serv.price}€ • {serv.duration} min</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-neutral-400 block mb-1.5 font-bold uppercase tracking-wider font-mono">Notas para la cita (opcional)</label>
                  <textarea
                    value={manNotes}
                    onChange={(e) => setManNotes(e.target.value)}
                    placeholder="Escribe detalles adicionales..."
                    rows={2}
                    className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-3 text-white text-sm focus:outline-none focus:border-amber-500"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs uppercase tracking-widest font-bold rounded-lg cursor-pointer transition-colors shadow-lg shadow-amber-500/10"
                >
                  Agendar Cita Manual
                </button>
              </form>
            )}

            {adminActiveTab === 'stats' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-400 font-mono uppercase block">Suma de Caja</span>
                      <span className="text-2xl font-serif font-bold text-amber-500 mt-1 block">
                        {allBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0)}€
                      </span>
                      <span className="text-[9px] text-neutral-500 mt-1 block">Todos los servicios activos</span>
                    </div>
                  </div>

                  <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-400 font-mono uppercase block">Total Agendados</span>
                      <span className="text-2xl font-serif font-bold text-white mt-1 block">
                        {allBookings.filter(b => !b.name.startsWith('🚫')).length}
                      </span>
                      <span className="text-[9px] text-neutral-500 mt-1 block">Excluyendo bloqueos de horas</span>
                    </div>
                  </div>

                  <div className="p-5 bg-neutral-900 rounded-xl border border-neutral-850 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-neutral-400 font-mono uppercase block">Servicio Preferido</span>
                      <span className="text-sm font-sans font-bold text-emerald-400 mt-1.5 block max-w-[150px] truncate">
                        {requestedServicesStats()}
                      </span>
                      <span className="text-[9px] text-neutral-400 mt-1 block">Servicio más pedido</span>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-neutral-900 rounded-xl border border-neutral-850">
                  <h4 className="font-mono text-[11px] font-bold uppercase tracking-wider text-neutral-300 mb-2">Composición del listado actual:</h4>
                  <div className="space-y-2 text-xs font-mono">
                    <div className="flex justify-between text-neutral-400">
                      <span>Ingresos medios por cita:</span>
                      <span className="text-white">
                        {allBookings.filter(b => (Number(b.totalPrice) || 0) > 0).length > 0
                          ? (allBookings.reduce((sum, b) => sum + (Number(b.totalPrice) || 0), 0) / allBookings.filter(b => (Number(b.totalPrice) || 0) > 0).length).toFixed(2)
                          : '0.00'}€
                      </span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Tiempo total ocupado en sillón:</span>
                      <span className="text-white">
                        {allBookings.reduce((sum, b) => sum + getBookingDuration(b), 0)} min (~{Math.round(allBookings.reduce((sum, b) => sum + getBookingDuration(b), 0) / 60)} horas)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {adminActiveTab === 'qr' && (
              <div className="space-y-8 animate-fade-in text-sans">
                <div className="flex flex-col md:flex-row gap-8 items-center justify-between p-6 bg-neutral-900 border border-neutral-850 rounded-2xl">
                  {/* Left Column: Details */}
                  <div className="flex-1 space-y-4 text-center md:text-left">
                    <span className="inline-block px-2.5 py-1 bg-amber-500/10 text-amber-500 border border-amber-500/20 rounded font-mono text-[10px] uppercase font-bold tracking-wider">
                      CÓDIGO QR PARA TU BARBERÍA
                    </span>
                    <h3 className="text-xl font-serif font-bold text-white uppercase tracking-wide">
                      Comparte tu App de Citas
                    </h3>
                    <p className="text-sm text-neutral-400 max-w-md leading-relaxed font-sans">
                      Este es el código QR exclusivo para tu negocio. Tus clientes pueden escanearlo con la cámara de sus móviles para entrar, seleccionar sus servicios y agendar citas en vivo.
                    </p>
                    
                    <div className="pt-2 font-mono space-y-2">
                      <div className="text-[11px] text-neutral-400">Enlace de reserva de tus clientes:</div>
                      <div className="p-3 bg-neutral-950 border border-neutral-800 rounded-lg text-amber-500 text-xs break-all flex items-center justify-between gap-3">
                        <span className="truncate">{window.location.origin + window.location.pathname}</span>
                        <button
                          type="button"
                          onClick={() => {
                            try {
                              navigator.clipboard.writeText(window.location.origin + window.location.pathname);
                              setAdminSuccess('¡Enlace de reserva copiado al portapapeles!');
                            } catch (e) {
                              setAdminError('Error al copiar enlace.');
                            }
                          }}
                          className="p-1 px-2.5 bg-neutral-900 hover:bg-neutral-800 rounded text-[10px] font-bold text-neutral-300 hover:text-white border border-neutral-800 transition-colors uppercase cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Copy className="w-3 h-3" />
                          Copiar
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed text-neutral-440 font-sans">
                      <div className="p-3 bg-neutral-950/40 rounded-lg border border-neutral-850">
                        <span className="font-bold text-white block mb-0.5">🖼️ En el espejo</span>
                        Imprime este código y pégalo en los espejos de tu barbería para que los clientes agenden su próxima visita mientras les cortas.
                      </div>
                      <div className="p-3 bg-neutral-950/40 rounded-lg border border-neutral-850">
                        <span className="font-bold text-white block mb-0.5">📸 Redes Sociales</span>
                        Sube una captura de tu QR a tus historias de Instagram o ponlo en la descripción de tu perfil para recibir reservas 24/7.
                      </div>
                    </div>
                  </div>

                  {/* Right Column: QR Visual Display */}
                  <div className="w-full sm:w-80 p-6 bg-neutral-950 border border-neutral-800 rounded-2xl flex flex-col items-center shadow-xl">
                    <div className="bg-white p-4 rounded-xl shadow-lg border-2 border-amber-500/20 aspect-square flex items-center justify-center">
                      <img
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=250x250&data=${encodeURIComponent(window.location.origin + window.location.pathname)}&color=0a0a0a`}
                        alt="Código QR de reserva"
                        className="w-48 h-48 block rounded"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    
                    <span className="text-[10px] text-amber-500 font-mono tracking-wider uppercase mt-4 font-bold">
                      EL BASTRIOUI APP
                    </span>
                    <span className="text-[9px] text-neutral-500 mt-0.5 max-w-[200px] text-center font-mono leading-tight">
                      Escanea para reservar cita en segundos
                    </span>

                    <a
                      href={`https://api.qrserver.com/v1/create-qr-code/?size=1000x1000&data=${encodeURIComponent(window.location.origin + window.location.pathname)}&color=0a0a0a`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-6 w-full py-2 px-4 bg-neutral-900 border border-neutral-800 hover:border-neutral-700 rounded-lg inline-flex items-center justify-center gap-2 text-xs font-mono font-bold text-neutral-300 hover:text-white hover:bg-neutral-850 transition-all cursor-pointer shadow"
                    >
                      <Download className="w-4 h-4 text-amber-500" />
                      Descargar QR Alta Res
                    </a>
                  </div>
                </div>

                <div className="p-5.5 bg-neutral-900 border border-neutral-850 rounded-xl space-y-3 font-sans">
                  <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-amber-500">
                    ℹ️ ¿Cómo publicar la aplicación en Internet gratis (Render)?
                  </h4>
                  <div className="space-y-2.5 text-xs text-neutral-300 leading-relaxed font-sans">
                    <p>
                      Para que tus clientes puedan entrar desde sus teléfonos, necesitas subir tu código a un servidor gratuito como <strong>Render.com</strong>:
                    </p>
                    <ol className="list-decimal list-inside space-y-1 text-neutral-400 font-sans">
                      <li>Sube este código a una cuenta de <strong>GitHub</strong>.</li>
                      <li>Crea una cuenta en <strong>Render.com</strong> y conecta tu repositorio como un "Web Service".</li>
                      <li>Configura los siguientes comandos en Render:
                        <ul className="list-disc list-inside pl-5 mt-1 text-[11px] font-mono text-amber-400">
                          <li>Build Command: <code className="bg-neutral-950 p-1 rounded text-white select-all">npm run build</code></li>
                          <li>Start Command: <code className="bg-neutral-950 p-1 rounded text-white select-all">npm start</code></li>
                        </ul>
                      </li>
                      <li>¡Listo! Render te dará un enlace público permanente de forma totalmente gratuita.</li>
                    </ol>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <section id="reservar" className="py-24 bg-neutral-900 scroll-mt-12 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="text-center max-w-3xl mx-auto mb-16 flex flex-col items-center">
          <div className="flex items-center justify-center gap-4 mb-4">
            <div className="w-12 h-[1px] bg-amber-500" />
            <span className="text-amber-500 uppercase tracking-[0.4em] font-mono text-xs font-bold block">
              RESERVA METICULOSA
            </span>
            <div className="w-12 h-[1px] bg-amber-500" />
          </div>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-serif text-white uppercase tracking-tight mb-4 animate-fade-in">
            agenda tu visita
          </h2>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-2xl mt-2">
            Agenda tu cita en segundos. Completa los detalles y te generaremos el pase de confirmación instantáneo con enlace de guardado local.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          
          {/* Main Booking Panel (Left) */}
          <div className="lg:col-span-8 bg-neutral-950 p-6 sm:p-10 rounded-2xl border border-neutral-800 shadow-2xl relative">
            <AnimatePresence mode="wait">
              {!successBooking ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onSubmit={handleSubmit}
                  className="space-y-8"
                >
                  {/* Step 1: Services Selection summary */}
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2 flex items-center justify-between">
                      <span>1. Servicios Elegidos</span>
                      <span className="font-sans text-xs tracking-normal text-amber-500 font-medium">Puedes marcar más de uno</span>
                    </h3>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                      {SERVICES.map((s) => {
                        const isChecked = selectedServiceIds.includes(s.id);
                        return (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => onToggleService(s.id)}
                            className={`p-3 text-left rounded-lg text-xs sm:text-sm flex items-center justify-between border cursor-pointer transition-all duration-200 ${
                              isChecked
                                ? 'bg-amber-500/10 border-amber-500 text-amber-400 font-semibold'
                                : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                            }`}
                          >
                            <span className="flex-1 truncate mr-2">{s.name}</span>
                            <span className="font-mono text-amber-500 text-right font-bold flex-shrink-0">{s.price}€</span>
                          </button>
                        );
                      })}
                    </div>

                    {selectedServices.length > 0 ? (
                      <div className="bg-neutral-900/50 p-4 rounded-lg flex flex-wrap gap-y-2 items-center justify-between border border-neutral-850">
                        <div className="text-xs sm:text-sm text-neutral-300">
                          Total: <strong className="text-white font-mono">{selectedServices.length}</strong> {selectedServices.length === 1 ? 'servicio' : 'servicios'} • Tiempo: <strong className="text-white font-mono">{totalDuration} min</strong>
                        </div>
                        <div className="text-sm font-semibold text-amber-500">
                          Precio Total: <span className="font-serif font-bold text-lg">{totalPrice}€</span>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-amber-500/5 border border-amber-500/20 text-neutral-300 p-4 rounded-lg text-xs sm:text-sm flex items-start gap-2.5">
                        <AlertCircle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-semibold text-white">Ningún servicio seleccionado</p>
                          <p className="mt-0.5 text-neutral-400">Por favor, marca qué servicios deseas realizarte haciendo clic arriba o en la sección servicios.</p>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 2: Custom Premium Calendar Selector */}
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-amber-500" />
                      <span>2. Elige Fecha</span>
                    </h3>

                    {/* Navigation Header */}
                    <div className="flex items-center justify-between mb-4 bg-neutral-900/80 p-3 rounded-lg border border-neutral-800">
                      <button
                        type="button"
                        onClick={handlePrevMonth}
                        disabled={isPrevMonthDisabled()}
                        className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white disabled:opacity-20 disabled:hover:bg-transparent cursor-pointer transition-all"
                        title="Mes anterior"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      
                      <span className="font-serif font-bold uppercase tracking-wider text-amber-500 text-xs sm:text-sm">
                        {monthsNames[viewDate.getMonth()]} {viewDate.getFullYear()}
                      </span>

                      <button
                        type="button"
                        onClick={handleNextMonth}
                        className="p-1.5 hover:bg-neutral-800 rounded text-neutral-400 hover:text-white cursor-pointer transition-all"
                        title="Mes siguiente"
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Calendar Grid */}
                    <div className="bg-neutral-900 border border-neutral-850 rounded-xl p-4 sm:p-5">
                      {/* Weekday Labels Header */}
                      <div className="grid grid-cols-7 gap-1 text-center border-b border-neutral-800 pb-2 mb-2">
                        {weekdays.map((wd) => (
                          <div key={wd} className="text-neutral-500 font-mono text-[10px] sm:text-xs uppercase tracking-wider font-semibold">
                            {wd}
                          </div>
                        ))}
                      </div>

                      {/* Day Grid Cells */}
                      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
                        {getCalendarDays().map((day, idx) => {
                          const dateStr = formatDateString(day.date);
                          const isSelected = bookingDate === dateStr;
                          const isPast = isPastDate(day.date);
                          const isSun = isDateSunday(day.date);
                          const isToday = formatDateString(new Date()) === dateStr;
                          const isMuted = !day.isCurrentMonth;
                          const isBlocked = allBookings.some(
                            (b) => b.date === dateStr && b.phone === 'ORGANIZACIÓN' && b.totalDuration && b.totalDuration >= 720
                          );

                          let cellStyle = "aspect-square relative flex flex-col items-center justify-center rounded-lg transition-all text-xs sm:text-sm border border-transparent ";
                          let clickHandler = undefined;

                          if (isPast) {
                            cellStyle += "text-neutral-700 cursor-not-allowed line-through bg-neutral-950/10";
                          } else if (isSun) {
                            cellStyle += "text-red-500/45 bg-red-950/10 border-red-950/20 cursor-not-allowed";
                          } else if (isBlocked) {
                            cellStyle += "text-red-500/50 bg-red-950/5 border-red-950/15 cursor-not-allowed opacity-80";
                          } else if (isMuted) {
                            cellStyle += "text-neutral-800 cursor-not-allowed opacity-25";
                          } else {
                            // Valid active month day
                            clickHandler = () => handleDaySelect(day.date);
                            if (isSelected) {
                              cellStyle += "bg-amber-500 text-neutral-950 font-bold border-amber-500 shadow-md shadow-amber-500/10 scale-102";
                            } else {
                              cellStyle += "bg-neutral-950 text-neutral-300 hover:bg-neutral-800 hover:border-neutral-700 hover:text-white cursor-pointer";
                              if (isToday) {
                                cellStyle += " border-amber-500/40 text-amber-400 font-medium";
                              }
                            }
                          }

                          return (
                            <button
                              key={`${dateStr}-${idx}`}
                              type="button"
                              onClick={clickHandler}
                              disabled={isPast || isSun || isMuted || isBlocked}
                              className={cellStyle}
                            >
                              <span className="font-semibold block">{day.dayNum}</span>
                              {isSun && (
                                <span className="absolute bottom-1 text-[7px] text-red-500 uppercase tracking-tighter">Cerrado</span>
                              )}
                              {isBlocked && !isSun && (
                                <span className="absolute bottom-1 text-[7px] text-red-400 font-bold uppercase tracking-tighter">Cerrado</span>
                              )}
                              {isToday && !isSelected && !isSun && !isBlocked && (
                                <span className="absolute bottom-1 w-1 h-1 bg-amber-500 rounded-full" />
                              )}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {bookingDate && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-xs text-amber-500/90 mt-3 font-mono bg-amber-500/5 p-2 rounded-lg border border-amber-500/10 inline-flex items-center gap-1.5"
                      >
                        <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-ping" />
                        Día seleccionado: {new Date(bookingDate + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                      </motion.div>
                    )}
                  </div>

                  {/* Step 3: Time Slot Select */}
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
                      <Clock className="w-5 h-5 text-amber-500" />
                      <span>3. Escoge la Hora</span>
                    </h3>

                    {!bookingDate ? (
                      <p className="text-neutral-500 text-xs sm:text-sm italic">Por favor, selecciona primero una fecha para habilitar los turnos de hora.</p>
                    ) : isSunday(bookingDate) ? (
                      <p className="text-red-400 text-xs sm:text-sm">La barbería está cerrada los domingos. Por favor cambia la fecha arriba.</p>
                    ) : (
                      <div className="space-y-6">
                        {/* Organization Block Notifications */}
                        {(() => {
                          const orgBlocks = allBookings.filter(b => b.date === bookingDate && b.phone === 'ORGANIZACIÓN');
                          const hasFullBlock = orgBlocks.some(b => b.totalDuration && b.totalDuration >= 720);
                          const hasMorningBlock = orgBlocks.some(b => b.totalDuration && b.totalDuration === 300 && b.time === '09:00');
                          
                          return (
                            <>
                              {hasFullBlock && orgBlocks.filter(b => b.totalDuration && b.totalDuration >= 720).map(b => (
                                <div key={b.id} className="p-4 rounded-xl border border-red-900/30 bg-red-950/20 text-red-100 text-xs sm:text-sm space-y-1 shadow-lg">
                                  <p className="font-bold flex items-center gap-1.5 uppercase font-mono text-[10px] sm:text-xs tracking-wider text-red-400">
                                    <span>🚫 JORNADA COMPLETAMENTE CERRADA</span>
                                  </p>
                                  <p className="text-neutral-300 font-sans">
                                    El responsable ha bloqueado este día: <span className="text-white font-medium">"{b.name.replace('🚫', '').trim()}"</span>. Sentimos las molestias.
                                  </p>
                                </div>
                              ))}
                              
                              {!hasFullBlock && hasMorningBlock && orgBlocks.filter(b => b.totalDuration && b.totalDuration === 300 && b.time === '09:00').map(b => (
                                <div key={b.id} className="p-4 rounded-xl border border-amber-900/30 bg-amber-950/25 text-amber-100 text-xs sm:text-sm space-y-1 shadow-md">
                                  <p className="font-bold flex items-center gap-1.5 uppercase font-mono text-[10px] sm:text-xs tracking-wider text-amber-400">
                                    <span>⏳ APERTURA DE TARDE</span>
                                  </p>
                                  <p className="text-neutral-300 font-sans">
                                    Aviso: <span className="text-white font-medium">"{b.name.replace('⏳', '').trim()}"</span>. El turno de mañana estará cerrado y abriremos a partir de las 16:00 h.
                                  </p>
                                </div>
                              ))}
                            </>
                          );
                        })()}

                        {/* Morning Shift */}
                        <div>
                          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-3 font-semibold font-mono">Turno de Mañana (09:00 - 14:00)</p>
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {morningSlots.map((slot) => {
                              const isSlotSelected = bookingTime === slot;
                              const booked = isSlotBooked(slot);
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  disabled={booked}
                                  onClick={() => !booked && setBookingTime(slot)}
                                  className={`py-2 text-center rounded font-mono text-xs sm:text-sm font-bold transition-all duration-150 relative ${
                                    booked
                                      ? 'bg-red-600 border border-red-700 text-white cursor-not-allowed opacity-95'
                                      : isSlotSelected
                                      ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-500/80 ring-offset-2 ring-offset-neutral-950 scale-105'
                                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 cursor-pointer'
                                  }`}
                                  title={booked ? 'Horario ya Reservado / Ocupado' : undefined}
                                >
                                  <span className={booked ? 'line-through decoration-white/90 text-white font-extrabold' : ''}>
                                    {slot}
                                  </span>
                                  {booked && (
                                    <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>

                        {/* Afternoon Shift */}
                        <div>
                          <p className="text-xs uppercase tracking-widest text-neutral-400 mb-3 font-semibold font-mono">Turno de Tarde (16:00 - 21:00)</p>
                          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                            {afternoonSlots.map((slot) => {
                              const isSlotSelected = bookingTime === slot;
                              const booked = isSlotBooked(slot);
                              return (
                                <button
                                  key={slot}
                                  type="button"
                                  id={`time-slot-${slot}`}
                                  disabled={booked}
                                  onClick={() => !booked && setBookingTime(slot)}
                                  className={`py-2 text-center rounded font-mono text-xs sm:text-sm font-bold transition-all duration-150 relative ${
                                    booked
                                      ? 'bg-red-600 border border-red-700 text-white cursor-not-allowed opacity-95'
                                      : isSlotSelected
                                      ? 'bg-amber-500 text-neutral-950 ring-2 ring-amber-500/80 ring-offset-2 ring-offset-neutral-950 scale-105'
                                      : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 cursor-pointer'
                                  }`}
                                  title={booked ? 'Horario ya Reservado / Ocupado' : undefined}
                                >
                                  <span className={booked ? 'line-through decoration-white/90 text-white font-extrabold' : ''}>
                                    {slot}
                                  </span>
                                  {booked && (
                                    <span className="absolute top-1 right-1 flex h-1.5 w-1.5">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-white"></span>
                                    </span>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Step 4: Persona Contact details */}
                  <div>
                    <h3 className="text-lg font-serif font-bold text-white uppercase tracking-wider mb-4 border-b border-neutral-800 pb-2 flex items-center gap-2">
                      <User className="w-5 h-5 text-amber-500" />
                      <span>4. Datos Personales</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="relative">
                        <label htmlFor="user-name" className="text-xs text-neutral-400 block mb-1.5 font-medium">Nombre Completo *</label>
                        <div className="relative">
                          <input
                            type="text"
                            id="user-name"
                            value={userName}
                            onChange={(e) => setUserName(e.target.value)}
                            placeholder="Ej. Redouan"
                            className="w-full bg-neutral-900 border border-neutral-850 rounded-lg p-3.5 pl-10 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                            required
                          />
                          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        </div>
                      </div>

                      <div className="relative">
                        <label htmlFor="user-phone" className="text-xs text-neutral-200 block mb-1.5 font-medium">Móvil de Contacto *</label>
                        <div className="relative">
                          <input
                            type="tel"
                            id="user-phone"
                            value={userPhone}
                            onChange={(e) => setUserPhone(e.target.value)}
                            placeholder="Ej. 604874545"
                            className="w-full bg-neutral-900 border border border-neutral-850 rounded-lg p-3.5 pl-10 text-white font-mono placeholder-neutral-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                            required
                          />
                          <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                        </div>
                      </div>
                    </div>

                    <div className="mt-4">
                      <label htmlFor="user-notes" className="text-xs text-neutral-400 block mb-1.5 font-medium">Notas / Comentarios (opcional)</label>
                      <div className="relative">
                        <textarea
                          id="user-notes"
                          value={notes}
                          onChange={(e) => setNotes(e.target.value)}
                          placeholder="Ej. Degradado muy apurado a navaja, gracias."
                          maxLength={300}
                          rows={2.5}
                          className="w-full bg-neutral-900 border border-neutral-850 rounded-lg p-3.5 pl-10 text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500/80 transition-colors"
                        />
                        <FileText className="absolute left-3.5 top-4 w-4 h-4 text-neutral-500" />
                      </div>
                    </div>

                    {/* Legal / GDPR Compliance and Consent */}
                    <div className="mt-5 p-3.5 rounded-lg border border-neutral-850 bg-neutral-900/30 text-xs text-neutral-400 space-y-3">
                      <div className="flex items-start gap-2.5">
                        <input
                          id="rgpd-check"
                          type="checkbox"
                          checked={rgpdConsent}
                          onChange={(e) => setRgpdConsent(e.target.checked)}
                          required
                          className="mt-1 accent-amber-500 scale-110 cursor-pointer h-4 w-4 rounded border-neutral-800 text-amber-500 bg-neutral-900 focus:ring-0 focus:ring-offset-0"
                        />
                        <label htmlFor="rgpd-check" className="cursor-pointer leading-relaxed text-[11px] sm:text-xs">
                          He leído y acepto la <span className="text-amber-500 hover:underline font-medium">Política de Privacidad</span> y doy mi consentimiento para el tratamiento de mis datos personales para la gestión de mi reserva. <span className="text-neutral-500 font-medium">/ Responsable:</span> Redouan El Bastrioui.
                        </label>
                      </div>
                      <p className="text-[10px] leading-relaxed text-neutral-500 pl-6 border-l border-neutral-800">
                        <span className="text-neutral-400 font-semibold uppercase tracking-wider text-[9px] block mb-0.5">Información Básica sobre Protección de Datos:</span>
                        Tus datos se recopilan únicamente con el fin de procesar y coordinar tu reserva de peluquería/barbería. No se cederán a terceros y se guardan con total confidencialidad. En cualquier momento puedes solicitar el acceso, rectificación o la eliminación inmediata de tus datos de la base de datos de citas de forma gratuita.
                      </p>
                    </div>
                  </div>

                  {/* Action Validation Error Display & Submit */}
                  {errorMessage && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-4 bg-red-950/65 border border-red-500/40 text-red-300 rounded-lg flex items-start gap-3 text-xs sm:text-sm"
                    >
                      <AlertCircle className="w-5 h-5 shrink-0 text-red-400 mt-0.5" />
                      <div>
                        <span className="font-bold">Error en la solicitud: </span>
                        {errorMessage}
                      </div>
                    </motion.div>
                  )}

                  <div className="pt-2">
                    <button
                      id="submit-booking-form-btn"
                      type="submit"
                      className="w-full bg-amber-500 hover:bg-amber-400 active:scale-[0.99] text-neutral-950 font-bold tracking-widest uppercase py-4 rounded-lg text-sm sm:text-base cursor-pointer transition-all duration-200 border border-transparent shadow-lg shadow-amber-500/10"
                    >
                      Solicitar y Guardar Cita
                    </button>
                    <p className="text-center text-[11px] text-neutral-500 mt-3">
                      Al agendar, tu cita se guardará de forma privada en tu navegador. Podrás verla, modificarla o cancelarla desde tu panel en cualquier momento.
                    </p>
                  </div>
                </motion.form>
              ) : (
                /* SUCCESS RECEIPT PANEL */
                <motion.div
                  key="receipt"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-8 py-4 text-center"
                >
                  <div className="flex flex-col items-center justify-center">
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/40 text-emerald-400 rounded-full mb-4">
                      <CheckCircle2 className="w-12 h-12 stroke-[2.5]" />
                    </div>
                    <h3 className="text-2xl sm:text-3xl font-serif text-white font-bold uppercase tracking-tight">
                      ¡Cita Registrada!
                    </h3>
                    <p className="text-neutral-400 text-xs sm:text-sm mt-1 max-w-lg mx-auto">
                      Tu cita se ha almacenado localmente en tu navegador.
                    </p>
                    <p className="text-amber-500 text-xs sm:text-sm font-semibold max-w-sm mx-auto mt-2">
                      ⚠️ IMPORTANTE: Se recomienda enviar confirmación por WhatsApp o Email a Redouan para asegurar tu hueco prioritario.
                    </p>
                  </div>

                  {/* Summary Board */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 text-left max-w-md mx-auto space-y-4">
                    <div className="bg-neutral-950 p-3 rounded border border-neutral-850 text-center text-xs font-mono font-bold tracking-widest text-amber-500">
                      CÓDIGO DE CITA: #{successBooking.id.toUpperCase()}
                    </div>

                    <div className="grid grid-cols-2 gap-y-3.5 gap-x-2 text-xs sm:text-sm border-b border-neutral-800 pb-4">
                      <div>
                        <span className="text-neutral-500 block text-[11px] uppercase font-mono">Nombre</span>
                        <span className="text-white font-medium">{successBooking.name}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[11px] uppercase font-mono">Teléfono</span>
                        <span className="text-white font-mono">{successBooking.phone}</span>
                      </div>
                      <div className="col-span-2">
                        <span className="text-neutral-500 block text-[11px] uppercase font-mono">Servicios</span>
                        <span className="text-white font-medium block truncate-3-lines">{getServicesNames(successBooking.services)}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[11px] uppercase font-mono">Fecha</span>
                        <span className="text-white font-mono font-semibold">{successBooking.date}</span>
                      </div>
                      <div>
                        <span className="text-neutral-500 block text-[11px] uppercase font-mono">Hora</span>
                        <span className="text-white font-mono font-semibold">{successBooking.time}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center pt-2 font-mono">
                      <span className="text-xs text-neutral-400 uppercase">Total a pagar:</span>
                      <span className="text-lg font-bold text-amber-500 font-serif">{successBooking.totalPrice}€</span>
                    </div>
                  </div>

                  {/* Action Link triggers */}
                  <div className="max-w-md mx-auto space-y-3">
                    <p className="text-neutral-400 text-xs font-semibold uppercase tracking-wider">Enviar confirmación directa a Redouan:</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <a
                        id="whatsapp-confirm-anchor"
                        href={getWhatsAppBookingLink({
                          name: successBooking.name,
                          phone: successBooking.phone,
                          date: successBooking.date,
                          time: successBooking.time,
                          servicesText: getServicesNames(successBooking.services),
                          price: successBooking.totalPrice,
                        })}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold text-xs uppercase tracking-wider cursor-pointer transition-colors"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Por WhatsApp</span>
                      </a>

                      <a
                        id="email-confirm-anchor"
                        href={getMailtoBookingLink({
                          name: successBooking.name,
                          phone: successBooking.phone,
                          date: successBooking.date,
                          time: successBooking.time,
                          servicesText: getServicesNames(successBooking.services),
                          price: successBooking.totalPrice,
                        })}
                        className="flex items-center justify-center space-x-2 px-4 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-white font-semibold text-xs uppercase tracking-wider cursor-pointer transition-colors border border-neutral-700"
                      >
                        <Mail className="w-4 h-4 text-amber-500" />
                        <span>Por Email</span>
                      </a>
                    </div>

                    <button
                      id="reset-form-btn"
                      onClick={resetFormAfterSuccess}
                      className="w-full text-center text-xs text-neutral-400 hover:text-amber-500 flex items-center justify-center gap-1.5 pt-4 transition-colors"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      <span>Volver a pedir otra cita</span>
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Quick Info & Appointments History (Right Sidebar, lg:col-span-4) */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Contact Quick details */}
            <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
              <h4 className="font-serif text-lg text-white font-bold uppercase tracking-wider border-b border-neutral-800 pb-2">Información Rápida</h4>
              <ul className="space-y-4 text-xs sm:text-sm font-sans">
                <li>
                  <span className="text-neutral-400 block font-mono text-xs uppercase">barbero</span>
                  <span className="text-white font-medium">{BARBER_CONTACT.owner}</span>
                </li>
                <li>
                  <span className="text-neutral-400 block font-mono text-xs uppercase">precio corte</span>
                  <span className="text-white font-medium">8€ (30 minutos)</span>
                </li>
                <li>
                  <span className="text-neutral-400 block font-mono text-xs uppercase">precio afeitado navaja</span>
                  <span className="text-white font-medium">5€ (15 minutos)</span>
                </li>
                <li>
                  <span className="text-neutral-400 block font-mono text-xs uppercase">horario mañana</span>
                  <span className="text-white font-medium">09:00 a 14:00 (Lunes a Sábado)</span>
                </li>
                <li>
                  <span className="text-neutral-400 block font-mono text-xs uppercase">horario tarde</span>
                  <span className="text-white font-medium">16:00 a 21:00 (Lunes a Sábado)</span>
                </li>
              </ul>
            </div>

            {/* Local Appointments Manager list */}
            <div id="mis-reservas-panel" className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
              <h4 className="font-serif text-lg text-white font-bold uppercase tracking-wider border-b border-neutral-800 pb-2 flex items-center justify-between">
                <span>Mis Reservas</span>
                <span className="bg-neutral-900 border border-neutral-800 text-[10px] text-amber-500 font-mono font-bold px-2.5 py-0.5 rounded-full">
                  {allBookings.filter(b => myBookingIds.includes(b.id)).length}
                </span>
              </h4>

              {allBookings.filter(b => myBookingIds.includes(b.id)).length === 0 ? (
                <p className="text-neutral-500 text-xs sm:text-sm italic">No tienes ninguna cita agendada en este dispositivo.</p>
              ) : (
                <div className="space-y-3.5 max-h-80 overflow-y-auto pr-1">
                  {allBookings.filter(b => myBookingIds.includes(b.id)).map((bk) => (
                    <div
                      key={bk.id}
                      id={`stored-booking-${bk.id}`}
                      className="p-3 bg-neutral-900/60 rounded border border-neutral-850/60 space-y-2 text-xs relative group"
                    >
                      {/* Delete absolute button */}
                      <button
                        id={`delete-booking-btn-${bk.id}`}
                        type="button"
                        onClick={(e) => handleDeleteBooking(bk.id, e)}
                        className="absolute top-2.5 right-2 text-neutral-500 hover:text-red-400 transition-colors p-1 rounded hover:bg-neutral-800 cursor-pointer"
                        title="Cancelar cita"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>

                      <div>
                        <div className="font-mono text-[9px] text-neutral-500 uppercase tracking-wider">Cita #{bk.id.toUpperCase()}</div>
                        <div className="text-white font-semibold mt-0.5">{getServicesNames(bk.services)}</div>
                      </div>

                      <div className="flex justify-between text-[11px] font-mono text-neutral-400 border-t border-neutral-850 pt-1.5">
                        <span>{bk.date} - {bk.time}</span>
                        <span className="font-bold text-amber-500 font-serif">{bk.totalPrice}€</span>
                      </div>

                      <div className="flex gap-2 pt-1">
                        <a
                          id={`whatsapp-reconfirm-${bk.id}`}
                          href={getWhatsAppBookingLink({
                            name: bk.name,
                            phone: bk.phone,
                            date: bk.date,
                            time: bk.time,
                            servicesText: getServicesNames(bk.services),
                            price: bk.totalPrice,
                          })}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[10px] text-emerald-400 hover:underline flex items-center gap-1 font-semibold"
                        >
                          <ExternalLink className="w-2.5 h-2.5" /> Reenviar WhatsApp
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>
    </section>
  );
}
