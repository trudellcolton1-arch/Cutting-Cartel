import { addDays } from "date-fns";
import { format as formatTz, fromZonedTime, formatInTimeZone } from "date-fns-tz";
import { safeJson } from "@/lib/utils";

type Hours = Record<string, [string, string] | null>;

const WEEKDAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"] as const;

/**
 * The barber's working timezone. All slots are interpreted in this zone, then
 * stored / sent over the wire as UTC. Every client / email renders back into
 * this zone so customers and Brian see consistent times.
 */
export const SHOP_TZ = "America/Chicago";

export function getDayKey(yyyymmdd: string) {
  const [y, m, d] = yyyymmdd.split("-").map(Number);
  // Use UTC math here — we just want the calendar day of the input string.
  return WEEKDAY_KEYS[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
}

export function shopDayBounds(yyyymmdd: string): { startUtc: Date; endUtc: Date } {
  return {
    startUtc: fromZonedTime(`${yyyymmdd}T00:00:00`, SHOP_TZ),
    endUtc: fromZonedTime(`${yyyymmdd}T23:59:59.999`, SHOP_TZ),
  };
}

/**
 * Generate every potential start time on a given calendar day in the shop's
 * timezone. Returns UTC Date objects that the client / email can render into
 * any zone.
 *
 * Permissive `workingHours: unknown` so callers can pass results from a
 * fallback query (when newer columns don't yet exist) without casting.
 */
export function generateSlots(
  barber: { workingHours: unknown; slotMinutes: number },
  dateStr: string
): Date[] {
  const hours = safeJson<Hours>(barber.workingHours, {});
  const range = hours[getDayKey(dateStr)];
  if (!range) return [];

  // "10:00" interpreted in Dallas time → UTC moment
  const startUtc = fromZonedTime(`${dateStr}T${range[0]}:00`, SHOP_TZ);
  const endUtc = fromZonedTime(`${dateStr}T${range[1]}:00`, SHOP_TZ);

  const slots: Date[] = [];
  const slotMs = barber.slotMinutes * 60 * 1000;
  let cursorMs = startUtc.getTime();
  const endMs = endUtc.getTime();
  while (cursorMs + slotMs <= endMs) {
    slots.push(new Date(cursorMs));
    cursorMs += slotMs;
  }
  return slots;
}

export function formatSlotLabel(date: Date) {
  return formatInTimeZone(date, SHOP_TZ, "h:mm a");
}

export function formatShopDateTime(date: Date, fmt = "EEE, MMM d · h:mm a 'CT'") {
  return formatInTimeZone(date, SHOP_TZ, fmt);
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
    if (slotStart.getTime() < now.getTime()) return false;
    const slotEnd = new Date(slotStart.getTime() + slotMinutes * 60 * 1000);
    return !taken.some(
      (t) =>
        // overlap test
        t.startsAt.getTime() < slotEnd.getTime() && slotStart.getTime() < t.endsAt.getTime()
    );
  });
}

// Re-exported for callers that want raw date-fns-tz formatting elsewhere
export { formatTz, formatInTimeZone, addDays };
