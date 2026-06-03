/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Service {
  id: string;
  name: string;
  price: number;
  duration: number; // in minutes
  description: string;
  category: 'pelo' | 'barba' | 'combo';
}

export interface Booking {
  id: string;
  name: string;
  phone: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  services: string[]; // Service IDs
  notes?: string;
  totalPrice: number;
  totalDuration: number;
  createdAt: number; // timestamp
  force?: boolean;
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  comment: string;
  date: string;
}

export interface OpeningHourDay {
  open: string;  // e.g. "09:00"
  close: string; // e.g. "14:00"
}

export interface OpeningHours {
  days: string; // e.g. "Lunes a Sábado"
  morning: OpeningHourDay;
  afternoon: OpeningHourDay;
  closedDays: number[]; // 0 = Sunday, etc.
}
