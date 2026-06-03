/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { Service, Review, OpeningHours } from './types';

export const SERVICES: Service[] = [
  {
    id: 'corte-pelo',
    name: 'Corte de Pelo',
    price: 8,
    duration: 30,
    description: 'Corte clásico o moderno adaptado a tu estilo. Lavado e hidratación incluidos.',
    category: 'pelo',
  },
  {
    id: 'afeitar-navaja',
    name: 'Afeitado de Barba con Navaja',
    price: 5,
    duration: 15,
    description: 'Afeitado tradicional a navaja con toalla caliente, espuma premium y bálsamo refrescante para cuidar tu piel.',
    category: 'barba',
  },
  {
    id: 'degradado-perfilar-barba',
    name: 'Degradado y Perfilado de Barba',
    price: 5,
    duration: 15,
    description: 'Arreglo de barba con degradado degradando patillas, perfilado meticuloso con navaja y nutrición con aceites esenciales.',
    category: 'barba',
  },
  {
    id: 'combo-completo',
    name: 'Combo Completo (Corte + Barba de tu elección)',
    price: 13,
    duration: 45,
    description: 'Experimenta el cuidado total de cabello y barba en una sola sesión premium.',
    category: 'combo',
  }
];

export const REVIEWS: Review[] = [];

export const OPENING_HOURS: OpeningHours = {
  days: 'Lunes a Sábado',
  morning: { open: '09:00', close: '14:00' },
  afternoon: { open: '16:00', close: '21:00' },
  closedDays: [0], // 0 = Sunday
};

export const BARBER_CONTACT = {
  name: 'El Bastrioui',
  owner: 'Redouan',
  foundedYear: 2023,
  address: 'Carrer de Lumière, 6 local 5',
  addressGoogleMaps: 'https://maps.google.com/?q=Carrer+de+Lumiere+6+Rubi',
  phone: '604874545',
  formattedPhone: '+34 604 87 45 45',
  email: 'Redouaneelbastrioui@gmail.com',
};

