"use client";

import { useEffect, useMemo, useState } from "react";
import { addDays, format } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { Calendar, Clock, CreditCard, ChevronRight, User, Baby, Wallet } from "lucide-react";
import { formatPrice } from "@/lib/utils";

const SHOP_TZ = "America/Chicago";
const fmtSlot = (iso: string) => formatInTimeZone(new Date(iso), SHOP_TZ, "h:mm a");
const fmtSummaryDate = (yyyymmdd: string) =>
  format(new Date(`${yyyymmdd}T12:00:00Z`), "EEE, MMM d");
const fmtSummaryTime = (iso: string) => formatInTimeZone(new Date(iso), SHOP_TZ, "h:mm a 'CT'");

type Barber = {
  id: string;
  displayName: string;
  bio: string | null;
  shopName: string;
  city: string;
  avatarUrl: string | null;
  basePriceCents: number;
  priceAdultCents: number;
  priceKidCents: number;
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

type CutType = "adult" | "kid";
type PaymentMethod = "online" | "in_person";

export function BookingFlow({ barbers, tryOn }: { barbers: Barber[]; tryOn: TryOnPayload }) {
  const [barberId, setBarberId] = useState<string | undefined>(barbers[0]?.id);
  const [cutType, setCutType] = useState<CutType>("adult");
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("online");
  const [date, setDate] = useState<string>(() => format(new Date(), "yyyy-MM-dd"));
  const [slots, setSlots] = useState<string[]>([]);
  const [slotMinutes, setSlotMinutes] = useState<number>(45);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [blockedUntil, setBlockedUntil] = useState<string | null>(null);
  const [notes, setNotes] = useState<string>(tryOn?.notes ?? "");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const barber = useMemo(() => barbers.find((b) => b.id === barberId), [barbers, barberId]);
  const priceCents =
    cutType === "kid"
      ? barber?.priceKidCents ?? 2000
      : barber?.priceAdultCents ?? 6000;

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
    setError(null);
    setBlockedUntil(null);
    fetch(`/api/availability?barberId=${barberId}&date=${date}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((j) => {
        if (cancelled) return;
        setSlots(j.slots ?? []);
        setSlotMinutes(j.slotMinutes ?? 45);
        setBlockedUntil(j.blockedUntil ?? null);
      })
      .catch(() => !cancelled && setError("Couldn't reach the schedule. Try again."))
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
          cutType,
          paymentMethod,
          hairstyleId: tryOn?.hairstyle?.id,
          tryOnSessionId: tryOn?.id,
        }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Booking failed");
      }
      const data = await res.json();
      if (data.checkoutUrl) {
        window.location.href = data.checkoutUrl;
      } else if (data.redirectUrl) {
        window.location.href = data.redirectUrl;
      } else {
        setError("Booking succeeded but no redirect URL returned.");
      }
    } catch (e) {
      setError((e as Error).message);
      setSubmitting(false);
    }
  };

  if (barbers.length === 0) {
    return (
      <div className="card mt-6 text-sm text-bone-200/70">
        No barbers are accepting bookings yet.
      </div>
    );
  }

  return (
    <div className="mt-6 flex flex-col gap-6 lg:grid lg:grid-cols-[1fr_360px]">
      <div className="min-w-0 space-y-4">
        {tryOn && (
          <div className="card flex gap-3 sm:gap-4">
            {tryOn.previewUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={tryOn.previewUrl}
                alt="Your locked cut"
                className="h-20 w-20 shrink-0 rounded-xl object-cover sm:h-24 sm:w-24"
              />
            )}
            <div className="flex-1">
              <div className="text-xs uppercase tracking-wider text-cartel-300">Locked cut</div>
              <div className="font-semibold">{tryOn.hairstyle.name}</div>
              <div className="text-xs text-bone-200/60">
                Length {tryOn.length} ·{" "}
                {tryOn.fade === 0 ? "no fade" : tryOn.fade === 5 ? "skin fade" : `fade ${tryOn.fade}`}
              </div>
            </div>
          </div>
        )}

        {/* Cut type */}
        <div className="card">
          <h3 className="font-display text-lg">Who's in the chair</h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ChoiceTile
              icon={<User className="h-4 w-4" />}
              label="Adult cut"
              price={barber?.priceAdultCents ?? 6000}
              selected={cutType === "adult"}
              onClick={() => setCutType("adult")}
            />
            <ChoiceTile
              icon={<Baby className="h-4 w-4" />}
              label="Kids cut"
              price={barber?.priceKidCents ?? 2000}
              selected={cutType === "kid"}
              onClick={() => setCutType("kid")}
            />
          </div>
        </div>

        {/* Barber */}
        {barbers.length > 1 && (
          <div className="card">
            <h3 className="font-display text-lg">Pick your barber</h3>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {barbers.map((b) => (
                <button
                  key={b.id}
                  onClick={() => setBarberId(b.id)}
                  className={`flex items-center gap-3 rounded-xl border p-3 text-left ${
                    b.id === barberId
                      ? "border-cartel-500 bg-cartel-500/5"
                      : "border-ink-600 hover:border-cartel-500/40"
                  }`}
                >
                  <div className="grid h-12 w-12 shrink-0 place-items-center overflow-hidden rounded-full bg-ink-700">
                    {b.avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={b.avatarUrl} alt={b.displayName} className="h-full w-full object-cover" />
                    ) : (
                      <span className="font-display text-lg text-cartel-300">
                        {b.displayName
                          .split(" ")
                          .map((p) => p[0])
                          .join("")
                          .slice(0, 2)}
                      </span>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{b.displayName}</div>
                    <div className="truncate text-xs text-bone-200/60">{b.shopName}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Date */}
        <div className="card">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <Calendar className="h-4 w-4 text-cartel-300" /> Pick a day
          </h3>
          <div className="no-scrollbar mt-3 -mx-2 flex gap-2 overflow-x-auto px-2 pb-1">
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

        {/* Time */}
        <div className="card">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <Clock className="h-4 w-4 text-cartel-300" /> Pick a time
          </h3>
          {loading ? (
            <div className="mt-3 text-sm text-bone-200/60">Loading slots…</div>
          ) : slots.length === 0 ? (
            <div className="mt-3 text-sm text-bone-200/60">
              {blockedUntil
                ? `Brian's chair is fully booked through ${formatInTimeZone(
                    new Date(blockedUntil),
                    SHOP_TZ,
                    "MMM d"
                  )}. First open day is ${formatInTimeZone(
                    new Date(blockedUntil),
                    SHOP_TZ,
                    "EEE MMM d"
                  )}.`
                : "No openings on this day. Try another."}
            </div>
          ) : (
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
              {slots.map((iso) => {
                const label = fmtSlot(iso);
                return (
                  <button
                    key={iso}
                    onClick={() => setSelectedSlot(iso)}
                    className={`min-h-[44px] rounded-xl border px-3 py-2 text-sm ${
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

        {/* Payment */}
        <div className="card">
          <h3 className="flex items-center gap-2 font-display text-lg">
            <Wallet className="h-4 w-4 text-cartel-300" /> Payment
          </h3>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <ChoiceTile
              icon={<CreditCard className="h-4 w-4" />}
              label="Pay now"
              hint="Card via Stripe"
              selected={paymentMethod === "online"}
              onClick={() => setPaymentMethod("online")}
            />
            <ChoiceTile
              icon={<Wallet className="h-4 w-4" />}
              label="Pay at the chair"
              hint="Cash or card on arrival"
              selected={paymentMethod === "in_person"}
              onClick={() => setPaymentMethod("in_person")}
            />
          </div>
        </div>

        {/* Notes */}
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

      {/* Sticky summary */}
      <aside className="min-w-0 lg:sticky lg:top-20 lg:self-start">
        <div className="card">
          <h3 className="font-display text-lg">Order summary</h3>
          <div className="mt-3 space-y-1 text-sm">
            <Row label="Type" value={cutType === "kid" ? "Kids cut" : "Adult cut"} />
            <Row label="Barber" value={barber?.displayName ?? "—"} />
            <Row label="Date" value={date ? fmtSummaryDate(date) : "—"} />
            <Row label="Time" value={selectedSlot ? fmtSummaryTime(selectedSlot) : "—"} />
            <Row label="Style" value={tryOn?.hairstyle?.name ?? "Walk-in cut"} />
            <Row
              label="Payment"
              value={paymentMethod === "online" ? "Pay now" : "At the chair"}
            />
          </div>
          <div className="mt-4 flex items-center justify-between border-t border-ink-700 pt-4">
            <span className="text-sm text-bone-200/70">
              {paymentMethod === "online" ? "Prepay" : "Due at chair"}
            </span>
            <span className="font-display text-2xl text-cartel-300">{formatPrice(priceCents)}</span>
          </div>
          {error && <div className="mt-3 text-sm text-red-400">{error}</div>}
          <button
            disabled={!selectedSlot || submitting}
            onClick={submit}
            className="btn-primary mt-4 w-full justify-center"
          >
            {paymentMethod === "online" ? (
              <>
                <CreditCard className="h-4 w-4" />
                {submitting ? "Redirecting…" : "Pay & Confirm"}
              </>
            ) : (
              <>
                <Calendar className="h-4 w-4" />
                {submitting ? "Booking…" : "Confirm booking"}
              </>
            )}
            <ChevronRight className="h-4 w-4" />
          </button>
          <p className="mt-2 text-center text-xs text-bone-200/50">
            {paymentMethod === "online"
              ? "Payment processed by Stripe. Cancel up to 12h before for a refund."
              : "Pay Brian directly when you arrive. Cancel anytime up to your slot."}
          </p>
        </div>
      </aside>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-bone-200/60">{label}</span>
      <span className="truncate text-right font-medium">{value}</span>
    </div>
  );
}

function ChoiceTile({
  icon,
  label,
  price,
  hint,
  selected,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  price?: number;
  hint?: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex min-h-[64px] flex-col items-start justify-center rounded-xl border p-3 text-left transition ${
        selected
          ? "border-cartel-500 bg-cartel-500/10 text-cartel-300"
          : "border-ink-600 text-bone-100 hover:border-cartel-500/40"
      }`}
    >
      <div className="flex items-center gap-2 text-sm font-semibold">
        {icon}
        {label}
      </div>
      {(price !== undefined || hint) && (
        <div className="mt-1 text-xs text-bone-200/60">
          {price !== undefined ? formatPrice(price) : hint}
        </div>
      )}
    </button>
  );
}
