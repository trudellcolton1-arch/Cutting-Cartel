import { addMinutes, format, isBefore, parse, startOfDay } from "date-fns";
import type { Barber } from "@prisma/client";
import { safeJson } from "@/lib/utils";

type Hours = Record<string, [string, string] | null>;

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

export function getDayKey(date: Date) {
  return WEEKDAY_KEYS[date.getDay()];
}

/**
 * Generate every potential start time on a given date, based on the barber's
 * configured working hours and slot length. Returns Date objects in local time.
 */
export function generateSlots(barber: Pick<Barber, "workingHours" | "slotMinutes">, date: Date): Date[] {
  const hours = safeJson<Hours>(barber.workingHours, {});
  const dayKey = getDayKey(date);
  const range = hours[dayKey];
  if (!range) return [];

  const dayStart = startOfDay(date);
  const start = parse(range[0], "HH:mm", dayStart);
  const end = parse(range[1], "HH:mm", dayStart);

  const slots: Date[] = [];
  let cursor = start;
  while (isBefore(addMinutes(cursor, barber.slotMinutes), end) || +addMinutes(cursor, barber.slotMinutes) === +end) {
    slots.push(cursor);
    cursor = addMinutes(cursor, barber.slotMinutes);
  }
  return slots;
}

export function formatSlotLabel(date: Date) {
  return format(date, "h:mm a");
}

/**
 * Subtract any taken slots from candidate slots. Slots that overlap a taken
 * appointment are removed.
 */
export function filterAvailableSlots(
  candidates: Date[],
  taken: { startsAt: Date; endsAt: Date }[],
  slotMinutes: number,
  now: Date = new Date()
): Date[] {
  return candidates.filter((slotStart) => {
    if (isBefore(slotStart, now)) return false;
    const slotEnd = addMinutes(slotStart, slotMinutes);
    return !taken.some(
      (t) =>
        // overlap test
        isBefore(t.startsAt, slotEnd) && isBefore(slotStart, t.endsAt)
    );
  });
}
