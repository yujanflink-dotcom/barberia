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
    description: 'Corte clásico o moderno adaptado a tu estilo.',
    category: 'pelo',
  },
  {
    id: 'afeitar-navaja',
    name: 'Afeitado de Barba con Navaja',
    price: 5,
    duration: 15,
    description: 'Afeitado tradicional a navaja.',
    category: 'barba',
  },
  {
    id: 'degradado-perfilar-barba',
    name: 'Degradado y Perfilado de Barba',
    price: 5,
    duration: 15,
    description: 'Arreglo de barba con degradado degradando patillas y perfilado meticuloso con navaja.',
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

export const REVIEWS: Review[] = [
  {
    id: "rev-static-1",
    author: "Martin",
    rating: 5,
    comment: "Excelente peluquería, Redouan es un auténtico profesional. El corte a 8€ es insuperable por esta calidad en todo Rubí.",
    date: "2026-05-12"
  },
  {
    id: "rev-static-2",
    author: "Dani",
    rating: 5,
    comment: "El afeitado tradicional a navaja y degradado espectacular. Un trato de diez y local impecable. Muy recomendado.",
    date: "2026-05-24"
  },
  {
    id: "rev-static-3",
    author: "Alberto",
    rating: 5,
    comment: "Mi peluquería habitual desde 2023. Amable, puntual y corte impecable en Carrer de Lumière. El mejor precio-servicio.",
    date: "2026-06-01"
  }
];

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

