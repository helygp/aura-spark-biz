import { format, isSameDay, parseISO } from "date-fns";

export interface BusinessHourLike {
  weekday: number;
  open_time: string;
  close_time: string;
  is_open: boolean;
}

export interface AppointmentLike {
  start_time: string;
  end_time: string;
  status: string;
  date: string;
}

export const DEFAULT_SLOT_MINUTES = 30;

/** Convert "HH:MM" or "HH:MM:SS" to minutes since midnight. */
export function timeToMinutes(t: string): number {
  const parts = t.split(":");
  return Number(parts[0]) * 60 + Number(parts[1]);
}

/** Convert minutes since midnight back to "HH:MM". */
export function minutesToTime(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/** Get the business_hour entry for a given JS Date. */
export function getHourForDate(
  hours: BusinessHourLike[] | undefined,
  date: Date,
): BusinessHourLike | undefined {
  if (!hours) return undefined;
  return hours.find((h) => h.weekday === date.getDay());
}

/** Build the "HH:MM" slot list for a day based on its business hour entry. */
export function buildDaySlots(
  hour: BusinessHourLike | undefined,
  stepMinutes: number = DEFAULT_SLOT_MINUTES,
): string[] {
  if (!hour || !hour.is_open) return [];
  const start = timeToMinutes(hour.open_time);
  const end = timeToMinutes(hour.close_time);
  const slots: string[] = [];
  for (let m = start; m < end; m += stepMinutes) {
    slots.push(minutesToTime(m));
  }
  return slots;
}

/** Sum of appointment minutes for a given date (ignores cancelled/no_show). */
export function sumBookedMinutes(
  appointments: AppointmentLike[] | undefined,
  date: Date,
): number {
  if (!appointments) return 0;
  const dateStr = format(date, "yyyy-MM-dd");
  let total = 0;
  for (const a of appointments) {
    if (a.date !== dateStr) continue;
    if (a.status === "cancelled" || a.status === "no_show") continue;
    total += timeToMinutes(a.end_time) - timeToMinutes(a.start_time);
  }
  return total;
}

/** Total open minutes for a day. */
export function totalOpenMinutes(hour: BusinessHourLike | undefined): number {
  if (!hour || !hour.is_open) return 0;
  return timeToMinutes(hour.close_time) - timeToMinutes(hour.open_time);
}

/** Free slots (of stepMinutes) for a day, given hours & appointments. */
export function countFreeSlots(
  hour: BusinessHourLike | undefined,
  appointments: AppointmentLike[] | undefined,
  date: Date,
  stepMinutes: number = DEFAULT_SLOT_MINUTES,
): { total: number; free: number; occupied: number } {
  const openMin = totalOpenMinutes(hour);
  const bookedMin = sumBookedMinutes(appointments, date);
  const total = Math.floor(openMin / stepMinutes);
  const occupied = Math.floor(bookedMin / stepMinutes);
  const free = Math.max(0, total - occupied);
  return { total, free, occupied };
}

export function occupancyRate(
  hour: BusinessHourLike | undefined,
  appointments: AppointmentLike[] | undefined,
  date: Date,
): number {
  const open = totalOpenMinutes(hour);
  if (open === 0) return 0;
  const booked = sumBookedMinutes(appointments, date);
  return Math.min(100, Math.round((booked / open) * 100));
}

/** Format a "yyyy-MM-dd" date string as a JS Date safely (no TZ shift). */
export function parseDateOnly(s: string): Date {
  return parseISO(`${s}T00:00:00`);
}

export function isSameDayString(dateStr: string, date: Date): boolean {
  return isSameDay(parseDateOnly(dateStr), date);
}