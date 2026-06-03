/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BARBER_CONTACT, OPENING_HOURS } from './data';

/**
 * Checks if the barbershop is currently open based on a given Date.
 */
export function getShopStatus(nowObj: Date = new Date()): { isOpen: boolean; text: string; nextOpening?: string } {
  // Translate to Spanish day index (0 = Domingo, 1 = Lunes, etc.)
  const day = nowObj.getDay();
  const hours = nowObj.getHours();
  const minutes = nowObj.getMinutes();
  const timeInMinutes = hours * 60 + minutes;

  // Closed on Sundays
  if (OPENING_HOURS.closedDays.includes(day)) {
    return { isOpen: false, text: 'Cerrado hoy (Domingo). Abrimos mañana a las 09:00' };
  }

  const mornStart = 9 * 60;  // 09:00
  const mornEnd = 14 * 60;  // 14:00
  const aftStart = 16 * 60; // 16:00
  const aftEnd = 21 * 60;   // 21:00

  // Check morning shift
  if (timeInMinutes >= mornStart && timeInMinutes < mornEnd) {
    const remains = mornEnd - timeInMinutes;
    return {
      isOpen: true,
      text: `Abierto - Cierra a las 14:00 (en ${Math.floor(remains / 60)}h ${remains % 60}m)`
    };
  }

  // Check siesta shift (between 14:00 and 16:00)
  if (timeInMinutes >= mornEnd && timeInMinutes < aftStart) {
    const remains = aftStart - timeInMinutes;
    return {
      isOpen: false,
      text: `Cerrado por descanso de mediodía. Abrimos la tarde a las 16:00 (en ${Math.floor(remains / 60)}h ${remains % 60}m)`
    };
  }

  // Check afternoon shift
  if (timeInMinutes >= aftStart && timeInMinutes < aftEnd) {
    const remains = aftEnd - timeInMinutes;
    return {
      isOpen: true,
      text: `Abierto - Cierra a las 21:00 (en ${Math.floor(remains / 60)}h ${remains % 60}m)`
    };
  }

  // Night closed
  if (timeInMinutes >= aftEnd) {
    const nextDay = day === 6 ? 'Lunes' : 'Mañana';
    return {
      isOpen: false,
      text: `Cerrado por hoy. Abrimos ${nextDay.toLowerCase()} a las 09:00`
    };
  }

  // Morning closed (before 9:00)
  const remains = mornStart - timeInMinutes;
  return {
    isOpen: false,
    text: `Cerrado - Abrimos a las 09:00 (en ${Math.floor(remains / 60)}h ${remains % 60}m)`
  };
}

/**
 * Returns a list of strings representing 15-minute intervals for booking.
 */
export function generateTimeSlots(): string[] {
  const slots: string[] = [];
  
  // Morning shift: 09:00 to 13:30 (last start time for a 30m appointment)
  for (let h = 9; h < 14; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 13 && m > 30) continue; // max 13:30
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
  }

  // Afternoon shift: 16:00 to 20:30
  for (let h = 16; h < 21; h++) {
    for (let m = 0; m < 60; m += 30) {
      if (h === 20 && m > 30) continue; // max 20:30
      const hh = h.toString().padStart(2, '0');
      const mm = m.toString().padStart(2, '0');
      slots.push(`${hh}:${mm}`);
    }
  }

  return slots;
}

/**
 * Validates if selected date is. Lunes a Sábado.
 */
export function isValidDate(dateStr: string): boolean {
  if (!dateStr) return false;
  const date = new Date(dateStr);
  const day = date.getDay();
  return day !== 0; // 0 = Domingo
}

/**
 * Creates a prefilled WhatsApp message link.
 */
export function getWhatsAppBookingLink(booking: {
  name: string;
  phone: string;
  date: string;
  time: string;
  servicesText: string;
  price: number;
}): string {
  const text = encodeURIComponent(
    `¡Hola Barbería El Bastrioui! Me gustaría confirmar una cita:\n\n` +
    `👤 *Nombre:* ${booking.name}\n` +
    `📞 *Contacto:* ${booking.phone}\n` +
    `📅 *Fecha:* ${booking.date}\n` +
    `🕒 *Hora:* ${booking.time}\n` +
    `💈 *Servicios:* ${booking.servicesText}\n` +
    `💰 *Precio Estimado:* ${booking.price}€\n\n` +
    `Por favor, confirmadme si tenéis disponibilidad. ¡Gracias!`
  );
  return `https://wa.me/34${BARBER_CONTACT.phone}?text=${text}`;
}

/**
 * Creates prefilled Mailto dynamic link.
 */
export function getMailtoBookingLink(booking: {
  name: string;
  phone: string;
  date: string;
  time: string;
  servicesText: string;
  price: number;
}): string {
  const subject = encodeURIComponent(`Cita en Barbería El Bastrioui - ${booking.name}`);
  const body = encodeURIComponent(
    `Hola Barbería El Bastrioui,\n\n` +
    `Me gustaría concertar la siguiente cita:\n\n` +
    `Nombre: ${booking.name}\n` +
    `Teléfono: ${booking.phone}\n` +
    `Fecha: ${booking.date}\n` +
    `Hora: ${booking.time}\n` +
    `Servicios: ${booking.servicesText}\n` +
    `Precio total estimado: ${booking.price}€\n\n` +
    `Espero vuestra confirmación.\nUn saludo!`
  );
  return `mailto:${BARBER_CONTACT.email}?subject=${subject}&body=${body}`;
}
