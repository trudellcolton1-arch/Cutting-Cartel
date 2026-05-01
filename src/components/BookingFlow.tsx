"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { Calendar, Clock, CreditCard, ChevronRight } from "lucide-react";
import { formatPrice } from "@/lib/utils";

type Barber = {
  id: string;
  displayName: string;
  bio: string | null;
  shopName: string;
  city: string;
  avatarUrl: string | null;
  basePriceCents: number;
  slotMinutes: number;
};

type TryOnPayload =
  | (null | undefined)
  | {
      id: string;
      previewUrl: string | null;
      selfieUrl: string;
      length: number;
      fade: number;
      notes: string | null;
      hairstyle: { id: string; name: string; thumbnailUrl: string };
    };

export function BookingFlow({ barbers, tryOn }: { barbers: Barber[]; tryOn: TryOnPayload }) {
  const [barberId, setBarberId] = useState<string | undefined>(barbers[0]?.id);
  const [date, setDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<string[]>([]);
  const [slotMinutes, setSlotMinutes] = useState<number>(45);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>(tryOn?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const barber = useMemo(() => barbers.find((b) => b.id === barberId), [barbers, barberId]);

  // The user can pick from today + 30 days.
  const dateOptions = useMemo(() => {
    const out: { value: string; label: string }[] = [];
    for (let i = 0; i < 30; i++) {
      const d = addDays(new Date(), i);
      out.push({ value: format(d, "yyyy-MM-dd"), label: format(d, "EEE MMM d") });
    }
    return out;
  }, []);

  useEffect(() => {
    if (!barberId || !date) return;
    let cancelled = false;
    setLoading(true);
    setSelectedSlot(null);
    fetch(`/api/availability?barberId=${barberId}&date=${date}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        setSlots(j.slots ?? []);
        setSlotMinutes(j.slotMinutes ?? 45);
      })
      .catch(() => setError("Could not load availability."))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [barberId, date]);

  const submit = async () => {
    if (!barberId || !selectedSlot) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/appointments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          barberId,
          startsAt: selectedSlot,
          notes,
          hairstyleId: tryOn?.hairstyle?.id,
          tryOnSessionId: tryOn?.id,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Booking failed");
      }
      const { checkoutUrl } = await res.json();
      if (checkoutUrl) {
        window.location.href = checkoutUrl;
      } else {
        setError("Stripe checkout could not start.");
      }
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  if (barbers.length === 0) {
    return (
      <div className="card mt-6 text-sm text-bone-200/70">
        No barbers are accepting bookings yet. Run <code>npm run db:seed</code> to add the founder
        crew.
      </div>
    );
  }

  return (
    <div className="mt-6 grid gap-6 md:grid-cols-[1fr_360px]">
      <div className="space-y-4">
        {tryOn && (
          <div className="card flex gap-4">
            {tryOn.previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={tryOn.previewUrl} alt="Your locked cut" className="h-24 w-24 rounded-xl object-cover" />
            )}
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-cartel-300">Locked cut</div>
              <div className="font-semibold">{tryOn.hairstyle.name}</div>
              <div className="text-xs text-bone-200/60">
                Length {tryOn.length} · Fade {tryOn.fade === 0 ? "none" : tryOn.fade === 5 ? "skin" : tryOn.fade}
              </div>
            </div>
          </div>
        )}

        <div className="card">
          <h3 className="font-display text-lg">Pick your barber</h3>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {barbers.map((b) => (
              <button
                key={b.id}
                onClick={() => setBarberId(b.id)}
                className={`flex items-center gap-3 rounded-xl border p-3 text-left ${
                  b.id === barberId ? "border-cartel-500 bg-cartel-500/5" : "border-ink-600 hover:border-cartel-500/40"
                }`}
              >
                <div className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-ink-700">
                  {b.avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={b.avatarUrl} alt={b.displayName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display text-lg text-cartel-300">
                      {b.displayName.split(" ").map((p) => p[0]).join("").slice(0, 2)}
                    </span>
                  )}
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{b.displayName}</div>
                  <div className="text-xs text-bone-200/60">
                    {b.shopName} · {b.city}
                  </div>
                </div>
                <div className="text-sm font-semibold text-cartel-300">{formatPrice(b.basePriceCents)}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <Calendar className="h-4 w-4 text-cartel-300" /> Pick a day
          </h3>
          <div className="mt-3 -mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
            {dateOptions.map((d) => (
              <button
                key={d.value}
                onClick={() => setDate(d.value)}
                className={`shrink-0 rounded-xl border px-4 py-2 text-sm ${
                  d.value === date
                    ? "border-cartel-500 bg-cartel-500/10 text-cartel-300"
                    : "border-ink-600 hover:border-cartel-500/40"
                }`}
              >
                {d.label}
              </button>
            ))}
          </div>
        </div>

        <div className="card">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <Clock className="h-4 w-4 text-cartel-300" /> Pick a time
          </h3>
          {loading ? (
            <div className="mt-3 text-sm text-bone-200/60">Loading slots…</div>
          ) : slots.length === 0 ? (
            <div className="mt-3 text-sm text-bone-200/60">No openings on this day. Try another.</div>
          ) : (
            <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
              {slots.map((iso) => {
                const d = new Date(iso);
                const label = format(d, "h:mm a");
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedSlot(iso)}
                    className={`rounded-xl border px-3 py-2 text-sm ${
                      iso === selectedSlot
                        ? "border-cartel-500 bg-cartel-500/10 text-cartel-300"
                        : "border-ink-600 hover:border-cartel-500/40"
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
          {barber && (
            <p className="mt-3 text-xs text-bone-200/60">
              {slotMinutes}-minute slots with {barber.displayName}.
            </p>
          )}
        </div>

        <div className="card">
          <label className="label">Notes for your barber</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={4}
            className="input resize-none"
            placeholder="Anything we should know — beard line, scalp sensitivities, allergies, etc."
          />
        </div>
      </div>

      <aside className="space-y-4">
        <div className="card sticky top-20">
          <h3 className="font-display text-lg">Order summary</h3>
          <div className="mt-3 space-y-1 text-sm">
            <Row label="Barber" value={barber?.displayName ?? "—"} />
            <Row label="Date" value={date ? format(new Date(date + "T00:00:00"), "EEE, MMM d") : "—"} />
            <Row label="Time" value={selectedSlot ? format(new Date(selectedSlot), "h:mm a") : "—"} />
            <Row label="Style" value={tryOn?.hairstyle?.name ?? "Walk-in cut"} />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-ink-700 pt-4">
            <span className="text-sm text-bone-200/70">Prepay</span>
            <span className="font-display text-2xl text-cartel-300">
              {formatPrice(barber?.basePriceCents ?? 0)}
            </span>
          </div>
          {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
          <button
            disabled={!selectedSlot || submitting}
            onClick={submit}
            className="btn-primary mt-4 w-full justify-center"
          >
            <CreditCard className="h-4 w-4" />
            {submitting ? "Redirecting…" : "Pay & Confirm"}
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="mt-2 text-center text-xs text-bone-200/50">
            Payment processed by Stripe. Cancel up to 12h before for a refund.
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-bone-200/60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
